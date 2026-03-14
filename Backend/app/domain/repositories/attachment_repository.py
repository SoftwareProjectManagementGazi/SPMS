from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.file import File


class IAttachmentRepository(ABC):
    @abstractmethod
    async def get_by_id(self, file_id: int) -> Optional[File]: ...

    @abstractmethod
    async def get_by_task(self, task_id: int) -> List[File]: ...

    @abstractmethod
    async def create(self, file: File) -> File: ...

    @abstractmethod
    async def soft_delete(self, file_id: int) -> bool: ...
