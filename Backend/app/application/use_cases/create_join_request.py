"""Phase 14 Plan 14-01 — CreateJoinRequestUseCase (D-A1, D-D2).

Persists the join request and emits an audit_log row enriched with project
name + key + target user id (D-A8 audit-log enrichment scope). The audit row
is the source of truth for the activity feed in /admin/audit and ProjectDetail
Activity tab (Plan 14-10).

DIP enforced — ZERO sqlalchemy / app.infrastructure imports.
"""
from typing import Optional

from app.domain.entities.project_join_request import ProjectJoinRequest
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.project_join_request_repository import (
    IProjectJoinRequestRepository,
)
from app.domain.repositories.project_repository import IProjectRepository


class CreateJoinRequestUseCase:
    """Create a join request + emit project_join_request.created audit row."""

    def __init__(
        self,
        repo: IProjectJoinRequestRepository,
        audit_repo: IAuditRepository,
        project_repo: IProjectRepository,
    ):
        self.repo = repo
        self.audit_repo = audit_repo
        self.project_repo = project_repo

    async def execute(
        self,
        project_id: int,
        requested_by_user_id: int,
        target_user_id: int,
        note: Optional[str] = None,
    ) -> ProjectJoinRequest:
        # 1) Persist
        entity = ProjectJoinRequest(
            project_id=project_id,
            requested_by_user_id=requested_by_user_id,
            target_user_id=target_user_id,
            status="pending",
            note=note,
        )
        created = await self.repo.create(entity)

        # 2) Lookup project for natural-language audit metadata. project_repo
        # may return None if the project was deleted between create and audit
        # emission — defensive None handling so audit row still ships.
        project = await self.project_repo.get_by_id(project_id)

        # 3) Emit enriched audit row (D-D2 user-lifecycle / project-lifecycle).
        await self.audit_repo.create_with_metadata(
            entity_type="project_join_request",
            entity_id=created.id or 0,
            action="created",
            user_id=requested_by_user_id,
            metadata={
                "project_id": project_id,
                "project_key": project.key if project else None,
                "project_name": project.name if project else None,
                "requested_by_user_id": requested_by_user_id,
                "target_user_id": target_user_id,
            },
        )
        return created
