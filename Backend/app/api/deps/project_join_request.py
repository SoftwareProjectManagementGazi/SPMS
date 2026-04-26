"""Phase 14 Plan 14-01 — ProjectJoinRequest repository DI factory.

Mirror of `app.api.deps.audit` (18 lines). Legacy import path
`from app.api.dependencies import get_project_join_request_repo` works via the
shim in dependencies.py.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.project_join_request_repository import (
    IProjectJoinRequestRepository,
)
from app.infrastructure.database.repositories.project_join_request_repo import (
    SqlAlchemyProjectJoinRequestRepository,
)


def get_project_join_request_repo(
    session: AsyncSession = Depends(get_db_session),
) -> IProjectJoinRequestRepository:
    return SqlAlchemyProjectJoinRequestRepository(session)


__all__ = ["get_project_join_request_repo"]
