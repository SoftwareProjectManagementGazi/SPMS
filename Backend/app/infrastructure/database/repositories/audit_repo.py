from typing import Optional, List, Tuple
from datetime import datetime
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

    async def create_with_metadata(
        self,
        entity_type: str,
        entity_id: int,
        action: str,
        user_id: Optional[int],
        metadata: dict,
        field_name: str = "transition",
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
    ):
        """D-08: insert audit_log row with full JSON envelope in extra_metadata column.

        Note: DB column is literally `metadata`; Python attr is `extra_metadata` (Pitfall 7).
        """
        log = AuditLogModel(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            user_id=user_id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            extra_metadata=metadata,
        )
        self.session.add(log)
        await self.session.flush()
        return log

    async def get_project_activity(
        self,
        project_id: int,
        types: Optional[List[str]] = None,
        user_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 30,
        offset: int = 0,
    ) -> Tuple[List[dict], int]:
        """D-46 / D-47: return (items, total).

        Each item is a denormalized dict with user_name + user_avatar from users table JOIN.
        entity_label is derived from entity_type + related entity lookups (best-effort; None allowed).
        """
        from app.infrastructure.database.models.user import UserModel

        conditions = [
            AuditLogModel.entity_type == "project",
            AuditLogModel.entity_id == project_id,
        ]

        if types:
            conditions.append(AuditLogModel.action.in_(types))
        if user_id is not None:
            conditions.append(AuditLogModel.user_id == user_id)
        if date_from is not None:
            conditions.append(AuditLogModel.timestamp >= date_from)
        if date_to is not None:
            conditions.append(AuditLogModel.timestamp <= date_to)

        # Total count
        count_stmt = select(sqlfunc.count(AuditLogModel.id)).where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        # Items with LEFT JOIN on users for denormalization (D-47)
        items_stmt = (
            select(
                AuditLogModel.id,
                AuditLogModel.action,
                AuditLogModel.entity_type,
                AuditLogModel.entity_id,
                AuditLogModel.field_name,
                AuditLogModel.old_value,
                AuditLogModel.new_value,
                AuditLogModel.user_id,
                UserModel.full_name.label("user_name"),
                UserModel.avatar.label("user_avatar"),
                AuditLogModel.timestamp,
                AuditLogModel.extra_metadata,
            )
            .select_from(AuditLogModel)
            .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
            .where(*conditions)
            .order_by(AuditLogModel.timestamp.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(items_stmt)
        rows = result.mappings().all()
        items = [
            {
                "id": row["id"],
                "action": row["action"],
                "entity_type": row["entity_type"],
                "entity_id": row["entity_id"],
                "entity_label": None,  # Future: resolve from entity_type (task title, milestone name, etc.)
                "field_name": row["field_name"],
                "old_value": row["old_value"],
                "new_value": row["new_value"],
                "user_id": row["user_id"],
                "user_name": row["user_name"],
                "user_avatar": row["user_avatar"],
                "timestamp": row["timestamp"],
                "metadata": row["extra_metadata"],
            }
            for row in rows
        ]
        return items, total

    async def get_global_activity(
        self,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[dict], int]:
        """D-28: global activity feed across all projects/entities (no project_id filter).

        Returns (items, total) with user_name + user_avatar via LEFT JOIN on users.
        """
        from app.infrastructure.database.models.user import UserModel

        # No WHERE conditions — queries ALL audit_log rows across all entities
        count_stmt = select(sqlfunc.count(AuditLogModel.id))
        total = (await self.session.execute(count_stmt)).scalar() or 0

        items_stmt = (
            select(
                AuditLogModel.id,
                AuditLogModel.action,
                AuditLogModel.entity_type,
                AuditLogModel.entity_id,
                AuditLogModel.field_name,
                AuditLogModel.old_value,
                AuditLogModel.new_value,
                AuditLogModel.user_id,
                UserModel.full_name.label("user_name"),
                UserModel.avatar.label("user_avatar"),
                AuditLogModel.timestamp,
                AuditLogModel.extra_metadata,
            )
            .select_from(AuditLogModel)
            .join(UserModel, UserModel.id == AuditLogModel.user_id, isouter=True)
            .order_by(AuditLogModel.timestamp.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(items_stmt)
        rows = result.mappings().all()
        items = [
            {
                "id": row["id"],
                "action": row["action"],
                "entity_type": row["entity_type"],
                "entity_id": row["entity_id"],
                "entity_label": None,
                "field_name": row["field_name"],
                "old_value": row["old_value"],
                "new_value": row["new_value"],
                "user_id": row["user_id"],
                "user_name": row["user_name"],
                "user_avatar": row["user_avatar"],
                "timestamp": row["timestamp"],
                "metadata": row["extra_metadata"],
            }
            for row in rows
        ]
        return items, total

    async def get_recent_by_user(self, user_id: int, limit: int = 5) -> List[dict]:
        """D-48: recent activity for a user (any entity)."""
        stmt = (
            select(AuditLogModel)
            .where(AuditLogModel.user_id == user_id)
            .order_by(AuditLogModel.timestamp.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        rows = result.scalars().all()
        return [
            {
                "id": r.id,
                "action": r.action,
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "timestamp": r.timestamp,
                "metadata": r.extra_metadata,
            }
            for r in rows
        ]
