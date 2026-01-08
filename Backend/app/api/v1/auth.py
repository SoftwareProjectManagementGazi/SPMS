from fastapi import APIRouter, Depends, HTTPException, status
from app.application.dtos.auth_dtos import UserRegisterDTO, UserLoginDTO, TokenDTO, UserResponseDTO
# UserListDTO'yu buradan import ediyorsanız kalsın, yoksa aşağıda tanımlayacağız.
# from app.application.dtos.auth_dtos import UserListDTO 

from app.application.use_cases.register_user import RegisterUserUseCase
from app.application.use_cases.login_user import LoginUserUseCase
from app.api.dependencies import get_user_repo, get_security_service, get_current_user
from app.domain.repositories.user_repository import IUserRepository
from app.application.ports.security_port import ISecurityService
from app.domain.entities.user import User
from app.domain.exceptions import UserAlreadyExistsError, InvalidCredentialsError
from typing import List
from pydantic import BaseModel

router = APIRouter()

# Eğer UserListDTO auth_dtos.py içinde yoksa burada tanımlayın:
class UserListDTO(BaseModel):
    id: int
    email: str
    username: str # Frontend bu ismi bekliyor olabilir, backend'den full_name'i buraya map edeceğiz
    avatar_url: str | None = None

@router.get("/me", response_model=UserResponseDTO)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserResponseDTO, status_code=status.HTTP_201_CREATED)
async def register(
    dto: UserRegisterDTO,
    user_repo: IUserRepository = Depends(get_user_repo),
    security_service: ISecurityService = Depends(get_security_service)
):
    try:
        use_case = RegisterUserUseCase(user_repo, security_service)
        return await use_case.execute(dto)
    except UserAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=TokenDTO)
async def login(
    dto: UserLoginDTO,
    user_repo: IUserRepository = Depends(get_user_repo),
    security_service: ISecurityService = Depends(get_security_service)
):
    try:
        use_case = LoginUserUseCase(user_repo, security_service)
        return await use_case.execute(dto)
    except InvalidCredentialsError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.get("/users", response_model=List[UserListDTO])
async def list_users(
    current_user: dict = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repo),
) -> List[UserListDTO]:
    """
    Sistemdeki tüm kullanıcıları listeler (Assignee seçimi için).
    """
    users = await user_repo.get_all() 
    return [
        UserListDTO(
            id=u.id, 
            email=u.email, 
            # DÜZELTME: u.username -> u.full_name
            # User entity'sinde 'username' yok, 'full_name' var.
            username=u.full_name, 
            # Avatar bilgisini de ekleyelim (Entity'de 'avatar' string olarak var)
            avatar_url=u.avatar 
        ) for u in users
    ]