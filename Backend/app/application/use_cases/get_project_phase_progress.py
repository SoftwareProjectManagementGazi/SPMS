"""Reports migration v2 (Strategy D) — phase progress aggregation use case.

Produces the data shown by the ``Phase Progress`` chart on the Reports page:
a horizontal step strip where each phase node (declared in
``project.process_config['phase_workflow']['nodes']``) shows its task
breakdown by column category (todo / in_progress / done).

Methodology-agnostic by design — any project that has phase workflow nodes
gets meaningful visualization, including Waterfall and custom workflows
that don't fit the legacy SCRUM/KANBAN binary.

DIP: only domain repository interfaces + DTOs imported. No SQLAlchemy.
"""
from typing import Any, Dict, List

from app.application.dtos.chart_dtos import (
    PhaseProgressEntryDTO,
    PhaseProgressResponseDTO,
)
from app.domain.exceptions import ProjectNotFoundError
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.report_repository import IReportRepository


class GetProjectPhaseProgressUseCase:
    """Aggregate task counts per workflow phase node.

    Reads the project's ``phase_workflow.nodes`` for ordering + display labels,
    then asks the report repository for the per-``phase_id`` task aggregates.
    Zips them together so the response preserves the workflow's declared
    node order even when some phases have zero tasks (the chart still shows
    the empty cell so users can see the missing-work signal).
    """

    def __init__(
        self,
        project_repo: IProjectRepository,
        report_repo: IReportRepository,
    ):
        self.project_repo = project_repo
        self.report_repo = report_repo

    async def execute(self, project_id: int) -> PhaseProgressResponseDTO:
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise ProjectNotFoundError(project_id)

        nodes = self._extract_phase_nodes(project.process_config)
        if not nodes:
            # Capability gate (caps.phase_progress) will be False on the FE,
            # so this empty response should only land if the FE bypassed the
            # gate. Return empty list rather than 422 — empty != invalid.
            return PhaseProgressResponseDTO(phases=[])

        aggregates = await self.report_repo.get_phase_progress(project_id)
        agg_by_id: Dict[str, Dict[str, Any]] = {
            row["phase_id"]: row for row in aggregates if row.get("phase_id")
        }

        entries: List[PhaseProgressEntryDTO] = []
        for order, node in enumerate(nodes):
            node_id = str(node.get("id") or "")
            if not node_id:
                continue
            agg = agg_by_id.get(node_id, {})
            entries.append(
                PhaseProgressEntryDTO(
                    id=node_id,
                    name=str(node.get("name") or node.get("label") or node_id),
                    order=order,
                    total=int(agg.get("total") or 0),
                    done=int(agg.get("done") or 0),
                    in_progress=int(agg.get("in_progress") or 0),
                    todo=int(agg.get("todo") or 0),
                )
            )

        return PhaseProgressResponseDTO(phases=entries)

    @staticmethod
    def _extract_phase_nodes(process_config: Dict[str, Any] | None) -> List[Dict[str, Any]]:
        """Resolve ``process_config.phase_workflow.nodes`` defensively.

        Returns empty list on any of: None config, missing keys, non-list
        nodes, archived-only nodes. Skipping archived nodes mirrors the
        ``phase_reports`` validator in ``manage_phase_reports._validate_phase_in_workflow``.
        """
        if not process_config or not isinstance(process_config, dict):
            return []
        phase_workflow = process_config.get("phase_workflow")
        if not isinstance(phase_workflow, dict):
            return []
        nodes = phase_workflow.get("nodes")
        if not isinstance(nodes, list):
            return []
        return [
            n for n in nodes
            if isinstance(n, dict) and not n.get("archived")
        ]
