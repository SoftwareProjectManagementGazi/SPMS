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
    Phase 12 Plan 12-10 (Bug Y UAT fix) — nodes must mark is_initial / is_final
    so D-19 rule 4 is satisfied.
    """
    legacy = {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_AAAAAAAAAA", "name": "A", "x": 0, "y": 0, "color": "#888",
             "is_initial": True, "is_final": False},
            {"id": "nd_BBBBBBBBBB", "name": "B", "x": 100, "y": 0, "color": "#888",
             "is_initial": False, "is_final": True},
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


# ============================================================================
# Phase 12 Plan 12-10 (Bug Y UAT fix) — WorkflowNode round-trip tests.
# ============================================================================
#
# Pre-fix the WorkflowNode Pydantic model only declared
# {id, name, x, y, color, is_archived}. Pydantic v2's `extra="ignore"`
# default silently dropped description, is_initial, is_final, parent_id,
# wip_limit at PATCH time, so a user editing those fields in the FE,
# saving, and reloading would see the values vanish.

import pytest
from pydantic import ValidationError as _PydValidationError
from app.application.dtos.workflow_dtos import WorkflowNode


def test_workflow_node_round_trips_description_isInitial_isFinal_parentId_wipLimit():
    """All FE-emitted fields must round-trip without being silently dropped."""
    raw = {
        "id": "nd_a1b2c3d4e5",
        "name": "Yürütme",
        "x": 100,
        "y": 200,
        "color": "#888",
        "description": "Sprint execution phase",
        "is_initial": False,
        "is_final": False,
        "is_archived": False,
        "parent_id": "gr_team_alpha",
        "wip_limit": 5,
    }
    node = WorkflowNode(**raw)
    assert node.description == "Sprint execution phase"
    assert node.is_initial is False
    assert node.is_final is False
    assert node.parent_id == "gr_team_alpha"
    assert node.wip_limit == 5


def test_workflow_node_legacy_minimal_payload_still_parses():
    """Pre-fix JSONB rows that lack the new keys must still parse to safe defaults."""
    legacy = {
        "id": "nd_legacy0001",
        "name": "Legacy Phase",
        "x": 0,
        "y": 0,
        "color": "#888",
    }
    node = WorkflowNode(**legacy)
    assert node.description is None
    assert node.is_initial is False
    assert node.is_final is False
    assert node.is_archived is False
    assert node.parent_id is None
    assert node.wip_limit is None


def test_workflow_node_negative_wip_limit_rejected():
    """wip_limit must be >= 0 — Pydantic Field(ge=0) catches negative values."""
    with pytest.raises(_PydValidationError):
        WorkflowNode(
            id="nd_a1b2c3d4e5",
            name="N",
            x=0,
            y=0,
            color="#888",
            wip_limit=-1,
        )


def test_workflow_config_rejects_zero_initial_nodes():
    """D-19 rule 4: a non-empty workflow MUST have at least one is_initial node."""
    from app.application.dtos.workflow_dtos import WorkflowConfig
    with pytest.raises(_PydValidationError) as ei:
        WorkflowConfig(
            mode="flexible",
            nodes=[
                {"id": "nd_aaaaaaaaaa", "name": "A", "x": 0, "y": 0, "color": "#888",
                 "is_initial": False, "is_final": True},
            ],
            edges=[],
            groups=[],
        )
    assert "is_initial" in str(ei.value).lower()


def test_workflow_config_rejects_zero_final_nodes():
    """D-19 rule 4: a non-empty workflow MUST have at least one is_final node."""
    from app.application.dtos.workflow_dtos import WorkflowConfig
    with pytest.raises(_PydValidationError) as ei:
        WorkflowConfig(
            mode="flexible",
            nodes=[
                {"id": "nd_aaaaaaaaaa", "name": "A", "x": 0, "y": 0, "color": "#888",
                 "is_initial": True, "is_final": False},
            ],
            edges=[],
            groups=[],
        )
    assert "is_final" in str(ei.value).lower()


def test_workflow_config_empty_nodes_skips_rule_4():
    """An empty workflow (nodes=[]) is the LIFE-01 default-state shape; rule 4 is
    intentionally skipped so the empty-state CTA flow can persist a fresh project
    before the user has applied a preset."""
    from app.application.dtos.workflow_dtos import WorkflowConfig
    config = WorkflowConfig(mode="flexible", nodes=[], edges=[], groups=[])
    assert config.nodes == []


def test_workflow_config_with_initial_and_final_passes():
    """Happy path: 1+ initial + 1+ final must pass rule 4."""
    from app.application.dtos.workflow_dtos import WorkflowConfig
    config = WorkflowConfig(
        mode="flexible",
        nodes=[
            {"id": "nd_aaaaaaaaaa", "name": "A", "x": 0, "y": 0, "color": "#888",
             "is_initial": True, "is_final": False},
            {"id": "nd_bbbbbbbbbb", "name": "B", "x": 100, "y": 0, "color": "#888",
             "is_initial": False, "is_final": True},
        ],
        edges=[
            {"id": "e1", "source": "nd_aaaaaaaaaa", "target": "nd_bbbbbbbbbb", "type": "flow"},
        ],
        groups=[],
    )
    assert any(n.is_initial for n in config.nodes)
    assert any(n.is_final for n in config.nodes)


def test_workflow_node_legacy_n1_id_still_rejected():
    """Bug X regression guard: even with the new fields available, the D-22 regex
    still rejects pre-fix IDs like 'n1' / 'n6'."""
    with pytest.raises(_PydValidationError):
        WorkflowNode(id="n1", name="A", x=0, y=0, color="#888")
    with pytest.raises(_PydValidationError):
        WorkflowNode(id="n6", name="F", x=0, y=0, color="#888")
