"""PhaseReport DI per D-31 / BACK-07."""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.database import get_db_session
from app.domain.repositories.phase_report_repository import IPhaseReportRepository
from app.infrastructure.database.repositories.phase_report_repo import SqlAlchemyPhaseReportRepository


def get_phase_report_repo(session: AsyncSession = Depends(get_db_session)) -> IPhaseReportRepository:
    return SqlAlchemyPhaseReportRepository(session)


__all__ = ["get_phase_report_repo"]
