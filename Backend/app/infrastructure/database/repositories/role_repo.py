"""Phase 15 RBAC-01 — SqlAlchemy impl of IRoleRepository (NEW per Pitfall 12, Plan 15-04)."""
from typing import List, Optional

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.role import Role
from app.domain.repositories.role_repository import IRoleRepository
from app.infrastructure.database.models.role import RoleModel


class SqlAlchemyRoleRepository(IRoleRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: RoleModel) -> Role:
        return Role.model_validate(model)

    async def create(self, role: Role) -> Role:
        model = RoleModel(
            name=role.name,
            description=role.description,
            is_system_role=role.is_system_role,
            icon_key=role.icon_key,
            color_token=role.color_token,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()
        return self._to_entity(model)

    async def get_by_id(self, role_id: int) -> Optional[Role]:
        result = await self.session.execute(
            select(RoleModel).where(RoleModel.id == role_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_name(self, name: str) -> Optional[Role]:
        result = await self.session.execute(
            select(RoleModel).where(RoleModel.name.ilike(name))
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_all(self) -> List[Role]:
        result = await self.session.execute(
            select(RoleModel).order_by(RoleModel.id)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def update(self, role: Role) -> Role:
        if role.id is None:
            raise ValueError("Cannot update role without id")
        await self.session.execute(
            update(RoleModel)
            .where(RoleModel.id == role.id)
            .values(
                name=role.name,
                description=role.description,
                icon_key=role.icon_key,
                color_token=role.color_token,
                # is_system_role intentionally NOT updatable here
            )
        )
        await self.session.flush()
        await self.session.commit()
        return await self.get_by_id(role.id) or role

    async def delete(self, role_id: int) -> bool:
        result = await self.session.execute(
            delete(RoleModel).where(RoleModel.id == role_id)
        )
        await self.session.flush()
        await self.session.commit()
        return (result.rowcount or 0) > 0
