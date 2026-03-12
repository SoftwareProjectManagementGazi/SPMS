from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.entities.password_reset_token import PasswordResetToken
from app.domain.repositories.password_reset_repository import IPasswordResetRepository
from app.infrastructure.database.models.password_reset_token import PasswordResetTokenModel


class SqlAlchemyPasswordResetRepository(IPasswordResetRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: PasswordResetTokenModel) -> PasswordResetToken:
        return PasswordResetToken.model_validate(model)

    async def create(self, user_id: int, token_hash: str, expires_at: datetime) -> PasswordResetToken:
        model = PasswordResetTokenModel(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def get_by_hash(self, token_hash: str) -> Optional[PasswordResetToken]:
        stmt = select(PasswordResetTokenModel).where(
            PasswordResetTokenModel.token_hash == token_hash
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def mark_used(self, token_id: int) -> None:
        stmt = select(PasswordResetTokenModel).where(PasswordResetTokenModel.id == token_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model:
            model.used_at = datetime.utcnow()
            await self.session.commit()
