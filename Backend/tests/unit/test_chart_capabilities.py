"""Reports migration v2 (Strategy D) — capability rule registry + use case unit tests.

Pure-function tests, no DB dependency. Lives under tests/unit/ so the default
``pytest`` invocation (which skips ``requires_db`` when Postgres is down) still
exercises the rule registry contract.

Covers:
  - Rule registry resolves correct booleans per project shape.
  - Registry exposes the expected chart name set.
  - GetChartCapabilitiesUseCase wires repo inputs through the rule registry.
  - GetProjectPhaseProgressUseCase zips workflow nodes with task aggregates.
  - GetProjectIterationUseCase is methodology-agnostic (Strategy D refactor).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import pytest

from app.application.use_cases.get_chart_capabilities import GetChartCapabilitiesUseCase
from app.application.use_cases.get_project_iteration import GetProjectIterationUseCase
from app.application.use_cases.get_project_phase_progress import (
    GetProjectPhaseProgressUseCase,
)
from app.domain.exceptions import ProjectNotFoundError
from app.domain.services.chart_applicability import (
    CHART_CAPABILITY_RULES,
    CapabilityInputs,
    chart_capabilities,
)


# ---------------------------------------------------------------------------
# In-memory fakes (Phase 12 D-09 pattern)
# ---------------------------------------------------------------------------


@dataclass
class _FakeProject:
    id: int
    methodology: str = "SCRUM"
    process_config: Optional[dict] = None


class _FakeProjectRepo:
    def __init__(
        self,
        project: Optional[_FakeProject],
        capability_inputs: Optional[CapabilityInputs] = None,
    ):
        self._project = project
        self._capability_inputs = capability_inputs or CapabilityInputs(
            sprint_count=0,
            closed_sprint_count=0,
            phase_node_count=0,
            column_count=0,
            member_count=0,
            has_all_categories=False,
        )

    async def get_by_id(self, project_id: int):
        if self._project is None or self._project.id != project_id:
            return None
        return self._project

    async def get_capability_inputs(self, project_id: int) -> CapabilityInputs:
        return self._capability_inputs


class _FakeAuditRepo:
    def __init__(self, iteration_data: Optional[List[dict]] = None):
        self._iteration_data = iteration_data or []

    async def get_iteration_data(self, project_id: int, count: int) -> List[dict]:
        return list(self._iteration_data[:count])


class _FakeReportRepo:
    def __init__(self, phase_progress: Optional[List[dict]] = None):
        self._phase_progress = phase_progress or []

    async def get_phase_progress(self, project_id: int) -> List[dict]:
        return list(self._phase_progress)


# ---------------------------------------------------------------------------
# Rule registry
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "inputs,expected",
    [
        # Scrum-like: sprints + categorised columns
        (
            CapabilityInputs(
                sprint_count=3, closed_sprint_count=2, phase_node_count=0,
                column_count=4, member_count=5, has_all_categories=True,
            ),
            {"burndown": True, "iteration": True, "cfd": True, "lead_cycle": True,
             "phase_progress": False, "team_load": True, "summary": True},
        ),
        # Kanban-like: no sprints, has all categories
        (
            CapabilityInputs(
                sprint_count=0, closed_sprint_count=0, phase_node_count=0,
                column_count=3, member_count=4, has_all_categories=True,
            ),
            {"burndown": False, "iteration": False, "cfd": True, "lead_cycle": True,
             "phase_progress": False, "team_load": True, "summary": True},
        ),
        # Waterfall-like: phase nodes, no sprints
        (
            CapabilityInputs(
                sprint_count=0, closed_sprint_count=0, phase_node_count=5,
                column_count=2, member_count=3, has_all_categories=False,
            ),
            {"burndown": False, "iteration": False, "cfd": False, "lead_cycle": True,
             "phase_progress": True, "team_load": True, "summary": True},
        ),
        # Empty project
        (
            CapabilityInputs(
                sprint_count=0, closed_sprint_count=0, phase_node_count=0,
                column_count=0, member_count=0, has_all_categories=False,
            ),
            {"burndown": False, "iteration": False, "cfd": False, "lead_cycle": True,
             "phase_progress": False, "team_load": False, "summary": True},
        ),
        # Hybrid: sprints + phase nodes + categories — everything on
        (
            CapabilityInputs(
                sprint_count=2, closed_sprint_count=1, phase_node_count=4,
                column_count=5, member_count=6, has_all_categories=True,
            ),
            {"burndown": True, "iteration": True, "cfd": True, "lead_cycle": True,
             "phase_progress": True, "team_load": True, "summary": True},
        ),
    ],
)
def test_chart_capability_rules_per_project_shape(inputs, expected):
    """Rule registry resolves every chart's gate from CapabilityInputs only.
    Methodology enum is never consulted (Strategy D)."""
    fake_project = _FakeProject(id=42, methodology="ANYTHING")
    result = chart_capabilities(fake_project, inputs)
    assert result == expected


def test_chart_capability_registry_covers_expected_charts():
    """Hardlock the chart name set so dropping a chart is a deliberate edit."""
    assert set(CHART_CAPABILITY_RULES) == {
        "burndown", "iteration", "cfd", "lead_cycle",
        "phase_progress", "team_load", "summary",
    }


# ---------------------------------------------------------------------------
# GetChartCapabilitiesUseCase
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_chart_capabilities_use_case_returns_dict():
    inputs = CapabilityInputs(
        sprint_count=2, closed_sprint_count=1, phase_node_count=3,
        column_count=4, member_count=5, has_all_categories=True,
    )
    use_case = GetChartCapabilitiesUseCase(
        project_repo=_FakeProjectRepo(
            _FakeProject(id=42, methodology="SCRUM"),
            capability_inputs=inputs,
        ),
    )
    caps = await use_case.execute(project_id=42)
    assert caps["burndown"] is True
    assert caps["iteration"] is True
    assert caps["cfd"] is True
    assert caps["phase_progress"] is True
    assert caps["lead_cycle"] is True
    assert caps["team_load"] is True
    assert caps["summary"] is True


@pytest.mark.asyncio
async def test_get_chart_capabilities_raises_on_unknown_project():
    use_case = GetChartCapabilitiesUseCase(project_repo=_FakeProjectRepo(project=None))
    with pytest.raises(ProjectNotFoundError):
        await use_case.execute(project_id=999)


# ---------------------------------------------------------------------------
# GetProjectIterationUseCase — Strategy D: no methodology check
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_iteration_empty_when_no_sprints():
    """Strategy D: no sprints = empty result, NOT 422."""
    use_case = GetProjectIterationUseCase(audit_repo=_FakeAuditRepo(iteration_data=[]))
    result = await use_case.execute(project_id=42, count=4)
    assert result.sprints == []


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "methodology",
    ["SCRUM", "KANBAN", "WATERFALL", "ITERATIVE", "INCREMENTAL", "EVOLUTIONARY", "RAD"],
)
async def test_iteration_returns_data_for_any_methodology_with_sprints(methodology):
    """Strategy D: methodology never gates iteration. Any project with sprint
    records gets data; gating is FE-side via /chart-capabilities."""
    sprints = [{"id": 1, "name": "Sprint 1", "planned": 10, "completed": 8, "carried": 2}]
    use_case = GetProjectIterationUseCase(audit_repo=_FakeAuditRepo(iteration_data=sprints))
    result = await use_case.execute(project_id=42, count=4)
    assert len(result.sprints) == 1


@pytest.mark.asyncio
async def test_iteration_count_validation_still_fires():
    """count must be in {3, 4, 6} — only validation kept from the legacy use case."""
    use_case = GetProjectIterationUseCase(audit_repo=_FakeAuditRepo())
    with pytest.raises(ValueError):
        await use_case.execute(project_id=42, count=5)


# ---------------------------------------------------------------------------
# GetProjectPhaseProgressUseCase
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_phase_progress_returns_empty_when_no_workflow_nodes():
    project = _FakeProject(id=42, process_config=None)
    use_case = GetProjectPhaseProgressUseCase(
        project_repo=_FakeProjectRepo(project),
        report_repo=_FakeReportRepo(),
    )
    result = await use_case.execute(project_id=42)
    assert result.phases == []


@pytest.mark.asyncio
async def test_phase_progress_preserves_node_order_and_zips_aggregates():
    process_config = {
        "phase_workflow": {
            "nodes": [
                {"id": "design", "name": "Design"},
                {"id": "build", "name": "Build"},
                {"id": "test", "name": "Test"},  # no tasks — should still appear
            ],
        },
    }
    project = _FakeProject(id=42, process_config=process_config)
    aggregates = [
        {"phase_id": "build", "total": 5, "done": 2, "in_progress": 2, "todo": 1},
        {"phase_id": "design", "total": 3, "done": 3, "in_progress": 0, "todo": 0},
    ]
    use_case = GetProjectPhaseProgressUseCase(
        project_repo=_FakeProjectRepo(project),
        report_repo=_FakeReportRepo(phase_progress=aggregates),
    )
    result = await use_case.execute(project_id=42)
    assert [p.id for p in result.phases] == ["design", "build", "test"]
    assert result.phases[0].done == 3  # Design: all done
    assert result.phases[1].in_progress == 2  # Build: 2 in progress
    assert result.phases[2].total == 0  # Test: no tasks but card slot reserved


@pytest.mark.asyncio
async def test_phase_progress_skips_archived_nodes():
    process_config = {
        "phase_workflow": {
            "nodes": [
                {"id": "design", "name": "Design"},
                {"id": "old", "name": "Old phase", "archived": True},
                {"id": "build", "name": "Build"},
            ],
        },
    }
    project = _FakeProject(id=42, process_config=process_config)
    use_case = GetProjectPhaseProgressUseCase(
        project_repo=_FakeProjectRepo(project),
        report_repo=_FakeReportRepo(),
    )
    result = await use_case.execute(project_id=42)
    assert [p.id for p in result.phases] == ["design", "build"]


@pytest.mark.asyncio
async def test_phase_progress_raises_on_unknown_project():
    use_case = GetProjectPhaseProgressUseCase(
        project_repo=_FakeProjectRepo(project=None),
        report_repo=_FakeReportRepo(),
    )
    with pytest.raises(ProjectNotFoundError):
        await use_case.execute(project_id=999)
