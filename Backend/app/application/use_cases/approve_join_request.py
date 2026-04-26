"""Phase 14 Plan 14-01 — ApproveJoinRequestUseCase (D-A1, D-D2).

Orchestrates approval atomically:
  1) Flip status to "approved" with reviewed_by_admin_id stamp
  2) team_repo.add_member(team_id, target_user_id) — idempotent (the team_repo
     swallows IntegrityError on duplicate membership)
  3) Emit project_join_request.approved audit row with enriched metadata
  4) Atomic intent: if step 2 raises a non-IntegrityError exception, roll back
     step 1 by flipping status back to "pending" + clearing reviewer fields

DIP enforced — ZERO sqlalchemy / app.infrastructure imports.
"""
from typing import Any, Optional

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


class ApproveJoinRequestUseCase:
    """Approve a pending join request and add the target user to the team."""

    def __init__(
        self,
        repo: IProjectJoinRequestRepository,
        audit_repo: IAuditRepository,
        team_repo: Any,  # Duck-typed: needs add_member + get_team_for_project
        project_repo: IProjectRepository,
    ):
        self.repo = repo
        self.audit_repo = audit_repo
        self.team_repo = team_repo
        self.project_repo = project_repo

    async def execute(
        self,
        request_id: int,
        approving_admin_id: int,
    ) -> ProjectJoinRequest:
        # 1) Fetch request and validate state
        req = await self.repo.get_by_id(request_id)
        if req is None:
            raise JoinRequestNotFoundError(request_id)
        if req.status != "pending":
            raise JoinRequestInvalidStateError(request_id, req.status)

        # 2) Flip status atomically
        updated = await self.repo.update_status(
            request_id, "approved", reviewed_by_admin_id=approving_admin_id
        )

        # 3) Add target user to team (idempotent — IntegrityError swallowed
        # inside team_repo.add_member). If add_member raises ANY non-Integrity
        # exception, roll back the status flip so the system stays consistent.
        try:
            team = None
            if hasattr(self.team_repo, "get_team_for_project"):
                team = await self.team_repo.get_team_for_project(req.project_id)
            if team is not None:
                await self.team_repo.add_member(team.id, req.target_user_id)
        except Exception:
            # Atomic rollback intent (D-A1 atomic intent). Flip status back
            # to pending + clear reviewer fields so admin can retry.
            await self.repo.update_status(
                request_id, "pending", reviewed_by_admin_id=None
            )
            raise

        # 4) Emit enriched audit row
        project = await self.project_repo.get_by_id(req.project_id)
        await self.audit_repo.create_with_metadata(
            entity_type="project_join_request",
            entity_id=request_id,
            action="approved",
            user_id=approving_admin_id,
            metadata={
                "project_id": req.project_id,
                "project_key": project.key if project else None,
                "project_name": project.name if project else None,
                "target_user_id": req.target_user_id,
                "requested_by_admin_id": approving_admin_id,
            },
        )
        return updated or req
