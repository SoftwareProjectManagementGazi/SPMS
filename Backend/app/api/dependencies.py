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
from app.domain.repositories.audit_repository import IAuditRepository
from app.infrastructure.database.repositories.audit_repo import SqlAlchemyAuditRepository
from app.application.ports.security_port import ISecurityService
from app.infrastructure.adapters.security_adapter import SecurityAdapter
from app.domain.repositories.team_repository import ITeamRepository
from app.infrastructure.database.repositories.team_repo import SqlAlchemyTeamRepository
from app.domain.repositories.password_reset_repository import IPasswordResetRepository
from app.infrastructure.database.repositories.password_reset_repo import SqlAlchemyPasswordResetRepository

# Re-export the database dependency
get_db = get_db_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_user_repo(session: AsyncSession = Depends(get_db)) -> IUserRepository:
    return SqlAlchemyUserRepository(session)

def get_project_repo(session: AsyncSession = Depends(get_db)) -> IProjectRepository:
    return SqlAlchemyProjectRepository(session)

def get_task_repo(session: AsyncSession = Depends(get_db)) -> ITaskRepository:
    return SqlAlchemyTaskRepository(session)

def get_audit_repo(session: AsyncSession = Depends(get_db)) -> IAuditRepository:
    return SqlAlchemyAuditRepository(session)

def get_team_repo(session: AsyncSession = Depends(get_db)) -> ITeamRepository:
    return SqlAlchemyTeamRepository(session)

def get_password_reset_repo(session: AsyncSession = Depends(get_db)) -> IPasswordResetRepository:
    return SqlAlchemyPasswordResetRepository(session)

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


def _is_admin(user: User) -> bool:
    """Return True when the user holds the admin role."""
    return (
        user.role is not None
        and user.role.name.lower() == "admin"
    )


async def get_project_member(
    project_id: int,
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
) -> User:
    """
    Verify that the current user is a member of the given project.
    Admin users bypass the membership check.
    Raises HTTP 403 for non-members.
    """
    if _is_admin(current_user):
        return current_user
    project = await project_repo.get_by_id_and_user(project_id, current_user.id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project",
        )
    return current_user


async def get_task_project_member(
    task_id: int,
    current_user: User = Depends(get_current_user),
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
) -> User:
    """
    Fetch the task, extract its project_id, then verify membership.
    Admin users bypass the membership check.
    Raises HTTP 404 if the task does not exist, HTTP 403 for non-members.
    """
    task = await task_repo.get_by_id(task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )
    if _is_admin(current_user):
        return current_user
    project = await project_repo.get_by_id_and_user(task.project_id, current_user.id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project",
        )
    return current_user
