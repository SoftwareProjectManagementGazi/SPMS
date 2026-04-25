"""Phase 12 Plan 12-09 — ExecutePhaseTransitionUseCase D-16/D-17 edge-direction tests.

Three behaviors validated directly at the use-case layer (no HTTP surface):
  1. is_all_gate=True: any non-archived source -> matching target is allowed
  2. bidirectional=True: PAIR-WISE reverse traversal allowed; NOT transitive
  3. sequential-flexible mode: feedback edges allow what flow edges block

The use case is exercised via in-memory fakes for each repository so the tests
remain pure-Python — no DB dependency. This is consistent with the "skip when
migration 005 not applied" pattern used by tests/integration/api tests.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Optional, List
import pytest

from app.application.use_cases.execute_phase_transition import ExecutePhaseTransitionUseCase
from app.application.dtos.phase_transition_dtos import PhaseTransitionRequestDTO
from app.application.services import idempotency_cache
from app.domain.exceptions import (
    InvalidTransitionError,
    ProjectNotFoundError,
)


# ---------------------------------------------------------------------------
# In-memory fakes (mirror IProjectRepository / ITaskRepository / IAuditRepository)
# ---------------------------------------------------------------------------

@dataclass
class FakeProject:
    id: int
    process_config: dict
    methodology: str = "SCRUM"
    name: str = "Test Project"


class FakeProjectRepo:
    def __init__(self, project: FakeProject):
        self._project = project

    async def get_by_id(self, project_id: int):
        if self._project.id != project_id:
            return None
        return self._project


class FakeTaskRepo:
    async def list_by_project_and_phase(self, project_id: int, phase_id: str):
        return []  # No tasks → no criteria evaluation, no moves


class FakeAuditRepo:
    def __init__(self):
        self.events: List[dict] = []

    async def create_with_metadata(
        self, *, entity_type: str, entity_id: int, action: str,
        user_id: int, metadata: dict,
    ):
        self.events.append({
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "user_id": user_id,
            "metadata": metadata,
        })


class FakeSession:
    """Minimal AsyncSession stub — execute() / flush() are no-ops.

    The use case calls `await acquire_project_lock_or_fail(self.session, project_id)`
    which executes `pg_try_advisory_xact_lock(...)` via session.execute.  We let
    the call return a truthy stub for both `.scalar()` and `.scalar_one()`.
    """
    def __init__(self):
        self.flushes = 0

    async def execute(self, *args, **kwargs):
        class _R:
            def scalar(self):
                return True

            def scalar_one(self):
                return True

            def scalars(self):
                return self

            def first(self):
                return None

            def all(self):
                return []

        return _R()

    async def flush(self):
        self.flushes += 1


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_workflow(mode: str, nodes: list, edges: list) -> dict:
    return {"mode": mode, "nodes": nodes, "edges": edges, "groups": []}


def _node(node_id: str, name: str = "", is_archived: bool = False) -> dict:
    return {
        "id": node_id,
        "name": name or node_id,
        "x": 0,
        "y": 0,
        "color": "#888",
        "is_archived": is_archived,
    }


def _edge(
    edge_id: str,
    source: str,
    target: str,
    type_: str = "flow",
    bidirectional: bool = False,
    is_all_gate: bool = False,
) -> dict:
    return {
        "id": edge_id,
        "source": source,
        "target": target,
        "type": type_,
        "label": None,
        "bidirectional": bidirectional,
        "is_all_gate": is_all_gate,
    }


@pytest.fixture(autouse=True)
def reset_idempotency():
    """Each test gets a fresh idempotency cache so rate-limit doesn't leak."""
    idempotency_cache.reset_for_tests()


def _build_use_case(workflow: dict) -> tuple[ExecutePhaseTransitionUseCase, FakeAuditRepo]:
    project = FakeProject(
        id=1,
        process_config={
            "schema_version": 1,
            "workflow": workflow,
            "phase_completion_criteria": {},
            "enable_phase_assignment": True,
        },
    )
    project_repo = FakeProjectRepo(project)
    task_repo = FakeTaskRepo()
    audit_repo = FakeAuditRepo()
    session = FakeSession()
    use_case = ExecutePhaseTransitionUseCase(project_repo, task_repo, audit_repo, session)
    return use_case, audit_repo


# ---------------------------------------------------------------------------
# Test 1 — is_all_gate=True allows any non-archived source
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_all_gate_allows_any_source():
    """Phase 12 D-17: is_all_gate=True edge with target=N allows ANY non-archived
    source to transition to N (Jira-style "All" gate)."""
    workflow = _make_workflow(
        mode="flexible",
        nodes=[
            _node("nd_RandomAAAA", name="Random"),
            _node("nd_TargetCCCC", name="Closure"),
            _node("nd_OtherDDDDD", name="Other"),
        ],
        edges=[
            # The all-gate edge — its source is irrelevant for source-side gating
            _edge("e_all", "nd_OtherDDDDD", "nd_TargetCCCC", is_all_gate=True),
        ],
    )
    use_case, audit_repo = _build_use_case(workflow)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_RandomAAAA",
        target_phase_id="nd_TargetCCCC",
        open_tasks_action="keep_in_source",
    )
    response = await use_case.execute(project_id=1, dto=dto, user_id=99)
    assert response.source_phase_id == "nd_RandomAAAA"
    assert response.target_phase_id == "nd_TargetCCCC"
    assert response.override_used is False
    assert len(audit_repo.events) == 1
    assert audit_repo.events[0]["action"] == "phase_transition"


