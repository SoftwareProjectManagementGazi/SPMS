"""Phase 14 Plan 14-01 — Admin user CRUD router (D-A6 / D-B2 / D-B3 / D-B4 / D-B7).

7 endpoints, every handler uses Depends(require_admin):
- POST   /admin/users                    invite (single)
- POST   /admin/users/bulk-invite        bulk invite (max 500 per D-B4)
- POST   /admin/users/{id}/password-reset   reset email link
- PATCH  /admin/users/{id}/role          system-wide role flip
- PATCH  /admin/users/{id}/deactivate    toggle is_active
- POST   /admin/users/bulk-action        per-user transaction (deactivate /
                                          activate / role_change)
- GET    /admin/users.csv                StreamingResponse with UTF-8 BOM (D-W3)
"""
import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.audit import get_audit_repo
from app.api.deps.auth import require_admin
from app.api.deps.password_reset import get_password_reset_repo
from app.api.deps.security import get_security_service
from app.api.deps.user import get_user_repo
from app.application.dtos.admin_user_dtos import (
    AdminRole,
    BulkActionRequestDTO,
    BulkActionResponseDTO,
    BulkInviteRequestDTO,
    BulkInviteResponseDTO,
    InviteUserRequestDTO,
    InviteUserResponseDTO,
    RoleChangeRequestDTO,
)
from app.application.use_cases.bulk_action_user import BulkActionUserUseCase
from app.application.use_cases.bulk_invite_user import BulkInviteUserUseCase
from app.application.use_cases.change_user_role import ChangeUserRoleUseCase
from app.application.use_cases.deactivate_user import DeactivateUserUseCase
from app.application.use_cases.invite_user import InviteUserUseCase
from app.application.use_cases.reset_user_password import ResetUserPasswordUseCase
from app.domain.entities.user import User
from app.domain.exceptions import UserAlreadyExistsError, UserNotFoundError
from app.infrastructure.config import settings
from app.infrastructure.database.database import get_db_session
from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel

router = APIRouter()


# ---------------------------------------------------------------------------
# Helper closures — kept here (router layer) so use cases stay free of
# Role table coupling per D-A6 (RBAC infra deferred; role_id resolution lives
# at the wiring boundary)
# ---------------------------------------------------------------------------


def _make_role_id_resolver(session: AsyncSession):
    async def resolve(role_name: str) -> Optional[int]:
        stmt = select(RoleModel).where(RoleModel.name.ilike(role_name))
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        return row.id if row else None
    return resolve


def _make_toggle_active(session: AsyncSession):
    async def toggle(user_id: int, is_active: bool) -> None:
        await session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(is_active=is_active)
        )
        await session.commit()
    return toggle


def _make_update_role(session: AsyncSession):
    async def upd(user_id: int, role_id: Optional[int]) -> None:
        await session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(role_id=role_id)
        )
        await session.commit()
    return upd


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/admin/users",
    response_model=InviteUserResponseDTO,
    status_code=http_status.HTTP_201_CREATED,
)
async def invite_user(
    dto: InviteUserRequestDTO,
    admin: User = Depends(require_admin),
    user_repo=Depends(get_user_repo),
    pwd_reset_repo=Depends(get_password_reset_repo),
    audit_repo=Depends(get_audit_repo),
    security=Depends(get_security_service),
    session: AsyncSession = Depends(get_db_session),
):
    """D-B2 admin invite — creates user(is_active=False) + reset token + audit row."""
    uc = InviteUserUseCase(
        user_repo=user_repo,
        password_reset_repo=pwd_reset_repo,
        audit_repo=audit_repo,
        security=security,
        invite_token_ttl_days=settings.INVITE_TOKEN_TTL_DAYS,
        frontend_url=settings.FRONTEND_URL,
    )
    try:
        return await uc.execute(
            dto, admin_id=admin.id,
            role_id_resolver=_make_role_id_resolver(session),
        )
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e),
        )


@router.post(
    "/admin/users/bulk-invite",
    response_model=BulkInviteResponseDTO,
)
async def bulk_invite(
    dto: BulkInviteRequestDTO,
    admin: User = Depends(require_admin),
    user_repo=Depends(get_user_repo),
    pwd_reset_repo=Depends(get_password_reset_repo),
    audit_repo=Depends(get_audit_repo),
    security=Depends(get_security_service),
    session: AsyncSession = Depends(get_db_session),
):
    """D-B4 bulk invite — 500-row server-side hard cap via Pydantic."""
    invite_uc = InviteUserUseCase(
        user_repo=user_repo,
        password_reset_repo=pwd_reset_repo,
        audit_repo=audit_repo,
        security=security,
        invite_token_ttl_days=settings.INVITE_TOKEN_TTL_DAYS,
        frontend_url=settings.FRONTEND_URL,
    )
    bulk_uc = BulkInviteUserUseCase(invite_uc)
    return await bulk_uc.execute(
        dto, admin_id=admin.id,
        role_id_resolver=_make_role_id_resolver(session),
    )


