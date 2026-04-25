"""API-10 / D-54, D-55 Workflow Pydantic validation tests."""
import pytest
from pydantic import ValidationError
from app.application.dtos.workflow_dtos import WorkflowConfig, WorkflowNode, WorkflowEdge, WorkflowGroup


def _node(nid="nd_a1b2c3d4e5", is_archived=False, is_initial=False, is_final=False):
    """Factory: minimal node with optional initial/final markers.

    Phase 12 Plan 12-10 (Bug Y UAT fix) — D-19 rule 4 now requires every
    non-empty workflow to have at least one is_initial AND one is_final.
    Tests that build workflows must mark at least one node accordingly,
    or use the dual-flag form `_node(is_initial=True, is_final=True)`
    for single-node fixtures.
    """
    return {
        "id": nid,
        "name": "N",
        "x": 0.0,
        "y": 0.0,
        "color": "#888",
        "is_archived": is_archived,
        "is_initial": is_initial,
        "is_final": is_final,
    }


def test_valid_minimal_workflow():
    # Single node satisfies rule 4 by being both initial AND final
    # (continuous-mode pattern).
    wf = WorkflowConfig(
        mode="flexible",
        nodes=[_node(is_initial=True, is_final=True)],
        edges=[],
        groups=[],
    )
    assert wf.mode == "flexible"


def test_node_id_bad_format_rejected():
    with pytest.raises(ValidationError):
        WorkflowConfig(
            mode="flexible",
            nodes=[_node("bad", is_initial=True, is_final=True)],
            edges=[],
            groups=[],
        )


def test_duplicate_node_ids_rejected():
    with pytest.raises(ValidationError) as ei:
        WorkflowConfig(
            mode="flexible",
            nodes=[
                _node("nd_a1b2c3d4e5", is_initial=True),
                _node("nd_a1b2c3d4e5", is_final=True),
            ],
            edges=[], groups=[],
        )
    assert "unique" in str(ei.value).lower()


def test_edge_references_nonexistent_node_rejected():
    with pytest.raises(ValidationError) as ei:
        WorkflowConfig(
            mode="flexible",
            nodes=[_node("nd_a1b2c3d4e5", is_initial=True, is_final=True)],
            edges=[{"id": "ed_1", "source": "nd_a1b2c3d4e5", "target": "nd_missing1234"}],
            groups=[],
        )
    assert "non-existent" in str(ei.value).lower() or "archived" in str(ei.value).lower()


def test_edge_references_archived_node_rejected():
    with pytest.raises(ValidationError):
        WorkflowConfig(
            mode="flexible",
            nodes=[
                _node("nd_a1b2c3d4e5", is_initial=True, is_final=True),
                _node("nd_archived123", is_archived=True),
            ],
            edges=[{"id": "ed_1", "source": "nd_a1b2c3d4e5", "target": "nd_archived123"}],
            groups=[],
        )


def test_sequential_flexible_cycle_rejected():
    """Flow edges forming a cycle rejected in sequential-flexible."""
    with pytest.raises(ValidationError) as ei:
        WorkflowConfig(
            mode="sequential-flexible",
            nodes=[
                _node("nd_a1b2c3d4e5", is_initial=True),
                _node("nd_f6g7h8i9j0", is_final=True),
            ],
            edges=[
                {"id": "e1", "source": "nd_a1b2c3d4e5", "target": "nd_f6g7h8i9j0", "type": "flow"},
                {"id": "e2", "source": "nd_f6g7h8i9j0", "target": "nd_a1b2c3d4e5", "type": "flow"},
            ],
            groups=[],
        )
    assert "cycle" in str(ei.value).lower()


def test_sequential_flexible_feedback_cycle_allowed():
    """Same shape with type=feedback is exempt from cycle detection."""
    wf = WorkflowConfig(
        mode="sequential-flexible",
        nodes=[
            _node("nd_a1b2c3d4e5", is_initial=True),
            _node("nd_f6g7h8i9j0", is_final=True),
        ],
        edges=[
            {"id": "e1", "source": "nd_a1b2c3d4e5", "target": "nd_f6g7h8i9j0", "type": "flow"},
            {"id": "e2", "source": "nd_f6g7h8i9j0", "target": "nd_a1b2c3d4e5", "type": "feedback"},
        ],
        groups=[],
    )
    assert len(wf.edges) == 2


def test_flexible_mode_allows_cycles():
    """flexible mode does NOT run cycle detection — all modes except sequential-flexible ignore it."""
    wf = WorkflowConfig(
        mode="flexible",
        nodes=[
            _node("nd_a1b2c3d4e5", is_initial=True),
            _node("nd_f6g7h8i9j0", is_final=True),
        ],
        edges=[
            {"id": "e1", "source": "nd_a1b2c3d4e5", "target": "nd_f6g7h8i9j0", "type": "flow"},
            {"id": "e2", "source": "nd_f6g7h8i9j0", "target": "nd_a1b2c3d4e5", "type": "flow"},
        ],
        groups=[],
    )
    assert wf.mode == "flexible"


def test_group_shape_accepts_fe_form():
    """Phase 12 Plan 12-10 (Bug Y UAT fix) — backend WorkflowGroup now matches
    the FE-side shape `{id, name, color, children}`. Pre-fix the backend
    required `x/y/width/height` geometry which the FE never persisted.
    """
    wf = WorkflowConfig(
        mode="flexible",
        nodes=[_node(is_initial=True, is_final=True)],
        edges=[],
        groups=[{"id": "g1", "name": "G", "color": "#888", "children": ["nd_a1b2c3d4e5"]}],
    )
    assert wf.groups[0].id == "g1"
    assert wf.groups[0].children == ["nd_a1b2c3d4e5"]


def test_group_legacy_geometry_still_parses():
    """Pre-Phase-12 rows that wrote x/y/width/height must still parse — the
    fields are now Optional and ignored. Backwards-compatible additive change.
    """
    wf = WorkflowConfig(
        mode="flexible",
        nodes=[_node(is_initial=True, is_final=True)],
        edges=[],
        groups=[{
            "id": "g1", "name": "G", "color": "#888",
            "children": [],
            "x": 100, "y": 50, "width": 200, "height": 150,
        }],
    )
    assert wf.groups[0].x == 100
    assert wf.groups[0].width == 200
