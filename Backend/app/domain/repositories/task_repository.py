from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
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

    @abstractmethod
    async def list_backlog_tasks(
        self, project_id: int, no_sprint: bool = False, exclude_done: bool = False
    ) -> List[Task]:
        """Backlog filter: optionally exclude tasks that have a sprint assigned
        (no_sprint=True) and/or tasks that are already done (exclude_done=True)."""
        pass

    @abstractmethod
    async def count_active_by_assignee(self, user_id: int) -> int:
        """Count non-deleted tasks assigned to user (proxy for active tasks)."""
        pass

    @abstractmethod
    async def count_completed_since(self, user_id: int, since: datetime) -> int:
        """Count tasks assigned to user updated since the given datetime."""
        pass

    @abstractmethod
    async def bulk_stamp_phase(
        self, task_ids: List[int], new_phase_id: Optional[str]
    ) -> None:
        """Bulk-update phase_id for a list of task IDs (flush, no commit).
        Passing new_phase_id=None clears the phase (moves to backlog).
        """
        pass

    @abstractmethod
    async def count_tasks_in_column(
        self, column_id: int, exclude_task_id: Optional[int] = None
    ) -> int:
        """Phase 17 C8 — count active (non-deleted) tasks in a column.

        ``exclude_task_id`` is critical for move semantics: when checking whether
        a target column can accept an incoming task, the moving task itself must
        not be counted toward the target's load (otherwise a same-column "move"
        — or a load-near-limit move — could spuriously trip the WIP limit).

        Returns 0 when the column is empty or non-existent.
        """
        pass
