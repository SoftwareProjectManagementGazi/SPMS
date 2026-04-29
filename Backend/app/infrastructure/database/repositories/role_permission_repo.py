"""Phase 15 RBAC-01 — SqlAlchemy impl of IRolePermissionRepository (Plan 15-04)."""
from typing import List

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.permission import Permission
from app.domain.entities.role_permission import RolePermission
from app.domain.repositories.role_permission_repository import IRolePermissionRepository
from app.infrastructure.database.models.permission import PermissionModel
from app.infrastructure.database.models.role_permission import RolePermissionModel


class SqlAlchemyRolePermissionRepository(IRolePermissionRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_matrix(self) -> List[RolePermission]:
        result = await self.session.execute(select(RolePermissionModel))
        return [RolePermission.model_validate(m) for m in result.scalars().all()]

    async def set_cell(
        self, role_id: int, permission_id: int, granted: bool
    ) -> None:
        if granted:
            stmt = pg_insert(RolePermissionModel).values(
                role_id=role_id, permission_id=permission_id
            ).on_conflict_do_nothing(index_elements=["role_id", "permission_id"])
            await self.session.execute(stmt)
        else:
            stmt = delete(RolePermissionModel).where(
                RolePermissionModel.role_id == role_id,
                RolePermissionModel.permission_id == permission_id,
            )
            await self.session.execute(stmt)
        await self.session.flush()
        await self.session.commit()

    async def list_by_role(self, role_id: int) -> List[Permission]:
        stmt = (
            select(PermissionModel)
            .join(
                RolePermissionModel,
                RolePermissionModel.permission_id == PermissionModel.id,
            )
            .where(RolePermissionModel.role_id == role_id)
            .order_by(PermissionModel.key)
        )
        result = await self.session.execute(stmt)
        return [Permission.model_validate(m) for m in result.scalars().all()]

    async def delete_by_role(self, role_id: int) -> int:
        stmt = delete(RolePermissionModel).where(
            RolePermissionModel.role_id == role_id
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        await self.session.commit()
        return result.rowcount or 0
