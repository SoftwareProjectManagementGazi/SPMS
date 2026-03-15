from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.dependencies import (
    get_task_repo,
    get_project_repo,
    get_current_user,
    get_project_member,
    get_task_project_member,
    get_audit_repo,
    get_dependency_repo,
)
from app.application.dtos.task_dtos import (
    TaskCreateDTO,
    TaskUpdateDTO,
    TaskResponseDTO,
    TaskDependencyCreateDTO,
    TaskDependencySummaryDTO,
    PaginatedResponse,
)
from app.application.use_cases.manage_tasks import (
    CreateTaskUseCase,
    ListProjectTasksUseCase,
    ListProjectTasksPaginatedUseCase,
    ListMyTasksUseCase,
    GetTaskUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
    SearchSimilarTasksUseCase,
)
from app.application.use_cases.manage_task_dependencies import (
    AddDependencyUseCase,
    RemoveDependencyUseCase,
    ListDependenciesUseCase,
)
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.entities.user import User
from app.domain.exceptions import TaskNotFoundError, ProjectNotFoundError, DependencyAlreadyExistsError
from app.infrastructure.database.repositories.task_dependency_repo import SqlAlchemyTaskDependencyRepository

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

@router.get("/project/{project_id}", response_model=PaginatedResponse)
async def list_project_tasks(
    project_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_project_member),
):
    use_case = ListProjectTasksPaginatedUseCase(task_repo)
    return await use_case.execute(project_id, page, page_size)

@router.get("/my-tasks", response_model=List[TaskResponseDTO])
async def list_my_tasks(
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_current_user)
):
    use_case = ListMyTasksUseCase(task_repo)
    return await use_case.execute(current_user.id)  # type: ignore


@router.get("/search", response_model=List[TaskResponseDTO])
async def search_tasks(
    project_id: int,
    q: str,
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_project_member),
):
    use_case = SearchSimilarTasksUseCase(task_repo)
    return await use_case.execute(project_id, q)


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
    apply_to: str = Query("this", description="'this' or 'all' — apply update to all future series instances"),
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_task_project_member),
):
    try:
        use_case = UpdateTaskUseCase(task_repo, project_repo)
        return await use_case.execute(task_id, dto, current_user.id, apply_to=apply_to)  # type: ignore
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{task_id}", response_model=TaskResponseDTO)
async def patch_task(
    task_id: int,
    dto: TaskUpdateDTO,
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_task_project_member),
):
    try:
        use_case = UpdateTaskUseCase(task_repo, project_repo)
        return await use_case.execute(task_id, dto, current_user.id)  # type: ignore
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
        await use_case.execute(task_id, current_user.id)  # type: ignore
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{task_id}/history", response_model=List[Any])
async def get_task_history(
    task_id: int,
    audit_repo: IAuditRepository = Depends(get_audit_repo),
    current_user: User = Depends(get_task_project_member),
):
    """Return audit log entries for a specific task."""
    return await audit_repo.get_by_entity("task", task_id)


@router.get("/{task_id}/dependencies", response_model=Dict[str, List[TaskDependencySummaryDTO]])
async def list_dependencies(
    task_id: int,
    dep_repo: SqlAlchemyTaskDependencyRepository = Depends(get_dependency_repo),
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_task_project_member),
):
    use_case = ListDependenciesUseCase(dep_repo, task_repo)
    return await use_case.execute(task_id)


@router.post("/{task_id}/dependencies", response_model=TaskDependencySummaryDTO, status_code=status.HTTP_201_CREATED)
async def add_dependency(
    task_id: int,
    dto: TaskDependencyCreateDTO,
    dep_repo: SqlAlchemyTaskDependencyRepository = Depends(get_dependency_repo),
    current_user: User = Depends(get_task_project_member),
):
    try:
        use_case = AddDependencyUseCase(dep_repo)
        return await use_case.execute(task_id, dto.depends_on_id, dto.dependency_type, current_user)
    except DependencyAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{task_id}/dependencies/{dependency_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_dependency(
    task_id: int,
    dependency_id: int,
    dep_repo: SqlAlchemyTaskDependencyRepository = Depends(get_dependency_repo),
    current_user: User = Depends(get_task_project_member),
):
    use_case = RemoveDependencyUseCase(dep_repo)
    await use_case.execute(dependency_id, current_user)
