import asyncio
from typing import List, Any, Dict
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select as sa_select, text
from app.api.dependencies import (
    get_db,
    get_task_repo,
    get_project_repo,
    get_current_user,
    get_project_member,
    get_task_project_member,
    get_audit_repo,
    get_dependency_repo,
    get_notification_service,
    get_user_repo,
    get_notification_preference_repo,
)
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.notification_preference_repository import INotificationPreferenceRepository
from app.infrastructure.email.email_service import send_notification_email
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
from app.application.services.notification_service import PollingNotificationService
from app.domain.entities.notification import NotificationType
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.entities.user import User
from app.domain.exceptions import TaskNotFoundError, ProjectNotFoundError, DependencyAlreadyExistsError
from app.infrastructure.database.repositories.task_dependency_repo import SqlAlchemyTaskDependencyRepository
from app.infrastructure.database.models.task_watcher import TaskWatcherModel

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
    phase_id: str = Query(default=None, description="API-05: filter tasks by phase_id (nd_xxx)"),
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_project_member),
):
    # API-05: if phase_id provided, use the phase-aware query
    if phase_id is not None:
        items = await task_repo.list_by_project_and_phase(project_id, phase_id)
        from app.application.dtos.task_dtos import TaskResponseDTO
        task_dtos = [TaskResponseDTO.model_validate(t) for t in items]
        return PaginatedResponse(items=task_dtos, total=len(task_dtos), page=page, page_size=page_size)
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
    background_tasks: BackgroundTasks,
    apply_to: str = Query("this", description="'this' or 'all' — apply update to all future series instances"),
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_task_project_member),
    notif_service: PollingNotificationService = Depends(get_notification_service),
    session: AsyncSession = Depends(get_db),
    user_repo: IUserRepository = Depends(get_user_repo),
    pref_repo: INotificationPreferenceRepository = Depends(get_notification_preference_repo),
):
    try:
        use_case = UpdateTaskUseCase(task_repo, project_repo)
        updated_task = await use_case.execute(task_id, dto, current_user.id, apply_to=apply_to)  # type: ignore
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Notification: task assigned to someone else
    if dto.assignee_id and dto.assignee_id != current_user.id:
        await notif_service.notify(
            user_id=dto.assignee_id,
            type=NotificationType.TASK_ASSIGNED,
            message=f"{current_user.full_name} sizi '{updated_task.title}' görevine atadı",
            related_entity_id=updated_task.id,
            related_entity_type="task",
            actor_id=current_user.id,
        )
        # Email: task assigned — send if email preference enabled
        recipient = await user_repo.get_by_id(dto.assignee_id)
        if recipient:
            pref = await pref_repo.get_by_user(dto.assignee_id)
            email_ok = (pref is None or pref.email_enabled) and (
                pref is None or pref.preferences.get("TASK_ASSIGNED", {}).get("email", True)
            )
            if email_ok:
                await send_notification_email(
                    background_tasks=background_tasks,
                    to_email=str(recipient.email),
                    subject=f"SPMS: '{updated_task.title}' görevine atandınız",
                    template_name="task_assigned.html",
                    body={
                        "task_title": updated_task.title,
                        "assigner_name": current_user.full_name,
                        "task_id": updated_task.id,
                    },
                )

    # Notification: status change — notify assignee and watchers
    if dto.status_id is not None:
        if updated_task.assignee_id and updated_task.assignee_id != current_user.id:
            await notif_service.notify(
                user_id=updated_task.assignee_id,
                type=NotificationType.STATUS_CHANGE,
                message=f"'{updated_task.title}' görevinin durumu değiştirildi",
                related_entity_id=updated_task.id,
                related_entity_type="task",
                actor_id=current_user.id,
            )
        # Notify watchers for status change
        result = await session.execute(
            sa_select(TaskWatcherModel).where(TaskWatcherModel.task_id == task_id)
        )
        watchers = result.scalars().all()
        for w in watchers:
            if w.user_id != current_user.id:
                await notif_service.notify(
                    user_id=w.user_id,
                    type=NotificationType.STATUS_CHANGE,
                    message=f"'{updated_task.title}' görevinin durumu değiştirildi",
                    related_entity_id=updated_task.id,
                    related_entity_type="task",
                    actor_id=current_user.id,
                )

    # Integration event: task.status_changed (EXT-01, D-16)
    if dto.column_id is not None:
        project = await project_repo.get_by_id(updated_task.project_id)
        if project:
            from app.api.v1.projects import _fire_integration_event
            from app.infrastructure.database.database import engine
            old_col_name = "?"
            new_col_name = "?"
            try:
                async with engine.connect() as _conn:
                    old_row = await _conn.execute(
                        text("SELECT name FROM board_columns WHERE id = :cid"),
                        {"cid": updated_task.column_id}
                    )
                    new_col_name = (old_row.scalar() or "?")
            except Exception:
                pass  # Fallback to "?" if lookup fails — non-blocking
            asyncio.create_task(
                _fire_integration_event(
                    project.process_config,
                    "task.status_changed",
                    {"message": f"{updated_task.title} durumu {old_col_name} \u27a1\ufe0f {new_col_name} olarak guncellendi."}
                )
            )

    # Integration event: task.assigned (EXT-01, D-16)
    if dto.assignee_id is not None:
        project = await project_repo.get_by_id(updated_task.project_id)
        if project:
            assignee = await user_repo.get_by_id(dto.assignee_id)
            assignee_name = assignee.full_name if assignee else str(dto.assignee_id)
            from app.api.v1.projects import _fire_integration_event
            asyncio.create_task(
                _fire_integration_event(
                    project.process_config,
                    "task.assigned",
                    {"message": f"\U0001f464 Yeni Gorev Atandi: {updated_task.title} -> {assignee_name}"}
                )
            )

    return updated_task

