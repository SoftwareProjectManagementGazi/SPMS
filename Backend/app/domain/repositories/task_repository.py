from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.task import Task

class ITaskRepository(ABC):
    @abstractmethod
    async def create(self, task: Task) -> Task:
        pass

    @abstractmethod
    async def get_by_id(self, task_id: int) -> Optional[Task]:
        pass

    @abstractmethod
    async def get_all_by_project(self, project_id: int) -> List[Task]:
        pass
    
    @abstractmethod
    async def get_all_by_assignee(self, assignee_id: int) -> List[Task]:
        pass

    @abstractmethod
    async def update(self, task: Task) -> Task:
        pass

    @abstractmethod
    async def delete(self, task_id: int) -> bool:
        pass

    @abstractmethod
    async def unassign_incomplete_tasks(self, project_id: int, user_id: int) -> None:
        """Set assignee_id=NULL for all incomplete tasks in project assigned to user.
        Tasks in 'done' columns are preserved.
        """
        pass

    @abstractmethod
    async def list_by_project_and_phase(self, project_id: int, phase_id) -> List[Task]:
        """API-05: GET /tasks/project/{id}?phase_id=X filter."""
        pass
