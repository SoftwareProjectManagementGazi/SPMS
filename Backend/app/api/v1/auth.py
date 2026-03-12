from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from pathlib import Path
import uuid
import os

from app.application.dtos.auth_dtos import UserRegisterDTO, UserLoginDTO, TokenDTO, UserResponseDTO, UserListDTO, UserUpdateDTO
from app.application.use_cases.register_user import RegisterUserUseCase
from app.application.use_cases.login_user import LoginUserUseCase
from app.application.use_cases.update_user_profile import UpdateUserProfileUseCase
from app.api.dependencies import get_user_repo, get_security_service, get_current_user
from app.domain.repositories.user_repository import IUserRepository
from app.application.ports.security_port import ISecurityService
from app.domain.entities.user import User
from app.domain.exceptions import UserAlreadyExistsError, InvalidCredentialsError
from typing import List

AVATAR_DIR = Path("static/uploads/avatars")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB

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


@router.put("/me", response_model=UserResponseDTO)
async def update_profile(
    dto: UserUpdateDTO,
    current_user: User = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repo),
    security_service: ISecurityService = Depends(get_security_service),
):
    """Update current user's full_name and/or email. Email change requires current_password."""
    use_case = UpdateUserProfileUseCase(user_repo, security_service)
    return await use_case.execute(current_user, dto)


@router.post("/me/avatar", response_model=UserResponseDTO)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    """Upload avatar image for the current user. Max 2MB. Allowed: jpg, jpeg, png, gif, webp."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed types: {sorted(ALLOWED_EXTENSIONS)}",
        )
    content = await file.read()
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 2MB limit")
    filename = f"{uuid.uuid4()}{ext}"
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    (AVATAR_DIR / filename).write_bytes(content)
    relative_path = f"uploads/avatars/{filename}"  # relative to static/ root
    await user_repo.update_avatar(current_user.id, relative_path)
    return await user_repo.get_by_id(current_user.id)


@router.get("/avatar/{filename}")
async def serve_avatar(
    filename: str,
    current_user: User = Depends(get_current_user),  # 401 if no token
):
    """Serve avatar file for authenticated users only (no public static mount)."""
    # Prevent path traversal
    safe_name = Path(filename).name
    path = AVATAR_DIR / safe_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(path)