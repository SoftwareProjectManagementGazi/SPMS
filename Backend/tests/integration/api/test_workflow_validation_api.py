"""API-10 Workflow validation — end-to-end smoke tests.

Full PATCH endpoint integration is in plan 09-10. This file verifies the DTO
is usable from the API layer (no import issues). Unit coverage of rules is
in tests/unit/application/test_workflow_validation.py.
"""
from app.application.dtos.workflow_dtos import WorkflowConfig


def test_workflow_config_importable():
    """Smoke: WorkflowConfig reachable from API layer imports."""
    assert WorkflowConfig is not None


def test_workflow_config_validates_minimal():
    wf = WorkflowConfig(
        mode="flexible",
        nodes=[{"id": "nd_a1b2c3d4e5", "name": "N", "x": 0, "y": 0, "color": "#888"}],
        edges=[], groups=[],
    )
    assert wf.mode == "flexible"
