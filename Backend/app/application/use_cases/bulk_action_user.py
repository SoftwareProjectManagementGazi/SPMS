"""Phase 14 Plan 14-01 — BulkActionUserUseCase (D-B7 per-user transaction).

Per-user transaction (NOT bulk all-or-none). Audit row written per user (NOT
per batch). Returns BulkActionResponseDTO with per-user success/failed list.

DIP — composes DeactivateUserUseCase + ChangeUserRoleUseCase; no infrastructure
imports.
"""
from typing import Any, Optional

from app.application.dtos.admin_user_dtos import (
    BulkActionRequestDTO,
    BulkActionResponseDTO,
    BulkActionResultDTO,
)
from app.application.use_cases.change_user_role import ChangeUserRoleUseCase
from app.application.use_cases.deactivate_user import DeactivateUserUseCase


class BulkActionUserUseCase:
    def __init__(
        self,
        deactivate_use_case: DeactivateUserUseCase,
        role_change_use_case: ChangeUserRoleUseCase,
    ):
        self.deactivate_use_case = deactivate_use_case
        self.role_change_use_case = role_change_use_case

    async def execute(
        self,
        request: BulkActionRequestDTO,
        admin_id: int,
        role_id_resolver: Optional[Any] = None,
    ) -> BulkActionResponseDTO:
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
                    new_role = (request.payload or {}).get("role")
                    if new_role is None:
                        raise ValueError("role_change requires payload.role")
                    await self.role_change_use_case.execute(
                        user_id, new_role, admin_id, role_id_resolver
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
