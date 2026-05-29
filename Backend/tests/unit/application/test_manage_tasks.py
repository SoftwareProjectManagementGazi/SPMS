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
from app.domain.exceptions import InvalidColumnMoveError, WipLimitExceededError


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


# ---------------------------------------------------------------------------
# C8 — UpdateTaskUseCase engine-driven WIP enforcement tests
# ---------------------------------------------------------------------------


def _mk_project_with_wip_workflow(
    *,
    columns: list[BoardColumn],
    enforce_wip: bool,
) -> Project:
    """Build a Project whose task_workflow toggles ONLY ``enforce_wip_limits``.

    Edge validation capability stays False so the WIP path is exercised in
    isolation — a denial in these tests must come from WipLimitExceededError,
    never from InvalidColumnMoveError leaking in.
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
                    "enforce_wip_limits": enforce_wip,
                    "enforce_sequential_dependencies": False,
                    "initial_node_id": None,
                },
                "edges": [],
                "groups": [],
            },
            "phase_completion_criteria": {},
            "enable_phase_assignment": False,
        },
    )


@pytest.mark.asyncio
async def test_wip_enforced_blocks_when_full():
    """Capability ON + wip_limit=2 + current=2 -> WipLimitExceededError, no update."""
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    doing = BoardColumn(
        id=2, project_id=1, name="Doing", order_index=1, wip_limit=2,
    )
    project = _mk_project_with_wip_workflow(columns=[todo, doing], enforce_wip=True)
    existing = _mk_existing_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, doing)
    # Target column already holds 2 active tasks (limit reached).
    task_repo.count_tasks_in_column = AsyncMock(return_value=2)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=2)

    with pytest.raises(WipLimitExceededError) as ei:
        await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert ei.value.column_id == 2
    assert ei.value.column_name == "Doing"
    assert ei.value.limit == 2
    assert ei.value.current == 2
    task_repo.count_tasks_in_column.assert_awaited_once_with(2, exclude_task_id=42)
    task_repo.update.assert_not_called()


@pytest.mark.asyncio
async def test_wip_disabled_when_capability_off():
    """Capability OFF -> count_tasks_in_column is NEVER queried; move succeeds.

    Even with wip_limit=2 and a hypothetical current_count well above the
    limit, the engine must bypass the WIP branch entirely. This is the
    zero-regression contract that lets existing projects keep working until
    they explicitly opt into WIP enforcement.
    """
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    doing = BoardColumn(
        id=2, project_id=1, name="Doing", order_index=1, wip_limit=2,
    )
    project = _mk_project_with_wip_workflow(columns=[todo, doing], enforce_wip=False)
    existing = _mk_existing_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, doing)
    # Make count_tasks_in_column return a tripwire value — if the code path
    # accidentally calls it, this would still let the move through (count=10
    # is far above the limit) so we additionally assert it was never awaited.
    task_repo.count_tasks_in_column = AsyncMock(return_value=10)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=2)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 2
    task_repo.count_tasks_in_column.assert_not_called()
    task_repo.update.assert_awaited_once()


@pytest.mark.asyncio
async def test_wip_zero_means_unlimited():
    """Capability ON + wip_limit=0 -> no limit enforced regardless of count.

    ``check_wip`` treats limit<=0 as "unlimited" so a column that was never
    given an explicit cap (the BoardColumn default) accepts any number of
    tasks even when the capability is on.
    """
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    doing = BoardColumn(
        id=2, project_id=1, name="Doing", order_index=1, wip_limit=0,
    )
    project = _mk_project_with_wip_workflow(columns=[todo, doing], enforce_wip=True)
    existing = _mk_existing_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, doing)
    task_repo.count_tasks_in_column = AsyncMock(return_value=100)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=2)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 2
    # The count IS queried (we entered the capability branch) but the engine
    # short-circuits because limit==0; no exception is raised.
    task_repo.count_tasks_in_column.assert_awaited_once_with(2, exclude_task_id=42)
    task_repo.update.assert_awaited_once()


@pytest.mark.asyncio
async def test_wip_excludes_self_when_moving_within():
    """Same-column "move" -> the engine branch is skipped entirely.

    When dto.column_id == existing_task.column_id the use case must not
    consult the engine OR the repo's count helper — otherwise a retitle
    PATCH on a task sitting in a full column would fail with 409.
    """
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    doing = BoardColumn(
        id=2, project_id=1, name="Doing", order_index=1, wip_limit=1,
    )
    project = _mk_project_with_wip_workflow(columns=[todo, doing], enforce_wip=True)
    # Task already sits in "Doing" (the full column).
    existing = _mk_existing_task(column_id=2, column=doing, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, doing)
    task_repo.count_tasks_in_column = AsyncMock(return_value=1)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    # Same-column "move" — engine block must not be entered.
    dto = TaskUpdateDTO(column_id=2)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 2
    task_repo.count_tasks_in_column.assert_not_called()
    task_repo.update.assert_awaited_once()


# ---------------------------------------------------------------------------
# C9 — Recurring trigger via WorkflowEngine.is_terminal()
# ---------------------------------------------------------------------------
# UpdateTaskUseCase no longer matches column.name.lower() against
# ("done", "completed", "closed"). Instead it asks engine.is_terminal(target)
# — language-agnostic, capability-gated by task_workflow.capabilities
# .has_recurring (default True). These tests pin all four branches of that
# gate (terminal+enabled, non-terminal, disabled, legacy fallback).


def _mk_project_with_recurring_workflow(
    *,
    columns: list[BoardColumn],
    has_recurring: bool = True,
) -> Project:
    """Build a Project whose task_workflow toggles ONLY ``has_recurring``.

    Edge validation & WIP capabilities stay False so the C9 path is exercised
    in isolation — any test failure here must come from the recurring trigger
    branch, never from C7/C8 leaking in.
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
                    "enforce_sequential_dependencies": False,
                    "has_recurring": has_recurring,
                    "initial_node_id": None,
                },
                "edges": [],
                "groups": [],
            },
            "phase_completion_criteria": {},
            "enable_phase_assignment": False,
        },
    )


