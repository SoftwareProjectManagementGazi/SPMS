"""API-01 Phase Gate use case unit tests (mocked repos + session)."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime
from app.application.use_cases.execute_phase_transition import ExecutePhaseTransitionUseCase
from app.application.dtos.phase_transition_dtos import PhaseTransitionRequestDTO, TaskException
from app.domain.entities.project import Project, Methodology, ProjectStatus
from app.domain.entities.task import Task
from app.domain.exceptions import (
    PhaseGateLockedError, CriteriaUnmetError, PhaseGateNotApplicableError,
    ArchivedNodeReferenceError, ProjectNotFoundError,
)


def _mk_project(mode="flexible", extra_nodes=None, criteria=None, extra_edges=None):
    nodes = [
        {"id": "nd_Src123DXYZ", "name": "Source", "x": 0, "y": 0, "color": "#888", "is_archived": False},
        {"id": "nd_Tgt456DXYZ", "name": "Target", "x": 100, "y": 0, "color": "#888", "is_archived": False},
    ]
    if extra_nodes:
        nodes.extend(extra_nodes)
    # Plan 15-02 TIDY-02: Phase 12 D-16/D-17 added the InvalidTransitionError edge
    # check inside ExecutePhaseTransitionUseCase. Tests must declare an edge from
    # source -> target for the happy-path transition.
    edges = [{"id": "e1", "source": "nd_Src123DXYZ", "target": "nd_Tgt456DXYZ", "type": "flow"}]
    if extra_edges:
        edges.extend(extra_edges)
    return Project(
        id=1, key="K", name="P", start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM, status=ProjectStatus.ACTIVE,
        process_config={
            "schema_version": 1,
            "workflow": {"mode": mode, "nodes": nodes, "edges": edges, "groups": []},
            "phase_completion_criteria": criteria or {},
            "enable_phase_assignment": True,
            "enforce_sequential_dependencies": False,
            "enforce_wip_limits": False,
            "restrict_expired_sprints": False,
        },
    )


def _mk_mocks(project, lock_acquired=True, tasks=None):
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=project)
    task_repo = MagicMock()
    task_repo.list_by_project_and_phase = AsyncMock(return_value=tasks or [])
    # Ayşe's d357b033 rewrote _apply_task_moves to use bulk_stamp_phase SQL
    # UPDATE instead of per-row in-memory mutation. Stub as awaitable so the
    # happy-path tests don't hit "MagicMock can't be awaited".
    task_repo.bulk_stamp_phase = AsyncMock()
    audit_repo = MagicMock()
    audit_repo.create_with_metadata = AsyncMock()
    session = MagicMock()
    # Simulate pg_try_advisory_xact_lock
    lock_result = MagicMock()
    lock_result.scalar_one = MagicMock(return_value=lock_acquired)
    session.execute = AsyncMock(return_value=lock_result)
    session.flush = AsyncMock()
    # Ayşe's 418bc8a2 added in-use-case `await self.session.commit()` (and a
    # rollback inside the phase_report try/except). Stub both as awaitable so
    # unit tests can drive the happy path without hitting the same
    # MagicMock-await failure. Architectural note: the use case's docstring
    # at execute_phase_transition.py:11-12 still claims FastAPI Depends
    # owns commit/rollback — that contract is stale and should be reconciled
    # separately (either remove the in-use-case commit or update the doc).
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return project_repo, task_repo, audit_repo, session


@pytest.mark.asyncio
async def test_transition_success_no_criteria():
    project = _mk_project()
    project_repo, task_repo, audit_repo, session = _mk_mocks(project)
    uc = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, session)
    dto = PhaseTransitionRequestDTO(source_phase_id="nd_Src123DXYZ", target_phase_id="nd_Tgt456DXYZ")
    resp = await uc.execute(1, dto, user_id=5)
    assert resp.moved_count == 0
    assert resp.override_used is False
    audit_repo.create_with_metadata.assert_awaited_once()


@pytest.mark.asyncio
async def test_lock_contention_raises_409():
    project = _mk_project()
    project_repo, task_repo, audit_repo, session = _mk_mocks(project, lock_acquired=False)
    uc = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, session)
    dto = PhaseTransitionRequestDTO(source_phase_id="nd_Src123DXYZ", target_phase_id="nd_Tgt456DXYZ")
    with pytest.raises(PhaseGateLockedError):
        await uc.execute(1, dto, user_id=5)


@pytest.mark.asyncio
async def test_continuous_mode_raises_400():
    project = _mk_project(mode="continuous")
    project_repo, task_repo, audit_repo, session = _mk_mocks(project)
    uc = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, session)
    dto = PhaseTransitionRequestDTO(source_phase_id="nd_Src123DXYZ", target_phase_id="nd_Tgt456DXYZ")
    with pytest.raises(PhaseGateNotApplicableError):
        await uc.execute(1, dto, user_id=5)


@pytest.mark.asyncio
async def test_archived_target_node_raises():
    # nd_Arc0000001 = nd_ + 10 chars (Arc0000001) — valid format, is_archived=True in project workflow
    # Plan 15-02 TIDY-02: edge to archived target included so the archived check fires
    # BEFORE the new D-16 edge check (archived check is earlier in execute_phase_transition).
    project = _mk_project(
        extra_nodes=[{"id": "nd_Arc0000001", "name": "A", "x": 0, "y": 0, "color": "#888", "is_archived": True}],
        extra_edges=[{"id": "e2", "source": "nd_Src123DXYZ", "target": "nd_Arc0000001", "type": "flow"}],
    )
    project_repo, task_repo, audit_repo, session = _mk_mocks(project)
    uc = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, session)
    dto = PhaseTransitionRequestDTO(source_phase_id="nd_Src123DXYZ", target_phase_id="nd_Arc0000001")
    with pytest.raises(ArchivedNodeReferenceError):
        await uc.execute(1, dto, user_id=5)


@pytest.mark.asyncio
async def test_criteria_unmet_raises_422_without_override():
    project = _mk_project(criteria={"nd_Src123DXYZ": {"auto": {"all_tasks_done": True}, "manual": []}})
    # Set up one incomplete task
    class FakeTask:
        def __init__(self, tid, phase_id, status):
            self.id = tid; self.phase_id = phase_id; self.status = status; self.priority = "MEDIUM"; self.sprint_id = None; self.column = None
    tasks = [FakeTask(1, "nd_Src123DXYZ", "TODO"), FakeTask(2, "nd_Src123DXYZ", "DONE")]
    project_repo, task_repo, audit_repo, session = _mk_mocks(project, tasks=tasks)
    uc = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, session)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_Src123DXYZ", target_phase_id="nd_Tgt456DXYZ",
        allow_override=False,
    )
    with pytest.raises(CriteriaUnmetError) as ei:
        await uc.execute(1, dto, user_id=5)
    assert any(c["check"] == "all_tasks_done" for c in ei.value.unmet_criteria)


@pytest.mark.asyncio
async def test_override_allowed_in_sequential_locked():
    """D-05: allow_override=true works even in sequential-locked mode."""
    project = _mk_project(mode="sequential-locked", criteria={"nd_Src123DXYZ": {"auto": {"all_tasks_done": True}}})
    class FakeTask:
        def __init__(self, tid, phase_id, status):
            self.id = tid; self.phase_id = phase_id; self.status = status; self.priority = "MEDIUM"; self.sprint_id = None; self.column = None
    tasks = [FakeTask(1, "nd_Src123DXYZ", "TODO")]
    project_repo, task_repo, audit_repo, session = _mk_mocks(project, tasks=tasks)
    uc = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, session)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_Src123DXYZ", target_phase_id="nd_Tgt456DXYZ",
        allow_override=True,
    )
    resp = await uc.execute(1, dto, user_id=5)
    assert resp.override_used is True


@pytest.mark.asyncio
async def test_open_tasks_move_to_next_with_exceptions():
    """D-04: bulk move_to_next with per-task exception keep_in_source."""
    project = _mk_project()
    class FakeTask:
        def __init__(self, tid):
            self.id = tid; self.phase_id = "nd_Src123DXYZ"; self.status = "DONE"; self.priority = "MEDIUM"; self.sprint_id = None; self.column = None
    t1 = FakeTask(1); t2 = FakeTask(2)
    project_repo, task_repo, audit_repo, session = _mk_mocks(project, tasks=[t1, t2])
    uc = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, session)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_Src123DXYZ", target_phase_id="nd_Tgt456DXYZ",
        open_tasks_action="move_to_next",
        exceptions=[TaskException(task_id=2, action="keep_in_source")],
    )
    resp = await uc.execute(1, dto, user_id=5)
    # Ayşe's d357b033 replaced in-memory `t.phase_id = target` mutation with a
    # bulk SQL `task_repo.bulk_stamp_phase(ids, phase_id)` UPDATE, so the
    # original in-memory assertions (`t1.phase_id == "nd_Tgt456DXYZ"`) no
    # longer hold — Python objects aren't touched by SQL UPDATE. The bulk
    # call IS asserted instead: only t1's id was moved (t2 kept by exception).
    task_repo.bulk_stamp_phase.assert_any_await([1], "nd_Tgt456DXYZ")
    assert resp.moved_count == 1
