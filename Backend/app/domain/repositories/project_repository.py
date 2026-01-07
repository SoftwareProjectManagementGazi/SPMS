from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.project import Project

class IProjectRepository(ABC):
    @abstractmethod
    async def create(self, project: Project) -> Project:
        pass

    @abstractmethod
    async def get_by_id(self, project_id: int) -> Optional[Project]:
        pass

    @abstractmethod
    async def get_by_id_and_user(self, project_id: int, user_id: int) -> Optional[Project]:
        pass

    @abstractmethod
    async def get_all(self, manager_id: int) -> List[Project]:
        pass

    @abstractmethod
    async def update(self, project: Project) -> Project:
        pass

    @abstractmethod
    async def delete(self, project_id: int) -> bool:
        pass
