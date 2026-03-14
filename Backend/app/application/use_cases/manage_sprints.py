"""Sprint management use cases — Clean Architecture (no SQLAlchemy imports)."""
from typing import List

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

    async def execute(self, sprint_id: int, user: User) -> None:
        deleted = await self.sprint_repo.delete(sprint_id)
        if not deleted:
            raise SprintNotFoundError(sprint_id)
