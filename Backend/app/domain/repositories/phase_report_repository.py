"""BACK-06 IPhaseReportRepository interface."""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.phase_report import PhaseReport


class IPhaseReportRepository(ABC):
    @abstractmethod
    async def create(self, report: PhaseReport) -> PhaseReport: ...

    @abstractmethod
    async def get_by_id(self, report_id: int) -> Optional[PhaseReport]: ...

    @abstractmethod
    async def list_by_project(self, project_id: int) -> List[PhaseReport]: ...

    @abstractmethod
    async def list_by_phase(self, project_id: int, phase_id: str) -> List[PhaseReport]:
        """All cycles / revisions for a specific phase in a project."""
        ...

    @abstractmethod
    async def get_latest_by_project_phase(
        self, project_id: int, phase_id: str
    ) -> Optional[PhaseReport]:
        """Highest cycle_number. Returns None if absent."""
        ...

    @abstractmethod
    async def update(self, report: PhaseReport) -> PhaseReport: ...

    @abstractmethod
    async def delete(self, report_id: int) -> bool:
        """Soft-delete."""
        ...
