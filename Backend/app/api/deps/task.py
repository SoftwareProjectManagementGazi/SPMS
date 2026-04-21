"""Task repository DI factory, task-project membership guard, and dependency repo.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.entities.user import User
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.infrastructure.database.repositories.task_repo import SqlAlchemyTaskRepository
from app.infrastructure.database.repositories.task_dependency_repo import SqlAlchemyTaskDependencyRepository
from app.api.deps.auth import get_current_user, _is_admin
from app.api.deps.project import get_project_repo


def get_task_repo(session: AsyncSession = Depends(get_db_session)) -> ITaskRepository:
    return SqlAlchemyTaskRepository(session)


def get_dependency_repo(session: AsyncSession = Depends(get_db_session)) -> SqlAlchemyTaskDependencyRepository:
    return SqlAlchemyTaskDependencyRepository(session)


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


__all__ = ["get_task_repo", "get_task_project_member", "get_dependency_repo"]
