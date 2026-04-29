"""Phase 15 RBAC-05 / D-2.1 — CreateRoleUseCase (Plan 15-05).

DIP — application layer; injects IRoleRepository + IAuditRepository ABCs.
NO sqlalchemy / FastAPI imports.

Validation order:
1. Trim + reserved-name check (case-insensitive) → RoleNameInvalidError(reason='reserved')
2. Duplicate check via IRoleRepository.get_by_name (ILIKE in concrete repo)
   → RoleNameInvalidError(reason='duplicate')
3. Construct Role entity with is_system_role=False (system roles seeded only by
   migration 007 per D-2.3)
4. Persist + emit role.created audit row with role_id, role_name, icon_key,
   color_token in metadata envelope
"""
from typing import Optional

from app.application.dtos.role_dtos import RESERVED_ROLE_NAMES, RoleCreateDTO, RoleResponseDTO
from app.domain.entities.role import Role
from app.domain.exceptions import RoleNameInvalidError
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.role_repository import IRoleRepository


class CreateRoleUseCase:
    def __init__(self, role_repo: IRoleRepository, audit_repo: Optional[IAuditRepository] = None):
        self.role_repo = role_repo
        self.audit_repo = audit_repo

    async def execute(self, dto: RoleCreateDTO, admin_id: int) -> RoleResponseDTO:
        trimmed = dto.name.strip()

        # D-2.6 — reserved-name (case-insensitive) — T-15-07 mitigation
        if trimmed.lower() in RESERVED_ROLE_NAMES:
            raise RoleNameInvalidError(dto.name, "reserved")

        # UNIQUE check (case-insensitive via IRoleRepository.get_by_name ILIKE)
        existing = await self.role_repo.get_by_name(trimmed)
        if existing is not None:
            raise RoleNameInvalidError(dto.name, "duplicate")

        role = Role(
            name=trimmed,
            description=dto.description,
            icon_key=dto.icon_key,
            color_token=dto.color_token,
            is_system_role=False,    # D-2.3 — system flag set only by migration seed
        )
        created = await self.role_repo.create(role)

        if self.audit_repo is not None:
            await self.audit_repo.create_with_metadata(
                entity_type="role",
                entity_id=created.id or 0,
                action="created",
                user_id=admin_id,
                metadata={
                    "role_id": created.id,
                    "role_name": created.name,
                    "icon_key": created.icon_key,
                    "color_token": created.color_token,
                },
                field_name="role",
            )
        return RoleResponseDTO.model_validate(created)
