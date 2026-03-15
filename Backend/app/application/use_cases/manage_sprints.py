"""Sprint management use cases — Clean Architecture (no SQLAlchemy imports)."""
from typing import List, Optional

from app.domain.entities.sprint import Sprint
from app.domain.entities.user import User
from app.domain.repositories.sprint_repository import ISprintRepository
from app.application.dtos.sprint_dtos import SprintCreateDTO, SprintUpdateDTO, SprintResponseDTO
from app.domain.exceptions import SprintNotFoundError


def _to_response_dto(sprint: Sprint) -> SprintResponseDTO:
    return SprintResponseDTO(
        id=sprint.id,
        project_id=sprint.project_id,
        name=sprint.name,
        goal=sprint.goal,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
        is_active=sprint.is_active,
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
        )
        created = await self.sprint_repo.create(sprint)
        return _to_response_dto(created)


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
    def __init__(self, sprint_repo: ISprintRepository):
        self.sprint_repo = sprint_repo

    async def execute(
        self,
        sprint_id: int,
        move_tasks_to_sprint_id: Optional[int] = None,
    ) -> SprintResponseDTO:
        """Close a sprint: mark is_active=False, move incomplete tasks to target sprint/backlog."""
        sprint = await self.sprint_repo.get_by_id(sprint_id)
        if sprint is None:
            raise SprintNotFoundError(sprint_id)

        # Move incomplete tasks (those NOT in a 'Done' column) to target sprint/backlog
        await self.sprint_repo.move_tasks_to_sprint(
            from_sprint_id=sprint_id,
            to_sprint_id=move_tasks_to_sprint_id,
            incomplete_only=True,
        )

        # Mark sprint as closed (is_active=False)
        updated = await self.sprint_repo.update(sprint_id, {"is_active": False})
        if updated is None:
            raise SprintNotFoundError(sprint_id)
        return _to_response_dto(updated)
