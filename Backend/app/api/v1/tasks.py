from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.dependencies import get_task_repo, get_project_repo, get_current_user
from app.application.dtos.task_dtos import TaskCreateDTO, TaskUpdateDTO, TaskResponseDTO
from app.application.use_cases.manage_tasks import (
    CreateTaskUseCase,
    ListProjectTasksUseCase,
    ListMyTasksUseCase,
    GetTaskUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase
)
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.entities.user import User
from app.domain.exceptions import TaskNotFoundError, ProjectNotFoundError

router = APIRouter()

@router.post("/", response_model=TaskResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_task(
    dto: TaskCreateDTO,
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    try:
        use_case = CreateTaskUseCase(task_repo, project_repo)
        return await use_case.execute(dto)
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/project/{project_id}", response_model=List[TaskResponseDTO])
async def list_project_tasks(
    project_id: int,
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_current_user)
):
    use_case = ListProjectTasksUseCase(task_repo)
    return await use_case.execute(project_id)

@router.get("/my-tasks", response_model=List[TaskResponseDTO])
async def list_my_tasks(
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_current_user)
):
    use_case = ListMyTasksUseCase(task_repo)
    return await use_case.execute(current_user.id) # type: ignore

@router.get("/{task_id}", response_model=TaskResponseDTO)
async def get_task(
    task_id: int,
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_current_user)
):
    try:
        use_case = GetTaskUseCase(task_repo)
        return await use_case.execute(task_id)
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/{task_id}", response_model=TaskResponseDTO)
async def update_task(
    task_id: int,
    dto: TaskUpdateDTO,
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    try:
        use_case = UpdateTaskUseCase(task_repo, project_repo)
        return await use_case.execute(task_id, dto, current_user.id) # type: ignore
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    try:
        use_case = DeleteTaskUseCase(task_repo, project_repo)
        await use_case.execute(task_id, current_user.id) # type: ignore
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
