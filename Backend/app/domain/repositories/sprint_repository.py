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
