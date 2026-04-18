from typing import List, Optional
from datetime import date

from app.domain.repositories.report_repository import IReportRepository
from app.application.dtos.report_dtos import (
    SummaryDTO,
    BurndownDTO,
    VelocityDTO,
    DistributionDTO,
    PerformanceDTO,
)


class GetSummaryUseCase:
    def __init__(self, repo: IReportRepository):
        self.repo = repo

    async def execute(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> SummaryDTO:
        return await self.repo.get_summary(project_id, assignee_ids, date_from, date_to)


class GetBurndownUseCase:
    def __init__(self, repo: IReportRepository):
        self.repo = repo

    async def execute(
        self,
        project_id: int,
        sprint_id: Optional[int],
    ) -> BurndownDTO:
        return await self.repo.get_burndown(project_id, sprint_id)


class GetVelocityUseCase:
    def __init__(self, repo: IReportRepository):
        self.repo = repo

    async def execute(
        self,
        project_id: int,
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> VelocityDTO:
        return await self.repo.get_velocity(project_id, date_from, date_to)


class GetDistributionUseCase:
    def __init__(self, repo: IReportRepository):
        self.repo = repo

    async def execute(
        self,
        project_id: int,
        group_by: str,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> DistributionDTO:
        return await self.repo.get_distribution(project_id, group_by, assignee_ids, date_from, date_to)


class GetPerformanceUseCase:
    def __init__(self, repo: IReportRepository):
        self.repo = repo

    async def execute(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> PerformanceDTO:
        return await self.repo.get_performance(project_id, assignee_ids, date_from, date_to)
