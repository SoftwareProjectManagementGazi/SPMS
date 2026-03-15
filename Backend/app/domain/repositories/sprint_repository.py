from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.sprint import Sprint


class ISprintRepository(ABC):
    @abstractmethod
    async def get_by_id(self, sprint_id: int) -> Optional[Sprint]: ...

    @abstractmethod
    async def get_by_project(self, project_id: int) -> List[Sprint]: ...

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
