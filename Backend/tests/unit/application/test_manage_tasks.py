"""C6 / C7 Strangler — read-path and write-path engine integration tests.

C6: map_task_to_response_dto delegates is_done to WorkflowEngine (3 tests).
C7: UpdateTaskUseCase.execute consults WorkflowEngine.can_move() when
    task_workflow.capabilities.enforce_sequential_dependencies=True (5 tests).

These tests pin the contract for both engine-based code paths so future
refactors (C8+, WIP enforcement) cannot accidentally regress observable
API behaviour.
"""
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.dtos.task_dtos import TaskUpdateDTO
from app.application.use_cases.manage_tasks import (
    UpdateTaskUseCase,
    map_task_to_response_dto,
)
from app.domain.entities.board_column import BoardColumn
from app.domain.entities.project import Methodology, Project, ProjectStatus
from app.domain.entities.task import Task, TaskPriority
from app.domain.exceptions import InvalidColumnMoveError


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


# ---------------------------------------------------------------------------
# C7 — UpdateTaskUseCase engine-driven edge validation tests
# ---------------------------------------------------------------------------


def _mk_project_with_workflow(
    *,
    columns: list[BoardColumn],
    enforce_sequential: bool,
    edges: list[dict] | None = None,
) -> Project:
    """Build a Project whose task_workflow can flip the C7 capability and edge
    set independently. Phase workflow stays inert (no nodes/edges) — the C7
    code path only touches task_workflow.
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
                "capabilities": {
                    "enforce_wip_limits": False,
                    "enforce_sequential_dependencies": enforce_sequential,
                    "initial_node_id": None,
                },
                "edges": edges or [],
                "groups": [],
            },
            "phase_completion_criteria": {},
            "enable_phase_assignment": False,
        },
    )


def _mk_existing_task(
    column_id: int, column: BoardColumn, project: Project
) -> Task:
    """Existing task fixture — non-recurring (skips the recurrence next-instance
    branch) so the move-validation path is exercised in isolation.
    """
    return Task(
        id=42,
        title="Existing",
        priority=TaskPriority.MEDIUM,
        project_id=1,
        column_id=column_id,
        column=column,
        project=project,
        is_recurring=False,
        created_at=datetime(2026, 1, 1),
    )


def _wire_mocks(existing_task: Task, project: Project, target_col: BoardColumn):
    """Build the (task_repo, project_repo) pair the use case expects.

    `task_repo.update` returns a fresh task whose column has been swapped to
    `target_col` so the post-update mapper call produces a coherent DTO.
    """
    updated = existing_task.model_copy(
        update={"column_id": target_col.id, "column": target_col}
    )

    task_repo = MagicMock()
    task_repo.get_by_id = AsyncMock(return_value=existing_task)
    task_repo.update = AsyncMock(return_value=updated)

    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=project)

    return task_repo, project_repo


@pytest.mark.asyncio
async def test_update_task_move_allowed_when_engine_disabled():
    """Default capability=False -> any move passes through, even with no edges.

    This is the regression-safety contract: existing projects never see a 400
    until they opt into the capability.
    """
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    done = BoardColumn(id=3, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _mk_project_with_workflow(
        columns=[todo, done], enforce_sequential=False, edges=[]
    )
    existing = _mk_existing_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, done)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=3)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 3
    task_repo.update.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_task_move_denied_when_no_edge_and_engine_enabled():
    """Capability ON + no edge connecting source -> target -> 400.

    Source column uses exit_policy='edges_only' so engine cannot short-circuit
    on the default exit_policy='any' bypass.
    """
    todo = BoardColumn(
        id=1, project_id=1, name="To Do", order_index=0,
        is_initial=True, exit_policy="edges_only",
    )
    done = BoardColumn(id=3, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _mk_project_with_workflow(
        columns=[todo, done], enforce_sequential=True, edges=[]
    )
    existing = _mk_existing_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, done)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=3)

    with pytest.raises(InvalidColumnMoveError) as ei:
        await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert ei.value.from_id == 1
    assert ei.value.to_id == 3
    assert "No edge" in ei.value.reason
    task_repo.update.assert_not_called()


@pytest.mark.asyncio
async def test_update_task_move_allowed_with_direct_edge():
    """Capability ON + edge {source: 1, target: 3} -> move succeeds.

    Same exit_policy='edges_only' fixture as the denied case so the edge
    lookup (not the policy bypass) is what allows the move.
    """
    todo = BoardColumn(
        id=1, project_id=1, name="To Do", order_index=0,
        is_initial=True, exit_policy="edges_only",
    )
    done = BoardColumn(id=3, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _mk_project_with_workflow(
        columns=[todo, done],
        enforce_sequential=True,
        edges=[{"source": 1, "target": 3}],
    )
    existing = _mk_existing_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, done)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=3)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 3
    task_repo.update.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_task_move_allowed_with_bidirectional_edge():
    """Edge {source: 1, target: 3, bidirectional: True} -> reverse move
    3 -> 1 succeeds even though no direct edge exists in that direction.
    """
    todo = BoardColumn(
        id=1, project_id=1, name="To Do", order_index=0, is_initial=True,
    )
    done = BoardColumn(
        id=3, project_id=1, name="Done", order_index=2,
        is_terminal=True, exit_policy="edges_only",
    )
    project = _mk_project_with_workflow(
        columns=[todo, done],
        enforce_sequential=True,
        edges=[{"source": 1, "target": 3, "bidirectional": True}],
    )
    # Reverse direction: task is currently in Done, moving back to To Do.
    existing = _mk_existing_task(column_id=3, column=done, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, todo)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=1)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 1
    task_repo.update.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_task_move_same_column_noop_allowed():
    """dto.column_id == existing_task.column_id -> engine is NOT consulted.

    Engine block sits inside `if existing_task.column_id != dto.column_id`.
    A same-column 'move' must always succeed regardless of capability or
    edges, otherwise an unrelated PATCH (e.g. retitle while column stays
    fixed) would 400.
    """
    todo = BoardColumn(
        id=1, project_id=1, name="To Do", order_index=0,
        is_initial=True, exit_policy="edges_only",
    )
    done = BoardColumn(id=3, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _mk_project_with_workflow(
        columns=[todo, done], enforce_sequential=True, edges=[]
    )
    existing = _mk_existing_task(column_id=1, column=todo, project=project)
    # Target equals source -> the use case should never raise even though
    # there is no edge and exit_policy is 'edges_only'.
    task_repo, project_repo = _wire_mocks(existing, project, todo)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=1)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 1
    task_repo.update.assert_awaited_once()
