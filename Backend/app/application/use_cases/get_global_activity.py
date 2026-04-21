"""D-28: Global activity feed use case — no project_id filter."""
from app.domain.repositories.audit_repository import IAuditRepository
from app.application.dtos.activity_dtos import ActivityResponseDTO, ActivityItemDTO


class GetGlobalActivityUseCase:
    """D-28: global activity feed across all projects.

    NEVER import sqlalchemy or app.infrastructure here — Clean Architecture DIP.
    High-level module depends only on the IAuditRepository abstraction (Domain layer).
    """

    def __init__(self, audit_repo: IAuditRepository):
        self.audit_repo = audit_repo

    async def execute(self, limit: int = 20, offset: int = 0) -> ActivityResponseDTO:
        items, total = await self.audit_repo.get_global_activity(limit=limit, offset=offset)
        return ActivityResponseDTO(
            items=[ActivityItemDTO.model_validate(i) for i in items],
            total=total,
        )
