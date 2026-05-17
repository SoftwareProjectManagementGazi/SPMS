"""Project entity factory."""
from datetime import datetime
from typing import Any, Optional
from app.domain.entities.project import Project, Methodology

_counter = {"value": 0}


def make_project(
    key: Optional[str] = None,
    name: str = "Test Project",
    methodology: Methodology = Methodology.SCRUM,
    manager_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    process_config: Optional[dict] = None,
    id: Optional[int] = None,
    **extra: Any,
) -> Project:
    _counter["value"] += 1
    n = _counter["value"]
    # Default workflow stub suitable for Phase Gate tests.
    # C3: V2 schema — `workflow` renamed to `phase_workflow`, engine flags moved
    # into `phase_workflow.capabilities`, and a `task_workflow` placeholder is
    # seeded. See .planning/workflow-engine-implementation.md C3 + C1.
    default_pc = {
        "schema_version": 2,
        "phase_workflow": {
            "mode": "flexible",
            "capabilities": {
                "enforce_wip_limits": False,
                "enforce_sequential_dependencies": False,
                "restrict_expired_sprints": False,
                "initial_node_id": "nd_SrcPhase001",
            },
            "nodes": [
                {"id": "nd_SrcPhase001", "name": "Source", "x": 0, "y": 0, "color": "#888", "is_archived": False, "is_initial": True, "is_final": False},
                {"id": "nd_TgtPhase001", "name": "Target", "x": 100, "y": 0, "color": "#888", "is_archived": False, "is_initial": False, "is_final": True},
            ],
            "edges": [{"id": "ed_1", "source": "nd_SrcPhase001", "target": "nd_TgtPhase001", "type": "flow"}],
            "groups": [],
        },
        "task_workflow": {
            "capabilities": {"enforce_wip_limits": False, "initial_node_id": None},
            "edges": [],
            "groups": [],
        },
        "phase_completion_criteria": {},
        "enable_phase_assignment": False,
        "backlog_definition": "cycle_null",
        "cycle_label": None,
    }
    return Project(
        id=id,
        key=key or f"TEST{n}",
        name=name,
        methodology=methodology,
        manager_id=manager_id,
        start_date=start_date or datetime(2026, 1, 1),
        process_config=process_config if process_config is not None else default_pc,
        **{k: v for k, v in extra.items() if k not in ("created_at",)},
    )
