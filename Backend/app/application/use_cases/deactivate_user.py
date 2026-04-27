"""Phase 14 Plan 14-01 — DeactivateUserUseCase (D-A6 / D-D2).

Toggles users.is_active on/off; emits user.deactivated or user.activated audit
row with target user metadata + requested_by_admin_id.

DIP — ZERO sqlalchemy / app.infrastructure imports.
"""
from typing import Any

from app.domain.exceptions import UserNotFoundError
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.user_repository import IUserRepository


class DeactivateUserUseCase:
    """Toggle is_active for a user; emits matching audit row."""

    def __init__(
        self,
        user_repo: IUserRepository,
        audit_repo: IAuditRepository,
        toggle_active: Any,  # callable(user_id, is_active) -> Coro — duck-typed
    ):
        """The repo's set_is_active is duck-typed via ``toggle_active`` so the
        IUserRepository ABC stays unchanged in v2.0; the router wires a thin
        async lambda that calls the SqlAlchemyUserRepository's update path."""
        self.user_repo = user_repo
        self.audit_repo = audit_repo
        self.toggle_active = toggle_active

    async def execute(self, target_user_id: int, admin_id: int, deactivate: bool = True):
        user = await self.user_repo.get_by_id(target_user_id)
        if user is None:
            raise UserNotFoundError(target_user_id)

        new_value = not deactivate  # deactivate=True → is_active=False
        await self.toggle_active(target_user_id, new_value)

        await self.audit_repo.create_with_metadata(
            entity_type="user",
            entity_id=target_user_id,
            action="deactivated" if deactivate else "activated",
            user_id=admin_id,
            metadata={
                "user_id": target_user_id,
                "user_email": user.email,
                "requested_by_admin_id": admin_id,
            },
        )
