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
from app.domain.exceptions import InvalidMethodologyError
from app.domain.services.chart_applicability import (
    chart_applicability_for,
    ITERATION_METHODOLOGIES,
)


# ---------------------------------------------------------------------------
# In-memory fakes (Phase 12 D-09 pattern)
# ---------------------------------------------------------------------------


@dataclass
class FakeProject:
    id: int
    methodology: str = "SCRUM"


class FakeProjectRepo:
    def __init__(self, project: Optional[FakeProject]):
        self._project = project

    async def get_by_id(self, project_id: int):
        if self._project is None or self._project.id != project_id:
            return None
        return self._project


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
    sprints = [
        {"id": i, "name": f"Sprint {i}", "planned": 10, "completed": 8, "carried": 2}
        for i in range(1, 7)
    ]
    use_case = GetProjectIterationUseCase(
        audit_repo=FakeAuditRepo(iteration_data=sprints),
        project_repo=FakeProjectRepo(FakeProject(id=42, methodology="SCRUM")),
    )
    result = await use_case.execute(project_id=42, count=4)
    assert len(result.sprints) == 4
    assert result.sprints[0].name == "Sprint 1"


# ---------------------------------------------------------------------------
# Test 7: Iteration raises InvalidMethodologyError for non-cycle methodology
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_iteration_invalid_methodology_raises():
    use_case = GetProjectIterationUseCase(
        audit_repo=FakeAuditRepo(),
        project_repo=FakeProjectRepo(FakeProject(id=42, methodology="WATERFALL")),
    )
    with pytest.raises(InvalidMethodologyError) as exc_info:
        await use_case.execute(project_id=42, count=4)
    assert exc_info.value.methodology == "WATERFALL"
    assert "SCRUM" in exc_info.value.required


@pytest.mark.asyncio
async def test_iteration_kanban_also_raises():
    """KANBAN is non-cycle even though some tooling treats it as iterative-ish."""
    use_case = GetProjectIterationUseCase(
        audit_repo=FakeAuditRepo(),
        project_repo=FakeProjectRepo(FakeProject(id=42, methodology="KANBAN")),
    )
    with pytest.raises(InvalidMethodologyError):
        await use_case.execute(project_id=42, count=4)


# ---------------------------------------------------------------------------
# Test 8: Chart applicability strategy (Strategy Pattern per CLAUDE.md OCP)
# ---------------------------------------------------------------------------


def test_chart_applicability_strategy_kanban():
    a = chart_applicability_for("KANBAN")
    assert a.cfd is True
    assert a.iteration is False
    assert a.lead_cycle is True
    assert a.burndown is False


def test_chart_applicability_strategy_scrum():
    a = chart_applicability_for("SCRUM")
    assert a.cfd is False
    assert a.iteration is True
    assert a.burndown is True
    assert a.lead_cycle is True


def test_chart_applicability_strategy_waterfall():
    a = chart_applicability_for("WATERFALL")
    assert a.cfd is False
    assert a.iteration is False
    assert a.burndown is False
    assert a.lead_cycle is True  # always available


def test_chart_applicability_iteration_methodologies_set():
    """Hardlock the 5-member set — adding a methodology should be a deliberate edit."""
    assert ITERATION_METHODOLOGIES == frozenset({
        "SCRUM", "ITERATIVE", "INCREMENTAL", "EVOLUTIONARY", "RAD",
    })


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
