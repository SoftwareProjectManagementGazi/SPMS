from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.dependencies import get_project_repo, get_current_user
from app.application.dtos.project_dtos import ProjectCreateDTO, ProjectUpdateDTO, ProjectResponseDTO
from app.application.use_cases.manage_projects import (
    CreateProjectUseCase,
    ListProjectsUseCase,
    GetProjectUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase
)
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.entities.user import User
from app.domain.exceptions import ProjectNotFoundError

router = APIRouter()

@router.post("/", response_model=ProjectResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_project(
    dto: ProjectCreateDTO,
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    use_case = CreateProjectUseCase(project_repo)
    return await use_case.execute(dto, current_user.id) # type: ignore

@router.get("/", response_model=List[ProjectResponseDTO])
async def list_projects(
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    use_case = ListProjectsUseCase(project_repo)
    return await use_case.execute(current_user.id) # type: ignore

@router.get("/{project_id}", response_model=ProjectResponseDTO)
async def get_project(
    project_id: int,
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    try:
        use_case = GetProjectUseCase(project_repo)
        return await use_case.execute(project_id, current_user.id) # type: ignore
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/{project_id}", response_model=ProjectResponseDTO)
async def update_project(
    project_id: int,
    dto: ProjectUpdateDTO,
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    try:
        use_case = UpdateProjectUseCase(project_repo)
        return await use_case.execute(project_id, dto, current_user.id) # type: ignore
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    try:
        use_case = DeleteProjectUseCase(project_repo)
        await use_case.execute(project_id, current_user.id) # type: ignore
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
