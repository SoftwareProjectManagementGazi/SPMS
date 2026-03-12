from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.dependencies import (
    get_task_repo,
    get_project_repo,
    get_current_user,
    get_project_member,
    get_task_project_member,
    get_audit_repo,
)
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
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.entities.user import User
from app.domain.exceptions import TaskNotFoundError, ProjectNotFoundError

router = APIRouter()

@router.post("/", response_model=TaskResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_task(
    dto: TaskCreateDTO,
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user),
):
    # Enforce project membership: check that the current user is a member of the project
    # specified in the request body. Admin bypass applies.
    from app.api.dependencies import _is_admin
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(dto.project_id, current_user.id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this project",
            )
    try:
        use_case = CreateTaskUseCase(task_repo, project_repo)
        return await use_case.execute(dto)
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/project/{project_id}", response_model=List[TaskResponseDTO])
async def list_project_tasks(
    project_id: int,
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_project_member),
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

@router.get("/activity/me", response_model=List[Any])
async def get_my_task_activity(
    task_repo: ITaskRepository = Depends(get_task_repo),
    audit_repo: IAuditRepository = Depends(get_audit_repo),
    current_user: User = Depends(get_current_user),
):
    """Return the last 20 audit log entries for tasks assigned to the current user."""
    # 1. Get all tasks assigned to the current user
    my_tasks = await task_repo.get_all_by_assignee(current_user.id)  # type: ignore

    # 2. Collect audit events for each task, merge, sort, and return top 20
    all_events: List[dict] = []
    for task in my_tasks:
        events = await audit_repo.get_by_entity("task", task.id)  # type: ignore
        all_events.extend(events)

    # Sort descending by timestamp (string ISO format sorts correctly)
    all_events.sort(key=lambda e: e.get("timestamp", ""), reverse=True)

    return all_events[:20]


@router.get("/{task_id}", response_model=TaskResponseDTO)
async def get_task(
    task_id: int,
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_task_project_member),
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
    current_user: User = Depends(get_task_project_member),
):
    try:
        use_case = UpdateTaskUseCase(task_repo, project_repo)
        return await use_case.execute(task_id, dto, current_user.id) # type: ignore
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_task_project_member),
):
    try:
        use_case = DeleteTaskUseCase(task_repo, project_repo)
        await use_case.execute(task_id, current_user.id) # type: ignore
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
