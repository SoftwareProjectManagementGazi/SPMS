"""Phase 14 Plan 14-01 — RejectJoinRequestUseCase (D-A1, D-D2).

Symmetric with ApproveJoinRequestUseCase but does NOT add to team. State flip
+ enriched audit emission only.

DIP enforced — ZERO sqlalchemy / app.infrastructure imports.
"""
from app.domain.entities.project_join_request import ProjectJoinRequest
from app.domain.exceptions import (
    JoinRequestInvalidStateError,
    JoinRequestNotFoundError,
)
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.project_join_request_repository import (
    IProjectJoinRequestRepository,
)
from app.domain.repositories.project_repository import IProjectRepository


class RejectJoinRequestUseCase:
    """Reject a pending join request — emits audit; no team membership change."""

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
        request_id: int,
        rejecting_admin_id: int,
    ) -> ProjectJoinRequest:
        req = await self.repo.get_by_id(request_id)
        if req is None:
            raise JoinRequestNotFoundError(request_id)
        if req.status != "pending":
            raise JoinRequestInvalidStateError(request_id, req.status)

        updated = await self.repo.update_status(
            request_id, "rejected", reviewed_by_admin_id=rejecting_admin_id
        )

        project = await self.project_repo.get_by_id(req.project_id)
        await self.audit_repo.create_with_metadata(
            entity_type="project_join_request",
            entity_id=request_id,
            action="rejected",
            user_id=rejecting_admin_id,
            metadata={
                "project_id": req.project_id,
                "project_key": project.key if project else None,
                "project_name": project.name if project else None,
                "target_user_id": req.target_user_id,
                "requested_by_admin_id": rejecting_admin_id,
            },
        )
        return updated or req
