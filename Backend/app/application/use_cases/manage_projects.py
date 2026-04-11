from typing import List, Optional
from app.domain.repositories.project_repository import IProjectRepository
from app.application.dtos.project_dtos import ProjectCreateDTO, ProjectUpdateDTO, ProjectResponseDTO
from app.domain.entities.project import Project, Methodology
from app.domain.entities.board_column import BoardColumn
from app.domain.exceptions import ProjectNotFoundError


class CreateProjectUseCase:
    def __init__(self, project_repo: IProjectRepository, template_repo=None, task_repo=None):
        self.project_repo = project_repo
        self.template_repo = template_repo
        self.task_repo = task_repo

    async def execute(self, dto: ProjectCreateDTO, manager_id: int) -> ProjectResponseDTO:
        # Look up process template if template_repo is available
        template = None
        if self.template_repo is not None:
            template = await self.template_repo.get_by_name(dto.methodology.value)

        # Build columns: from template if no custom columns provided, otherwise from DTO
        if template and not dto.columns:
            columns = [
                BoardColumn(
                    name=col["name"],
                    order_index=col.get("order", i),
                    wip_limit=col.get("wip_limit", 0),
                )
                for i, col in enumerate(template.columns)
            ]
        else:
            columns = [
                BoardColumn(name=col_name, order_index=i, wip_limit=0)
                for i, col_name in enumerate(dto.columns)
            ]

        # Build process_config: merge template behavioral_flags with user-provided config
        default_config: dict = {
            "methodology": dto.methodology.value,
            "sprint_duration_days": 14,
            **(template.behavioral_flags if template else {}),
            "integrations": {},
        }
        process_config = {**default_config, **(dto.process_config or {})}

        new_project = Project(
            key=dto.key,
            name=dto.name,
            description=dto.description,
            start_date=dto.start_date,
            end_date=dto.end_date,
            methodology=dto.methodology,
            manager_id=manager_id,
            columns=columns,
            custom_fields=dto.custom_fields,
            process_config=process_config,
        )
        created_project = await self.project_repo.create(new_project)

        # Seed recurring tasks from template (PROC-02)
        if template and template.recurring_tasks and self.task_repo:
            from app.domain.entities.task import Task
            from datetime import datetime
            for task_seed in template.recurring_tasks:
                # Use first column id as initial status/column
                first_column_id = created_project.columns[0].id if created_project.columns else None
                recurring_task = Task(
                    title=task_seed["name"],
                    project_id=created_project.id,
                    column_id=first_column_id,
                    is_recurring=True,
                    recurrence_interval=task_seed.get("recurrence_type", "weekly"),
                    created_at=datetime.utcnow(),
                )
                await self.task_repo.create(recurring_task)

        return ProjectResponseDTO.model_validate(created_project)


class ListProjectsUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, manager_id: int) -> List[ProjectResponseDTO]:
        projects = await self.project_repo.get_all(manager_id)
        return [ProjectResponseDTO.model_validate(p) for p in projects]


class GetProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int, manager_id: int) -> ProjectResponseDTO:
        project = await self.project_repo.get_by_id_and_user(project_id, manager_id)
        if not project:
            raise ProjectNotFoundError(project_id)
        return ProjectResponseDTO.model_validate(project)


class UpdateProjectUseCase:
    def __init__(self, project_repo: IProjectRepository, sprint_repo=None):
        self.project_repo = project_repo
        self.sprint_repo = sprint_repo

    async def execute(self, project_id: int, dto: ProjectUpdateDTO, manager_id: int, is_admin: bool = False) -> ProjectResponseDTO:
        project = await self.project_repo.get_by_id(project_id)
        if not project or (not is_admin and project.manager_id != manager_id):
            raise ProjectNotFoundError(project_id)

        old_methodology = project.methodology
        update_data = dto.model_dump(exclude_unset=True)
        new_methodology = update_data.get("methodology")

        # Mid-project methodology change: archive active sprints when leaving SCRUM (D-10)
        if new_methodology and new_methodology != old_methodology:
            if old_methodology == Methodology.SCRUM and self.sprint_repo:
                sprints = await self.sprint_repo.get_by_project(project_id)
                for sprint in sprints:
                    if sprint.is_active:
                        await self.sprint_repo.update(sprint.id, {"is_active": False})

        updated_project = project.model_copy(update=update_data)
        result = await self.project_repo.update(updated_project)
        return ProjectResponseDTO.model_validate(result)


class DeleteProjectUseCase:
    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int, manager_id: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.manager_id != manager_id:
            raise ProjectNotFoundError(project_id)

        await self.project_repo.delete(project_id)
