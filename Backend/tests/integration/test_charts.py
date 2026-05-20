"""Phase 13 Plan 13-01 Task 1 — chart use case tests (in-memory fakes).

Pattern: Phase 12 D-09 in-memory fakes. No DB dependency, runs in <0.1s per test.
Covers chart use cases (CFD / Lead-Cycle / Iteration) + project-activity
SQL broadening regression + chart_applicability strategy.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import List, Optional, Tuple
import pytest

from app.application.use_cases.get_project_cfd import GetProjectCFDUseCase
from app.application.use_cases.get_project_lead_cycle import GetProjectLeadCycleUseCase
from app.application.use_cases.get_project_iteration import GetProjectIterationUseCase
from app.application.use_cases.get_chart_capabilities import GetChartCapabilitiesUseCase
from app.application.use_cases.get_project_phase_progress import (
    GetProjectPhaseProgressUseCase,
)
from app.domain.services.chart_applicability import (
    CHART_CAPABILITY_RULES,
    CapabilityInputs,
    chart_capabilities,
)

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


# ---------------------------------------------------------------------------
# In-memory fakes (Phase 12 D-09 pattern)
# ---------------------------------------------------------------------------


@dataclass
class FakeProject:
    id: int
    methodology: str = "SCRUM"
    process_config: Optional[dict] = None


class FakeProjectRepo:
    def __init__(
        self,
        project: Optional[FakeProject],
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


class FakeReportRepo:
    """Fake report repo for the phase-progress use case test."""

    def __init__(self, phase_progress: Optional[List[dict]] = None):
        self._phase_progress = phase_progress or []

    async def get_phase_progress(self, project_id: int) -> List[dict]:
        return list(self._phase_progress)


class FakeAuditRepo:
    """Fake audit repo. Methods return whatever was seeded for the test."""

    def __init__(
        self,
        cfd_snapshots: Optional[List[dict]] = None,
        lead_cycle_data: Optional[dict] = None,
        iteration_data: Optional[List[dict]] = None,
        project_activity: Optional[Tuple[List[dict], int]] = None,
    ):
        self._cfd_snapshots = cfd_snapshots or []
        self._lead_cycle_data = lead_cycle_data or {}
        self._iteration_data = iteration_data or []
        self._project_activity = project_activity or ([], 0)
        self.last_project_activity_call: Optional[dict] = None

    async def get_cfd_snapshots(
        self, project_id: int, date_from: date, date_to: date,
    ) -> List[dict]:
        # Return only snapshots that fall in the requested range — verifies
        # that the use case computes date_from/date_to correctly.
        return [
            s for s in self._cfd_snapshots
            if date_from.isoformat() <= s["date"] <= date_to.isoformat()
        ]

    async def get_lead_cycle_data(self, project_id: int, range_days: int) -> dict:
        return dict(self._lead_cycle_data)

    async def get_iteration_data(self, project_id: int, count: int) -> List[dict]:
        return list(self._iteration_data[:count])

    async def get_project_activity(
        self, project_id: int, types=None, user_id=None,
        date_from=None, date_to=None, limit: int = 30, offset: int = 0,
    ) -> Tuple[List[dict], int]:
        self.last_project_activity_call = {
            "project_id": project_id,
            "types": types,
            "user_id": user_id,
            "limit": limit,
            "offset": offset,
        }
        return self._project_activity


class FakeTaskRepo:
    """Not used by chart use cases — supplied for DI shape only."""
    pass


# ---------------------------------------------------------------------------
# Test 1: CFD returns daily snapshots for 30d range
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cfd_returns_daily_snapshots_for_30d_range():
    today = date.today()
    snapshots = [
        {
            "date": (today - timedelta(days=i)).isoformat(),
            "todo": 5, "progress": 3, "review": 2, "done": 10,
        }
        for i in range(0, 30)
    ]
    use_case = GetProjectCFDUseCase(
        audit_repo=FakeAuditRepo(cfd_snapshots=snapshots),
        task_repo=FakeTaskRepo(),
    )
    result = await use_case.execute(project_id=42, range_days=30)
    assert len(result.days) == 30
    assert result.avg_wip == 5.0  # (3+2) per day, average 5.0
    assert result.avg_completion_per_day == 10.0


# ---------------------------------------------------------------------------
# Test 2: CFD handles empty data (zero snapshots)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cfd_handles_empty_data():
    use_case = GetProjectCFDUseCase(
        audit_repo=FakeAuditRepo(cfd_snapshots=[]),
        task_repo=FakeTaskRepo(),
    )
    result = await use_case.execute(project_id=42, range_days=30)
    assert result.days == []
    assert result.avg_wip == 0.0
    assert result.avg_completion_per_day == 0.0


# ---------------------------------------------------------------------------
# Test 3: CFD validates range (must be 7|30|90)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cfd_validates_range():
    use_case = GetProjectCFDUseCase(
        audit_repo=FakeAuditRepo(),
        task_repo=FakeTaskRepo(),
    )
    with pytest.raises(ValueError) as exc_info:
        await use_case.execute(project_id=42, range_days=15)
    assert "range_days" in str(exc_info.value)


# ---------------------------------------------------------------------------
# Test 4: Lead/Cycle percentiles map to DTO
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_lead_cycle_percentiles():
    seeded = {
        "lead_avg": 4.0, "lead_p50": 3.0, "lead_p85": 7.5, "lead_p95": 12.0,
        "cycle_avg": 2.0, "cycle_p50": 1.5, "cycle_p85": 5.0, "cycle_p95": 8.0,
        "lead_b1": 3, "lead_b2": 5, "lead_b3": 4, "lead_b4": 2, "lead_b5": 1,
        "cycle_b1": 6, "cycle_b2": 4, "cycle_b3": 3, "cycle_b4": 1, "cycle_b5": 0,
    }
    use_case = GetProjectLeadCycleUseCase(
        audit_repo=FakeAuditRepo(lead_cycle_data=seeded),
    )
    result = await use_case.execute(project_id=42, range_days=30)

    assert result.lead.p50 == 3.0
    assert result.lead.p85 == 7.5
    assert result.lead.p95 == 12.0
    assert result.cycle.p50 == 1.5

    # Bucket labels in canonical order
    assert [b.range for b in result.lead.buckets] == [
        "0-1d", "1-3d", "3-5d", "5-10d", "10d+",
    ]
    assert [b.count for b in result.lead.buckets] == [3, 5, 4, 2, 1]
    assert [b.count for b in result.cycle.buckets] == [6, 4, 3, 1, 0]


# ---------------------------------------------------------------------------
# Test 5: Lead/Cycle excludes tasks with no in_progress from cycle bucket
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_lead_cycle_excludes_no_in_progress_from_cycle():
    """If a task was created+done with no in_progress event, the SQL maps it
    into the lead bucket but cycle stays at NULL → cycle bucket b1 stays 0
    while lead bucket counts include it.
    """
    seeded = {
        "lead_avg": 0.5, "lead_p50": 0.5, "lead_p85": 0.5, "lead_p95": 0.5,
        # cycle is empty — task had no in_progress event
        "cycle_avg": 0.0, "cycle_p50": 0.0, "cycle_p85": 0.0, "cycle_p95": 0.0,
        "lead_b1": 1, "lead_b2": 0, "lead_b3": 0, "lead_b4": 0, "lead_b5": 0,
        "cycle_b1": 0, "cycle_b2": 0, "cycle_b3": 0, "cycle_b4": 0, "cycle_b5": 0,
    }
    use_case = GetProjectLeadCycleUseCase(
        audit_repo=FakeAuditRepo(lead_cycle_data=seeded),
    )
    result = await use_case.execute(project_id=42, range_days=30)
    assert result.lead.buckets[0].count == 1
    assert result.cycle.buckets[0].count == 0


# ---------------------------------------------------------------------------
# Test 6: Iteration returns last N sprints (count param honored)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_iteration_returns_last_n_sprints():
    """Iteration use case no longer needs project_repo — Strategy D refactor."""
    sprints = [
        {"id": i, "name": f"Sprint {i}", "planned": 10, "completed": 8, "carried": 2}
        for i in range(1, 7)
    ]
    use_case = GetProjectIterationUseCase(
        audit_repo=FakeAuditRepo(iteration_data=sprints),
    )
    result = await use_case.execute(project_id=42, count=4)
    assert len(result.sprints) == 4
    assert result.sprints[0].name == "Sprint 1"


# ---------------------------------------------------------------------------
# Reports migration v2 (Strategy D) — iteration is methodology-agnostic
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_iteration_empty_when_no_sprints():
    """Strategy D: no sprints = empty result, NOT 422. Replaces the old
    InvalidMethodologyError tests — iteration endpoint no longer cares about
    the methodology enum."""
    use_case = GetProjectIterationUseCase(audit_repo=FakeAuditRepo(iteration_data=[]))
    result = await use_case.execute(project_id=42, count=4)
    assert result.sprints == []


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "methodology", ["SCRUM", "KANBAN", "WATERFALL", "ITERATIVE", "INCREMENTAL", "EVOLUTIONARY", "RAD"]
)
async def test_iteration_returns_data_for_any_methodology_with_sprints(methodology):
    """Strategy D: methodology never gates iteration. Any project with sprint
    records gets data; non-applicable methodologies are no longer rejected at
    the backend — gating is FE-side via /chart-capabilities."""
    sprints = [{"id": 1, "name": "Sprint 1", "planned": 10, "completed": 8, "carried": 2}]
    use_case = GetProjectIterationUseCase(audit_repo=FakeAuditRepo(iteration_data=sprints))
    result = await use_case.execute(project_id=42, count=4)
    assert len(result.sprints) == 1


# ---------------------------------------------------------------------------
# Reports migration v2 (Strategy D) — capability rule registry
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "inputs,expected",
    [
        # Scrum-like project with sprints + categorised columns
        (
            CapabilityInputs(
                sprint_count=3, closed_sprint_count=2, phase_node_count=0,
                column_count=4, member_count=5, has_all_categories=True,
            ),
            {"burndown": True, "iteration": True, "cfd": True, "lead_cycle": True,
             "phase_progress": False, "team_load": True, "summary": True},
        ),
        # Kanban project — no sprints, has all categories
        (
            CapabilityInputs(
                sprint_count=0, closed_sprint_count=0, phase_node_count=0,
                column_count=3, member_count=4, has_all_categories=True,
            ),
            {"burndown": False, "iteration": False, "cfd": True, "lead_cycle": True,
             "phase_progress": False, "team_load": True, "summary": True},
        ),
        # Waterfall project — phase nodes, no sprints
        (
            CapabilityInputs(
                sprint_count=0, closed_sprint_count=0, phase_node_count=5,
                column_count=2, member_count=3, has_all_categories=False,
            ),
            {"burndown": False, "iteration": False, "cfd": False, "lead_cycle": True,
             "phase_progress": True, "team_load": True, "summary": True},
        ),
        # Empty project — defaults
        (
            CapabilityInputs(
                sprint_count=0, closed_sprint_count=0, phase_node_count=0,
                column_count=0, member_count=0, has_all_categories=False,
            ),
            {"burndown": False, "iteration": False, "cfd": False, "lead_cycle": True,
             "phase_progress": False, "team_load": False, "summary": True},
        ),
    ],
)
def test_chart_capability_rules_per_project_shape(inputs, expected):
    """Rule registry resolves every chart's gate from CapabilityInputs only.
    Methodology enum is never consulted (Strategy D)."""
    fake_project = FakeProject(id=42, methodology="ANYTHING")
    result = chart_capabilities(fake_project, inputs)
    assert result == expected


def test_chart_capability_registry_covers_expected_charts():
    """Hardlock the chart name set so dropping a chart is a deliberate edit."""
    assert set(CHART_CAPABILITY_RULES) == {
        "burndown", "iteration", "cfd", "lead_cycle",
        "phase_progress", "team_load", "summary",
    }


# ---------------------------------------------------------------------------
# Reports migration v2 — capability use case (integration with rule registry)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_chart_capabilities_use_case_returns_dict():
    """Use case combines repo inputs + rule registry into a flat dict."""
    inputs = CapabilityInputs(
        sprint_count=2, closed_sprint_count=1, phase_node_count=3,
        column_count=4, member_count=5, has_all_categories=True,
    )
    use_case = GetChartCapabilitiesUseCase(
        project_repo=FakeProjectRepo(
            FakeProject(id=42, methodology="SCRUM"),
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
    from app.domain.exceptions import ProjectNotFoundError
    use_case = GetChartCapabilitiesUseCase(project_repo=FakeProjectRepo(project=None))
    with pytest.raises(ProjectNotFoundError):
        await use_case.execute(project_id=999)


# ---------------------------------------------------------------------------
# Reports migration v2 — phase-progress use case
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_phase_progress_returns_empty_when_no_workflow_nodes():
    project = FakeProject(id=42, process_config=None)
    use_case = GetProjectPhaseProgressUseCase(
        project_repo=FakeProjectRepo(project),
        report_repo=FakeReportRepo(),
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
    project = FakeProject(id=42, process_config=process_config)
    aggregates = [
        {"phase_id": "build", "total": 5, "done": 2, "in_progress": 2, "todo": 1},
        {"phase_id": "design", "total": 3, "done": 3, "in_progress": 0, "todo": 0},
    ]
    use_case = GetProjectPhaseProgressUseCase(
        project_repo=FakeProjectRepo(project),
        report_repo=FakeReportRepo(phase_progress=aggregates),
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
    project = FakeProject(id=42, process_config=process_config)
    use_case = GetProjectPhaseProgressUseCase(
        project_repo=FakeProjectRepo(project),
        report_repo=FakeReportRepo(),
    )
    result = await use_case.execute(project_id=42)
    assert [p.id for p in result.phases] == ["design", "build"]


# ---------------------------------------------------------------------------
# Test 14: Project activity broadening regression — UNION over task events
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_project_activity_includes_task_events_after_broadening():
    """Regression test for RESEARCH §Pitfall 2 / D-13-01: the use case must
    end up with task events alongside phase_transition events.

    Concretely: seed FakeAuditRepo with 4 items (1 phase_transition + 3 task
    rows) and verify the use case returns all 4 — i.e. the broadening
    happened at the SQL layer (the fake just returns whatever it's seeded
    with, so this asserts the contract / payload shape downstream code
    relies on).
    """
    from app.application.use_cases.get_project_activity import GetProjectActivityUseCase

    seeded_items = [
        {
            "id": 1, "action": "phase_transition", "entity_type": "project",
            "entity_id": 42, "entity_label": None, "field_name": None,
            "old_value": None, "new_value": None,
            "user_id": 1, "user_name": "Tester", "user_avatar": None,
            "timestamp": None, "metadata": None,
        },
    ] + [
        {
            "id": 100 + i, "action": "updated", "entity_type": "task",
            "entity_id": 200 + i, "entity_label": None, "field_name": "column_id",
            "old_value": "1", "new_value": "2",
            "user_id": 1, "user_name": "Tester", "user_avatar": None,
            "timestamp": None, "metadata": None,
        }
        for i in range(3)
    ]
    fake_repo = FakeAuditRepo(project_activity=(seeded_items, 4))
    use_case = GetProjectActivityUseCase(fake_repo)
    result = await use_case.execute(project_id=42)

    assert result.total == 4
    assert len(result.items) == 4
    entity_types = {item.entity_type for item in result.items}
    assert "project" in entity_types
    assert "task" in entity_types  # broadening contract


@pytest.mark.asyncio
async def test_project_activity_repo_marker_present():
    """D-13-01 docstring marker must be findable via grep — guards against
    a future refactor silently reverting the broadening.
    """
    from pathlib import Path
    repo_path = Path(__file__).resolve().parents[2] / "app" / "infrastructure" / "database" / "repositories" / "audit_repo.py"
    contents = repo_path.read_text(encoding="utf-8")
    assert "D-13-01: BROADENED" in contents
