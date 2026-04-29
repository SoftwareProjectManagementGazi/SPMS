from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities.user import User

class IUserRepository(ABC):
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        pass

    @abstractmethod
    async def create(self, user: User) -> User:
        pass

    @abstractmethod
    async def get_by_id(self, user_id: int) -> Optional[User]:
        pass

    @abstractmethod
    async def update_password(self, user_id: int, password_hash: str) -> None:
        pass

    @abstractmethod
    async def search_by_email_or_name(self, query: str) -> List[User]:
        pass

    @abstractmethod
    async def get_all_by_role(self, role_name: str) -> List[User]: ...

    # ------------------------------------------------------------------
    # Phase 15 RBAC-03 / D-1.17 (Plan 15-05) — role-id-driven user updates
    # ------------------------------------------------------------------

    @abstractmethod
    async def update_role(self, user_id: int, role_id: int) -> None:
        """Phase 15 D-1.17 — Set users.role_id directly.

        Phase 14 14-01 used a duck-typed closure (`_make_update_role`); Plan 15-05
        promotes this into the ABC so ChangeUserRoleUseCase can inject IUserRepository
        without leaking SQLAlchemy session into the application layer.
        """
        ...

    @abstractmethod
    async def bulk_update_role_id(self, from_role_id: int, to_role_id: int) -> List[int]:
        """Phase 15 D-2.2 — DeleteRoleUseCase Member fallback.

        Updates every user where role_id == from_role_id to role_id == to_role_id.
        Returns list of affected user IDs (for per-user audit emission per
        Member-fallback-01 mitigation in PLAN 15-05 threat_model).
        """
        ...
