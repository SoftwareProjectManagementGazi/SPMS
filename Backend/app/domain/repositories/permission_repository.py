"""Phase 15 RBAC-01 — IPermissionRepository abstract interface."""
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.entities.permission import Permission


class IPermissionRepository(ABC):
    @abstractmethod
    async def list_all(self) -> List[Permission]: ...

    @abstractmethod
    async def get_by_key(self, key: str) -> Optional[Permission]: ...

    @abstractmethod
    async def list_by_scope(self, scope: str) -> List[Permission]:
        """scope must be 'system' or 'project'. Used by matrix UI badge (D-3.4)."""
        ...

    @abstractmethod
    async def create_many(self, perms: List[Permission]) -> List[Permission]:
        """Bulk seed support. Idempotent: ON CONFLICT DO NOTHING."""
        ...
