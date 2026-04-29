"""Phase 15 RBAC-05 / D-1.12 — UpdatePermissionMatrixUseCase (Plan 15-05).

DIP — pure application layer. Per-cell PATCH semantics so the frontend can
toggle individual cells without re-uploading the entire matrix (D-1.12).

Guards:
- Role missing → RoleNotFoundError (router maps 404)
- Admin column readonly (D-1.5 / D-2.9 / T-15-04 last-admin-lockout) →
  SystemRoleProtectedError. Even if UI bypassed, backend rejects.
- Permission key unknown → PermissionDeniedError (router maps 403; signals
  the requester to refresh their permission list)

Audit emission:
- entity_type='role', action='permission_granted' or 'permission_revoked'
  (depending on `granted` flag)
- metadata: {role_id, role_name, perm_id, perm_key, granted}
"""
from app.domain.exceptions import (
    PermissionDeniedError,
    RoleNotFoundError,
    SystemRoleProtectedError,
)
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.permission_repository import IPermissionRepository
from app.domain.repositories.role_permission_repository import IRolePermissionRepository
from app.domain.repositories.role_repository import IRoleRepository


class UpdatePermissionMatrixUseCase:
    def __init__(
        self,
        role_repo: IRoleRepository,
        perm_repo: IPermissionRepository,
        role_perm_repo: IRolePermissionRepository,
        audit_repo: IAuditRepository,
    ):
        self.role_repo = role_repo
        self.perm_repo = perm_repo
        self.role_perm_repo = role_perm_repo
        self.audit_repo = audit_repo

    async def execute(self, role_id: int, perm_key: str, granted: bool, admin_id: int) -> None:
        role = await self.role_repo.get_by_id(role_id)
        if role is None:
            raise RoleNotFoundError(role_id)
        # D-1.5 / D-2.9 — Admin column readonly (super-role; matrix changes meaningless
        # because Admin short-circuits via _is_admin in Plan 15-06 require_permission).
        # Defensive: even if UI bypass, backend rejects (T-15-04 last-admin lockout).
        if role.name.lower() == "admin":
            raise SystemRoleProtectedError(role_id, role.name)

        perm = await self.perm_repo.get_by_key(perm_key)
        if perm is None or perm.id is None:
            raise PermissionDeniedError(perm_key)

        await self.role_perm_repo.set_cell(role_id, perm.id, granted)

        await self.audit_repo.create_with_metadata(
            entity_type="role",
            entity_id=role_id,
            action="permission_granted" if granted else "permission_revoked",
            user_id=admin_id,
            metadata={
                "role_id": role_id,
                "role_name": role.name,
                "perm_id": perm.id,
                "perm_key": perm_key,
                "granted": granted,
            },
            field_name="permissions",
        )
