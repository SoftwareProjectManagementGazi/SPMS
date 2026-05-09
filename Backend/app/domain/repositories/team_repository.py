from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities.team import Team


class ITeamRepository(ABC):
    @abstractmethod
    async def create(
        self,
        name: str,
        description: Optional[str],
        owner_id: int,
        color: str = "#3b82f6",
        department: Optional[str] = None,
        leader_id: Optional[int] = None,
    ) -> Team: ...

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

    @abstractmethod
    async def update(self, team: Team) -> Team:
        """Persist changes to a Team entity (name, description, leader_id, color, department)."""
        ...

    @abstractmethod
    async def user_leads_any_team_on_project(self, user_id: int, project_id: int) -> bool:
        """D-16: EXISTS(Teams JOIN TeamProjects WHERE leader_id=user_id AND project_id=project_id)."""
        ...

    @abstractmethod
    async def get_teams_led_by(self, user_id: int) -> list:
        """D-16: Teams where leader_id=user_id."""
        ...

    # ---------------------------------------------------------------
    # Yeni metodlar — Teams sayfası stats / projects / activity
    # ---------------------------------------------------------------

    @abstractmethod
    async def get_stats_for_user(self, user_id: int) -> dict:
        """Sayfa üstü stats strip için: total_teams, total_members, active_tasks, completion_rate."""
        ...

    @abstractmethod
    async def get_projects(self, team_id: int) -> list:
        """Detay sayfası → Projeler sekmesi: takıma bağlı projeler ve ilerleme."""
        ...

    @abstractmethod
    async def get_activity(self, team_id: int, limit: int = 50) -> list:
        """Detay sayfası → Aktivite sekmesi: takıma ait son audit log olayları."""
        ...

    @abstractmethod
    async def assign_project(self, team_id: int, project_id: int) -> None:
        """team_projects tablosuna (team_id, project_id) satırı ekle. Idempotent."""
        ...

    @abstractmethod
    async def unassign_project(self, team_id: int, project_id: int) -> None:
        """team_projects tablosundan (team_id, project_id) satırını sil."""
        ...

    @abstractmethod
    async def get_member_stats(self, team_id: int) -> list:
        """Takım üyelerinin tamamlanan görev sayıları."""
        ...