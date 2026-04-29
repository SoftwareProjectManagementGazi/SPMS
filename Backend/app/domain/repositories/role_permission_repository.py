"""Phase 15 RBAC-01 — IRolePermissionRepository abstract interface (junction CRUD)."""
from abc import ABC, abstractmethod
from typing import List

from app.domain.entities.permission import Permission
from app.domain.entities.role_permission import RolePermission


class IRolePermissionRepository(ABC):
    @abstractmethod
    async def get_matrix(self) -> List[RolePermission]:
        """Full flat list — matrix UI hydrates from this."""
        ...

    @abstractmethod
    async def set_cell(self, role_id: int, permission_id: int, granted: bool) -> None:
        """granted=True: INSERT ON CONFLICT DO NOTHING. granted=False: DELETE WHERE pair."""
        ...

    @abstractmethod
    async def list_by_role(self, role_id: int) -> List[Permission]:
        """JOIN; used by login handler for JWT permissions[] claim composition (Plan 15-06)."""
        ...

    @abstractmethod
    async def delete_by_role(self, role_id: int) -> int:
        """Bulk delete junction rows for a role (DeleteRoleUseCase Member fallback D-2.2)."""
        ...
