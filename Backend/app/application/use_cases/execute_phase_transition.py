"""API-01 / D-01..D-12 Phase Gate use case.

Single atomic transaction (D-10):
  1. acquire_project_lock_or_fail -> 409 on contention
  2. Load project, normalize process_config
  3. Check workflow.mode (D-07) -> 400 for continuous
  4. Validate source/target phase IDs (D-19, D-21)
  5. Evaluate criteria (D-03, D-05) -> 422 unless allow_override
  6. Apply open_tasks_action with exceptions (D-04)
  7. Insert audit_log with full envelope (D-08)
Commit releases advisory lock automatically.
"""
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.application.services.phase_gate_service import acquire_project_lock_or_fail
from app.application.dtos.phase_transition_dtos import (
    PhaseTransitionRequestDTO, PhaseTransitionResponseDTO, CriterionResult,
)
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.exceptions import (
    ProjectNotFoundError,
    CriteriaUnmetError,
    PhaseGateNotApplicableError,
    ArchivedNodeReferenceError,
)


class ExecutePhaseTransitionUseCase:
    def __init__(
        self,
        project_repo: IProjectRepository,
        task_repo: ITaskRepository,
        audit_repo: IAuditRepository,
        session: AsyncSession,
    ):
        self.project_repo = project_repo
        self.task_repo = task_repo
        self.audit_repo = audit_repo
        self.session = session

    async def execute(
        self, project_id: int, dto: PhaseTransitionRequestDTO, user_id: int
    ) -> PhaseTransitionResponseDTO:
        # All steps inside a single atomic tx; commit releases advisory lock.
        # NOTE: caller (router) opens/closes the outer session; here we use session.begin_nested
        # only if we need a savepoint. Default behavior: rely on FastAPI Depends session lifecycle
        # (session.commit on return, rollback on exception) which satisfies D-10.

        # 1. Advisory lock (409 on contention)
        await acquire_project_lock_or_fail(self.session, project_id)

        # 2. Load project (entity normalizes process_config via @model_validator)
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(project_id)

        pc = project.process_config or {}
        workflow = pc.get("workflow", {})
        mode = workflow.get("mode", "flexible")

        # 3. Mode guard (D-07)
        if mode == "continuous":
            raise PhaseGateNotApplicableError(mode=mode)

        # 4. Phase ID existence + archived check (D-19, D-21)
        nodes = workflow.get("nodes", [])
        node_map = {n["id"]: n for n in nodes}
        for pid, label in ((dto.source_phase_id, "source"), (dto.target_phase_id, "target")):
            node = node_map.get(pid)
            if node is None:
                raise ArchivedNodeReferenceError(node_id=pid, reason=f"non-existent in project workflow ({label})")
            if node.get("is_archived"):
                raise ArchivedNodeReferenceError(node_id=pid, reason=f"archived ({label})")

        # 5. Criteria evaluation (D-03)
        criteria = pc.get("phase_completion_criteria", {}).get(dto.source_phase_id, {})
        unmet = await self._evaluate_criteria(project_id, dto.source_phase_id, criteria)
        if unmet and not dto.allow_override:
            raise CriteriaUnmetError(unmet=[c.model_dump() for c in unmet])

        override_used = bool(unmet and dto.allow_override)

        # 6. Apply open_tasks_action (D-04)
        moved_count = await self._apply_task_moves(
            project_id, dto.source_phase_id, dto.target_phase_id,
            dto.open_tasks_action, dto.exceptions,
        )

        # 7. Audit envelope (D-08)
        envelope = {
            "source_phase_id": dto.source_phase_id,
            "source_phase_name": node_map[dto.source_phase_id].get("name"),
            "target_phase_id": dto.target_phase_id,
            "target_phase_name": node_map[dto.target_phase_id].get("name"),
            "workflow_mode": mode,
            "criteria_snapshot": criteria,
            "unmet_criteria": [c.model_dump() for c in unmet],
            "override_used": override_used,
            "open_tasks_action": dto.open_tasks_action,
            "exceptions": [e.model_dump() for e in dto.exceptions],
            "moved_task_count": moved_count,
            "note": dto.note,
        }
        await self.audit_repo.create_with_metadata(
            entity_type="project",
            entity_id=project_id,
            action="phase_transition",
            user_id=user_id,
            metadata=envelope,
        )

        return PhaseTransitionResponseDTO(
            moved_count=moved_count,
            override_used=override_used,
            unmet_criteria=unmet,
            source_phase_id=dto.source_phase_id,
            target_phase_id=dto.target_phase_id,
        )

    async def _evaluate_criteria(
        self, project_id: int, source_phase_id: str, criteria: dict
    ) -> List[CriterionResult]:
        """D-03 auto-criteria. Returns list of failed criteria.

        auto checks supported:
          - all_tasks_done: every task with phase_id=source must be DONE
          - no_critical_tasks: no CRITICAL priority task with phase_id=source is non-DONE
          - no_blockers: (heuristic) no dependency-graph incoming edges block completion (simplified v2.0)
        manual checks (in criteria['manual']) require user confirmation — evaluated as unmet unless allow_override.
        """
        unmet: List[CriterionResult] = []
        auto = criteria.get("auto", {}) or {}
        manual = criteria.get("manual", []) or []
        # Fetch phase tasks
        tasks = await self.task_repo.list_by_project_and_phase(project_id, source_phase_id)

        if auto.get("all_tasks_done"):
            done = sum(1 for t in tasks if str(getattr(t, "status", "")).upper() == "DONE" or
                                         (getattr(t, "column", None) and getattr(t.column, "name", "").upper() == "DONE"))
            total = len(tasks)
            if total > 0 and done < total:
                unmet.append(CriterionResult(
                    check="all_tasks_done", passed=False,
                    detail=f"{done}/{total} done",
                ))

        if auto.get("no_critical_tasks"):
            critical_open = [t for t in tasks if str(getattr(t, "priority", "")).upper() == "CRITICAL"
                             and str(getattr(t, "status", "")).upper() != "DONE"]
            if critical_open:
                unmet.append(CriterionResult(
                    check="no_critical_tasks", passed=False,
                    detail=f"{len(critical_open)} critical task(s) still open",
                ))

        if auto.get("no_blockers"):
            # Simplified v2.0: count tasks with non-null status != DONE
            blockers = [t for t in tasks if str(getattr(t, "status", "")).upper() in ("BLOCKED", "REVIEW")]
            if blockers:
                unmet.append(CriterionResult(
                    check="no_blockers", passed=False,
                    detail=f"{len(blockers)} task(s) blocked",
                ))

        # Manual items — each item an unmet criterion until user override/signoff
        for item in manual:
            unmet.append(CriterionResult(
                check=f"manual:{item}", passed=False,
                detail="Requires manual confirmation (use allow_override or complete manually)",
            ))

        return unmet

    async def _apply_task_moves(
        self, project_id: int, source_phase_id: str, target_phase_id: str,
        action: str, exceptions: list,
    ) -> int:
        """D-04: bulk action with per-task exceptions."""
        tasks = await self.task_repo.list_by_project_and_phase(project_id, source_phase_id)
        exc_map = {e.task_id: e.action for e in exceptions}
        moved = 0
        for t in tasks:
            eff_action = exc_map.get(t.id, action)
            if eff_action == "move_to_next":
                t.phase_id = target_phase_id
                moved += 1
            elif eff_action == "move_to_backlog":
                t.phase_id = None
                # also clear sprint_id for backlog per D-04
                if hasattr(t, "sprint_id"):
                    t.sprint_id = None
                moved += 1
            # keep_in_source: no-op
        # Persist moves — caller session already holds them; flush to send SQL
        await self.session.flush()
        return moved
