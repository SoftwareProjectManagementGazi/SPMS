from abc import ABC, abstractmethod
from typing import Dict, List, Optional
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
    async def update(
        self,
        project: Project,
        user_id: Optional[int] = None,
        updated_keys: Optional[set] = None,
    ) -> Project:
        """Persist updated fields on an existing project.

        FL-06 fix (Phase 10 review): ``updated_keys`` lets the application
        layer distinguish "field not present in the PATCH body" from "field
        explicitly cleared to None". When ``updated_keys`` is ``None`` the
        repository keeps legacy behavior (skip assignment when new value is
        ``None``); when the set is provided, only keys in the set are
        considered, but a ``None`` value IS written so clients can clear
        nullable columns like ``description`` or ``end_date``.
        """
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

    # ------------------------------------------------------------------
    # Phase 14 Plan 14-01 — admin stats aggregation (D-A7 / D-X3 / D-X4)
    # ------------------------------------------------------------------

    async def methodology_distribution(self) -> dict:
        """D-X3 — count of non-archived projects per methodology.

        Returns {methodology_lower: count}. Default implementation returns
        empty dict so test fakes can override; production impl issues a single
        SELECT methodology, COUNT(*) FROM projects WHERE status != 'ARCHIVED'
        GROUP BY methodology query.
        """
        return {}

    async def list_recent_projects(self, limit: int = 30) -> list:
        """D-X4 — top N most-recently-updated non-archived projects (DoS cap).

        Returns Project entities ordered by updated_at DESC. Default returns
        empty list so test fakes can override.
        """
        return []

    async def task_counts_by_project_ids(
        self, project_ids: List[int]
    ) -> Dict[int, Dict[str, int]]:
        """Plan 14-05 follow-up — task aggregates for the admin /admin/projects table.

        Returns ``{project_id: {"total": N, "done": M}}`` for each requested project.
        A task is "done" when its ``board_columns.name`` (case-insensitive) matches a
        terminal-state label such as ``done``/``completed``/``closed``/``tamamlandi``/``bitti``.
        Default returns empty dict so test fakes can override.
        """
        return {}
