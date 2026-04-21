from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.project import Project
from app.domain.entities.user import User


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

    @abstractmethod
    async def add_member(self, project_id: int, user_id: int) -> None:
        pass

    @abstractmethod
    async def remove_member(self, project_id: int, user_id: int) -> None:
        pass

    @abstractmethod
    async def get_members(self, project_id: int) -> List[User]:
        pass

    @abstractmethod
    async def list_by_status(self, statuses: list) -> List[Project]:
        """API-04: GET /projects?status=X filter."""
        pass

    @abstractmethod
    async def list_by_member_and_status(self, user_id: int, statuses: List[str]) -> List[Project]:
        """D-49: projects where user is a team member, filtered by status."""
        pass

    @abstractmethod
    async def count_by_member(self, user_id: int) -> int:
        """Count distinct projects where user is a team member (any non-deleted status)."""
        pass
