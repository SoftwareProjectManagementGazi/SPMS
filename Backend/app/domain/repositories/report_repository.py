from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import date
from app.application.dtos.report_dtos import (
    SummaryDTO, BurndownDTO, VelocityDTO,
    DistributionDTO, PerformanceDTO, TaskExportRowDTO,
)


class IReportRepository(ABC):
    @abstractmethod
    async def get_summary(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> SummaryDTO: ...

    @abstractmethod
    async def get_burndown(
        self,
        project_id: int,
        sprint_id: Optional[int],
    ) -> BurndownDTO: ...

    @abstractmethod
    async def get_velocity(
        self,
        project_id: int,
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> VelocityDTO: ...

    @abstractmethod
    async def get_distribution(
        self,
        project_id: int,
        group_by: str,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> DistributionDTO: ...

    @abstractmethod
    async def get_performance(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> PerformanceDTO: ...

    @abstractmethod
    async def get_tasks_for_export(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> List[TaskExportRowDTO]: ...
