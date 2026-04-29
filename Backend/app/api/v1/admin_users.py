"""Phase 14 Plan 14-01 / Phase 15 Plan 15-07 — Admin user CRUD router.

7 endpoints. Phase 15 D-1.4 migrates each handler from the legacy admin
gate to endpoint-specific ``Depends(require_permission('<key>'))``:

- GET    /admin/users                    list  → admin.access
- POST   /admin/users                    invite → admin.users.invite
- POST   /admin/users/bulk-invite        bulk invite → admin.users.invite
- POST   /admin/users/{id}/password-reset reset email link → admin.users.invite
- PATCH  /admin/users/{id}/role          role flip → admin.users.role_change
- PATCH  /admin/users/{id}/deactivate    toggle is_active → admin.users.deactivate
- POST   /admin/users/bulk-action        per-user txn → admin.users.bulk
                                          (umbrella; use case adds dynamic
                                          SUB_PERM_MAP check D-1.16)
- GET    /admin/users.csv                CSV export → admin.access
"""
import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from fastapi.responses import StreamingResponse
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.audit import get_audit_repo
from app.api.deps.auth import _has_permission, require_permission
from app.api.deps.password_reset import get_password_reset_repo
from app.api.deps.role import get_role_repo
from app.api.deps.security import get_security_service
from app.api.deps.user import get_user_repo
from app.application.dtos.admin_user_dtos import (
    AdminRole,
    AdminUserListItemDTO,
    AdminUserListResponseDTO,
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
from app.domain.exceptions import (
    PermissionDeniedError,
    RoleNotFoundError,
    UserAlreadyExistsError,
    UserNotFoundError,
)
from app.domain.repositories.role_repository import IRoleRepository
from app.infrastructure.config import settings
from app.infrastructure.database.database import get_db_session
from app.infrastructure.database.models.user import UserModel

router = APIRouter()


# ---------------------------------------------------------------------------
# Helper closures — Phase 15 Plan 15-06 migrated the role-update and
# role-name-resolver closures to IRoleRepository ABC injection. The Phase 14
# `_make_toggle_active` closure remains until Plan 15-07 ports the deactivate
# endpoint; deactivate logic is unchanged by Plan 15-06.
#
# The role-name → role-id translation that the legacy invite/bulk endpoints
# still perform is now handled inline via `_resolve_role_id_via_repo` (uses
# IRoleRepository.get_by_name). Plan 15-07 will migrate those endpoints to
# `role_id: int` DTOs and remove the resolver entirely.
# ---------------------------------------------------------------------------


def _make_toggle_active(session: AsyncSession):
    async def toggle(user_id: int, is_active: bool) -> None:
        await session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(is_active=is_active)
        )
        await session.commit()
    return toggle


def _resolve_role_id_via_repo(role_repo: IRoleRepository):
    """Phase 15 Plan 15-06 — Pitfall 12 follow-through.

    Returns a (role_name -> Optional[int]) async callable backed by
    IRoleRepository.get_by_name (case-insensitive ILIKE). Used by the legacy
    invite/bulk-invite endpoints until Plan 15-07 migrates their DTOs to
    role_id: int.
    """
    async def resolve(role_name: str) -> Optional[int]:
        role = await role_repo.get_by_name(role_name)
        return role.id if role is not None else None
    return resolve


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/admin/users",
    response_model=AdminUserListResponseDTO,
)
async def list_admin_users(
    role: Optional[AdminRole] = Query(default=None),
    status: Optional[str] = Query(default=None),  # "active" | "inactive"
    q: Optional[str] = Query(default=None),
    limit: Optional[int] = Query(default=None, ge=1, le=1000),
    offset: Optional[int] = Query(default=0, ge=0),
    admin: User = Depends(require_permission("admin.access")),
    user_repo=Depends(get_user_repo),
):
    """Phase 14 Plan 14-03 — admin-scoped user list.

    Richer than `/auth/users` (UserListDTO lacks role + is_active). Returns
    `{items: [{id, email, full_name, role, is_active, ...}], total}` so the
    Users tab can render role badges and status dots directly.

    Filters:
    - `role`     — exact role-name match (Admin / Project Manager / Member).
    - `status`   — "active" / "inactive".
    - `q`        — case-insensitive match on email or full_name.
    - `limit` / `offset` — optional pagination.
    """
    users = await user_repo.get_all()

    # Filter — role / status / q.
    filtered = []
    q_lower = (q or "").strip().lower()
    for u in users:
        if role is not None:
            user_role = u.role.name if u.role else None
            if user_role != role:
                continue
        if status == "active" and not u.is_active:
            continue
        if status == "inactive" and u.is_active:
            continue
        if q_lower:
            if (
                q_lower not in (u.email or "").lower()
                and q_lower not in (u.full_name or "").lower()
            ):
                continue
        filtered.append(u)

    total = len(filtered)
    # Optional pagination.
    if offset:
        filtered = filtered[offset:]
    if limit:
        filtered = filtered[:limit]

    items = [
        AdminUserListItemDTO(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            avatar=u.avatar,
            is_active=u.is_active,
            role=(u.role.name if u.role else None),
            created_at=u.created_at,
        )
        for u in filtered
    ]
    return AdminUserListResponseDTO(items=items, total=total)