def _mk_recurring_task(column_id: int, column: BoardColumn, project: Project) -> Task:
    """Recurring-task fixture for C9 tests.

    ``recurrence_count=3`` is the loop-continue value used by
    ``_check_recurrence_should_continue`` (anything > 1 keeps the series alive).
    ``recurrence_end_date`` is left None so the date comparison branch in that
    helper is skipped — the trigger we want to observe here is purely the
    is_terminal/cap interaction, not series-end logic.
    """
    return Task(
        id=42,
        title="Recurring",
        priority=TaskPriority.MEDIUM,
        project_id=1,
        column_id=column_id,
        column=column,
        project=project,
        is_recurring=True,
        recurrence_interval="weekly",
        recurrence_count=3,
        series_id="series-uuid-test",
        due_date=datetime(2026, 1, 8),
        created_at=datetime(2026, 1, 1),
    )


@pytest.mark.asyncio
async def test_recurring_triggers_on_is_terminal_column():
    """is_terminal=True target column + has_recurring=True -> next instance created.

    Custom non-English terminal column name ("Tamamlandı") proves the trigger
    is language-agnostic. The old hard-coded match against
    {"done","completed","closed"} would never have fired on this name; engine
    .is_terminal() does because the column carries the explicit flag.
    """
    todo = BoardColumn(
        id=1, project_id=1, name="Yapılacak", order_index=0, is_initial=True,
    )
    tamamlandi = BoardColumn(
        id=3, project_id=1, name="Tamamlandı", order_index=2, is_terminal=True,
    )
    project = _mk_project_with_recurring_workflow(
        columns=[todo, tamamlandi], has_recurring=True
    )
    existing = _mk_recurring_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, tamamlandi)
    # `_create_next_recurrence_instance` calls task_repo.create — wire it.
    task_repo.create = AsyncMock(return_value=existing)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=3)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 3
    # The recurring-next-instance was created exactly once.
    task_repo.create.assert_awaited_once()
    # Sanity: the new task carries the same series_id and is_recurring=True.
    new_task_arg = task_repo.create.await_args.args[0]
    assert new_task_arg.series_id == "series-uuid-test"
    assert new_task_arg.is_recurring is True


