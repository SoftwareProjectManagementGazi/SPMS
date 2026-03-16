from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.notification import Notification


class INotificationRepository(ABC):
    @abstractmethod
    async def create(self, notification: Notification) -> Notification: ...

    @abstractmethod
    async def get_by_user(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Notification]: ...

    @abstractmethod
    async def get_unread_count(self, user_id: int) -> int: ...

    @abstractmethod
    async def mark_read(self, notification_id: int, user_id: int) -> bool: ...

    @abstractmethod
    async def mark_all_read(self, user_id: int) -> None: ...

    @abstractmethod
    async def delete(self, notification_id: int, user_id: int) -> bool: ...

    @abstractmethod
    async def clear_read(self, user_id: int) -> None: ...

    @abstractmethod
    async def purge_old_read(self, days: int = 90) -> int: ...

    @abstractmethod
    async def get_tasks_approaching_deadline(self, days_ahead: int) -> List[dict]: ...
    # Returns list of dicts: {task_id, task_title, assignee_id, due_date}
