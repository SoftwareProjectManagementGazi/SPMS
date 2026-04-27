"""Phase 14 Plan 14-01 — ChangeUserRoleUseCase (D-A6 / D-D2).

Validates new role ∈ {Admin, Project Manager, Member}, looks up the role row
via injected resolver, and updates users.role_id. Audit row records both
source_role and target_role for the lifecycle event.

DIP — ZERO sqlalchemy / app.infrastructure imports. The role lookup is
injected as a duck-typed callable so the use case stays free of Role table
coupling.
"""
from typing import Any, Optional

from app.application.dtos.admin_user_dtos import AdminRole
from app.domain.exceptions import UserNotFoundError
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.user_repository import IUserRepository


class ChangeUserRoleUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        audit_repo: IAuditRepository,
        update_role: Any,  # callable(user_id, role_id) -> Coro
    ):
        self.user_repo = user_repo
        self.audit_repo = audit_repo
        self.update_role = update_role

    async def execute(
        self,
        target_user_id: int,
        new_role: AdminRole,
        admin_id: int,
        role_id_resolver: Any,  # callable(role_name) -> role_id
    ) -> None:
        user = await self.user_repo.get_by_id(target_user_id)
        if user is None:
            raise UserNotFoundError(target_user_id)

        source_role: Optional[str] = None
        if user.role is not None:
            source_role = user.role.name

        new_role_id = await role_id_resolver(new_role)
        await self.update_role(target_user_id, new_role_id)

        await self.audit_repo.create_with_metadata(
            entity_type="user",
            entity_id=target_user_id,
            action="role_changed",
            user_id=admin_id,
            metadata={
                "user_id": target_user_id,
                "user_email": user.email,
                "source_role": source_role,
                "target_role": new_role,
                "requested_by_admin_id": admin_id,
            },
        )
