"""Phase 15 RBAC-05 / D-2.3 — UpdateRoleUseCase (Plan 15-05).

DIP — pure application layer; injects IRoleRepository + IAuditRepository ABCs.
NO sqlalchemy / FastAPI imports.

Guards (in order):
1. Lookup target role; missing → RoleNotFoundError (router maps 404)
2. is_system_role=True → SystemRoleProtectedError (router maps 422
   error_code=SYSTEM_ROLE_PROTECTED). T-15-03 mitigation.
3. If name is being updated:
   a. Reserved-name (case-insensitive) → RoleNameInvalidError(reason='reserved')
   b. Duplicate (case-insensitive, excluding self) → RoleNameInvalidError(reason='duplicate')
4. Apply patch (name/description/icon_key/color_token via exclude_unset=True)
5. Persist + emit role.updated audit with diff fields list

Partial updates supported per Pydantic v2 model_dump(exclude_unset=True).
"""
from typing import Optional

from app.application.dtos.role_dtos import RESERVED_ROLE_NAMES, RoleResponseDTO, RoleUpdateDTO
from app.domain.exceptions import (
    RoleNameInvalidError,
    RoleNotFoundError,
    SystemRoleProtectedError,
)
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.role_repository import IRoleRepository


class UpdateRoleUseCase:
    def __init__(self, role_repo: IRoleRepository, audit_repo: Optional[IAuditRepository] = None):
        self.role_repo = role_repo
        self.audit_repo = audit_repo

    async def execute(self, role_id: int, dto: RoleUpdateDTO, admin_id: int) -> RoleResponseDTO:
        role = await self.role_repo.get_by_id(role_id)
        if role is None:
            raise RoleNotFoundError(role_id)
        if role.is_system_role:
            raise SystemRoleProtectedError(role_id, role.name)

        updates = dto.model_dump(exclude_unset=True)

        if "name" in updates and updates["name"] is not None:
            trimmed = updates["name"].strip()
            # D-2.6 reserved-name check on rename (T-15-07)
            if trimmed.lower() in RESERVED_ROLE_NAMES:
                raise RoleNameInvalidError(updates["name"], "reserved")
            # Duplicate check excluding self
            existing = await self.role_repo.get_by_name(trimmed)
            if existing is not None and existing.id != role.id:
                raise RoleNameInvalidError(updates["name"], "duplicate")
            role.name = trimmed
        if "description" in updates:
            role.description = updates["description"]
        if "icon_key" in updates:
            role.icon_key = updates["icon_key"]
        if "color_token" in updates:
            role.color_token = updates["color_token"]

        updated = await self.role_repo.update(role)

        if self.audit_repo is not None:
            await self.audit_repo.create_with_metadata(
                entity_type="role",
                entity_id=role.id or 0,
                action="updated",
                user_id=admin_id,
                metadata={
                    "role_id": role.id,
                    "role_name": role.name,
                    "fields": sorted(updates.keys()),
                },
                field_name="role",
            )
        return RoleResponseDTO.model_validate(updated)
