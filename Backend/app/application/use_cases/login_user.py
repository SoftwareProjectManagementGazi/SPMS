from fastapi import HTTPException
from app.domain.repositories.user_repository import IUserRepository
from app.application.ports.security_port import ISecurityService
from app.application.dtos.auth_dtos import UserLoginDTO, TokenDTO
from app.domain.exceptions import InvalidCredentialsError
from app.application.services.lockout import check_lockout, record_failed_attempt, clear_lockout


class LoginUserUseCase:
    def __init__(self, user_repo: IUserRepository, security_service: ISecurityService):
        self.user_repo = user_repo
        self.security_service = security_service

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

        access_token = self.security_service.create_access_token(
            data={"sub": user.email}
        )

        return TokenDTO(access_token=access_token, token_type="bearer")
