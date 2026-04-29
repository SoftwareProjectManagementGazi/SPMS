"""Phase 15 RBAC-01 — SqlAlchemy impl of IPermissionRepository (Plan 15-04)."""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.permission import Permission
from app.domain.repositories.permission_repository import IPermissionRepository
from app.infrastructure.database.models.permission import PermissionModel


class SqlAlchemyPermissionRepository(IPermissionRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: PermissionModel) -> Permission:
        return Permission.model_validate(model)

    async def list_all(self) -> List[Permission]:
        result = await self.session.execute(
            select(PermissionModel).order_by(PermissionModel.key)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_by_key(self, key: str) -> Optional[Permission]:
        result = await self.session.execute(
            select(PermissionModel).where(PermissionModel.key == key)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_scope(self, scope: str) -> List[Permission]:
        result = await self.session.execute(
            select(PermissionModel)
            .where(PermissionModel.scope == scope)
            .order_by(PermissionModel.key)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def create_many(self, perms: List[Permission]) -> List[Permission]:
        if not perms:
            return []
        stmt = pg_insert(PermissionModel).values(
            [
                {
                    "key": p.key,
                    "label_tr": p.label_tr,
                    "label_en": p.label_en,
                    "scope": p.scope,
                }
                for p in perms
            ]
        ).on_conflict_do_nothing(index_elements=["key"])
        await self.session.execute(stmt)
        await self.session.flush()
        return await self.list_all()
