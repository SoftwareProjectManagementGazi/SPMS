"""C6 Strangler — map_task_to_response_dto now delegates is_done to WorkflowEngine.

These tests pin the contract for the *first* engine-based read path so future
refactors (C7+, UpdateTaskUseCase edge validation) cannot accidentally regress
the read-side behaviour seen by API consumers.
"""
from datetime import datetime

from app.application.use_cases.manage_tasks import map_task_to_response_dto
from app.domain.entities.board_column import BoardColumn
from app.domain.entities.project import Methodology, Project, ProjectStatus
from app.domain.entities.task import Task, TaskPriority


def _mk_project(columns: list[BoardColumn]) -> Project:
    """Minimal V2 project — `task_workflow` is empty (no edges), so the engine
    relies on column flags / order_index for terminal detection.
    """
    return Project(
        id=1,
        key="K",
        name="P",
        start_date=datetime(2026, 1, 1),
        methodology=Methodology.KANBAN,
        status=ProjectStatus.ACTIVE,
        columns=columns,
        process_config={
            "schema_version": 2,
            "phase_workflow": {
                "mode": "flexible",
                "capabilities": {
                    "enforce_wip_limits": False,
                    "enforce_sequential_dependencies": False,
                    "restrict_expired_sprints": False,
                    "initial_node_id": None,
                },
                "nodes": [],
                "edges": [],
                "groups": [],
            },
            "task_workflow": {
                "capabilities": {"enforce_wip_limits": False, "initial_node_id": None},
                "edges": [],
                "groups": [],
            },
            "phase_completion_criteria": {},
            "enable_phase_assignment": False,
        },
    )


def test_map_task_to_response_dto_uses_is_terminal_flag():
    """When BoardColumn.is_terminal=True (post-migration 013 backfill), engine
    returns True even if order_index is not the maximum — proving the read
    path consults the flag, not the legacy max(order_index) shortcut.
    """
    # Intentionally make order_index NOT the max — flag alone must win.
    done_col = BoardColumn(id=10, project_id=1, name="Done", order_index=1, is_terminal=True)
    later_col = BoardColumn(id=11, project_id=1, name="Archive", order_index=99, is_terminal=False)
    project = _mk_project(columns=[done_col, later_col])
    task = Task(
        id=1,
        title="T",
        priority=TaskPriority.MEDIUM,
        project_id=1,
        column_id=10,
        column=done_col,
        project=project,
        created_at=datetime(2026, 1, 1),
    )

    dto = map_task_to_response_dto(task)

    assert dto.is_done is True
    assert dto.status == "done"


def test_map_task_to_response_dto_falls_back_to_order_index():
    """Legacy / unmigrated rows: BoardColumn.is_terminal=False but the column
    has the highest order_index. Engine fallback path mirrors the prior
    hard-coded max(order_index) behaviour exactly.
    """
    todo_col = BoardColumn(id=20, project_id=1, name="To Do", order_index=0, is_terminal=False)
    doing_col = BoardColumn(id=21, project_id=1, name="Doing", order_index=1, is_terminal=False)
    done_col = BoardColumn(id=22, project_id=1, name="Tamamlandı", order_index=2, is_terminal=False)
    project = _mk_project(columns=[todo_col, doing_col, done_col])
    task = Task(
        id=2,
        title="T2",
        priority=TaskPriority.MEDIUM,
        project_id=1,
        column_id=22,
        column=done_col,
        project=project,
        created_at=datetime(2026, 1, 1),
    )

    dto = map_task_to_response_dto(task)

    assert dto.is_done is True
    assert dto.status == "tamamlandı"


def test_map_task_to_response_dto_done_false_when_not_terminal():
    """Middle column (neither flagged nor highest order_index) -> is_done=False."""
    todo_col = BoardColumn(id=30, project_id=1, name="To Do", order_index=0, is_terminal=False)
    doing_col = BoardColumn(id=31, project_id=1, name="In Progress", order_index=1, is_terminal=False)
    done_col = BoardColumn(id=32, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _mk_project(columns=[todo_col, doing_col, done_col])
    task = Task(
        id=3,
        title="T3",
        priority=TaskPriority.MEDIUM,
        project_id=1,
        column_id=31,
        column=doing_col,
        project=project,
        created_at=datetime(2026, 1, 1),
    )

    dto = map_task_to_response_dto(task)

    assert dto.is_done is False
    assert dto.status == "in progress"
