"""Phase 14 Plan 14-01 — ResetUserPasswordUseCase (D-B3 / D-D2).

Identical to user-initiated /auth/forgot-password but admin-triggered. Token
is 24h TTL (the password-reset default; invites are 7d via
INVITE_TOKEN_TTL_DAYS). Audit row distinguishes via metadata.requested_by_admin_id.

DIP — ZERO sqlalchemy / app.infrastructure imports.
"""
import hashlib
import json
import logging
import secrets
from datetime import datetime, timedelta

from app.domain.exceptions import UserNotFoundError
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.password_reset_repository import (
    IPasswordResetRepository,
)
from app.domain.repositories.user_repository import IUserRepository

logger = logging.getLogger("spms")


class ResetUserPasswordUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        password_reset_repo: IPasswordResetRepository,
        audit_repo: IAuditRepository,
        frontend_url: str = "http://localhost:3000",
    ):
        self.user_repo = user_repo
        self.password_reset_repo = password_reset_repo
        self.audit_repo = audit_repo
        self.frontend_url = frontend_url

    async def execute(self, target_user_id: int, admin_id: int) -> None:
        user = await self.user_repo.get_by_id(target_user_id)
        if user is None:
            raise UserNotFoundError(target_user_id)

        raw = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(hours=24)
        await self.password_reset_repo.create(user.id, token_hash, expires_at)

        link = f"{self.frontend_url}/reset-password?token={raw}"
        logger.info(json.dumps({
            "event": "admin_password_reset_requested",
            "user_id": user.id,
            "email": user.email,
            "link": link,
            "requested_by_admin_id": admin_id,
        }))

        await self.audit_repo.create_with_metadata(
            entity_type="auth",
            entity_id=user.id or 0,
            action="password_reset_requested",
            user_id=admin_id,
            metadata={
                "user_id": user.id,
                "user_email": user.email,
                "requested_by_admin_id": admin_id,
            },
        )
