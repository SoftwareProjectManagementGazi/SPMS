from fastapi import APIRouter, Depends, HTTPException, status
from app.application.dtos.auth_dtos import UserRegisterDTO, UserLoginDTO, TokenDTO, UserResponseDTO
from app.application.use_cases.register_user import RegisterUserUseCase
from app.application.use_cases.login_user import LoginUserUseCase
from app.api.dependencies import get_user_repo, get_security_service, get_current_user
from app.domain.repositories.user_repository import IUserRepository
from app.application.ports.security_port import ISecurityService
from app.domain.entities.user import User
from app.domain.exceptions import UserAlreadyExistsError, InvalidCredentialsError

router = APIRouter()

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
