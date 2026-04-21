"""Team repository DI factory.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.team_repository import ITeamRepository
from app.infrastructure.database.repositories.team_repo import SqlAlchemyTeamRepository


def get_team_repo(session: AsyncSession = Depends(get_db_session)) -> ITeamRepository:
    return SqlAlchemyTeamRepository(session)


__all__ = ["get_team_repo"]
