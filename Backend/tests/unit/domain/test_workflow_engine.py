"""Phase 17 C5 — WorkflowEngine unit tests.

Pure domain tests; no DB, no async, no fixtures from conftest. Each test builds
a minimal workflow dict + BoardColumn list and asserts engine behavior. Mirrors
the test plan in .planning/workflow-engine-implementation.md (C5).
"""
from datetime import datetime, timedelta

import pytest

from app.domain.entities.board_column import BoardColumn
from app.domain.services.workflow_engine import WorkflowEngine


# ---------- Fixtures (plain helpers, not pytest fixtures — keeps tests obvious) ----------

def _col(
    id_: int,
    name: str,
    order_index: int,
    *,
    wip_limit: int = 0,
    is_initial: bool = False,
    is_terminal: bool = False,
    max_duration_days=None,
    exit_policy: str = "any",
    entry_policy: str = "any",
) -> BoardColumn:
    return BoardColumn(
        id=id_,
        project_id=1,
        name=name,
        order_index=order_index,
        wip_limit=wip_limit,
        is_initial=is_initial,
        is_terminal=is_terminal,
        max_duration_days=max_duration_days,
        exit_policy=exit_policy,
        entry_policy=entry_policy,
    )


# ---------- is_terminal / is_initial ----------

def test_is_terminal_via_column_flag():
    col = _col(1, "Done", order_index=2, is_terminal=True)
    engine = WorkflowEngine(workflow=None, columns=[col])
    assert engine.is_terminal(col) is True


def test_is_terminal_via_order_index_fallback():
    # Neither column flagged is_terminal, but the engine falls back to
    # max(order_index) for backfill compatibility.
    backlog = _col(1, "Backlog", order_index=0)
    doing = _col(2, "Doing", order_index=1)
    done = _col(3, "Done", order_index=2)
    engine = WorkflowEngine(workflow=None, columns=[backlog, doing, done])
    assert engine.is_terminal(done) is True
    assert engine.is_terminal(doing) is False
    assert engine.is_terminal(backlog) is False


def test_is_terminal_via_phase_node_dict():
    workflow = {"nodes": [{"id": "n1", "is_final": True}]}
    engine = WorkflowEngine(workflow=workflow)
    assert engine.is_terminal({"id": "n1", "is_final": True}) is True
    assert engine.is_terminal({"id": "n2", "is_terminal": True}) is True
    assert engine.is_terminal({"id": "n3"}) is False


def test_is_initial_via_column_flag():
    col = _col(1, "Backlog", order_index=0, is_initial=True)
    engine = WorkflowEngine(workflow=None, columns=[col])
    assert engine.is_initial(col) is True


def test_get_terminal_and_initial_columns():
    backlog = _col(1, "Backlog", order_index=0, is_initial=True)
    doing = _col(2, "Doing", order_index=1)
    done = _col(3, "Done", order_index=2, is_terminal=True)
    engine = WorkflowEngine(workflow=None, columns=[backlog, doing, done])
    assert engine.get_terminal_columns() == [done]
    assert engine.get_initial_columns() == [backlog]


# ---------- can_move ----------

def test_can_move_direct_edge_allowed():
    workflow = {"edges": [{"source": "n1", "target": "n2"}]}
    engine = WorkflowEngine(workflow=workflow)
    allowed, reason = engine.can_move("n1", "n2")
    assert allowed is True
    assert reason is None


def test_can_move_no_edge_denied():
    # Use phase nodes with explicit exit_policy='edges_only' so the engine
    # actually requires an edge (default 'any' bypasses the edge check).
    workflow = {
        "nodes": [{"id": "n1", "exit_policy": "edges_only"}],
        "edges": [],
    }
    engine = WorkflowEngine(workflow=workflow)
    allowed, reason = engine.can_move("n1", "n2")
    assert allowed is False
    assert "No edge connects" in reason


def test_can_move_bidirectional_reverse():
    workflow = {
        "nodes": [
            {"id": "n1", "exit_policy": "edges_only"},
            {"id": "n2", "exit_policy": "edges_only"},
        ],
        "edges": [{"source": "n1", "target": "n2", "bidirectional": True}],
    }
    engine = WorkflowEngine(workflow=workflow)
    allowed, reason = engine.can_move("n2", "n1")
    assert allowed is True
    assert reason is None


def test_can_move_is_all_gate():
    workflow = {
        "nodes": [{"id": "n3", "exit_policy": "edges_only"}],
        "edges": [{"source": "anything", "target": "n5", "is_all_gate": True}],
    }
    engine = WorkflowEngine(workflow=workflow)
    # Any source -> n5 is allowed
    allowed, _ = engine.can_move("n3", "n5")
    assert allowed is True


