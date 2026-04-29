"""Phase 15 RBAC-05 — ListRolesUseCase (Plan 15-05).

DIP — pure application layer. Returns RoleListResponseDTO {items, total}.
"""
from app.application.dtos.role_dtos import RoleListResponseDTO, RoleResponseDTO
from app.domain.repositories.role_repository import IRoleRepository


class ListRolesUseCase:
    def __init__(self, role_repo: IRoleRepository):
        self.role_repo = role_repo

    async def execute(self) -> RoleListResponseDTO:
        roles = await self.role_repo.list_all()
        items = [RoleResponseDTO.model_validate(r) for r in roles]
        return RoleListResponseDTO(items=items, total=len(items))
