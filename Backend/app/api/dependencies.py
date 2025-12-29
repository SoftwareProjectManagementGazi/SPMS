# Dependency Injection Container
# This file will map interfaces to implementations
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.infrastructure.database.database import get_db_session
from app.infrastructure.config import settings
from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.infrastructure.database.repositories.user_repo import SqlAlchemyUserRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.infrastructure.database.repositories.project_repo import SqlAlchemyProjectRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.infrastructure.database.repositories.task_repo import SqlAlchemyTaskRepository
from app.application.ports.security_port import ISecurityService
from app.infrastructure.adapters.security_adapter import SecurityAdapter

# Re-export the database dependency
get_db = get_db_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_user_repo(session: AsyncSession = Depends(get_db)) -> IUserRepository:
    return SqlAlchemyUserRepository(session)

def get_project_repo(session: AsyncSession = Depends(get_db)) -> IProjectRepository:
    return SqlAlchemyProjectRepository(session)

def get_task_repo(session: AsyncSession = Depends(get_db)) -> ITaskRepository:
    return SqlAlchemyTaskRepository(session)

def get_security_service() -> ISecurityService:
    return SecurityAdapter()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: IUserRepository = Depends(get_user_repo)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await user_repo.get_by_email(email)
    if user is None:
        raise credentials_exception
    return user
