import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.dependencies import (
    get_project_repo,
    get_current_user,
    get_project_member,
    get_user_repo,
    get_team_repo,
    get_task_repo,
    get_sprint_repo,
    get_process_template_repo,
    get_notification_service,
    _is_admin,
)
from app.application.services.notification_service import PollingNotificationService
from app.domain.entities.notification import NotificationType
from app.application.dtos.project_dtos import (
    ProjectCreateDTO,
    ProjectUpdateDTO,
    ProjectResponseDTO,
    ProjectMemberDTO,
)
from app.application.use_cases.manage_projects import (
    CreateProjectUseCase,
    ListProjectsUseCase,
    GetProjectUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase
)
from app.application.use_cases.manage_project_members import (
    AddProjectMemberUseCase,
    AddTeamToProjectUseCase,
    RemoveProjectMemberUseCase,
)
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.team_repository import ITeamRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.domain.repositories.sprint_repository import ISprintRepository
from app.domain.entities.user import User
from app.domain.entities.project import Project
from app.domain.exceptions import ProjectNotFoundError, UserNotFoundError

router = APIRouter()


class MemberAddDTO(BaseModel):
    user_id: Optional[int] = None  # individual add
    team_id: Optional[int] = None  # team add; one of these must be set


def _is_manager_or_admin(user: User, project: Project) -> bool:
    """Return True if user is project manager or admin role."""
    return user.id == project.manager_id or _is_admin(user)


def _sanitize_process_config(dto: ProjectResponseDTO) -> ProjectResponseDTO:
    """Strip webhook_url from process_config.integrations before returning to client (EXT-04, D-19)."""
    if dto.process_config and "integrations" in dto.process_config:
        safe_integrations = {
            k: v
            for k, v in dto.process_config["integrations"].items()
            if k != "webhook_url"
        }
        dto.process_config = {**dto.process_config, "integrations": safe_integrations}
    return dto


async def _fire_integration_event(process_config, event_type: str, payload: dict) -> None:
    """Non-blocking: check admin master switch + project webhook config.
    Fire-and-forget — never raises into caller (EXT-01, D-15, D-16).
    """
    try:
        from app.application.services.system_config_service import get_system_config
        from app.infrastructure.database.repositories.system_config_repo import SqlAlchemySystemConfigRepository
        from app.infrastructure.database.database import AsyncSessionLocal
        from app.infrastructure.integrations.integration_factory import get_integration_service

        async with AsyncSessionLocal() as session:
            config_repo = SqlAlchemySystemConfigRepository(session)
            config = await get_system_config(config_repo)
            # Admin master switch: integrations_enabled must be "true" (string from JSONB)
            if config.get("integrations_enabled", "true").lower() != "true":
                return
            integrations = (process_config or {}).get("integrations", {})
            webhook_url = integrations.get("webhook_url")
            platform = integrations.get("platform")
            if webhook_url and platform:
                svc = get_integration_service(platform, webhook_url)
                await svc.send_event(event_type, payload)
    except Exception:
        pass  # Fire-and-forget; never raise into caller


