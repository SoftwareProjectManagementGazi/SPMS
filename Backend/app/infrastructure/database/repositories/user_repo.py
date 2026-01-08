from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import joinedload # <-- BU İMPORT ÖNEMLİ

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

    async def create(self, user: User) -> User:
        model = self._to_model(user)
        # Create aşamasında role_id set edildiği için ilişkiyi manuel yönetmeye gerek kalmayabilir
        # ama en temizi create sonrası get_by_id ile çekmektir.
        self.session.add(model)
        await self.session.flush()
        return await self.get_by_id(model.id) # type: ignore

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = (
            select(UserModel)
            .options(joinedload(UserModel.role)) # <-- Role'ü yükle
            .where(UserModel.email == email)
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_id(self, user_id: int) -> Optional[User]:
        stmt = (
            select(UserModel)
            .options(joinedload(UserModel.role)) # <-- Role'ü yükle
            .where(UserModel.id == user_id)
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    # HATA VEREN METOD BURASIYDI
    async def get_all(self) -> List[User]:
        stmt = (
            select(UserModel)
            .options(joinedload(UserModel.role)) # <-- Role'ü yükle (HATA ÇÖZÜMÜ)
        )
        result = await self.session.execute(stmt)
        # unique() eklemek, join işlemlerinde oluşan satır çoğullamalarını önler (joinedload kullanınca gereklidir)
        return [self._to_entity(m) for m in result.unique().scalars().all()]