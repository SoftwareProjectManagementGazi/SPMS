"""Milestone DI per D-31 / BACK-07 — populated by plan 09-05."""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.database import get_db_session
from app.domain.repositories.milestone_repository import IMilestoneRepository
from app.infrastructure.database.repositories.milestone_repo import SqlAlchemyMilestoneRepository


def get_milestone_repo(session: AsyncSession = Depends(get_db_session)) -> IMilestoneRepository:
    return SqlAlchemyMilestoneRepository(session)


__all__ = ["get_milestone_repo"]
