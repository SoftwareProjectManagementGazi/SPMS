"""BACK-04: IMilestoneRepository abstract interface."""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.milestone import Milestone


class IMilestoneRepository(ABC):
    @abstractmethod
    async def create(self, milestone: Milestone) -> Milestone: ...

    @abstractmethod
    async def get_by_id(self, milestone_id: int) -> Optional[Milestone]: ...

    @abstractmethod
    async def list_by_project(self, project_id: int) -> List[Milestone]: ...

    @abstractmethod
    async def list_by_phase(self, project_id: int, phase_id: str) -> List[Milestone]:
        """D-38: GIN-indexed JSONB containment query on linked_phase_ids."""
        ...

    @abstractmethod
    async def update(self, milestone: Milestone) -> Milestone: ...

    @abstractmethod
    async def delete(self, milestone_id: int) -> bool:
        """Soft-delete: sets is_deleted=True + deleted_at. Returns True on success."""
        ...
