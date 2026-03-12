from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities.team import Team


class ITeamRepository(ABC):
    @abstractmethod
    async def create(self, name: str, description: Optional[str], owner_id: int) -> Team: ...
    @abstractmethod
    async def get_by_id(self, team_id: int) -> Optional[Team]: ...
    @abstractmethod
    async def list_by_user(self, user_id: int) -> List[Team]: ...
    @abstractmethod
    async def add_member(self, team_id: int, user_id: int) -> None: ...
    @abstractmethod
    async def remove_member(self, team_id: int, user_id: int) -> None: ...
    @abstractmethod
    async def get_members(self, team_id: int) -> List[int]: ...  # returns user_ids
    @abstractmethod
    async def soft_delete(self, team_id: int) -> None: ...
