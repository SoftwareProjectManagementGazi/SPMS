from typing import List, Optional
from pydantic import ValidationError
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.artifact_repository import IArtifactRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.application.dtos.project_dtos import ProjectCreateDTO, ProjectUpdateDTO, ProjectResponseDTO
from app.application.dtos.workflow_dtos import WorkflowConfig as WorkflowConfigDTO
from app.domain.entities.project import Project, Methodology
from app.domain.entities.board_column import BoardColumn
from app.domain.entities.user import User
from app.domain.exceptions import ProjectAccessDeniedError, ProjectNotFoundError
from app.application.services.artifact_seeder import ArtifactSeeder


class CreateProjectUseCase:
    def __init__(
        self,
        project_repo: IProjectRepository,
        template_repo=None,
        task_repo=None,
        artifact_repo: Optional[IArtifactRepository] = None,  # NEW D-28
    ):
        self.project_repo = project_repo
        self.template_repo = template_repo
        self.task_repo = task_repo
        self.artifact_repo = artifact_repo

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

        # NEW D-28: Seed default artifacts from template in same transaction.
        # If template lookup succeeded (above) and artifact_repo provided, seed.
        # If template is None (e.g., custom workflow, D-30) OR artifact_repo missing, skip gracefully.
        # D-29: methodology change (PATCH) is a no-op on existing artifacts — this only runs on CREATE.
        if self.artifact_repo is not None and template is not None:
            seeder = ArtifactSeeder(self.artifact_repo)
            await seeder.seed(created_project.id, template)

        # Seed recurring tasks from template (PROC-02)
        if template and template.recurring_tasks and self.task_repo:
            from app.domain.entities.task import Task
            # FL-07 fix (Phase 10 review): datetime.utcnow() returns a naive
            # datetime and is deprecated on Python 3.12+. Use a timezone-aware
            # UTC timestamp so recurring-task created_at matches the rest of
            # the codebase (most SQLAlchemy columns use server_default=func.now(),
            # which is tz-aware) and so the deprecation warning goes away.
            from datetime import datetime, timezone
            for task_seed in template.recurring_tasks:
                # Use first column id as initial status/column
                first_column_id = created_project.columns[0].id if created_project.columns else None
                recurring_task = Task(
                    title=task_seed["name"],
                    project_id=created_project.id,
                    column_id=first_column_id,
                    is_recurring=True,
                    recurrence_interval=task_seed.get("recurrence_type", "weekly"),
                    created_at=datetime.now(timezone.utc),
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
        if not project:
            raise ProjectNotFoundError(project_id)
        if not is_admin and project.manager_id != manager_id:
            raise ProjectAccessDeniedError(project_id)

        # Phase 12 Plan 12-10 (Bug X + Bug Y UAT fix) — when the client sends
        # `process_config.workflow`, route it through the WorkflowConfig
        # Pydantic DTO so D-22 node-id regex + D-55 rules 1-3 + D-19 rule 4
        # all execute server-side. Pre-fix the dto's `process_config` was
        # `Dict[str, Any]` which accepted ANY shape, so bad node IDs and
        # missing isInitial/isFinal landed in the DB and only failed later
        # at task-creation time. We surface the validation error as a
        # standard Pydantic ValidationError; FastAPI's exception handler
        # converts that to a 422 with the standard `detail[]` payload so
        # the FE save-flow's 422 branch shows the correct toast.
        if dto.process_config is not None:
            wf = dto.process_config.get("workflow") if isinstance(dto.process_config, dict) else None
            if isinstance(wf, dict):
                # Pydantic raises ValidationError on regex / business-rule
                # failures; let it propagate up to the API layer.
                WorkflowConfigDTO(**wf)

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

        # FL-06 fix (Phase 10 review): pass the set of user-supplied keys to the
        # repository so explicit {description: null} or {end_date: null} requests
        # actually clear the column instead of being silently dropped by the
        # "new_val is None → skip" guard. model_dump(exclude_unset=True) above
        # already contains only the keys the client sent, so its keys() are the
        # authoritative intent.
        updated_keys = set(update_data.keys())
        updated_project = project.model_copy(update=update_data)
        result = await self.project_repo.update(
            updated_project,
            user_id=manager_id,
            updated_keys=updated_keys,
        )
        return ProjectResponseDTO.model_validate(result)


class DeleteProjectUseCase:
    """Delete a project. Plan 14-14 (UAT Test 23): admin actors bypass the
    PM-ownership guard so /admin/projects "Sil" works on any project.

    Per CLAUDE.md DIP discipline the use case accepts the full domain User
    entity (not a FastAPI primitive). The router resolves
    ``current_user`` via Depends(get_current_user) and passes it through
    as ``actor=``.

    Audit-trail compliance (must_haves truth #4 + threat T-14-14-02):
    when admin overrides the ownership rule, an explicit
    ``project.deleted_by_admin`` audit row is written with
    ``user_id=<admin id>``, ``entity_id=<project id>``, and
    ``metadata.target_manager_id=<original PM id>`` so the compliance
    review can see WHO deleted WHOSE project.
    """

    def __init__(
        self,
        project_repo: IProjectRepository,
        audit_repo: Optional[IAuditRepository] = None,
    ):
        self.project_repo = project_repo
        self.audit_repo = audit_repo

    async def execute(self, project_id: int, actor: User) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(project_id)

        # Admin bypass — admins can delete any project regardless of
        # ownership. Threat T-14-14-01: gated AFTER Depends(get_current_user)
        # which already enforces JWT validity; non-admin actors fall through
        # to the original 404 path (info-disclosure-safe).
        is_admin = (
            actor.role is not None
            and actor.role.name is not None
            and actor.role.name.lower() == "admin"
        )
        if not is_admin and project.manager_id != actor.id:
            # Preserve existing info-disclosure-safe response for non-admin
            # actors trying to delete a project they don't manage — same
            # response as a missing project (Plan 14-14 must_haves truth #3).
            raise ProjectNotFoundError(project_id)

        original_manager_id = project.manager_id
        original_key = project.key
        original_name = project.name

        await self.project_repo.delete(project_id)

        # Compliance audit row — only when admin OVERRODE the ownership
        # check (i.e. is_admin AND not also the project's manager).
        # When an admin happens to be the project's PM the regular delete
        # path is sufficient; the repo-level audit (Plan 14-09 enrichment)
        # already covers it and a duplicate by_admin row would be noise.
        if (
            self.audit_repo is not None
            and is_admin
            and original_manager_id != actor.id
        ):
            await self.audit_repo.create_with_metadata(
                entity_type="project",
                entity_id=project_id,
                action="project.deleted_by_admin",
                user_id=actor.id,
                metadata={
                    "target_manager_id": original_manager_id,
                    "project_key": original_key,
                    "project_name": original_name,
                },
            )
