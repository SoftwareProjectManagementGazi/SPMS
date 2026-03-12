import hashlib
from datetime import datetime
from fastapi import HTTPException
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.password_reset_repository import IPasswordResetRepository
from app.application.dtos.auth_dtos import PasswordResetConfirmDTO
from app.application.ports.security_port import ISecurityService


class ConfirmPasswordResetUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        reset_repo: IPasswordResetRepository,
        security: ISecurityService,
    ):
        self._user_repo = user_repo
        self._reset_repo = reset_repo
        self._security = security

    async def execute(self, dto: PasswordResetConfirmDTO) -> None:
        token_hash = hashlib.sha256(dto.token.encode()).hexdigest()
        record = await self._reset_repo.get_by_hash(token_hash)
        if not record:
            raise HTTPException(
                status_code=400,
                detail="This link has expired or has already been used. Request a new password reset.",
            )
        if record.used_at is not None:
            raise HTTPException(
                status_code=400,
                detail="This link has expired or has already been used. Request a new password reset.",
            )
        if datetime.utcnow() > record.expires_at:
            raise HTTPException(
                status_code=400,
                detail="This link has expired or has already been used. Request a new password reset.",
            )
        new_hash = self._security.get_password_hash(dto.new_password)
        await self._user_repo.update_password(record.user_id, new_hash)
        await self._reset_repo.mark_used(record.id)
