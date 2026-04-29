"""Phase 15 RBAC-05 — GetPermissionMatrixUseCase (Plan 15-05).

DIP — pure application layer. Composes 3 reads into one PermissionMatrixResponseDTO
that the Plan 15-09 frontend hydrates the matrix UI from in a single network call.

Output shape (PermissionMatrixResponseDTO):
- roles: List[RoleResponseDTO]
- permissions: List[PermissionResponseDTO]
- cells: List[MatrixCellDTO]   # one per junction row; granted=True (absent = False)

Note: junction rows present in role_permissions ALL imply granted=True
(no half-granted state exists in the schema). Absence = revoked.
"""
from app.application.dtos.permission_dtos import (
    MatrixCellDTO,
    PermissionMatrixResponseDTO,
    PermissionResponseDTO,
)
from app.application.dtos.role_dtos import RoleResponseDTO
from app.domain.repositories.permission_repository import IPermissionRepository
from app.domain.repositories.role_permission_repository import IRolePermissionRepository
from app.domain.repositories.role_repository import IRoleRepository


class GetPermissionMatrixUseCase:
    def __init__(
        self,
        role_repo: IRoleRepository,
        perm_repo: IPermissionRepository,
        role_perm_repo: IRolePermissionRepository,
    ):
        self.role_repo = role_repo
        self.perm_repo = perm_repo
        self.role_perm_repo = role_perm_repo

    async def execute(self) -> PermissionMatrixResponseDTO:
        roles = await self.role_repo.list_all()
        perms = await self.perm_repo.list_all()
        matrix = await self.role_perm_repo.get_matrix()  # List[RolePermission]
        cells = [
            MatrixCellDTO(role_id=rp.role_id, permission_id=rp.permission_id, granted=True)
            for rp in matrix
        ]
        return PermissionMatrixResponseDTO(
            roles=[RoleResponseDTO.model_validate(r) for r in roles],
            permissions=[PermissionResponseDTO.model_validate(p) for p in perms],
            cells=cells,
        )
