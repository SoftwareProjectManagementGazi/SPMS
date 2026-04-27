"""Phase 14 Plan 14-01 — InviteUserUseCase (D-B2 / D-A6 / D-D2).

Email-invite flow:
1) Create User(is_active=False) with random bcrypt-hashed password (placeholder
   until invitee sets their own via the email link)
2) Create PasswordResetToken with INVITE_TOKEN_TTL_DAYS expiry (7d default)
3) Log the invite link (Phase 5 / dev SMTP-less path) — production would send
   the email here via the configured SMTP infrastructure
4) Emit user.invited audit_log row enriched with target email + role +
   requested_by_admin_id

DIP — ZERO sqlalchemy / app.infrastructure imports. Settings come via the
constructor's ``invite_token_ttl_days`` argument so tests can override
without monkey-patching the global Settings singleton.
"""
import hashlib
import json
import logging
import secrets
from datetime import datetime, timedelta
from typing import Any, Optional

from app.application.dtos.admin_user_dtos import (
    InviteUserRequestDTO,
    InviteUserResponseDTO,
)
from app.application.ports.security_port import ISecurityService
from app.domain.entities.user import User
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.password_reset_repository import (
    IPasswordResetRepository,
)
from app.domain.repositories.user_repository import IUserRepository

logger = logging.getLogger("spms")


class InviteUserUseCase:
    """Admin-triggered email invite — creates user + reset token + logs link."""

    def __init__(
        self,
        user_repo: IUserRepository,
        password_reset_repo: IPasswordResetRepository,
        audit_repo: IAuditRepository,
        security: ISecurityService,
        invite_token_ttl_days: int = 7,
        frontend_url: str = "http://localhost:3000",
    ):
        self.user_repo = user_repo
        self.password_reset_repo = password_reset_repo
        self.audit_repo = audit_repo
        self.security = security
        self.invite_token_ttl_days = invite_token_ttl_days
        self.frontend_url = frontend_url

    async def execute(
        self,
        dto: InviteUserRequestDTO,
        admin_id: int,
        role_id_resolver: Optional[Any] = None,
    ) -> InviteUserResponseDTO:
        """Execute the invite flow.

        ``role_id_resolver`` is a callable async function (role_name) -> role_id
        injected by the router so the use case stays free of Role table coupling.
        Pass None when running in tests with fake user_repo that ignores role_id.
        """
        # 1) Create user with disabled account + random hashed password
        # placeholder; invitee will replace via the reset-token link.
        random_password = secrets.token_urlsafe(32)
        password_hash = self.security.get_password_hash(random_password)

        role_id: Optional[int] = None
        if role_id_resolver is not None:
            role_id = await role_id_resolver(dto.role)

        new_user = User(
            email=dto.email,
            full_name=dto.name or dto.email.split("@")[0],
            password_hash=password_hash,
            is_active=False,  # Activated when invitee sets password
            role_id=role_id,
        )
        created = await self.user_repo.create(new_user)

        # 2) PasswordResetToken with extended invite TTL.
        raw = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(days=self.invite_token_ttl_days)
        await self.password_reset_repo.create(created.id, token_hash, expires_at)

        # 3) Invite link logged (dev path); production sends via SMTP.
        link = f"{self.frontend_url}/auth/set-password?token={raw}"
        logger.info(json.dumps({
            "event": "user_invited",
            "user_id": created.id,
            "email": created.email,
            "link": link,
        }))

        # 4) Enriched audit row (D-D2 user-lifecycle metadata).
        await self.audit_repo.create_with_metadata(
            entity_type="user",
            entity_id=created.id or 0,
            action="invited",
            user_id=admin_id,
            metadata={
                "user_id": created.id,
                "user_email": created.email,
                "target_role": dto.role,
                "requested_by_admin_id": admin_id,
            },
        )

        return InviteUserResponseDTO(
            user_id=created.id or 0,
            email=created.email,
            invite_token_expires_at=expires_at,
        )
