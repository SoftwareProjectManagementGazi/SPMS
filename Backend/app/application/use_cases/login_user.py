from typing import Optional

from fastapi import HTTPException
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.role_permission_repository import IRolePermissionRepository
from app.application.ports.security_port import ISecurityService
from app.application.dtos.auth_dtos import UserLoginDTO, TokenDTO
from app.domain.exceptions import InvalidCredentialsError
from app.application.services.lockout import check_lockout, record_failed_attempt, clear_lockout


class LoginUserUseCase:
    """Login flow with Phase 15 RBAC-02 JWT permissions[] claim composition.

    DIP — application layer; injects IUserRepository + ISecurityService + optional
    IRolePermissionRepository. The role_permission_repo is optional for
    backwards-compat (callers that have not yet wired the Phase 15 dep can still
    use the use case; existing admins will still log in via Admin super-role
    short-circuit in _has_permission).

    Phase 15 D-1.3 + Pitfall 14 — composes permissions[] from
    IRolePermissionRepository.list_by_role(user.role.id), sorted alphabetically
    for deterministic test assertions and stable token shape across logins.
    """

    def __init__(
        self,
        user_repo: IUserRepository,
        security_service: ISecurityService,
        role_permission_repo: Optional[IRolePermissionRepository] = None,
    ):
        self.user_repo = user_repo
        self.security_service = security_service
        self.role_permission_repo = role_permission_repo

    async def execute(self, dto: UserLoginDTO) -> TokenDTO:
        # Step 1: Lookup user — if not found, raise invalid credentials (no enumeration)
        user = await self.user_repo.get_by_email(dto.email)
        if not user:
            raise InvalidCredentialsError()

        # Step 2: Check account lockout before verifying password
        locked_until = check_lockout(user.id)
        if locked_until:
            raise HTTPException(
                status_code=423,
                detail=f"ACCOUNT_LOCKED:{locked_until.isoformat()}",
            )

        # Step 3: Verify password — record failure or clear on success
        if not self.security_service.verify_password(dto.password, user.password_hash):
            record_failed_attempt(user.id)
            raise InvalidCredentialsError()

        # Step 4: Successful login — clear any partial lockout state
        clear_lockout(user.id)

        # Step 5: Phase 15 D-1.3 — compose permissions[] claim from
        # role_permission_repo.list_by_role. Sorted alphabetically per Pitfall 14
        # for deterministic order across logins (eases test assertions and JWT
        # shape comparisons). Empty list when:
        #   - user has no role (Admin super-role still works via _is_admin)
        #   - role_permission_repo not injected (backwards-compat)
        #   - role has 0 explicit perms (Admin / Guest by D-1.5 / D-2.4)
        perms: list[str] = []
        if (
            self.role_permission_repo is not None
            and user.role is not None
            and getattr(user.role, "id", None) is not None
        ):
            role_perms = await self.role_permission_repo.list_by_role(user.role.id)
            perms = sorted(p.key for p in role_perms)

        access_token = self.security_service.create_access_token(
            data={"sub": user.email, "permissions": perms}
        )

        return TokenDTO(access_token=access_token, token_type="bearer")
