"""Reports migration v2 (Strategy D) — chart capability resolution use case.

Single Responsibility (CLAUDE.md §4.1 S): for one project, return the
per-chart visibility booleans. Backend is the single source of truth;
Frontend2 ``hooks/use-chart-capabilities`` consumes this endpoint and
never mirrors the rule definitions client-side.

DIP: only domain repository interfaces + domain services imported.
"""
from typing import Dict

from app.domain.entities.project import Project
from app.domain.exceptions import ProjectNotFoundError
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.services.chart_applicability import chart_capabilities


class GetChartCapabilitiesUseCase:
    """Resolve per-chart visibility flags for a project.

    Single round trip to the repository — ``get_capability_inputs`` aggregates
    all 6 inputs (sprint counts, column categories, member count, phase nodes)
    via scalar subqueries in one query. The rule registry then maps each
    chart name to a boolean.
    """

    def __init__(self, project_repo: IProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int) -> Dict[str, bool]:
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(project_id)
        inputs = await self.project_repo.get_capability_inputs(project_id)
        return chart_capabilities(project, inputs)
