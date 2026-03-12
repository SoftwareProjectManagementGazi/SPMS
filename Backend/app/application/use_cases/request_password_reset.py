import secrets
import hashlib
import json
import logging
from datetime import datetime, timedelta
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.password_reset_repository import IPasswordResetRepository
from app.application.dtos.auth_dtos import PasswordResetRequestDTO
from app.infrastructure.config import settings

logger = logging.getLogger("spms")


class RequestPasswordResetUseCase:
    def __init__(self, user_repo: IUserRepository, reset_repo: IPasswordResetRepository):
        self._user_repo = user_repo
        self._reset_repo = reset_repo

    async def execute(self, dto: PasswordResetRequestDTO) -> None:
        """Always succeeds — 204 whether email exists or not (no user enumeration)."""
        user = await self._user_repo.get_by_email(dto.email)
        if user:
            raw = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw.encode()).hexdigest()
            expires_at = datetime.utcnow() + timedelta(minutes=30)
            await self._reset_repo.create(user.id, token_hash, expires_at)
            link = f"{settings.FRONTEND_URL}/reset-password?token={raw}"
            # Dev: log link to structured logger (no SMTP needed in dev)
            logger.info(json.dumps({"event": "password_reset_requested", "user_id": user.id, "link": link}))
            # Production path: if settings.SMTP_HOST: send_email(user.email, link)
