"""Phase 14 Plan 14-01 — GetGlobalAuditUseCase (D-A8 / D-Z2 / Pitfall 6).

Thin wrapper around audit_repo.get_global_audit. The repo returns
(items, capped_total, truncated); this use case maps to AdminAuditResponseDTO
which exposes the truncated flag to the frontend so it can render an
AlertBanner above the table when the actual audit_log count exceeded the
50k visible-row hard cap.

DIP — pure repo wrapper.
"""
from datetime import datetime
from typing import Optional

from app.application.dtos.admin_audit_dtos import (
    AdminAuditItemDTO,
    AdminAuditResponseDTO,
)
from app.domain.repositories.audit_repository import IAuditRepository


class GetGlobalAuditUseCase:
    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo

    async def execute(
        self,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        actor_id: Optional[int] = None,
        action_prefix: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> AdminAuditResponseDTO:
        items, total, truncated = await self.audit_repo.get_global_audit(
            date_from=date_from,
            date_to=date_to,
            actor_id=actor_id,
            action_prefix=action_prefix,
            limit=limit,
            offset=offset,
        )
        return AdminAuditResponseDTO(
            items=[AdminAuditItemDTO.model_validate(i) for i in items],
            total=total,
            truncated=truncated,
        )
