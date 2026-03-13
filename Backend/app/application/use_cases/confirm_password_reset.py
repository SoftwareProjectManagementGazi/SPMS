import hashlib
from datetime import datetime
from fastapi import HTTPException
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.password_reset_repository import IPasswordResetRepository
from app.application.dtos.auth_dtos import PasswordResetConfirmDTO
from app.application.ports.security_port import ISecurityService
from app.application.services.lockout import clear_lockout


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
        if not record or record.used_at is not None or datetime.utcnow() > record.expires_at:
            raise HTTPException(
                status_code=400,
                detail="Bu bağlantının süresi dolmuş veya daha önce kullanılmış. Yeni bir sıfırlama bağlantısı talep edin.",
            )
        new_hash = self._security.get_password_hash(dto.new_password)
        await self._user_repo.update_password(record.user_id, new_hash)
        await self._reset_repo.mark_used(record.id)
        # Clear any account lockout so the user can log in with the new password
        clear_lockout(record.user_id)
