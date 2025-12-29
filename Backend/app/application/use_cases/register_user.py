from app.domain.repositories.user_repository import IUserRepository
from app.application.ports.security_port import ISecurityService
from app.application.dtos.auth_dtos import UserRegisterDTO, UserResponseDTO
from app.domain.entities.user import User
from app.domain.exceptions import UserAlreadyExistsError

class RegisterUserUseCase:
    def __init__(self, user_repo: IUserRepository, security_service: ISecurityService):
        self.user_repo = user_repo
        self.security_service = security_service

    async def execute(self, dto: UserRegisterDTO) -> UserResponseDTO:
        existing_user = await self.user_repo.get_by_email(dto.email)
        if existing_user:
            raise UserAlreadyExistsError(dto.email)

        hashed_password = self.security_service.get_password_hash(dto.password)
        
        new_user = User(
            email=dto.email,
            password_hash=hashed_password,
            full_name=dto.full_name
        )

        created_user = await self.user_repo.create(new_user)
        
        # Manually map to DTO to avoid exposing password_hash or internal fields
        return UserResponseDTO(
            id=created_user.id, # type: ignore
            email=created_user.email,
            full_name=created_user.full_name,
            is_active=created_user.is_active
        )
