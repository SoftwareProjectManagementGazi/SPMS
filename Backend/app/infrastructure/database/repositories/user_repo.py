from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import joinedload

from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.infrastructure.database.models.user import UserModel


class SqlAlchemyUserRepository(IUserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: UserModel) -> User:
        return User.model_validate(model)

    def _to_model(self, entity: User) -> UserModel:
        data = entity.model_dump(exclude={"id", "created_at", "updated_at", "role"})
        return UserModel(**data)

    def _get_base_query(self):
        """Return base select with is_deleted filter and eager-loaded role."""
        return (
            select(UserModel)
            .where(UserModel.is_deleted == False)
            .options(joinedload(UserModel.role))
        )

    async def create(self, user: User) -> User:
        model = self._to_model(user)
        self.session.add(model)
        await self.session.flush()
        return await self.get_by_id(model.id)  # type: ignore

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = self._get_base_query().where(UserModel.email == email)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_id(self, user_id: int) -> Optional[User]:
        stmt = self._get_base_query().where(UserModel.id == user_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all(self) -> List[User]:
        stmt = self._get_base_query()
        result = await self.session.execute(stmt)
        # unique() prevents row duplication from joinedload on collections
        return [self._to_entity(m) for m in result.unique().scalars().all()]

    async def delete(self, user_id: int) -> bool:
        """Soft-delete: set is_deleted=True and deleted_at; do NOT issue SQL DELETE."""
        stmt = select(UserModel).where(UserModel.id == user_id, UserModel.is_deleted == False)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model:
            model.is_deleted = True
            model.deleted_at = datetime.utcnow()  # Set explicitly — NOT via onupdate
            await self.session.commit()
            return True
        return False
