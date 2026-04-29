"""Phase 15 RBAC-01 — IRoleRepository abstract interface.

Pitfall 12: Phase 14 14-01 used a duck-typed callable; Plan 15-04 creates the proper ABC.
"""
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.entities.role import Role


class IRoleRepository(ABC):
    @abstractmethod
    async def create(self, role: Role) -> Role: ...

    @abstractmethod
    async def get_by_id(self, role_id: int) -> Optional[Role]: ...

    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[Role]:
        """Case-insensitive lookup (ILIKE). Used by Member-fallback + reserved-name validation."""
        ...

    @abstractmethod
    async def list_all(self) -> List[Role]: ...

    @abstractmethod
    async def update(self, role: Role) -> Role: ...

    @abstractmethod
    async def delete(self, role_id: int) -> bool:
        """Hard-delete (system role check at use case layer). Returns True on success."""
        ...
