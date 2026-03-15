"""Board column CRUD router — /api/v1/projects/{project_id}/columns"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import (
    get_project_member,
    get_current_user,
    get_project_repo,
    get_board_column_repo,
    _is_admin,
)
from app.application.dtos.board_column_dtos import (
    BoardColumnDTO,
    CreateColumnDTO,
    UpdateColumnDTO,
)
from app.application.use_cases.manage_board_columns import (
    ListColumnsUseCase,
    CreateColumnUseCase,
    UpdateColumnUseCase,
    DeleteColumnUseCase,
)
from app.domain.repositories.board_column_repository import IBoardColumnRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.entities.user import User

router = APIRouter()


@router.get("/{project_id}/columns", response_model=List[BoardColumnDTO])
async def list_columns(
    project_id: int,
    current_user: User = Depends(get_project_member),
    column_repo: IBoardColumnRepository = Depends(get_board_column_repo),
):
    """Return all board columns for a project ordered by order_index."""
    use_case = ListColumnsUseCase(column_repo)
    return await use_case.execute(project_id)


@router.post(
    "/{project_id}/columns",
    response_model=BoardColumnDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_column(
    project_id: int,
    dto: CreateColumnDTO,
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    column_repo: IBoardColumnRepository = Depends(get_board_column_repo),
):
    """Create a new board column. Manager or admin only."""
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this project",
            )
        if project.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only project managers or admins can create columns",
            )
    use_case = CreateColumnUseCase(column_repo)
    return await use_case.execute(project_id, dto)


@router.patch("/{project_id}/columns/{col_id}", response_model=BoardColumnDTO)
async def update_column(
    project_id: int,
    col_id: int,
    dto: UpdateColumnDTO,
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    column_repo: IBoardColumnRepository = Depends(get_board_column_repo),
):
    """Rename or reorder a column. Manager or admin only."""
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this project",
            )
        if project.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only project managers or admins can update columns",
            )
    try:
        use_case = UpdateColumnUseCase(column_repo)
        return await use_case.execute(col_id, dto)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/{project_id}/columns/{col_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_column(
    project_id: int,
    col_id: int,
    move_tasks_to_column_id: int = Query(..., description="Target column ID to move tasks to"),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    column_repo: IBoardColumnRepository = Depends(get_board_column_repo),
):
    """Move all tasks to target column then delete. Manager or admin only."""
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this project",
            )
        if project.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only project managers or admins can delete columns",
            )
    try:
        use_case = DeleteColumnUseCase(column_repo)
        await use_case.execute(col_id, move_tasks_to_column_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
