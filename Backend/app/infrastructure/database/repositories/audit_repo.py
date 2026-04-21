from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc

from app.domain.repositories.audit_repository import IAuditRepository
from app.infrastructure.database.models.audit_log import AuditLogModel


class SqlAlchemyAuditRepository(IAuditRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        entity_type: str,
        entity_id: int,
        field_name: str,
        old_value: Optional[str],
        new_value: Optional[str],
        user_id: Optional[int],
        action: str,
    ) -> None:
        entry = AuditLogModel(
            entity_type=entity_type,
            entity_id=entity_id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            user_id=user_id,
            action=action,
        )
        self.session.add(entry)
        await self.session.commit()

    async def get_by_entity(self, entity_type: str, entity_id: int) -> list[dict]:
        stmt = (
            select(AuditLogModel)
            .where(
                AuditLogModel.entity_type == entity_type,
                AuditLogModel.entity_id == entity_id,
            )
            .order_by(AuditLogModel.timestamp.desc())
        )
        result = await self.session.execute(stmt)
        rows = result.scalars().all()
        return [
            {
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "field_name": row.field_name,
                "old_value": row.old_value,
                "new_value": row.new_value,
                "user_id": row.user_id,
                "action": row.action,
                "timestamp": row.timestamp,
            }
            for row in rows
        ]

    async def count_phase_transitions(self, project_id: int, source_phase_id: str) -> int:
        """D-25: count phase transitions for a project+source_phase, used for cycle_number auto-calc."""
        stmt = (
            select(sqlfunc.count(AuditLogModel.id))
            .where(AuditLogModel.entity_type == "project")
            .where(AuditLogModel.entity_id == project_id)
            .where(AuditLogModel.action == "phase_transition")
            # D-08: extra_metadata JSONB carries the source_phase_id
            .where(AuditLogModel.extra_metadata["source_phase_id"].astext == source_phase_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
