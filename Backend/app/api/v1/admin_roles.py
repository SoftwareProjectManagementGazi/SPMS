"""Phase 15 RBAC-05 — /api/v1/admin/roles CRUD router (Plan 15-06).

4 endpoints, every handler gated by Depends(require_permission('admin.access')):
- GET    /admin/roles            list  (RoleListResponseDTO)
- POST   /admin/roles            create (RoleResponseDTO; 201)
- PATCH  /admin/roles/{id}       update (RoleResponseDTO)
- DELETE /admin/roles/{id}       delete (204; Member fallback transaction)

Error envelope (Phase 9 D-09 taxonomy):
- ROLE_NAME_INVALID    → 422 {error_code, name, reason}
- SYSTEM_ROLE_PROTECTED → 422 {error_code, role_id, role_name}
- RoleNotFoundError    → 404 (str detail)

Design references:
- D-1.4: gate via require_permission('admin.access')
- D-2.2: DeleteRoleUseCase Member fallback (1 role.deleted + N user.role_changed audit)
- D-2.3: System role PATCH/DELETE protection (T-15-03 mitigation)
- D-2.6: Reserved-name rejection (T-15-07 mitigation, case-insensitive)
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps.audit import get_audit_repo
from app.api.deps.auth import require_permission
from app.api.deps.role import get_role_permission_repo, get_role_repo
from app.api.deps.user import get_user_repo
from app.application.dtos.role_dtos import (
    RoleCreateDTO,
    RoleListResponseDTO,
    RoleResponseDTO,
    RoleUpdateDTO,
)
from app.application.use_cases.create_role import CreateRoleUseCase
from app.application.use_cases.delete_role import DeleteRoleUseCase
from app.application.use_cases.list_roles import ListRolesUseCase
from app.application.use_cases.update_role import UpdateRoleUseCase
from app.domain.entities.user import User
from app.domain.exceptions import (
    RoleNameInvalidError,
    RoleNotFoundError,
    SystemRoleProtectedError,
)
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.role_permission_repository import IRolePermissionRepository
from app.domain.repositories.role_repository import IRoleRepository
from app.domain.repositories.user_repository import IUserRepository

router = APIRouter(prefix="/admin/roles", tags=["admin-roles"])


@router.get("", response_model=RoleListResponseDTO)
async def list_roles(
    role_repo: IRoleRepository = Depends(get_role_repo),
    _user: User = Depends(require_permission("admin.access")),
):
    """List all roles (system + custom). Frontend hydrates the role-cards grid
    from this in a single network call.
    """
    use_case = ListRolesUseCase(role_repo)
    return await use_case.execute()


@router.post(
    "",
    response_model=RoleResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_role(
    body: RoleCreateDTO,
    role_repo: IRoleRepository = Depends(get_role_repo),
    audit_repo: IAuditRepository = Depends(get_audit_repo),
    current_user: User = Depends(require_permission("admin.access")),
):
    """Create a custom role (is_system_role=False forced by use case).

    Validation:
    - Reserved name (D-2.6) → 422 ROLE_NAME_INVALID reason='reserved'
    - Duplicate name (case-insensitive) → 422 ROLE_NAME_INVALID reason='duplicate'
    """
    use_case = CreateRoleUseCase(role_repo, audit_repo)
    try:
        return await use_case.execute(body, admin_id=current_user.id)
    except RoleNameInvalidError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "ROLE_NAME_INVALID",
                "name": e.name,
                "reason": e.reason,
            },
        )


@router.patch("/{role_id}", response_model=RoleResponseDTO)
async def update_role(
    role_id: int,
    body: RoleUpdateDTO,
    role_repo: IRoleRepository = Depends(get_role_repo),
    audit_repo: IAuditRepository = Depends(get_audit_repo),
    current_user: User = Depends(require_permission("admin.access")),
):
    """Update a custom role (system roles rejected with 422 SYSTEM_ROLE_PROTECTED)."""
    use_case = UpdateRoleUseCase(role_repo, audit_repo)
    try:
        return await use_case.execute(role_id, body, admin_id=current_user.id)
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
    except RoleNameInvalidError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "ROLE_NAME_INVALID",
                "name": e.name,
                "reason": e.reason,
            },
        )


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    role_repo: IRoleRepository = Depends(get_role_repo),
    role_perm_repo: IRolePermissionRepository = Depends(get_role_permission_repo),
    user_repo: IUserRepository = Depends(get_user_repo),
    audit_repo: IAuditRepository = Depends(get_audit_repo),
    current_user: User = Depends(require_permission("admin.access")),
):
    """Delete a custom role (D-2.2 Member fallback transaction).

    Steps inside DeleteRoleUseCase (single transaction via shared session):
    1. Reject system roles → 422 SYSTEM_ROLE_PROTECTED
    2. UPDATE users SET role_id=member.id WHERE role_id=target.id
    3. DELETE FROM role_permissions WHERE role_id=target.id
    4. DELETE FROM roles WHERE id=target.id
    5. Emit 1 role.deleted + N user.role_changed audit rows
    """
    use_case = DeleteRoleUseCase(role_repo, role_perm_repo, user_repo, audit_repo)
    try:
        await use_case.execute(role_id, admin_id=current_user.id)
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
    return None
