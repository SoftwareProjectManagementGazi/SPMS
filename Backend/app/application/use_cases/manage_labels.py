"""Label management use cases — Clean Architecture (no SQLAlchemy imports).

Phase 11 D-51 — project-scoped labels with auto-create on first use.

CLAUDE.md §4.2 DIP rule: this module MUST NOT import from app.infrastructure
or from sqlalchemy. Dependencies are abstractions in app.domain.*.
"""
from typing import List

from app.domain.entities.label import Label
from app.domain.repositories.label_repository import ILabelRepository
from app.domain.exceptions import LabelNameAlreadyExistsError
from app.application.dtos.label_dtos import LabelCreateDTO, LabelResponseDTO


_DEFAULT_COLOR = "#94a3b8"


def _to_response_dto(label: Label) -> LabelResponseDTO:
    return LabelResponseDTO(
        id=label.id or 0,
        project_id=label.project_id,
        name=label.name,
        color=label.color,
        usage_count=label.usage_count,
    )


class ListProjectLabelsUseCase:
    """Return all labels in a project with usage_count populated."""

    def __init__(self, repo: ILabelRepository):
        self.repo = repo

    async def execute(self, project_id: int) -> List[LabelResponseDTO]:
        labels = await self.repo.list_by_project(project_id)
        return [_to_response_dto(label) for label in labels]


class CreateLabelUseCase:
    """Create a new label scoped to a project.

    Raises LabelNameAlreadyExistsError if (project_id, name) already exists — router
    maps to HTTP 409 so the frontend can gracefully fall back to using the existing id.
    """

    def __init__(self, repo: ILabelRepository):
        self.repo = repo

    async def execute(self, dto: LabelCreateDTO) -> LabelResponseDTO:
        existing = await self.repo.get_by_name_in_project(dto.project_id, dto.name)
        if existing is not None:
            raise LabelNameAlreadyExistsError(
                project_id=dto.project_id, name=dto.name
            )
        color = (dto.color or _DEFAULT_COLOR).strip() or _DEFAULT_COLOR
        label = await self.repo.create(dto.project_id, dto.name, color)
        return _to_response_dto(label)
