from abc import ABC, abstractmethod
from typing import Optional
from app.domain.entities.password_reset_token import PasswordResetToken


class IPasswordResetRepository(ABC):
    @abstractmethod
    async def create(self, user_id: int, token_hash: str, expires_at) -> PasswordResetToken: ...
    @abstractmethod
    async def get_by_hash(self, token_hash: str) -> Optional[PasswordResetToken]: ...
    @abstractmethod
    async def mark_used(self, token_id: int) -> None: ...