@pytest.mark.asyncio
async def test_recurring_does_not_trigger_on_non_terminal():
    """Middle (non-terminal) column move -> no next instance created.

    Even with has_recurring=True and a recurring task, moving to a
    non-terminal column ("Doing") must not spawn a next instance.
    """
    todo = BoardColumn(
        id=1, project_id=1, name="To Do", order_index=0, is_initial=True,
    )
    doing = BoardColumn(
        id=2, project_id=1, name="Doing", order_index=1, is_terminal=False,
    )
    done = BoardColumn(
        id=3, project_id=1, name="Done", order_index=2, is_terminal=True,
    )
    project = _mk_project_with_recurring_workflow(
        columns=[todo, doing, done], has_recurring=True
    )
    existing = _mk_recurring_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, doing)
    task_repo.create = AsyncMock()

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=2)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 2
    # No recurring instance — Doing is not terminal.
    task_repo.create.assert_not_called()


@pytest.mark.asyncio
async def test_recurring_disabled_when_has_recurring_off():
    """has_recurring=False -> trigger is skipped even on a terminal column.

    This is the per-project opt-out: a workflow editor will eventually expose
    has_recurring as a toggle so admins can pause series creation without
    deleting the recurring tasks themselves.
    """
    todo = BoardColumn(
        id=1, project_id=1, name="To Do", order_index=0, is_initial=True,
    )
    done = BoardColumn(
        id=3, project_id=1, name="Done", order_index=2, is_terminal=True,
    )
    project = _mk_project_with_recurring_workflow(
        columns=[todo, done], has_recurring=False
    )
    existing = _mk_recurring_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, done)
    task_repo.create = AsyncMock()

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=3)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 3
    # Capability gate held — no creation despite landing in a terminal column.
    task_repo.create.assert_not_called()


@pytest.mark.asyncio
async def test_recurring_legacy_done_column_still_works():
    """Legacy / unmigrated rows: is_terminal=None but max(order_index) wins.

    Pre-migration-013 columns carry is_terminal=None. engine.is_terminal()'s
    fallback path matches the column with max(order_index) as terminal — so
    a recurring task moved to that column still triggers, with NO hard-coded
    English string match anywhere in the use case.
    """
    todo = BoardColumn(
        id=1, project_id=1, name="To Do", order_index=0, is_initial=True,
        is_terminal=False,  # legacy default
    )
    # Highest order_index, but is_terminal explicitly False (mirrors a row
    # that pre-dates migration 013's backfill of is_terminal=True).
    legacy_done = BoardColumn(
        id=3, project_id=1, name="Done", order_index=2, is_terminal=False,
    )
    project = _mk_project_with_recurring_workflow(
        columns=[todo, legacy_done], has_recurring=True
    )
    existing = _mk_recurring_task(column_id=1, column=todo, project=project)
    task_repo, project_repo = _wire_mocks(existing, project, legacy_done)
    task_repo.create = AsyncMock(return_value=existing)

    use_case = UpdateTaskUseCase(task_repo, project_repo)
    dto = TaskUpdateDTO(column_id=3)

    result = await use_case.execute(task_id=42, dto=dto, user_id=99)

    assert result.column_id == 3
    # Engine fell back to max(order_index) — a recurring instance was created.
    task_repo.create.assert_awaited_once()
    # kills mutation: assert WHAT was created (the next recurring instance), not
    # merely that create() fired.
    created = task_repo.create.await_args.args[0]
    assert created.is_recurring is True
    assert created.title == existing.title
