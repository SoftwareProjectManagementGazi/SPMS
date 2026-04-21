"""Project repository DI factory and project membership guard.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.entities.user import User
from app.domain.repositories.project_repository import IProjectRepository
from app.infrastructure.database.repositories.project_repo import SqlAlchemyProjectRepository
from app.api.deps.auth import get_current_user, _is_admin


def get_project_repo(session: AsyncSession = Depends(get_db_session)) -> IProjectRepository:
    return SqlAlchemyProjectRepository(session)


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


__all__ = ["get_project_repo", "get_project_member"]
