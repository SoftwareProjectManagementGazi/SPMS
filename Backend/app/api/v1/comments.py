from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import (
    get_current_user,
    get_task_project_member,
    get_task_repo,
    get_project_repo,
    get_comment_repo,
    _is_admin,
)
from app.domain.entities.user import User
from app.domain.repositories.comment_repository import ICommentRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.exceptions import CommentNotFoundError
from app.application.dtos.comment_dtos import (
    CommentCreateDTO,
    CommentUpdateDTO,
    CommentResponseDTO,
)
from app.application.use_cases.manage_comments import (
    ListCommentsUseCase,
    CreateCommentUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
)

router = APIRouter()


@router.get("/task/{task_id}", response_model=List[CommentResponseDTO])
async def list_comments(
    task_id: int,
    current_user: User = Depends(get_task_project_member),
    comment_repo: ICommentRepository = Depends(get_comment_repo),
):
    use_case = ListCommentsUseCase(comment_repo)
    return await use_case.execute(task_id)


@router.post("/", response_model=CommentResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_comment(
    dto: CommentCreateDTO,
    current_user: User = Depends(get_current_user),
    comment_repo: ICommentRepository = Depends(get_comment_repo),
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
):
    # Enforce project membership: task_id comes from body (not path param)
    task = await task_repo.get_by_id(dto.task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {dto.task_id} not found",
        )
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(task.project_id, current_user.id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this project",
            )
    use_case = CreateCommentUseCase(comment_repo)
    return await use_case.execute(dto, author_id=current_user.id)


@router.patch("/{comment_id}", response_model=CommentResponseDTO)
async def update_comment(
    comment_id: int,
    dto: CommentUpdateDTO,
    current_user: User = Depends(get_current_user),
    comment_repo: ICommentRepository = Depends(get_comment_repo),
):
    use_case = UpdateCommentUseCase(comment_repo)
    try:
        return await use_case.execute(comment_id, dto, current_user.id, current_user)
    except CommentNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    comment_repo: ICommentRepository = Depends(get_comment_repo),
):
    use_case = DeleteCommentUseCase(comment_repo)
    try:
        await use_case.execute(comment_id, current_user.id, current_user)
    except CommentNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