@router.patch("/{task_id}", response_model=TaskResponseDTO)
async def patch_task(
    task_id: int,
    dto: TaskUpdateDTO,
    background_tasks: BackgroundTasks,
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_task_project_member),
    notif_service: PollingNotificationService = Depends(get_notification_service),
    session: AsyncSession = Depends(get_db),
    user_repo: IUserRepository = Depends(get_user_repo),
    pref_repo: INotificationPreferenceRepository = Depends(get_notification_preference_repo),
):
    try:
        use_case = UpdateTaskUseCase(task_repo, project_repo)
        updated_task = await use_case.execute(task_id, dto, current_user.id)  # type: ignore
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Notification: task assigned to someone else
    if dto.assignee_id and dto.assignee_id != current_user.id:
        await notif_service.notify(
            user_id=dto.assignee_id,
            type=NotificationType.TASK_ASSIGNED,
            message=f"{current_user.full_name} sizi '{updated_task.title}' görevine atadı",
            related_entity_id=updated_task.id,
            related_entity_type="task",
            actor_id=current_user.id,
        )
        # Email: task assigned — send if email preference enabled
        recipient = await user_repo.get_by_id(dto.assignee_id)
        if recipient:
            pref = await pref_repo.get_by_user(dto.assignee_id)
            email_ok = (pref is None or pref.email_enabled) and (
                pref is None or pref.preferences.get("TASK_ASSIGNED", {}).get("email", True)
            )
            if email_ok:
                await send_notification_email(
                    background_tasks=background_tasks,
                    to_email=str(recipient.email),
                    subject=f"SPMS: '{updated_task.title}' görevine atandınız",
                    template_name="task_assigned.html",
                    body={
                        "task_title": updated_task.title,
                        "assigner_name": current_user.full_name,
                        "task_id": updated_task.id,
                    },
                )

    # Notification: status change — notify assignee and watchers
    if dto.status_id is not None:
        if updated_task.assignee_id and updated_task.assignee_id != current_user.id:
            await notif_service.notify(
                user_id=updated_task.assignee_id,
                type=NotificationType.STATUS_CHANGE,
                message=f"'{updated_task.title}' görevinin durumu değiştirildi",
                related_entity_id=updated_task.id,
                related_entity_type="task",
                actor_id=current_user.id,
            )
        # Notify watchers for status change
        result = await session.execute(
            sa_select(TaskWatcherModel).where(TaskWatcherModel.task_id == task_id)
        )
        watchers = result.scalars().all()
        for w in watchers:
            if w.user_id != current_user.id:
                await notif_service.notify(
                    user_id=w.user_id,
                    type=NotificationType.STATUS_CHANGE,
                    message=f"'{updated_task.title}' görevinin durumu değiştirildi",
                    related_entity_id=updated_task.id,
                    related_entity_type="task",
                    actor_id=current_user.id,
                )

    # Integration event: task.status_changed (EXT-01, D-16)
    if dto.column_id is not None:
        project = await project_repo.get_by_id(updated_task.project_id)
        if project:
            from app.api.v1.projects import _fire_integration_event
            from app.infrastructure.database.database import engine
            old_col_name = "?"
            new_col_name = "?"
            try:
                async with engine.connect() as _conn:
                    old_row = await _conn.execute(
                        text("SELECT name FROM board_columns WHERE id = :cid"),
                        {"cid": updated_task.column_id}
                    )
                    new_col_name = (old_row.scalar() or "?")
            except Exception:
                pass  # Fallback to "?" if lookup fails — non-blocking
            asyncio.create_task(
                _fire_integration_event(
                    project.process_config,
                    "task.status_changed",
                    {"message": f"{updated_task.title} durumu {old_col_name} \u27a1\ufe0f {new_col_name} olarak guncellendi."}
                )
            )

    # Integration event: task.assigned (EXT-01, D-16)
    if dto.assignee_id is not None:
        project = await project_repo.get_by_id(updated_task.project_id)
        if project:
            assignee = await user_repo.get_by_id(dto.assignee_id)
            assignee_name = assignee.full_name if assignee else str(dto.assignee_id)
            from app.api.v1.projects import _fire_integration_event
            asyncio.create_task(
                _fire_integration_event(
                    project.process_config,
                    "task.assigned",
                    {"message": f"\U0001f464 Yeni Gorev Atandi: {updated_task.title} -> {assignee_name}"}
                )
            )

    return updated_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    task_repo: ITaskRepository = Depends(get_task_repo),
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_task_project_member),
    notif_service: PollingNotificationService = Depends(get_notification_service),
    session: AsyncSession = Depends(get_db),
):
    # Fetch task BEFORE deletion to get title and assignee_id
    task = await task_repo.get_by_id(task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {task_id} not found")

    # Fetch watchers BEFORE deletion (CASCADE delete would remove them)
    result = await session.execute(
        sa_select(TaskWatcherModel).where(TaskWatcherModel.task_id == task_id)
    )
    watchers = result.scalars().all()

    try:
        use_case = DeleteTaskUseCase(task_repo, project_repo)
        await use_case.execute(task_id, current_user.id)  # type: ignore
    except TaskNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    # Notify assignee about deletion
    if task.assignee_id and task.assignee_id != current_user.id:
        await notif_service.notify(
            user_id=task.assignee_id,
            type=NotificationType.TASK_DELETED,
            message=f"'{task.title}' görevi silindi",
            related_entity_id=task.id,
            related_entity_type="task",
            actor_id=current_user.id,
        )

    # Notify watchers about deletion
    for w in watchers:
        if w.user_id != current_user.id:
            await notif_service.notify(
                user_id=w.user_id,
                type=NotificationType.TASK_DELETED,
                message=f"'{task.title}' görevi silindi",
                related_entity_id=task.id,
                related_entity_type="task",
                actor_id=current_user.id,
            )


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


@router.get("/{task_id}/watch", response_model=Dict[str, Any])
async def get_watch_status(
    task_id: int,
    current_user: User = Depends(get_task_project_member),
    session: AsyncSession = Depends(get_db),
):
    """Return whether the current user is watching this task."""
    result = await session.execute(
        sa_select(TaskWatcherModel).where(
            TaskWatcherModel.task_id == task_id,
            TaskWatcherModel.user_id == current_user.id,
        )
    )
    watcher = result.scalar_one_or_none()
    return {"is_watching": watcher is not None}


@router.post("/{task_id}/watch", status_code=status.HTTP_200_OK)
async def watch_task(
    task_id: int,
    current_user: User = Depends(get_task_project_member),
    session: AsyncSession = Depends(get_db),
):
    """Add current user as a watcher of the task (idempotent)."""
    result = await session.execute(
        sa_select(TaskWatcherModel).where(
            TaskWatcherModel.task_id == task_id,
            TaskWatcherModel.user_id == current_user.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing is None:
        session.add(TaskWatcherModel(task_id=task_id, user_id=current_user.id))
        await session.commit()
    return {"message": "Görev izlemeye alındı"}


@router.delete("/{task_id}/watch", status_code=status.HTTP_200_OK)
async def unwatch_task(
    task_id: int,
    current_user: User = Depends(get_task_project_member),
    session: AsyncSession = Depends(get_db),
):
    """Remove current user from watchers of the task."""
    result = await session.execute(
        sa_select(TaskWatcherModel).where(
            TaskWatcherModel.task_id == task_id,
            TaskWatcherModel.user_id == current_user.id,
        )
    )
    watcher = result.scalar_one_or_none()
    if watcher is not None:
        await session.delete(watcher)
        await session.commit()
    return {"message": "Görev izlemesi kaldırıldı"}
