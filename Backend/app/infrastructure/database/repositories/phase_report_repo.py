"""BACK-06 SqlAlchemyPhaseReportRepository."""
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.phase_report import PhaseReport
from app.domain.repositories.phase_report_repository import IPhaseReportRepository
from app.infrastructure.database.models.phase_report import PhaseReportModel


class SqlAlchemyPhaseReportRepository(IPhaseReportRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, m: PhaseReportModel) -> PhaseReport:
        return PhaseReport.model_validate(m)

    def _to_model(self, e: PhaseReport) -> PhaseReportModel:
        data = e.model_dump(exclude={"id", "created_at", "updated_at"})
        return PhaseReportModel(**data)

    def _base_query(self):
        return select(PhaseReportModel).where(PhaseReportModel.is_deleted == False)  # noqa: E712

    async def create(self, report: PhaseReport) -> PhaseReport:
        model = self._to_model(report)
        self.session.add(model)
        await self.session.flush()
        return await self.get_by_id(model.id)  # type: ignore

    async def get_by_id(self, report_id: int) -> Optional[PhaseReport]:
        stmt = self._base_query().where(PhaseReportModel.id == report_id)
        result = await self.session.execute(stmt)
        m = result.scalar_one_or_none()
        return self._to_entity(m) if m else None

    async def list_by_project(self, project_id: int) -> List[PhaseReport]:
        stmt = self._base_query().where(PhaseReportModel.project_id == project_id).order_by(desc(PhaseReportModel.created_at))
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_by_phase(self, project_id: int, phase_id: str) -> List[PhaseReport]:
        stmt = (
            self._base_query()
            .where(PhaseReportModel.project_id == project_id)
            .where(PhaseReportModel.phase_id == phase_id)
            .order_by(desc(PhaseReportModel.cycle_number))
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_latest_by_project_phase(
        self, project_id: int, phase_id: str
    ) -> Optional[PhaseReport]:
        stmt = (
            self._base_query()
            .where(PhaseReportModel.project_id == project_id)
            .where(PhaseReportModel.phase_id == phase_id)
            .order_by(desc(PhaseReportModel.cycle_number))
            .limit(1)
        )
        result = await self.session.execute(stmt)
        m = result.scalar_one_or_none()
        return self._to_entity(m) if m else None

    async def update(self, report: PhaseReport) -> PhaseReport:
        stmt = self._base_query().where(PhaseReportModel.id == report.id)
        result = await self.session.execute(stmt)
        m = result.scalar_one_or_none()
        if m is None:
            raise ValueError(f"PhaseReport {report.id} not found for update")
        # Apply all fields except id/created_at/audit cols
        data = report.model_dump(exclude={"id", "created_at", "updated_at", "is_deleted", "deleted_at"})
        for k, v in data.items():
            setattr(m, k, v)
        m.updated_at = datetime.utcnow()
        await self.session.flush()
        return self._to_entity(m)

    async def delete(self, report_id: int) -> bool:
        stmt = self._base_query().where(PhaseReportModel.id == report_id)
        result = await self.session.execute(stmt)
        m = result.scalar_one_or_none()
        if m is None:
            return False
        m.is_deleted = True
        m.deleted_at = datetime.utcnow()
        await self.session.flush()
        return True
