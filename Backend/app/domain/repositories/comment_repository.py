from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.comment import Comment


class ICommentRepository(ABC):
    @abstractmethod
    async def get_by_id(self, comment_id: int) -> Optional[Comment]: ...

    @abstractmethod
    async def get_by_task(self, task_id: int) -> List[Comment]: ...

    @abstractmethod
    async def create(self, comment: Comment) -> Comment: ...

    @abstractmethod
    async def update(self, comment_id: int, content: str) -> Optional[Comment]: ...

    @abstractmethod
    async def soft_delete(self, comment_id: int) -> bool: ...
