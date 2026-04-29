"""Phase 15 RBAC-03 / D-1.17 — ChangeUserRoleUseCase migrated (Plan 15-05).

Phase 14 14-01 used `target_role: AdminRole` literal + duck-typed
update_role/role_id_resolver callables. Plan 15-05 migrates to:

- Constructor: (user_repo: IUserRepository, role_repo: IRoleRepository,
                audit_repo: IAuditRepository) — proper ABC injection
- execute signature: (target_user_id: int, role_id: int, admin_id: int)
- Self-edit guard (D-2.9): backend-authoritative check; raises PermissionError
  before any repository call. Frontend disabled-button is cosmetic.
- Role lookup via IRoleRepository.get_by_id(role_id) — feeds target_role_name
  into audit metadata for downstream activity-feed rendering.

DIP — application layer; injects 3 ABCs. NO sqlalchemy / FastAPI imports.

Audit metadata envelope (entity_type=user, action=role_changed):
- user_id, user_email
- source_role (string name from existing role; may be None if user has no role)
- target_role_id (int)
- target_role_name (string name from IRoleRepository lookup)
- requested_by_admin_id

The router (Plan 15-06) maps:
- PermissionError → HTTP 403 (self-edit attempt — UI button should be disabled
  but backend is authoritative per D-2.9)
- UserNotFoundError → HTTP 404
- RoleNotFoundError → HTTP 404
"""
from app.domain.exceptions import RoleNotFoundError, UserNotFoundError
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.role_repository import IRoleRepository
from app.domain.repositories.user_repository import IUserRepository


class ChangeUserRoleUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        role_repo: IRoleRepository,
        audit_repo: IAuditRepository,
    ):
        self.user_repo = user_repo
        self.role_repo = role_repo
        self.audit_repo = audit_repo

    async def execute(self, target_user_id: int, role_id: int, admin_id: int) -> None:
        # D-2.9 — backend-authoritative self-edit prevention. Frontend
        # disabled-state is a cosmetic affordance; this guard is the trust boundary.
        # T-15-02 mitigation (privilege escalation via self-role-change).
        if target_user_id == admin_id:
            raise PermissionError("Kendi rolünü değiştiremezsin")

        user = await self.user_repo.get_by_id(target_user_id)
        if user is None:
            raise UserNotFoundError(target_user_id)

        target_role = await self.role_repo.get_by_id(role_id)
        if target_role is None:
            raise RoleNotFoundError(role_id)

        source_role_name = user.role.name if user.role is not None else None

        await self.user_repo.update_role(target_user_id, role_id)

        await self.audit_repo.create_with_metadata(
            entity_type="user",
            entity_id=target_user_id,
            action="role_changed",
            user_id=admin_id,
            metadata={
                "user_id": target_user_id,
                "user_email": user.email,
                "source_role": source_role_name,
                "target_role_id": role_id,
                "target_role_name": target_role.name,
                "requested_by_admin_id": admin_id,
            },
        )