@pytest.mark.asyncio
async def test_all_gate_does_not_help_other_targets():
    """is_all_gate is target-specific — an all-gate edge to N does NOT help
    transitions to OTHER targets."""
    workflow = _make_workflow(
        mode="flexible",
        nodes=[
            _node("nd_AAAAAAAAAA"),
            _node("nd_BBBBBBBBBB"),
            _node("nd_CCCCCCCCCC"),
        ],
        edges=[
            # All-gate edge points at C; transitions to B should still need their own edge
            _edge("e_all", "nd_AAAAAAAAAA", "nd_CCCCCCCCCC", is_all_gate=True),
        ],
    )
    use_case, _ = _build_use_case(workflow)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_AAAAAAAAAA",
        target_phase_id="nd_BBBBBBBBBB",  # Different target — not protected by the all-gate
        open_tasks_action="keep_in_source",
    )
    with pytest.raises(InvalidTransitionError):
        await use_case.execute(project_id=1, dto=dto, user_id=99)


# ---------------------------------------------------------------------------
# Test 2 — bidirectional=True is PAIR-WISE not transitive
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_bidirectional_pair_wise_forward_allowed():
    """Pair-wise A↔B: A→B (direct edge) succeeds."""
    workflow = _make_workflow(
        mode="flexible",
        nodes=[
            _node("nd_AAAAAAAAAA"),
            _node("nd_BBBBBBBBBB"),
            _node("nd_CCCCCCCCCC"),
        ],
        edges=[
            _edge("e_ab", "nd_AAAAAAAAAA", "nd_BBBBBBBBBB", bidirectional=True),
            _edge("e_bc", "nd_BBBBBBBBBB", "nd_CCCCCCCCCC", bidirectional=True),
        ],
    )
    use_case, _ = _build_use_case(workflow)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_AAAAAAAAAA",
        target_phase_id="nd_BBBBBBBBBB",
        open_tasks_action="keep_in_source",
    )
    response = await use_case.execute(project_id=1, dto=dto, user_id=99)
    assert response.target_phase_id == "nd_BBBBBBBBBB"


@pytest.mark.asyncio
async def test_bidirectional_pair_wise_reverse_allowed():
    """Pair-wise A↔B: B→A (reverse via bidirectional) succeeds."""
    workflow = _make_workflow(
        mode="flexible",
        nodes=[
            _node("nd_AAAAAAAAAA"),
            _node("nd_BBBBBBBBBB"),
        ],
        edges=[
            _edge("e_ab", "nd_AAAAAAAAAA", "nd_BBBBBBBBBB", bidirectional=True),
        ],
    )
    use_case, _ = _build_use_case(workflow)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_BBBBBBBBBB",
        target_phase_id="nd_AAAAAAAAAA",
        open_tasks_action="keep_in_source",
    )
    response = await use_case.execute(project_id=1, dto=dto, user_id=99)
    assert response.target_phase_id == "nd_AAAAAAAAAA"


@pytest.mark.asyncio
async def test_bidirectional_not_transitive():
    """CONTEXT D-16: A↔B and B↔C does NOT permit A→C — pair-wise NOT transitive."""
    workflow = _make_workflow(
        mode="flexible",
        nodes=[
            _node("nd_AAAAAAAAAA"),
            _node("nd_BBBBBBBBBB"),
            _node("nd_CCCCCCCCCC"),
        ],
        edges=[
            _edge("e_ab", "nd_AAAAAAAAAA", "nd_BBBBBBBBBB", bidirectional=True),
            _edge("e_bc", "nd_BBBBBBBBBB", "nd_CCCCCCCCCC", bidirectional=True),
        ],
    )
    use_case, _ = _build_use_case(workflow)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_AAAAAAAAAA",
        target_phase_id="nd_CCCCCCCCCC",  # No direct A→C; must reject
        open_tasks_action="keep_in_source",
    )
    with pytest.raises(InvalidTransitionError) as exc_info:
        await use_case.execute(project_id=1, dto=dto, user_id=99)
    assert exc_info.value.source_phase_id == "nd_AAAAAAAAAA"
    assert exc_info.value.target_phase_id == "nd_CCCCCCCCCC"


@pytest.mark.asyncio
async def test_non_bidirectional_reverse_rejected():
    """Reverse traversal of a non-bidirectional edge is rejected."""
    workflow = _make_workflow(
        mode="flexible",
        nodes=[
            _node("nd_AAAAAAAAAA"),
            _node("nd_BBBBBBBBBB"),
        ],
        edges=[
            _edge("e_ab", "nd_AAAAAAAAAA", "nd_BBBBBBBBBB", bidirectional=False),
        ],
    )
    use_case, _ = _build_use_case(workflow)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_BBBBBBBBBB",
        target_phase_id="nd_AAAAAAAAAA",
        open_tasks_action="keep_in_source",
    )
    with pytest.raises(InvalidTransitionError):
        await use_case.execute(project_id=1, dto=dto, user_id=99)


