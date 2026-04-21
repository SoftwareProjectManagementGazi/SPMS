"""API-10 / D-54, D-55 Workflow Pydantic validation tests."""
import pytest
from pydantic import ValidationError
from app.application.dtos.workflow_dtos import WorkflowConfig, WorkflowNode, WorkflowEdge, WorkflowGroup


def _node(nid="nd_a1b2c3d4e5", is_archived=False):
    return {"id": nid, "name": "N", "x": 0.0, "y": 0.0, "color": "#888", "is_archived": is_archived}


def test_valid_minimal_workflow():
    wf = WorkflowConfig(mode="flexible", nodes=[_node()], edges=[], groups=[])
    assert wf.mode == "flexible"


def test_node_id_bad_format_rejected():
    with pytest.raises(ValidationError):
        WorkflowConfig(mode="flexible", nodes=[_node("bad")], edges=[], groups=[])


def test_duplicate_node_ids_rejected():
    with pytest.raises(ValidationError) as ei:
        WorkflowConfig(
            mode="flexible",
            nodes=[_node("nd_a1b2c3d4e5"), _node("nd_a1b2c3d4e5")],
            edges=[], groups=[],
        )
    assert "unique" in str(ei.value).lower()


def test_edge_references_nonexistent_node_rejected():
    with pytest.raises(ValidationError) as ei:
        WorkflowConfig(
            mode="flexible",
            nodes=[_node("nd_a1b2c3d4e5")],
            edges=[{"id": "ed_1", "source": "nd_a1b2c3d4e5", "target": "nd_missing1234"}],
            groups=[],
        )
    assert "non-existent" in str(ei.value).lower() or "archived" in str(ei.value).lower()


def test_edge_references_archived_node_rejected():
    with pytest.raises(ValidationError):
        WorkflowConfig(
            mode="flexible",
            nodes=[_node("nd_a1b2c3d4e5"), _node("nd_archived123", is_archived=True)],
            edges=[{"id": "ed_1", "source": "nd_a1b2c3d4e5", "target": "nd_archived123"}],
            groups=[],
        )


def test_sequential_flexible_cycle_rejected():
    """Flow edges forming a cycle rejected in sequential-flexible."""
    with pytest.raises(ValidationError) as ei:
        WorkflowConfig(
            mode="sequential-flexible",
            nodes=[_node("nd_a1b2c3d4e5"), _node("nd_f6g7h8i9j0")],
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
        nodes=[_node("nd_a1b2c3d4e5"), _node("nd_f6g7h8i9j0")],
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
        nodes=[_node("nd_a1b2c3d4e5"), _node("nd_f6g7h8i9j0")],
        edges=[
            {"id": "e1", "source": "nd_a1b2c3d4e5", "target": "nd_f6g7h8i9j0", "type": "flow"},
            {"id": "e2", "source": "nd_f6g7h8i9j0", "target": "nd_a1b2c3d4e5", "type": "flow"},
        ],
        groups=[],
    )
    assert wf.mode == "flexible"


def test_group_bounds_invalid():
    with pytest.raises(ValidationError):
        WorkflowConfig(
            mode="flexible",
            nodes=[_node()],
            edges=[],
            groups=[{"id": "g1", "name": "G", "x": -1, "y": 0, "width": 100, "height": 100, "color": "#888"}],
        )
    with pytest.raises(ValidationError):
        WorkflowConfig(
            mode="flexible",
            nodes=[_node()],
            edges=[],
            groups=[{"id": "g1", "name": "G", "x": 0, "y": 0, "width": 0, "height": 100, "color": "#888"}],
        )
