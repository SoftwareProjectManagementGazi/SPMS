"""Phase 14 Plan 14-01 / Phase 15 Plan 15-07 — BulkActionUserUseCase.

Per-user transaction (NOT bulk all-or-none). Audit row written per user (NOT
per batch). Returns BulkActionResponseDTO with per-user success/failed list.

DIP — composes DeactivateUserUseCase + ChangeUserRoleUseCase; no infrastructure
imports.

Phase 15 Plan 15-06 — ChangeUserRoleUseCase migrated to (target_user_id,
role_id: int, admin_id) signature. Bulk-action payload now accepts either
``payload.role_id`` (preferred) or ``payload.role`` (legacy string, resolved
via the optional ``role_id_resolver`` callable).

Phase 15 Plan 15-07 / D-1.16 — bulk-action endpoint is gated by
``require_permission('admin.users.bulk')`` (umbrella). The use case adds an
extra dynamic per-action perm check at execute() entry: if the caller lacks
the action's specific sub-perm (e.g. ``admin.users.deactivate`` for action
``deactivate``), :class:`PermissionDeniedError` is raised BEFORE any user
row is mutated (Pitfall 17 — no partial success).

DIP-preserving callable injection (CLAUDE.md §4.1 D rule + §4.2 DI strategy):
the application layer MUST NOT import from ``app.api.deps`` or
``app.infrastructure``. The permission check is therefore injected as a
``permission_check: Callable[[User, str], bool]`` at construction time. The
API/router layer (which legitimately knows about ``_has_permission``) wires
the callable; the use case stays Clean Architecture pure.
"""
from typing import Any, Callable, Optional

from app.application.dtos.admin_user_dtos import (
    BulkActionRequestDTO,
    BulkActionResponseDTO,
    BulkActionResultDTO,
)
from app.application.use_cases.change_user_role import ChangeUserRoleUseCase
from app.application.use_cases.deactivate_user import DeactivateUserUseCase
from app.domain.entities.user import User
from app.domain.exceptions import PermissionDeniedError


# D-1.16 mapping — sub-perm per action subtype. Each bulk action is gated by
# both the umbrella ``admin.users.bulk`` (router) AND the per-action sub-perm
# below (use case). Keep the keys identical to BulkActionRequestDTO.action.
SUB_PERM_MAP: dict[str, str] = {
    "deactivate": "admin.users.deactivate",
    "activate": "admin.users.deactivate",       # same perm covers activate
    "role_change": "admin.users.role_change",
}


class BulkActionUserUseCase:
    def __init__(
        self,
        deactivate_use_case: DeactivateUserUseCase,
        role_change_use_case: ChangeUserRoleUseCase,
        permission_check: Optional[Callable[[User, str], bool]] = None,
    ):
        """Constructor.

        ``permission_check`` is the D-1.16 dynamic per-action perm check. The
        signature ``Callable[[User, str], bool]`` matches
        ``app.api.deps.auth._has_permission``. The router wires the real
        callable; tests may inject a stub. ``None`` disables the dynamic
        check (legacy callers / unit tests that don't exercise perms — the
        umbrella ``Depends(require_permission('admin.users.bulk'))`` at the
        router still gates entry).
        """
        self.deactivate_use_case = deactivate_use_case
        self.role_change_use_case = role_change_use_case
        self._permission_check = permission_check

    async def execute(
        self,
        request: BulkActionRequestDTO,
        admin_id: int,
        admin_user: Optional[User] = None,
        role_id_resolver: Optional[Any] = None,
    ) -> BulkActionResponseDTO:
        # D-1.16 dynamic per-action perm dispatch — fires BEFORE the per-user
        # loop so a missing sub-perm fails the entire bulk request without
        # mutating any rows (Pitfall 17 — no partial success).
        if self._permission_check is not None and admin_user is not None:
            sub_perm = SUB_PERM_MAP.get(request.action)
            if sub_perm is None:
                raise PermissionDeniedError(f"unknown bulk action: {request.action}")
            if not self._permission_check(admin_user, sub_perm):
                raise PermissionDeniedError(sub_perm)

        results = []
        success_count = 0
        failed_count = 0
        for user_id in request.user_ids:
            try:
                if request.action == "deactivate":
                    await self.deactivate_use_case.execute(user_id, admin_id, deactivate=True)
                elif request.action == "activate":
                    await self.deactivate_use_case.execute(user_id, admin_id, deactivate=False)
                elif request.action == "role_change":
                    payload = request.payload or {}
                    role_id = payload.get("role_id")
                    if role_id is None:
                        # Legacy: payload contains {role: str}; resolve via callback.
                        legacy_role = payload.get("role")
                        if legacy_role is None or role_id_resolver is None:
                            raise ValueError(
                                "role_change requires payload.role_id "
                                "(or payload.role with role_id_resolver)"
                            )
                        role_id = await role_id_resolver(legacy_role)
                        if role_id is None:
                            raise ValueError(
                                f"role_change: unknown role '{legacy_role}'"
                            )
                    await self.role_change_use_case.execute(
                        target_user_id=user_id,
                        role_id=int(role_id),
                        admin_id=admin_id,
                    )
                else:
                    raise ValueError(f"Unknown action: {request.action}")
                results.append(BulkActionResultDTO(user_id=user_id, status="success"))
                success_count += 1
            except Exception as exc:
                results.append(
                    BulkActionResultDTO(
                        user_id=user_id, status="failed", error=str(exc)
                    )
                )
                failed_count += 1
        return BulkActionResponseDTO(
            results=results,
            success_count=success_count,
            failed_count=failed_count,
        )
