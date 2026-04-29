"""Phase 15 RBAC-05 — ListPermissionsUseCase (Plan 15-05).

DIP — pure application layer. Optional scope filter ('system' | 'project').
"""
from typing import List, Optional

from app.application.dtos.permission_dtos import PermissionResponseDTO
from app.domain.repositories.permission_repository import IPermissionRepository


class ListPermissionsUseCase:
    def __init__(self, perm_repo: IPermissionRepository):
        self.perm_repo = perm_repo

    async def execute(self, scope: Optional[str] = None) -> List[PermissionResponseDTO]:
        if scope is None:
            perms = await self.perm_repo.list_all()
        else:
            perms = await self.perm_repo.list_by_scope(scope)
        return [PermissionResponseDTO.model_validate(p) for p in perms]
