"""Sprint CRUD router — /api/v1/sprints"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.api.dependencies import (
    get_sprint_repo,
    get_sprint_project_member,
    get_current_user,
    get_project_repo,
    _is_admin,
)
from app.application.dtos.sprint_dtos import SprintCreateDTO, SprintUpdateDTO, SprintResponseDTO
from app.application.use_cases.manage_sprints import (
    CreateSprintUseCase,
    ListSprintsUseCase,
    UpdateSprintUseCase,
    DeleteSprintUseCase,
    CloseSprintUseCase,
)


class CloseSprintDTO(BaseModel):
    move_tasks_to_sprint_id: Optional[int] = None
from app.domain.repositories.sprint_repository import ISprintRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.entities.user import User
from app.domain.exceptions import SprintNotFoundError

router = APIRouter()


@router.get("/", response_model=List[SprintResponseDTO])
async def list_sprints(
    project_id: int,
    current_user: User = Depends(get_sprint_project_member),
    sprint_repo: ISprintRepository = Depends(get_sprint_repo),
):
    use_case = ListSprintsUseCase(sprint_repo)
    return await use_case.execute(project_id)


@router.post("/", response_model=SprintResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_sprint(
    dto: SprintCreateDTO,
    current_user: User = Depends(get_current_user),
    sprint_repo: ISprintRepository = Depends(get_sprint_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
):
    # Verify project membership for the project in the body
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(dto.project_id, current_user.id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this project",
            )
    use_case = CreateSprintUseCase(sprint_repo)
    return await use_case.execute(dto)


@router.patch("/{sprint_id}", response_model=SprintResponseDTO)
async def update_sprint(
    sprint_id: int,
    dto: SprintUpdateDTO,
    current_user: User = Depends(get_current_user),
    sprint_repo: ISprintRepository = Depends(get_sprint_repo),
):
    try:
        use_case = UpdateSprintUseCase(sprint_repo)
        return await use_case.execute(sprint_id, dto, current_user)
    except SprintNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{sprint_id}/close", response_model=SprintResponseDTO)
async def close_sprint(
    sprint_id: int,
    dto: CloseSprintDTO,
    current_user: User = Depends(get_current_user),
    sprint_repo: ISprintRepository = Depends(get_sprint_repo),
):
    try:
        use_case = CloseSprintUseCase(sprint_repo)
        return await use_case.execute(sprint_id, dto.move_tasks_to_sprint_id)
    except SprintNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sprint(
    sprint_id: int,
    move_tasks_to: Optional[int] = Query(None, description="Target sprint ID to move tasks to (null = backlog)"),
    current_user: User = Depends(get_current_user),
    sprint_repo: ISprintRepository = Depends(get_sprint_repo),
):
    try:
        use_case = DeleteSprintUseCase(sprint_repo)
        await use_case.execute(sprint_id, current_user, move_tasks_to_sprint_id=move_tasks_to)
    except SprintNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