# ---------------------------------------------------------------------------
# Test 3 — sequential-flexible mode + feedback edges
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sequential_flexible_feedback_transition_allowed():
    """sequential-flexible: a feedback-typed edge B→A allows B→A transition.

    Per CONTEXT D-55 rule 3, sequential-flexible mode permits feedback edges
    that would otherwise create a cycle in flow edges. The use case checks
    edge existence regardless of edge type, so a feedback edge is sufficient.
    """
    workflow = _make_workflow(
        mode="sequential-flexible",
        nodes=[
            _node("nd_AAAAAAAAAA", name="A"),
            _node("nd_BBBBBBBBBB", name="B"),
        ],
        edges=[
            _edge("e_flow", "nd_AAAAAAAAAA", "nd_BBBBBBBBBB", type_="flow"),
            # Feedback edge enables B → A backward transition without forming
            # a flow-cycle (feedback type is exempt from the cycle check).
            _edge("e_feedback", "nd_BBBBBBBBBB", "nd_AAAAAAAAAA", type_="feedback"),
        ],
    )
    use_case, _ = _build_use_case(workflow)
    # Forward via flow edge — allowed
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_AAAAAAAAAA",
        target_phase_id="nd_BBBBBBBBBB",
        open_tasks_action="keep_in_source",
    )
    response = await use_case.execute(project_id=1, dto=dto, user_id=99)
    assert response.target_phase_id == "nd_BBBBBBBBBB"
    # Reset idempotency for second call
    idempotency_cache.reset_for_tests()
    use_case2, _ = _build_use_case(workflow)
    # Backward via feedback edge — allowed
    dto2 = PhaseTransitionRequestDTO(
        source_phase_id="nd_BBBBBBBBBB",
        target_phase_id="nd_AAAAAAAAAA",
        open_tasks_action="keep_in_source",
    )
    response2 = await use_case2.execute(project_id=1, dto=dto2, user_id=99)
    assert response2.target_phase_id == "nd_AAAAAAAAAA"


@pytest.mark.asyncio
async def test_sequential_flexible_backward_without_edge_rejected():
    """sequential-flexible without a backward edge: B→A rejected."""
    workflow = _make_workflow(
        mode="sequential-flexible",
        nodes=[
            _node("nd_AAAAAAAAAA"),
            _node("nd_BBBBBBBBBB"),
        ],
        edges=[
            _edge("e_flow", "nd_AAAAAAAAAA", "nd_BBBBBBBBBB", type_="flow"),
            # No feedback edge, no bidirectional, no all-gate → backward rejected
        ],
    )
    use_case, _ = _build_use_case(workflow)
    dto = PhaseTransitionRequestDTO(
        source_phase_id="nd_BBBBBBBBBB",
        target_phase_id="nd_AAAAAAAAAA",
        open_tasks_action="keep_in_source",
    )
    with pytest.raises(InvalidTransitionError):
        await use_case.execute(project_id=1, dto=dto, user_id=99)


# ---------------------------------------------------------------------------
# Test 4 — Pre-existing edges (no D-16/D-17 fields) read with defaults
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_legacy_edge_without_new_fields_treated_as_unidirectional():
    """A pre-Phase-12 edge dict missing `bidirectional` and `is_all_gate` keys
    must be treated as unidirectional (default False)."""
    workflow = {
        "mode": "flexible",
        "nodes": [
            _node("nd_AAAAAAAAAA"),
            _node("nd_BBBBBBBBBB"),
        ],
        "edges": [
            # Legacy edge — no new fields
            {"id": "e_legacy", "source": "nd_AAAAAAAAAA", "target": "nd_BBBBBBBBBB",
             "type": "flow", "label": None},
        ],
        "groups": [],
    }
    use_case, _ = _build_use_case(workflow)
    # Forward should succeed (direct edge)
    dto_fwd = PhaseTransitionRequestDTO(
        source_phase_id="nd_AAAAAAAAAA",
        target_phase_id="nd_BBBBBBBBBB",
        open_tasks_action="keep_in_source",
    )
    response = await use_case.execute(project_id=1, dto=dto_fwd, user_id=99)
    assert response.target_phase_id == "nd_BBBBBBBBBB"

    # Backward should be rejected — legacy edge is treated as unidirectional
    idempotency_cache.reset_for_tests()
    use_case2, _ = _build_use_case(workflow)
    dto_back = PhaseTransitionRequestDTO(
        source_phase_id="nd_BBBBBBBBBB",
        target_phase_id="nd_AAAAAAAAAA",
        open_tasks_action="keep_in_source",
    )
    with pytest.raises(InvalidTransitionError):
        await use_case2.execute(project_id=1, dto=dto_back, user_id=99)
