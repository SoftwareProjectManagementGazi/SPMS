"""Label repository interface — Clean Architecture (no SQLAlchemy imports).

Phase 11 D-51: Project-scoped labels with auto-create on first use.
Analog: app.domain.repositories.board_column_repository.IBoardColumnRepository.
"""
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.entities.label import Label


class ILabelRepository(ABC):
    @abstractmethod
    async def list_by_project(self, project_id: int) -> List[Label]:
        """Return all labels for a project with usage_count populated, ordered by name ASC."""
        ...

    @abstractmethod
    async def get_by_name_in_project(self, project_id: int, name: str) -> Optional[Label]:
        """Return the label matching (project_id, name) or None.

        Used for the uniqueness check before CreateLabelUseCase.repo.create(...).
        """
        ...

    @abstractmethod
    async def create(self, project_id: int, name: str, color: str) -> Label:
        """Create a new label.

        Caller is responsible for the uniqueness check (CreateLabelUseCase calls
        get_by_name_in_project first and raises LabelNameAlreadyExistsError on
        collision → router returns HTTP 409).
        """
        ...