@router.post("/", response_model=ProjectResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_project(
    dto: ProjectCreateDTO,
    project_repo: IProjectRepository = Depends(get_project_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
    task_repo: ITaskRepository = Depends(get_task_repo),
    template_repo=Depends(get_process_template_repo),
    current_user: User = Depends(get_current_user),
    notif_service: PollingNotificationService = Depends(get_notification_service),
):
    use_case = CreateProjectUseCase(project_repo, template_repo, task_repo)
    project = await use_case.execute(dto, current_user.id)  # type: ignore

    # Notify all admins about new project (excluding the actor)
    admins = await user_repo.get_all_by_role("admin")
    await asyncio.gather(*[
        notif_service.notify(
            user_id=admin.id,
            type=NotificationType.PROJECT_CREATED,
            message=f"'{project.name}' projesi oluşturuldu",
            related_entity_id=project.id,
            related_entity_type="project",
            actor_id=current_user.id,
        )
        for admin in admins if admin.id != current_user.id
    ])

    # Fire integration event: project.created (EXT-01)
    asyncio.create_task(
        _fire_integration_event(
            project.process_config,
            "project.created",
            {"message": f"\U0001f680 Yeni Proje Olusturuldu: {project.name}"}
        )
    )

    return _sanitize_process_config(project)


@router.get("/", response_model=List[ProjectResponseDTO])
async def list_projects(
    project_repo: IProjectRepository = Depends(get_project_repo),
    current_user: User = Depends(get_current_user)
):
    use_case = ListProjectsUseCase(project_repo)
    results = await use_case.execute(current_user.id)  # type: ignore
    return [_sanitize_process_config(r) for r in results]


@router.get("/{project_id}", response_model=ProjectResponseDTO)
async def get_project(
    project_id: int,
    current_user: dict = Depends(get_current_user),  # Giriş yapmış olması yeterli
    project_repo: IProjectRepository = Depends(get_project_repo)
):
    # DİKKAT: Burada repository'nin 'unique()' eklenmiş get_by_id metodunu kullanıyoruz.
    project = await project_repo.get_by_id(project_id)

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with id {project_id} not found")

    return _sanitize_process_config(ProjectResponseDTO.model_validate(project))


@router.patch("/{project_id}", response_model=ProjectResponseDTO)
@router.put("/{project_id}", response_model=ProjectResponseDTO)
async def update_project(
    project_id: int,
    dto: ProjectUpdateDTO,
    project_repo: IProjectRepository = Depends(get_project_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
    sprint_repo: ISprintRepository = Depends(get_sprint_repo),
    current_user: User = Depends(get_current_user),
    notif_service: PollingNotificationService = Depends(get_notification_service),
):
    try:
        use_case = UpdateProjectUseCase(project_repo, sprint_repo)
        project = await use_case.execute(project_id, dto, current_user.id)  # type: ignore
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    # Notify all admins about project update (excluding the actor)
    admins = await user_repo.get_all_by_role("admin")
    await asyncio.gather(*[
        notif_service.notify(
            user_id=admin.id,
            type=NotificationType.PROJECT_UPDATED,
            message=f"'{project.name}' projesi güncellendi",
            related_entity_id=project.id,
            related_entity_type="project",
            actor_id=current_user.id,
        )
        for admin in admins if admin.id != current_user.id
    ])

    return _sanitize_process_config(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    project_repo: IProjectRepository = Depends(get_project_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
    current_user: User = Depends(get_current_user),
    notif_service: PollingNotificationService = Depends(get_notification_service),
):
    # Fetch project BEFORE deletion to get the name for notification message
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    project_name = project.name

    try:
        use_case = DeleteProjectUseCase(project_repo)
        await use_case.execute(project_id, current_user.id)  # type: ignore
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    # Notify all admins about project deletion (excluding the actor)
    admins = await user_repo.get_all_by_role("admin")
    await asyncio.gather(*[
        notif_service.notify(
            user_id=admin.id,
            type=NotificationType.PROJECT_DELETED,
            message=f"'{project_name}' projesi silindi",
            related_entity_id=project_id,
            related_entity_type="project",
            actor_id=current_user.id,
        )
        for admin in admins if admin.id != current_user.id
    ])


# ---------------------------------------------------------------------------
# Project Member Management endpoints
# ---------------------------------------------------------------------------

@router.get("/{project_id}/members", response_model=List[ProjectMemberDTO])
async def list_project_members(
    project_id: int,
    current_user: User = Depends(get_project_member),
    project_repo: IProjectRepository = Depends(get_project_repo),
):
    members = await project_repo.get_members(project_id)
    return [
        ProjectMemberDTO(
            id=m.id,
            full_name=m.full_name,
            avatar_path=m.avatar,
            role_name=m.role.name if m.role else "member",
            is_current_member=True,
        )
        for m in members
    ]


@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
async def add_project_member(
    project_id: int,
    dto: MemberAddDTO,
    current_user: User = Depends(get_project_member),
    project_repo: IProjectRepository = Depends(get_project_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
    team_repo: ITeamRepository = Depends(get_team_repo),
):
    # Verify actor is manager or admin
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    if not _is_manager_or_admin(current_user, project):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers or admins can add members")

    if dto.team_id is not None:
        use_case = AddTeamToProjectUseCase(project_repo, team_repo)
        await use_case.execute(project_id, dto.team_id, current_user)
    elif dto.user_id is not None:
        use_case = AddProjectMemberUseCase(project_repo, user_repo)
        try:
            await use_case.execute(project_id, dto.user_id, current_user)
        except UserNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either user_id or team_id must be provided",
        )
    return {"detail": "Member(s) added successfully"}


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project_member(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_project_member),
    project_repo: IProjectRepository = Depends(get_project_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
    task_repo: ITaskRepository = Depends(get_task_repo),
):
    # Verify actor is manager or admin
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    if not _is_manager_or_admin(current_user, project):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers or admins can remove members")

    try:
        use_case = RemoveProjectMemberUseCase(project_repo, user_repo, task_repo)
        await use_case.execute(project_id, user_id, current_user)
    except (ProjectNotFoundError, UserNotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
