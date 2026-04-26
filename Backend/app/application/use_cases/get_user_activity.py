"""Phase 13 D-X4 — User activity use case.

Privacy filter (D-C7): non-admin viewers see only audit_log rows scoped to
projects they belong to via team_projects. Admin viewers bypass the filter.

Single Responsibility (CLAUDE.md §4.1 S): orchestrate the privacy-filtered
fetch and map repo dicts into ``ActivityResponseDTO``.

DIP: only domain repository imported.
"""
from typing import List, Optional
from datetime import datetime

from app.domain.repositories.audit_repository import IAuditRepository
from app.application.dtos.activity_dtos import ActivityResponseDTO, ActivityItemDTO


class GetUserActivityUseCase:
    """D-X4 User activity feed, viewer-privacy-filtered (admin bypass)."""

    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo

    async def execute(
        self,
        target_user_id: int,
        viewer_user_id: int,
        is_admin: bool,
        types: Optional[List[str]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 30,
        offset: int = 0,
    ) -> ActivityResponseDTO:
        """Return ``ActivityResponseDTO`` filtered by viewer's project memberships.

        Pagination is capped at 200 inside the repo (Phase 9 D-44 convention);
        we still pass ``limit`` through for the request envelope.
        """
        items, total = await self.audit_repo.get_user_activity(
            target_user_id=target_user_id,
            viewer_user_id=viewer_user_id,
            is_admin=is_admin,
            types=types,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset,
        )
        return ActivityResponseDTO(
            items=[ActivityItemDTO.model_validate(i) for i in items],
            total=total,
        )
