from app.domain.repositories.user_repository import IUserRepository
from app.application.ports.security_port import ISecurityService
from app.application.dtos.auth_dtos import UserLoginDTO, TokenDTO
from app.domain.exceptions import InvalidCredentialsError

class LoginUserUseCase:
    def __init__(self, user_repo: IUserRepository, security_service: ISecurityService):
        self.user_repo = user_repo
        self.security_service = security_service

    async def execute(self, dto: UserLoginDTO) -> TokenDTO:
        user = await self.user_repo.get_by_email(dto.email)
        
        if not user or not self.security_service.verify_password(dto.password, user.password_hash):
            raise InvalidCredentialsError()

        access_token = self.security_service.create_access_token(
            data={"sub": user.email}
        )
        
        return TokenDTO(access_token=access_token, token_type="bearer")
