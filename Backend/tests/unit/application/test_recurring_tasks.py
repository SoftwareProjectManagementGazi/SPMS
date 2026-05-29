"""TASK-06: Recurring tasks — real unit tests for the recurrence behaviour that
lives in ``UpdateTaskUseCase`` (manage_tasks.py).

Replaces the previous ``xfail(strict=False) + assert False`` stubs (flagged as
fake passes by the test audit). Each test drives the real use case with mocked
repositories and asserts on the observable recurrence side-effects
(``task_repo.create`` for the next instance, ``task_repo.update_series`` for
apply-to-all).

The former ``test_stop_recurring_marks_series_as_ended`` stub was removed: there
is no ``StopRecurringUseCase`` anywhere in the codebase, so any test for it could
only be a placeholder. Stopping a series today is done by PATCHing
``is_recurring=False`` on the task.
"""
from datetime import date, datetime

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.application.dtos.task_dtos import TaskUpdateDTO
from app.application.use_cases.manage_tasks import UpdateTaskUseCase
from app.domain.entities.board_column import BoardColumn
from app.domain.entities.project import Methodology, Project, ProjectStatus
from app.domain.entities.task import Task, TaskPriority


def _project(columns, *, has_recurring: bool = True) -> Project:
    """Minimal V2 project whose task_workflow toggles only ``has_recurring``.

    Edge-validation and WIP capabilities stay off so the recurrence path is
    exercised in isolation.
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


def _recurring_task(column_id, column, project, **overrides) -> Task:
    base = dict(
        id=42,
        title="Weekly standup",
        priority=TaskPriority.MEDIUM,
        project_id=1,
        column_id=column_id,
        column=column,
        project=project,
        is_recurring=True,
        recurrence_interval="weekly",
        recurrence_count=3,
        series_id="series-1",
        due_date=datetime(2026, 1, 8),
        created_at=datetime(2026, 1, 1),
    )
    base.update(overrides)
    return Task(**base)


def _wire(existing: Task, project: Project):
    """Build (task_repo, project_repo) mocks. ``update`` echoes the existing task
    (it carries created_at + column + project, so the response mapper succeeds).
    """
    task_repo = MagicMock()
    task_repo.get_by_id = AsyncMock(return_value=existing)
    task_repo.update = AsyncMock(return_value=existing)
    task_repo.create = AsyncMock(return_value=existing)
    task_repo.count_tasks_in_column = AsyncMock(return_value=0)
    task_repo.update_series = AsyncMock()
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=project)
    return task_repo, project_repo


@pytest.mark.asyncio
async def test_completing_recurring_task_creates_next_instance():
    """Moving a recurring task into a terminal column spawns the next instance."""
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    done = BoardColumn(id=3, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _project([todo, done], has_recurring=True)
    existing = _recurring_task(1, todo, project, recurrence_count=3)
    task_repo, project_repo = _wire(existing, project)

    await UpdateTaskUseCase(task_repo, project_repo).execute(
        task_id=42, dto=TaskUpdateDTO(column_id=3), user_id=99
    )

    task_repo.create.assert_awaited_once()  # kills mutation: dropping the next-instance block
    new_task = task_repo.create.await_args.args[0]
    assert new_task.is_recurring is True
    assert new_task.series_id == "series-1"  # stays in the same series
    assert new_task.recurrence_count == 2  # decremented from 3
    task_repo.update_series.assert_not_called()  # apply_to defaulted to "this"


@pytest.mark.asyncio
async def test_no_next_instance_when_target_not_terminal():
    """Moving to a non-terminal column must NOT spawn a next instance."""
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    doing = BoardColumn(id=2, project_id=1, name="Doing", order_index=1, is_terminal=False)
    done = BoardColumn(id=3, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _project([todo, doing, done], has_recurring=True)
    existing = _recurring_task(1, todo, project, recurrence_count=3)
    task_repo, project_repo = _wire(existing, project)

    await UpdateTaskUseCase(task_repo, project_repo).execute(
        task_id=42, dto=TaskUpdateDTO(column_id=2), user_id=99
    )

    task_repo.create.assert_not_called()


@pytest.mark.asyncio
async def test_end_date_reached_no_next_instance_created():
    """A past recurrence_end_date stops the series (regression guard for the
    date-vs-datetime comparison bug in _check_recurrence_should_continue)."""
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    done = BoardColumn(id=3, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _project([todo, done], has_recurring=True)
    existing = _recurring_task(
        1, todo, project, recurrence_end_date=date(2020, 1, 1), recurrence_count=5
    )
    task_repo, project_repo = _wire(existing, project)

    await UpdateTaskUseCase(task_repo, project_repo).execute(
        task_id=42, dto=TaskUpdateDTO(column_id=3), user_id=99
    )

    task_repo.create.assert_not_called()  # end date passed -> no new instance


@pytest.mark.asyncio
async def test_recurrence_count_exhausted_no_next_instance_created():
    """recurrence_count == 1 (last occurrence) -> no next instance."""
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    done = BoardColumn(id=3, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _project([todo, done], has_recurring=True)
    existing = _recurring_task(1, todo, project, recurrence_count=1)
    task_repo, project_repo = _wire(existing, project)

    await UpdateTaskUseCase(task_repo, project_repo).execute(
        task_id=42, dto=TaskUpdateDTO(column_id=3), user_id=99
    )

    task_repo.create.assert_not_called()  # kills mutation: dropping the count check


@pytest.mark.asyncio
async def test_has_recurring_capability_off_skips_next_instance():
    """With task_workflow.has_recurring=False the trigger is gated off."""
    todo = BoardColumn(id=1, project_id=1, name="To Do", order_index=0, is_initial=True)
    done = BoardColumn(id=3, project_id=1, name="Done", order_index=2, is_terminal=True)
    project = _project([todo, done], has_recurring=False)
    existing = _recurring_task(1, todo, project, recurrence_count=3)
    task_repo, project_repo = _wire(existing, project)

    await UpdateTaskUseCase(task_repo, project_repo).execute(
        task_id=42, dto=TaskUpdateDTO(column_id=3), user_id=99
    )

    task_repo.create.assert_not_called()


@pytest.mark.asyncio
async def test_apply_to_all_updates_all_future_instances():
    """apply_to='all' propagates the change to the whole series via update_series."""
    # No column change -> isolate the apply_to="all" propagation branch.
    existing = Task(
        id=42,
        title="Weekly",
        priority=TaskPriority.MEDIUM,
        project_id=1,
        is_recurring=True,
        series_id="series-1",
        created_at=datetime(2026, 1, 1),
    )
    task_repo = MagicMock()
    task_repo.get_by_id = AsyncMock(return_value=existing)
    task_repo.update = AsyncMock(return_value=existing)
    task_repo.update_series = AsyncMock()
    task_repo.create = AsyncMock()
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=None)

    await UpdateTaskUseCase(task_repo, project_repo).execute(
        task_id=42, dto=TaskUpdateDTO(title="Renamed"), user_id=99, apply_to="all"
    )

    # kills mutation: apply_to="all" only touching the current task.
    task_repo.update_series.assert_awaited_once_with("series-1", {"title": "Renamed"})


@pytest.mark.asyncio
async def test_apply_to_this_does_not_touch_series():
    """The default apply_to='this' must NOT propagate to the series."""
    existing = Task(
        id=42,
        title="Weekly",
        priority=TaskPriority.MEDIUM,
        project_id=1,
        is_recurring=True,
        series_id="series-1",
        created_at=datetime(2026, 1, 1),
    )
    task_repo = MagicMock()
    task_repo.get_by_id = AsyncMock(return_value=existing)
    task_repo.update = AsyncMock(return_value=existing)
    task_repo.update_series = AsyncMock()
    task_repo.create = AsyncMock()
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=None)

    await UpdateTaskUseCase(task_repo, project_repo).execute(
        task_id=42, dto=TaskUpdateDTO(title="Renamed"), user_id=99
    )

    task_repo.update_series.assert_not_called()
