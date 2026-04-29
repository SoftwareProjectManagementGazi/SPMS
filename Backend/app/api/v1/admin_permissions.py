"""Phase 15 RBAC-05 — /api/v1/admin/permissions list + matrix router (Plan 15-06).

3 endpoints:
- GET    /admin/permissions               list 38 perms (List[PermissionResponseDTO])
- GET    /admin/permissions/matrix        full {roles, permissions, cells}
- PATCH  /admin/permissions/matrix        per-cell auto-save (D-1.12)

Gating:
- GET /admin/permissions → require_permission('admin.access')
- GET /admin/permissions/matrix → require_permission('permission.matrix.update')
  (matrix view is the surface that drives the PATCH endpoint; gate consistency)
- PATCH /admin/permissions/matrix → require_permission('permission.matrix.update')

Error envelope (Phase 9 D-09 taxonomy):
- RoleNotFoundError       → 404 (str detail)
- SystemRoleProtectedError → 422 {error_code, role_name}    (D-1.5 Admin readonly)
- PermissionDeniedError   → 422 {error_code, perm_key}      (unknown perm key)
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps.audit import get_audit_repo
from app.api.deps.auth import require_permission
from app.api.deps.role import (
    get_permission_repo,
    get_role_permission_repo,
    get_role_repo,
)
from app.application.dtos.permission_dtos import (
    PermissionMatrixResponseDTO,
    PermissionResponseDTO,
    UpdateMatrixCellRequestDTO,
)
from app.application.use_cases.get_permission_matrix import GetPermissionMatrixUseCase
from app.application.use_cases.list_permissions import ListPermissionsUseCase
from app.application.use_cases.update_permission_matrix import (
    UpdatePermissionMatrixUseCase,
)
from app.domain.entities.user import User
from app.domain.exceptions import (
    PermissionDeniedError,
    RoleNotFoundError,
    SystemRoleProtectedError,
)
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.permission_repository import IPermissionRepository
from app.domain.repositories.role_permission_repository import IRolePermissionRepository
from app.domain.repositories.role_repository import IRoleRepository

router = APIRouter(prefix="/admin/permissions", tags=["admin-permissions"])


@router.get("", response_model=List[PermissionResponseDTO])
async def list_permissions(
    scope: Optional[str] = None,
    perm_repo: IPermissionRepository = Depends(get_permission_repo),
    _user: User = Depends(require_permission("admin.access")),
):
    """List all 38 permissions (Migration 007 seed).

    Optional ?scope=system|project filter.
    """
    use_case = ListPermissionsUseCase(perm_repo)
    return await use_case.execute(scope=scope)


@router.get("/matrix", response_model=PermissionMatrixResponseDTO)
async def get_matrix(
    role_repo: IRoleRepository = Depends(get_role_repo),
    perm_repo: IPermissionRepository = Depends(get_permission_repo),
    role_perm_repo: IRolePermissionRepository = Depends(get_role_permission_repo),
    _user: User = Depends(require_permission("permission.matrix.update")),
):
    """Composite hydration — frontend renders the full matrix from this single
    response (Plan 15-09 prep). Cells contain only granted=true rows; absence
    implies revoked.
    """
    use_case = GetPermissionMatrixUseCase(role_repo, perm_repo, role_perm_repo)
    return await use_case.execute()


@router.patch("/matrix", status_code=status.HTTP_204_NO_CONTENT)
async def update_matrix_cell(
    body: UpdateMatrixCellRequestDTO,
    role_repo: IRoleRepository = Depends(get_role_repo),
    perm_repo: IPermissionRepository = Depends(get_permission_repo),
    role_perm_repo: IRolePermissionRepository = Depends(get_role_permission_repo),
    audit_repo: IAuditRepository = Depends(get_audit_repo),
    current_user: User = Depends(require_permission("permission.matrix.update")),
):
    """D-1.12 — per-cell auto-save. Body: {role_id, perm_key, granted}.

    Errors:
    - Unknown role_id → 404
    - role.name == 'admin' (D-1.5 super-role) → 422 SYSTEM_ROLE_PROTECTED
    - Unknown perm_key → 422 PERMISSION_NOT_FOUND
    """
    use_case = UpdatePermissionMatrixUseCase(
        role_repo, perm_repo, role_perm_repo, audit_repo
    )
    try:
        await use_case.execute(
            role_id=body.role_id,
            perm_key=body.perm_key,
            granted=body.granted,
            admin_id=current_user.id,
        )
    except RoleNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except SystemRoleProtectedError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "SYSTEM_ROLE_PROTECTED",
                "role_id": e.role_id,
                "role_name": e.role_name,
            },
        )
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "PERMISSION_NOT_FOUND",
                "perm_key": e.missing_permission,
            },
        )
    return None
