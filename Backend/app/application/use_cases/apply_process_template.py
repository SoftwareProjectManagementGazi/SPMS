"""D-44 ApplyProcessTemplateUseCase.

For each project_id:
1. Acquire per-project advisory lock (wait up to 5s; if still held, add to failed list with advisory_lock_timeout).
2. Fetch project + template.
3. Apply template defaults (process_template_id, default_workflow if present, default_phase_criteria if present).
4. Write back via project_repo.update().
5. Lock auto-releases at transaction commit (pg_advisory_xact_lock semantics).

Returns {"applied": [project_ids], "failed": [{"project_id": id, "error": msg}], "require_pm_approval": bool}.

Advisory lock key: hash("template_apply:{project_id}") & 0x7FFFFFFFFFFFFFFF
Distinct from Phase Gate key: hash("phase_gate:{project_id}") — parallel ops on same project allowed.
"""
import asyncio
from typing import List
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.project_repository import IProjectRepository


def _tpl_apply_lock_key(project_id: int) -> int:
    """63-bit advisory lock key for template apply (distinct from phase_gate key)."""
    return hash(f"template_apply:{project_id}") & 0x7FFFFFFFFFFFFFFF


class ApplyProcessTemplateUseCase:
    """D-44: Apply a ProcessTemplate to multiple projects with per-project advisory lock."""

    def __init__(
        self,
        project_repo: IProjectRepository,
        template_repo,
        session: AsyncSession,
    ):
        self.project_repo = project_repo
        self.template_repo = template_repo
        self.session = session

    async def execute(
        self,
        template_id: int,
        project_ids: List[int],
        require_pm_approval: bool = False,
    ) -> dict:
        template = await self.template_repo.get_by_id(template_id)
        if template is None:
            from app.domain.exceptions import DomainError
            raise DomainError(f"ProcessTemplate {template_id} not found")

        applied: List[int] = []
        failed: List[dict] = []

        for pid in project_ids:
            try:
                # Try advisory lock with bounded 5s retry
                acquired = False
                for _ in range(5):
                    r = await self.session.execute(
                        select(func.pg_try_advisory_xact_lock(_tpl_apply_lock_key(pid)))
                    )
                    if r.scalar_one():
                        acquired = True
                        break
                    await asyncio.sleep(1)

                if not acquired:
                    failed.append({"project_id": pid, "error": "advisory_lock_timeout"})
                    continue

                project = await self.project_repo.get_by_id(pid)
                if project is None:
                    failed.append({"project_id": pid, "error": "project_not_found"})
                    continue

                # Apply template fields
                project.process_template_id = template.id
                pc = project.process_config or {}
                if getattr(template, "default_workflow", None):
                    pc["workflow"] = template.default_workflow
                if getattr(template, "default_phase_criteria", None):
                    pc["phase_completion_criteria"] = template.default_phase_criteria
                pc["schema_version"] = 1
                project.process_config = pc

                await self.project_repo.update(project)
                # NOTE: require_pm_approval flag accepted but approval workflow deferred to Phase 12
                applied.append(pid)

            except Exception as e:
                failed.append({"project_id": pid, "error": str(e)})

        return {"applied": applied, "failed": failed, "require_pm_approval": require_pm_approval}