@router.post(
    "/admin/users",
    response_model=InviteUserResponseDTO,
    status_code=http_status.HTTP_201_CREATED,
)
async def invite_user(
    dto: InviteUserRequestDTO,
    admin: User = Depends(require_permission("admin.users.invite")),
    user_repo=Depends(get_user_repo),
    pwd_reset_repo=Depends(get_password_reset_repo),
    audit_repo=Depends(get_audit_repo),
    security=Depends(get_security_service),
    role_repo: IRoleRepository = Depends(get_role_repo),
):
    """D-B2 admin invite — creates user(is_active=False) + reset token + audit row.

    Phase 15 Plan 15-06: role-name → id resolution now via IRoleRepository
    (Pitfall 12 follow-through). Plan 15-07 will migrate the DTO to
    `role_id: int`.
    """
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
            role_id_resolver=_resolve_role_id_via_repo(role_repo),
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
    admin: User = Depends(require_permission("admin.users.invite")),
    user_repo=Depends(get_user_repo),
    pwd_reset_repo=Depends(get_password_reset_repo),
    audit_repo=Depends(get_audit_repo),
    security=Depends(get_security_service),
    role_repo: IRoleRepository = Depends(get_role_repo),
):
    """D-B4 bulk invite — 500-row server-side hard cap via Pydantic.

    Phase 15 Plan 15-06: role-name → id resolution via IRoleRepository.
    """
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
        role_id_resolver=_resolve_role_id_via_repo(role_repo),
    )


@router.post("/admin/users/{user_id}/password-reset", status_code=http_status.HTTP_204_NO_CONTENT)
async def reset_user_password(
    user_id: int,
    admin: User = Depends(require_permission("admin.users.invite")),
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
    body: RoleChangeRequestDTO,
    admin: User = Depends(require_permission("admin.users.role_change")),
    user_repo=Depends(get_user_repo),
    role_repo: IRoleRepository = Depends(get_role_repo),
    audit_repo=Depends(get_audit_repo),
):
    """D-A6 system-wide role flip — supports any role_id (system + custom roles).

    Phase 15 Plan 15-06 / D-1.17 — Body migrated from ``{role: AdminRole}``
    string-literal to ``{role_id: int}`` so custom Plan 15-11 roles can be
    assigned. The migrated ChangeUserRoleUseCase injects IRoleRepository
    and enforces the D-2.9 self-edit guard backend-authoritatively (T-15-02).

    Phase 15 Plan 15-07 / D-1.4 — gate migrated from the legacy admin
    decorator to Depends(require_permission('admin.users.role_change')).
    Admin role short-circuits via _is_admin (D-1.5 super-role).
    """
    uc = ChangeUserRoleUseCase(
        user_repo=user_repo,
        role_repo=role_repo,
        audit_repo=audit_repo,
    )
    try:
        await uc.execute(
            target_user_id=user_id,
            role_id=body.role_id,
            admin_id=admin.id,
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail=str(e),
        )
    except RoleNotFoundError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND, detail=str(e),
        )
    except PermissionError as e:
        # D-2.9 self-edit guard — backend-authoritative trust boundary
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail={"error_code": "PERMISSION_DENIED", "message": str(e)},
        )


@router.patch("/admin/users/{user_id}/deactivate", status_code=http_status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: int,
    admin: User = Depends(require_permission("admin.users.deactivate")),
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
    admin: User = Depends(require_permission("admin.users.bulk")),
    user_repo=Depends(get_user_repo),
    role_repo: IRoleRepository = Depends(get_role_repo),
    audit_repo=Depends(get_audit_repo),
    session: AsyncSession = Depends(get_db_session),
):
    """D-B7 per-user transaction; per-user audit row.

    Phase 15 Plan 15-06: ChangeUserRoleUseCase now takes IRoleRepository +
    role_id: int. The bulk-action `payload.role_id` (legacy callers may pass
    `payload.role` string) is normalized via _resolve_role_id_via_repo before
    invoking the use case.

    Phase 15 Plan 15-07 / D-1.16 — gate migrated to
    Depends(require_permission('admin.users.bulk')) (umbrella). The use case
    adds a dynamic per-action sub-perm check (SUB_PERM_MAP) that runs BEFORE
    the per-user loop so a missing sub-perm raises PermissionDeniedError
    without mutating any rows (Pitfall 17 — no partial success). The router
    wires ``_has_permission`` as the DIP-preserving callable injection.
    """
    deactivate_uc = DeactivateUserUseCase(
        user_repo=user_repo,
        audit_repo=audit_repo,
        toggle_active=_make_toggle_active(session),
    )
    role_uc = ChangeUserRoleUseCase(
        user_repo=user_repo,
        role_repo=role_repo,
        audit_repo=audit_repo,
    )
    # D-1.16 — DIP-preserving callable injection. Application layer never
    # imports `_has_permission`; the API layer (which legitimately knows about
    # auth dependencies) wires it at construction time.
    uc = BulkActionUserUseCase(
        deactivate_uc,
        role_uc,
        permission_check=_has_permission,
    )
    try:
        return await uc.execute(
            dto,
            admin_id=admin.id,
            admin_user=admin,
            role_id_resolver=_resolve_role_id_via_repo(role_repo),
        )
    except PermissionDeniedError as exc:
        # D-1.16 sub-perm missing — Pitfall 17 fail-fast before DB.
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "PERMISSION_DENIED",
                "missing_permission": exc.missing_permission,
                "message": (
                    f"Bu işlem için {exc.missing_permission} yetkisi gerekir"
                ),
            },
        )


@router.get("/admin/users.csv")
async def export_users_csv(
    admin: User = Depends(require_permission("admin.access")),
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