@router.post("/admin/users/{user_id}/password-reset", status_code=http_status.HTTP_204_NO_CONTENT)
async def reset_user_password(
    user_id: int,
    admin: User = Depends(require_admin),
    user_repo=Depends(get_user_repo),
    pwd_reset_repo=Depends(get_password_reset_repo),
    audit_repo=Depends(get_audit_repo),
):
    """D-B3 admin password reset — sends reset email + emits audit row."""
    uc = ResetUserPasswordUseCase(
        user_repo=user_repo,
        password_reset_repo=pwd_reset_repo,
        audit_repo=audit_repo,
        frontend_url=settings.FRONTEND_URL,
    )
    try:
        await uc.execute(user_id, admin_id=admin.id)
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail=str(e),
        )


@router.patch("/admin/users/{user_id}/role", status_code=http_status.HTTP_204_NO_CONTENT)
async def change_user_role(
    user_id: int,
    dto: RoleChangeRequestDTO,
    admin: User = Depends(require_admin),
    user_repo=Depends(get_user_repo),
    audit_repo=Depends(get_audit_repo),
    session: AsyncSession = Depends(get_db_session),
):
    """D-A6 system-wide role flip — Admin / Project Manager / Member only."""
    uc = ChangeUserRoleUseCase(
        user_repo=user_repo,
        audit_repo=audit_repo,
        update_role=_make_update_role(session),
    )
    try:
        await uc.execute(
            user_id, dto.role, admin_id=admin.id,
            role_id_resolver=_make_role_id_resolver(session),
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail=str(e),
        )


@router.patch("/admin/users/{user_id}/deactivate", status_code=http_status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: int,
    admin: User = Depends(require_admin),
    user_repo=Depends(get_user_repo),
    audit_repo=Depends(get_audit_repo),
    session: AsyncSession = Depends(get_db_session),
):
    """D-A6 toggle is_active=False + emit user.deactivated audit row."""
    uc = DeactivateUserUseCase(
        user_repo=user_repo,
        audit_repo=audit_repo,
        toggle_active=_make_toggle_active(session),
    )
    try:
        await uc.execute(user_id, admin_id=admin.id, deactivate=True)
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail=str(e),
        )


@router.post(
    "/admin/users/bulk-action",
    response_model=BulkActionResponseDTO,
)
async def bulk_action(
    dto: BulkActionRequestDTO,
    admin: User = Depends(require_admin),
    user_repo=Depends(get_user_repo),
    audit_repo=Depends(get_audit_repo),
    session: AsyncSession = Depends(get_db_session),
):
    """D-B7 per-user transaction; per-user audit row."""
    deactivate_uc = DeactivateUserUseCase(
        user_repo=user_repo,
        audit_repo=audit_repo,
        toggle_active=_make_toggle_active(session),
    )
    role_uc = ChangeUserRoleUseCase(
        user_repo=user_repo,
        audit_repo=audit_repo,
        update_role=_make_update_role(session),
    )
    uc = BulkActionUserUseCase(deactivate_uc, role_uc)
    return await uc.execute(
        dto, admin_id=admin.id,
        role_id_resolver=_make_role_id_resolver(session),
    )


@router.get("/admin/users.csv")
async def export_users_csv(
    admin: User = Depends(require_admin),
    user_repo=Depends(get_user_repo),
):
    """D-W3 server-rendered CSV export — UTF-8 BOM for Excel-friendliness."""
    users = await user_repo.get_all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "email", "full_name", "role", "is_active", "created_at"])
    for u in users:
        role_name = u.role.name if u.role else ""
        created_at = u.created_at.isoformat() if u.created_at else ""
        writer.writerow([u.id, u.email, u.full_name, role_name, u.is_active, created_at])

    csv_bytes = buf.getvalue().encode("utf-8")
    # UTF-8 BOM prefix — Excel auto-detects as UTF-8 with BOM rather than CP1252.
    bom = b"\xef\xbb\xbf"
    filename = f"users-{datetime.utcnow().strftime('%Y-%m-%d')}.csv"
    return StreamingResponse(
        io.BytesIO(bom + csv_bytes),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
