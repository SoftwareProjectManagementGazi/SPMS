"""Sprint management use cases — Clean Architecture (no SQLAlchemy imports)."""
from typing import List, Optional

from app.domain.entities.sprint import Sprint, SprintStatus
from app.domain.entities.user import User
from app.domain.repositories.sprint_repository import ISprintRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.application.dtos.sprint_dtos import SprintCreateDTO, SprintUpdateDTO, SprintResponseDTO
from app.domain.exceptions import SprintNotFoundError, ActiveSprintAlreadyExistsError


def _to_response_dto(sprint: Sprint) -> SprintResponseDTO:
    return SprintResponseDTO(
        id=sprint.id,
        project_id=sprint.project_id,
        name=sprint.name,
        goal=sprint.goal,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
        is_active=sprint.is_active,
        status=sprint.status,
        task_count=sprint.task_count,
        completed_count=sprint.completed_count,
        total_points=sprint.total_points,
    )


class CreateSprintUseCase:
    def __init__(self, sprint_repo: ISprintRepository):
        self.sprint_repo = sprint_repo

    async def execute(self, dto: SprintCreateDTO) -> SprintResponseDTO:
        sprint = Sprint(
            project_id=dto.project_id,
            name=dto.name,
            goal=dto.goal,
            start_date=dto.start_date,
            end_date=dto.end_date,
            is_active=False,
            status=SprintStatus.PLANNED,
        )
        created = await self.sprint_repo.create(sprint)
        return _to_response_dto(created)


class StartSprintUseCase:
    """Activate a sprint — enforces one-active-sprint-per-project rule."""

    def __init__(self, sprint_repo: ISprintRepository, audit_repo: IAuditRepository):
        self.sprint_repo = sprint_repo
        self.audit_repo = audit_repo

    async def execute(self, sprint_id: int, user: User) -> SprintResponseDTO:
        sprint = await self.sprint_repo.get_by_id(sprint_id)
        if sprint is None:
            raise SprintNotFoundError(sprint_id)

        # Enforce one-active-sprint rule
        active = await self.sprint_repo.get_active_sprint(sprint.project_id)
        if active is not None and active.id != sprint_id:
            raise ActiveSprintAlreadyExistsError(sprint.project_id, active.name)

        updated = await self.sprint_repo.update(
            sprint_id, {"is_active": True, "status": SprintStatus.ACTIVE}
        )
        if updated is None:
            raise SprintNotFoundError(sprint_id)

        await self.audit_repo.create(
            entity_type="sprint",
            entity_id=sprint_id,
            field_name="status",
            old_value=sprint.status.value,
            new_value=SprintStatus.ACTIVE.value,
            user_id=user.id,
            action="sprint_started",
        )

        return _to_response_dto(updated)


class ListSprintsUseCase:
    def __init__(self, sprint_repo: ISprintRepository):
        self.sprint_repo = sprint_repo

    async def execute(self, project_id: int) -> List[SprintResponseDTO]:
        sprints = await self.sprint_repo.get_by_project(project_id)
        return [_to_response_dto(s) for s in sprints]


class UpdateSprintUseCase:
    def __init__(self, sprint_repo: ISprintRepository):
        self.sprint_repo = sprint_repo

    async def execute(self, sprint_id: int, dto: SprintUpdateDTO, user: User) -> SprintResponseDTO:
        fields = dto.model_dump(exclude_none=True)
        updated = await self.sprint_repo.update(sprint_id, fields)
        if updated is None:
            raise SprintNotFoundError(sprint_id)
        return _to_response_dto(updated)


class DeleteSprintUseCase:
    def __init__(self, sprint_repo: ISprintRepository):
        self.sprint_repo = sprint_repo

    async def execute(
        self,
        sprint_id: int,
        user: User,
        move_tasks_to_sprint_id: Optional[int] = None,
    ) -> None:
        # Verify the sprint exists before moving tasks
        sprint = await self.sprint_repo.get_by_id(sprint_id)
        if sprint is None:
            raise SprintNotFoundError(sprint_id)

        # Move ALL tasks to target sprint/backlog before deleting
        await self.sprint_repo.move_tasks_to_sprint(
            from_sprint_id=sprint_id,
            to_sprint_id=move_tasks_to_sprint_id,
            incomplete_only=False,
        )

        deleted = await self.sprint_repo.delete(sprint_id)
        if not deleted:
            raise SprintNotFoundError(sprint_id)


class CloseSprintUseCase:
    def __init__(self, sprint_repo: ISprintRepository, audit_repo: IAuditRepository):
        self.sprint_repo = sprint_repo
        self.audit_repo = audit_repo

    async def execute(
        self,
        sprint_id: int,
        user_id: Optional[int] = None,
        move_tasks_to_sprint_id: Optional[int] = None,
    ) -> SprintResponseDTO:
        """Close a sprint: snapshot stats, move incomplete tasks, write audit log."""
        sprint = await self.sprint_repo.get_by_id(sprint_id)
        if sprint is None:
            raise SprintNotFoundError(sprint_id)

        # Snapshot current stats BEFORE moving tasks (point-in-time accuracy)
        await self.sprint_repo.create_snapshot(
            sprint_id=sprint_id,
            project_id=sprint.project_id,
            task_count=sprint.task_count,
            completed_count=sprint.completed_count,
            total_points=sprint.total_points,
        )

        # Move incomplete tasks (those NOT in a 'Done' column) to target sprint/backlog
        await self.sprint_repo.move_tasks_to_sprint(
            from_sprint_id=sprint_id,
            to_sprint_id=move_tasks_to_sprint_id,
            incomplete_only=True,
        )

        # Mark sprint as closed
        updated = await self.sprint_repo.update(
            sprint_id, {"is_active": False, "status": SprintStatus.CLOSED}
        )
        if updated is None:
            raise SprintNotFoundError(sprint_id)

        await self.audit_repo.create(
            entity_type="sprint",
            entity_id=sprint_id,
            field_name="status",
            old_value=sprint.status.value,
            new_value=SprintStatus.CLOSED.value,
            user_id=user_id,
            action="sprint_closed",
        )

        return _to_response_dto(updated)
