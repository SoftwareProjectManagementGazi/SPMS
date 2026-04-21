"""API-02 Activity feed use case."""
from typing import List, Optional
from datetime import datetime
from app.domain.repositories.audit_repository import IAuditRepository
from app.application.dtos.activity_dtos import ActivityResponseDTO, ActivityItemDTO


class GetProjectActivityUseCase:
    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo

    async def execute(
        self,
        project_id: int,
        types: Optional[List[str]] = None,
        user_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 30,
        offset: int = 0,
    ) -> ActivityResponseDTO:
        items, total = await self.audit_repo.get_project_activity(
            project_id=project_id, types=types, user_id=user_id,
            date_from=date_from, date_to=date_to, limit=limit, offset=offset,
        )
        return ActivityResponseDTO(
            items=[ActivityItemDTO.model_validate(i) for i in items],
            total=total,
        )
