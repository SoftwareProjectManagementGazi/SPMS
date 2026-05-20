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
    Verify that the current user can access the given project.
    Raises HTTP 404 if the project does not exist (for both admin and
    non-admin callers), HTTP 403 if the caller is non-admin and not a
    member of the project.

    Reports v2 audit (BUG-C): admin callers previously bypassed the
    existence check entirely, so endpoints downstream returned 200 with
    empty data for non-existent project IDs. That silent-success
    contract leaked to FE consumers (e.g. /reports?projectId=99999
    rendered a broken page with no diagnostic). Asserting existence
    for admin too gives a uniform 404 contract across both roles.
    """
    if _is_admin(current_user):
        project = await project_repo.get_by_id(project_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error_code": "PROJECT_NOT_FOUND", "project_id": project_id},
            )
        return current_user
    project = await project_repo.get_by_id_and_user(project_id, current_user.id)
    if project is None:
        # 404 vs 403 disambiguation: query the existence separately so a
        # non-member of an existing project still gets the 403 they had
        # before (don't leak project enumeration to non-members).
        exists = await project_repo.get_by_id(project_id)
        if exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error_code": "PROJECT_NOT_FOUND", "project_id": project_id},
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project",
        )
    return current_user


__all__ = ["get_project_repo", "get_project_member"]
