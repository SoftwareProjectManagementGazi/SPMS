"""Phase 14 Plan 14-01 — BulkInviteUserUseCase (D-B4 / D-A8 per-user audit).

Iterates BulkInviteRowDTO rows and calls InviteUserUseCase per row. Per-row
try/except so one bad row does not abort the batch (D-B4 commit-or-skip
strategy). Returns {successful: [...], failed: [...]} per the BulkInviteResponseDTO.

DIP — composes InviteUserUseCase; no infrastructure imports.
"""
from typing import Any, Optional

from app.application.dtos.admin_user_dtos import (
    BulkInviteRequestDTO,
    BulkInviteResponseDTO,
    BulkInviteRowFailureDTO,
    InviteUserRequestDTO,
)
from app.application.use_cases.invite_user import InviteUserUseCase


class BulkInviteUserUseCase:
    def __init__(self, invite_use_case: InviteUserUseCase):
        self.invite_use_case = invite_use_case

    async def execute(
        self,
        request: BulkInviteRequestDTO,
        admin_id: int,
        role_id_resolver: Optional[Any] = None,
    ) -> BulkInviteResponseDTO:
        successful = []
        failed = []
        for idx, row in enumerate(request.rows):
            row_number = idx + 1
            try:
                resp = await self.invite_use_case.execute(
                    InviteUserRequestDTO(
                        email=row.email, role=row.role, name=row.name
                    ),
                    admin_id=admin_id,
                    role_id_resolver=role_id_resolver,
                )
                successful.append(resp)
            except Exception as exc:
                # Per-row commit-or-skip — defer DB-level rollback decisions
                # to the underlying InviteUserUseCase. We just record the
                # failure for the response payload.
                failed.append(
                    BulkInviteRowFailureDTO(
                        row_number=row_number,
                        email=row.email,
                        errors=[str(exc)],
                    )
                )
        return BulkInviteResponseDTO(successful=successful, failed=failed)