def test_can_move_is_any_gate():
    workflow = {
        "nodes": [{"id": "n1", "exit_policy": "edges_only"}],
        "edges": [{"source": "n1", "target": "irrelevant", "is_any_gate": True}],
    }
    engine = WorkflowEngine(workflow=workflow)
    # n1 -> any target is allowed
    allowed, _ = engine.can_move("n1", "n_anything")
    assert allowed is True


def test_can_move_exit_policy_any_bypasses_edge_check():
    workflow = {
        "nodes": [{"id": "n1", "exit_policy": "any"}],
        "edges": [],
    }
    engine = WorkflowEngine(workflow=workflow)
    allowed, reason = engine.can_move("n1", "n2")
    assert allowed is True
    assert reason is None


def test_can_move_exit_policy_terminal_lock_blocks_terminal_source():
    workflow = {
        "nodes": [
            {
                "id": "n_done",
                "is_final": True,
                "exit_policy": "terminal_lock",
            }
        ],
        "edges": [],
    }
    engine = WorkflowEngine(workflow=workflow)
    allowed, reason = engine.can_move("n_done", "n2")
    assert allowed is False
    assert "terminal_lock" in reason


def test_can_move_same_source_target_is_noop():
    workflow = {
        "nodes": [{"id": "n1", "exit_policy": "edges_only"}],
        "edges": [],
    }
    engine = WorkflowEngine(workflow=workflow)
    allowed, reason = engine.can_move("n1", "n1")
    assert allowed is True
    assert reason is None


# ---------- check_wip ----------

def test_check_wip_disabled_when_capability_off():
    col = _col(1, "Doing", order_index=1, wip_limit=2)
    workflow = {"capabilities": {"enforce_wip_limits": False}}
    engine = WorkflowEngine(workflow=workflow, columns=[col])
    allowed, _ = engine.check_wip(col, current_count=99)
    assert allowed is True


def test_check_wip_blocks_at_limit():
    col = _col(1, "Doing", order_index=1, wip_limit=3)
    workflow = {"capabilities": {"enforce_wip_limits": True}}
    engine = WorkflowEngine(workflow=workflow, columns=[col])
    allowed, reason = engine.check_wip(col, current_count=3)
    assert allowed is False
    assert "WIP limit 3" in reason
    assert "Doing" in reason


def test_check_wip_allows_under_limit():
    col = _col(1, "Doing", order_index=1, wip_limit=3)
    workflow = {"capabilities": {"enforce_wip_limits": True}}
    engine = WorkflowEngine(workflow=workflow, columns=[col])
    allowed, reason = engine.check_wip(col, current_count=2)
    assert allowed is True
    assert reason is None


def test_check_wip_unlimited_when_zero():
    col = _col(1, "Doing", order_index=1, wip_limit=0)
    workflow = {"capabilities": {"enforce_wip_limits": True}}
    engine = WorkflowEngine(workflow=workflow, columns=[col])
    allowed, _ = engine.check_wip(col, current_count=999)
    assert allowed is True


# ---------- is_stale ----------

def test_is_stale_returns_false_when_no_max_duration():
    col = _col(1, "Doing", order_index=1, max_duration_days=None)
    engine = WorkflowEngine(workflow=None, columns=[col])
    assert engine.is_stale(col, last_transition_at=datetime(2026, 1, 1), now=datetime(2027, 1, 1)) is False


def test_is_stale_returns_true_when_overdue():
    col = _col(1, "Doing", order_index=1, max_duration_days=7)
    engine = WorkflowEngine(workflow=None, columns=[col])
    last = datetime(2026, 1, 1)
    now = last + timedelta(days=10)  # 10 > 7
    assert engine.is_stale(col, last_transition_at=last, now=now) is True


def test_is_stale_returns_false_when_within_limit():
    col = _col(1, "Doing", order_index=1, max_duration_days=7)
    engine = WorkflowEngine(workflow=None, columns=[col])
    last = datetime(2026, 1, 1)
    now = last + timedelta(days=5)  # 5 < 7
    assert engine.is_stale(col, last_transition_at=last, now=now) is False


# ---------- Engine resilience ----------

def test_engine_handles_none_workflow_gracefully():
    """Smoke: no exceptions when workflow=None and columns=[]."""
    engine = WorkflowEngine(workflow=None)
    assert engine.cap("enforce_wip_limits") is False
    assert engine.cap("anything", default=True) is True  # default plumbed
    assert engine.get_terminal_columns() == []
    assert engine.get_initial_columns() == []
    # can_move with no nodes/edges and no exit_policy resolution -> denied
    allowed, _ = engine.can_move("n1", "n2")
    assert allowed is False


def test_edge_resolution_accepts_from_to_aliases():
    """V2 design uses {from, to}; engine reads both shapes."""
    workflow = {
        "nodes": [{"id": "n1", "exit_policy": "edges_only"}],
        "edges": [{"from": "n1", "to": "n2"}],
    }
    engine = WorkflowEngine(workflow=workflow)
    allowed, _ = engine.can_move("n1", "n2")
    assert allowed is True
