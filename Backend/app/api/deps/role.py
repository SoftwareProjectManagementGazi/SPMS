"""Phase 15 RBAC DI factories (Plan 15-04). Mirrors Backend/app/api/deps/milestone.py shape."""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.permission_repository import IPermissionRepository
from app.domain.repositories.role_permission_repository import IRolePermissionRepository
from app.domain.repositories.role_repository import IRoleRepository
from app.infrastructure.database.database import get_db_session
from app.infrastructure.database.repositories.permission_repo import (
    SqlAlchemyPermissionRepository,
)
from app.infrastructure.database.repositories.role_permission_repo import (
    SqlAlchemyRolePermissionRepository,
)
from app.infrastructure.database.repositories.role_repo import (
    SqlAlchemyRoleRepository,
)


def get_role_repo(
    session: AsyncSession = Depends(get_db_session),
) -> IRoleRepository:
    return SqlAlchemyRoleRepository(session)


def get_permission_repo(
    session: AsyncSession = Depends(get_db_session),
) -> IPermissionRepository:
    return SqlAlchemyPermissionRepository(session)


def get_role_permission_repo(
    session: AsyncSession = Depends(get_db_session),
) -> IRolePermissionRepository:
    return SqlAlchemyRolePermissionRepository(session)


__all__ = [
    "get_role_repo",
    "get_permission_repo",
    "get_role_permission_repo",
]
