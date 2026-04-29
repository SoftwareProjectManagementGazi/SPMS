"""Authentication DI: oauth2_scheme, get_current_user, role checks.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.infrastructure.database.database import get_db_session
from app.infrastructure.config import settings
from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.api.deps.user import get_user_repo  # cross-sub-module: auth needs user repo

# Re-export get_db for backward compat (used by tasks.py via get_db)
get_db = get_db_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: IUserRepository = Depends(get_user_repo),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await user_repo.get_by_email(email)
    if user is None:
        raise credentials_exception

    # Phase 15 RBAC-02 (Plan 15-06) — JWT permissions[] claim → User.permissions.
    # Pitfall 9 / R-02 backwards-compat: stale pre-Phase 15 tokens have no
    # `permissions` claim; payload.get(..., []) defaults to empty list. Existing
    # Admin users keep working via _is_admin(user) short-circuit in
    # _has_permission (Admin super-role bypasses the empty list).
    user.permissions = list(payload.get("permissions") or [])
    return user


def _is_admin(user: User) -> bool:
    """Return True when the user holds the admin role."""
    return (
        user.role is not None
        and user.role.name.lower() == "admin"
    )


def _is_project_manager(user: User) -> bool:
    return (
        user.role is not None
        and user.role.name.lower() == "project manager"
    )


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Raises HTTP 403 if the current user is not an admin."""
    if not _is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def require_admin_or_project_manager(
    current_user: User = Depends(get_current_user),
) -> User:
    """Raises HTTP 403 if the user is neither admin nor project manager."""
    if not (_is_admin(current_user) or _is_project_manager(current_user)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Project Manager role required",
        )
    return current_user


# ---------------------------------------------------------------------------
# Phase 15 RBAC-02 (Plan 15-06) — perm DSL primitives
# ---------------------------------------------------------------------------


def _has_permission(user: User, key: str) -> bool:
    """Phase 15 D-1.5 + D-1.10 — Admin super-role short-circuit, then JWT-claim lookup.

    Reads ``user.permissions`` which is JWT-derived in :func:`get_current_user`
    (no DB hit per D-1.10). Defends against ``None`` via ``user.permissions or []``
    per Pitfall 18.

    Order of checks:
    1. ``_is_admin(user)`` — Admin role.name.lower() == "admin" → True.
       Even if matrix wiped, super-role kicks in (T-15-04 last-admin lockout
       mitigation).
    2. ``key in user.permissions`` — claim-derived membership lookup.
    """
    if _is_admin(user):
        return True
    return key in (user.permissions or [])


def require_permission(key: str):
    """Phase 15 D-1.4 / D-1.11 — Returns a Depends-compatible callable that
    enforces a single permission key.

    On failure raises ``HTTPException(403, detail={...})`` with the Phase 9
    D-09 error_code envelope::

        {
            "error_code": "PERMISSION_DENIED",
            "missing_permission": "<key>",
            "message": "Bu işlem için <key> yetkisi gerekir"
        }

    Usage::

        @router.post("/projects/{project_id}/milestones")
        async def create(
            ...,
            _perm: User = Depends(require_permission("milestone.create")),  # tier 1 perm DSL
            _auth: User = Depends(require_project_transition_authority),    # tier 2 (Phase 9 D-15)
        ):
            ...

    The closure captures ``key`` so each call site gets its own checker. The
    inner ``_checker`` re-uses :func:`get_current_user`'s caching so the JWT
    is only decoded once per request even when stacked with other auth deps.
    """

    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if not _has_permission(current_user, key):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "PERMISSION_DENIED",
                    "missing_permission": key,
                    "message": f"Bu işlem için {key} yetkisi gerekir",
                },
            )
        return current_user

    return _checker


__all__ = [
    "oauth2_scheme",
    "get_db",
    "get_current_user",
    "_is_admin",
    "_is_project_manager",
    "require_admin",
    "require_admin_or_project_manager",
    "_has_permission",
    "require_permission",
]


# ---------------------------------------------------------------------------
# Phase 9 D-15: require_project_transition_authority
# ---------------------------------------------------------------------------
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.team_repository import ITeamRepository
from app.api.deps.project import get_project_repo
from app.api.deps.team import get_team_repo


async def require_project_transition_authority(
    project_id: int,
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    team_repo: ITeamRepository = Depends(get_team_repo),
) -> User:
    """D-15: passes if Admin OR project.manager_id == user.id OR user_leads_any_team_on_project.

    Raises HTTP 403 otherwise, HTTP 404 if project does not exist.

    Used by: Phase Gate (API-01), Milestone POST/PATCH/DELETE (API-07, D-35),
    Artifact POST/DELETE (API-08, D-36), PhaseReport POST/PATCH/DELETE (API-09, D-37),
    and PATCH /teams/{id}/leader_id (D-17 — Admin only variant uses require_admin directly).
    """
    if _is_admin(current_user):
        return current_user
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    if project.manager_id == current_user.id:
        return current_user
    if await team_repo.user_leads_any_team_on_project(current_user.id, project_id):
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Phase transition authority required (Admin, Project Manager, or Team Leader)",
    )


__all__ = __all__ + ["require_project_transition_authority"]  # type: ignore
