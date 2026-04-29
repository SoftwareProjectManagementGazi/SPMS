"""Phase 15 RBAC-05 / D-2.2 — DeleteRoleUseCase with Member fallback (Plan 15-05).

DIP — pure application layer; injects 4 ABCs (IRoleRepository,
IRolePermissionRepository, IUserRepository, IAuditRepository).
NO sqlalchemy / FastAPI imports.

Member-fallback transaction (Member-fallback-01 threat mitigation):
1. Validate target role exists and is NOT a system role (T-15-03)
2. Resolve the canonical Member role id (defensive — system roles always seeded)
3. UPDATE users SET role_id = member_role.id WHERE role_id = target_role.id
   → returns affected user IDs for audit
4. DELETE FROM role_permissions WHERE role_id = target_role.id (junction cascade)
5. DELETE FROM roles WHERE id = target_role.id
6. Audit emission:
   - 1 role.deleted row (with affected_user_count + fallback_role_id metadata)
   - N user.role_changed rows (one per affected user, with cascade_from_delete_role_id hint)

The session is shared across all 4 repos via DI (`Depends(get_db_session)`),
so the transaction is atomic. If any step raises, FastAPI's get_db_session
exception handler triggers rollback (router-layer concern).

Audit metadata envelope:
- role.deleted row: {role_id, role_name, affected_user_count, fallback_role_id, fallback_role_name}
- user.role_changed row: {source_role, target_role, cascade_from_delete_role_id}
"""
from app.domain.exceptions import RoleNotFoundError, SystemRoleProtectedError
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.role_permission_repository import IRolePermissionRepository
from app.domain.repositories.role_repository import IRoleRepository
from app.domain.repositories.user_repository import IUserRepository


class DeleteRoleUseCase:
    def __init__(
        self,
        role_repo: IRoleRepository,
        role_permission_repo: IRolePermissionRepository,
        user_repo: IUserRepository,
        audit_repo: IAuditRepository,
    ):
        self.role_repo = role_repo
        self.role_permission_repo = role_permission_repo
        self.user_repo = user_repo
        self.audit_repo = audit_repo

    async def execute(self, role_id: int, admin_id: int) -> None:
        role = await self.role_repo.get_by_id(role_id)
        if role is None:
            raise RoleNotFoundError(role_id)
        if role.is_system_role:
            raise SystemRoleProtectedError(role_id, role.name)

        # 1. Member fallback (D-2.2) — find the Member role
        member_role = await self.role_repo.get_by_name("Member")
        if member_role is None or member_role.id is None:
            # Defensive — Member is seeded by Migration 007. If absent, schema is corrupt.
            raise RoleNotFoundError("Member")

        # 2. Migrate users to Member (single transaction — session shared across repos)
        affected_user_ids = await self.user_repo.bulk_update_role_id(
            from_role_id=role_id,
            to_role_id=member_role.id,
        )

        # 3. Delete junction rows (RolePermission cascade)
        await self.role_permission_repo.delete_by_role(role_id)

        # 4. Delete role
        await self.role_repo.delete(role_id)

        # 5. Audit — 1 role_deleted + N user_role_changed
        await self.audit_repo.create_with_metadata(
            entity_type="role",
            entity_id=role_id,
            action="deleted",
            user_id=admin_id,
            metadata={
                "role_id": role_id,
                "role_name": role.name,
                "affected_user_count": len(affected_user_ids),
                "fallback_role_id": member_role.id,
                "fallback_role_name": "Member",
            },
            field_name="role",
        )
        for uid in affected_user_ids:
            await self.audit_repo.create_with_metadata(
                entity_type="user",
                entity_id=uid,
                action="role_changed",
                user_id=admin_id,
                metadata={
                    "source_role": role.name,
                    "target_role": "Member",
                    "cascade_from_delete_role_id": role_id,
                },
                field_name="role",
            )
