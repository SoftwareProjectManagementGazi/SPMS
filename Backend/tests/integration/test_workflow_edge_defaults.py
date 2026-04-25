"""Long-term canary test: pre-existing edges (no new fields) must read with default false.

Phase 12 Plan 12-09 — Pitfall 10 mitigation. SPEC line 22 + line 163 explicitly OVERRIDE
CONTEXT D-18: NO `_migrate_v1_to_v2` function is added, NO `CURRENT_SCHEMA_VERSION` bump,
NO new Alembic migration file. Pydantic field defaults on `WorkflowEdge.bidirectional`
and `WorkflowEdge.is_all_gate` are the ENTIRE defense against legacy JSONB shape drift.

If these tests ever fail, it means a future plan accidentally:
  (a) made the new fields required (removed default=False), OR
  (b) introduced a normalizer that mutates edges on read in a way that breaks defaults.

Both would silently break pre-Phase-12 data. Keep this test green forever.
"""
import pytest
from app.application.dtos.workflow_dtos import WorkflowEdge, WorkflowConfig


def test_legacy_edge_reads_with_default_bidirectional_false():
    """Pre-Phase-12 edge dict (no new fields) must default `bidirectional=False`."""
    legacy = {"id": "e1", "source": "a", "target": "b", "type": "flow", "label": None}
    edge = WorkflowEdge(**legacy)
    assert edge.bidirectional is False
    assert edge.is_all_gate is False


def test_legacy_edge_minimal_fields_reads_with_defaults():
    """Even more minimal pre-Phase-12 edge (no `type`, no `label`) must default both new fields."""
    legacy = {"id": "e1", "source": "a", "target": "b"}
    edge = WorkflowEdge(**legacy)
    assert edge.bidirectional is False
    assert edge.is_all_gate is False
    # And the existing default for `type` still works
    assert edge.type == "flow"


def test_legacy_workflow_config_reads_with_defaults():
    """Whole WorkflowConfig with legacy edge shape: every edge gets default false on both new fields.

    Note: NODE_ID_REGEX is `nd_[A-Za-z0-9_-]{10}` — exactly 10 chars after the `nd_` prefix.
    """
    legacy = {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_AAAAAAAAAA", "name": "A", "x": 0, "y": 0, "color": "#888"},
            {"id": "nd_BBBBBBBBBB", "name": "B", "x": 100, "y": 0, "color": "#888"},
        ],
        "edges": [
            {"id": "e1", "source": "nd_AAAAAAAAAA", "target": "nd_BBBBBBBBBB", "type": "flow", "label": None}
        ],
        "groups": [],
    }
    config = WorkflowConfig(**legacy)
    assert all(e.bidirectional is False for e in config.edges)
    assert all(e.is_all_gate is False for e in config.edges)


def test_explicit_true_preserved():
    """When new fields are explicitly set to True, they round-trip correctly (no override)."""
    new = {
        "id": "e1",
        "source": "a",
        "target": "b",
        "type": "flow",
        "label": None,
        "bidirectional": True,
        "is_all_gate": True,
    }
    edge = WorkflowEdge(**new)
    assert edge.bidirectional is True
    assert edge.is_all_gate is True


def test_partial_new_fields():
    """Only one new field set: the OTHER one still defaults to False."""
    only_bidir = {
        "id": "e1",
        "source": "a",
        "target": "b",
        "type": "flow",
        "label": None,
        "bidirectional": True,
    }
    edge = WorkflowEdge(**only_bidir)
    assert edge.bidirectional is True
    assert edge.is_all_gate is False  # default

    only_allgate = {
        "id": "e2",
        "source": "a",
        "target": "b",
        "type": "flow",
        "label": None,
        "is_all_gate": True,
    }
    edge2 = WorkflowEdge(**only_allgate)
    assert edge2.bidirectional is False  # default
    assert edge2.is_all_gate is True
