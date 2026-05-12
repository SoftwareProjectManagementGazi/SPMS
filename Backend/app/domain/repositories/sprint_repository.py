from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.sprint import Sprint


class ISprintRepository(ABC):
    @abstractmethod
    async def get_by_id(self, sprint_id: int) -> Optional[Sprint]: ...

    @abstractmethod
    async def get_by_project(self, project_id: int) -> List[Sprint]: ...

    @abstractmethod
    async def get_active_sprint(self, project_id: int) -> Optional[Sprint]:
        """Return the currently ACTIVE sprint for a project, or None."""
        ...

    @abstractmethod
    async def create(self, sprint: Sprint) -> Sprint: ...

    @abstractmethod
    async def update(self, sprint_id: int, fields: dict) -> Optional[Sprint]: ...

    @abstractmethod
    async def delete(self, sprint_id: int) -> bool: ...

    @abstractmethod
    async def move_tasks_to_sprint(
        self,
        from_sprint_id: int,
        to_sprint_id: Optional[int],
        incomplete_only: bool = False,
    ) -> int:
        """Move tasks from one sprint to another (or backlog if to_sprint_id is None).
        Returns the count of tasks moved.
        If incomplete_only is True, only moves tasks not in a 'Done' column.
        """
        ...

    @abstractmethod
    async def create_snapshot(
        self,
        sprint_id: int,
        project_id: int,
        task_count: int,
        completed_count: int,
        total_points: int,
    ) -> None:
        """Persist a point-in-time snapshot of sprint stats at close time.
        Used by velocity reports to prevent retroactive data changes.
        """
        ...
