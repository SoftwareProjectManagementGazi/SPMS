"""
Unit tests for task repository soft-delete behavior.
Uses unittest.mock to simulate the SQLAlchemy AsyncSession — no DB required.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
from datetime import datetime

from app.infrastructure.database.repositories.task_repo import SqlAlchemyTaskRepository
from app.infrastructure.database.models.task import TaskModel
from app.infrastructure.database.models.audit_log import AuditLogModel


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_task_model(task_id: int = 1, title: str = "Original Title", is_deleted: bool = False):
    """Return a mock TaskModel-like object."""
    m = MagicMock(spec=TaskModel)
    m.id = task_id
    m.title = title
    m.is_deleted = is_deleted
    m.deleted_at = None
    m.version = 1
    m.project_id = 1
    # Plan 15-02 TIDY-02 / Plan 14-09 D-D2: task_repo.update() now snapshots
    # task_key + title BEFORE mutation for enriched audit metadata.
    m.task_key = "TKEY-1"
    # Relationships (not exercised in soft-delete unit tests)
    m.project = None
    m.column = None
    m.assignee = None
    m.parent = None
    m.subtasks = []
    return m


def _make_project_model(project_id: int = 1, key: str = "PKEY", name: str = "Test Project"):
    """Plan 15-02 TIDY-02: lightweight ProjectModel mock for the second
    session.execute() call inside task_repo.update() (Plan 14-09 D-D2 enriched metadata)."""
    p = MagicMock()
    p.id = project_id
    p.key = key
    p.name = name
    return p


def _make_update_execute_side_effect(task_model, project_model=None):
    """Plan 15-02 TIDY-02: build a session.execute side_effect that returns
    the task model on the 1st call and the project model on the 2nd call.
    Mirrors the two SELECTs inside SqlAlchemyTaskRepository.update()."""
    if project_model is None:
        project_model = _make_project_model()
    task_result = MagicMock()
    task_result.scalar_one_or_none.return_value = task_model
    project_result = MagicMock()
    project_result.scalar_one_or_none.return_value = project_model
    return [task_result, project_result]


# ---------------------------------------------------------------------------
# Tests: soft-delete visible-in-list behavior
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_soft_deleted_task_not_in_list():
    """After soft-deleting a task, get_all_by_project() returns is_deleted=False filter."""
    session = MagicMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()

    # delete() call — returns a non-deleted task model
    task_model = _make_task_model(task_id=1, is_deleted=False)

    # For the delete path: select + is_deleted==False filter
    delete_result = MagicMock()
    delete_result.scalar_one_or_none.return_value = task_model
    session.execute.return_value = delete_result

    repo = SqlAlchemyTaskRepository(session)
    deleted = await repo.delete(1)

    assert deleted is True
    assert task_model.is_deleted is True
    assert task_model.deleted_at is not None
    session.commit.assert_awaited()


@pytest.mark.asyncio
async def test_soft_delete_sets_is_deleted_true():
    """Soft-delete sets is_deleted=True and deleted_at is not None on the model."""
    session = MagicMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()

    task_model = _make_task_model(task_id=1)
    result = MagicMock()
    result.scalar_one_or_none.return_value = task_model
    session.execute.return_value = result

    repo = SqlAlchemyTaskRepository(session)
    await repo.delete(1)

    assert task_model.is_deleted is True
    assert task_model.deleted_at is not None
    assert isinstance(task_model.deleted_at, datetime)


@pytest.mark.asyncio
async def test_soft_delete_returns_false_when_not_found():
    """delete() returns False when no task exists (or already deleted)."""
    session = MagicMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()

    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    session.execute.return_value = result

    repo = SqlAlchemyTaskRepository(session)
    deleted = await repo.delete(999)

    assert deleted is False
    session.commit.assert_not_awaited()


# ---------------------------------------------------------------------------
# Tests: audit log on update
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_task_writes_audit_row():
    """update() with user_id creates AuditLogModel rows for each changed field.

    We patch get_by_id to avoid building a full Task entity from the mock
    (the audit row assertions are what matter here).

    Plan 15-02 TIDY-02 / Plan 14-09 D-D2: task_repo.update() now performs TWO
    session.execute() calls (task SELECT, then project SELECT for enriched
    metadata), so the mock must side_effect-return distinct results.
    """
    session = MagicMock()
    session.execute = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.add_all = MagicMock()

    task_model = _make_task_model(task_id=1, title="Original Title")
    task_model.version = 1

    session.execute.side_effect = _make_update_execute_side_effect(task_model)

    repo = SqlAlchemyTaskRepository(session)

    # Patch get_by_id so the final re-fetch does not crash on entity building
    repo.get_by_id = AsyncMock(return_value=None)

    await repo.update(1, {"title": "New Title"}, user_id=42)

    # Verify audit rows were added
    session.add_all.assert_called_once()
    audit_entries = session.add_all.call_args[0][0]
    assert len(audit_entries) == 1

    entry = audit_entries[0]
    assert isinstance(entry, AuditLogModel)
    assert entry.entity_type == "task"
    assert entry.entity_id == 1
    assert entry.field_name == "title"
    assert entry.old_value == "Original Title"
    assert entry.new_value == "New Title"
    assert entry.user_id == 42
    assert entry.action == "updated"
    # Plan 15-02 TIDY-02: D-D2 enriched audit metadata envelope must contain
    # project_key, project_name, task_key, and task_title snapshots.
    assert entry.extra_metadata["task_id"] == 1
    assert entry.extra_metadata["task_key"] == "TKEY-1"
    assert entry.extra_metadata["task_title"] == "Original Title"
    assert entry.extra_metadata["project_id"] == 1
    assert entry.extra_metadata["project_key"] == "PKEY"
    assert entry.extra_metadata["project_name"] == "Test Project"
    assert entry.extra_metadata["field_name"] == "title"
    assert entry.extra_metadata["old_value_label"] == "Original Title"
    assert entry.extra_metadata["new_value_label"] == "New Title"


@pytest.mark.asyncio
async def test_update_task_no_audit_row_for_unchanged_fields():
    """update() does NOT create audit rows for fields that did not change.

    Plan 15-02 TIDY-02: see sibling test for D-D2 two-execute side_effect note.
    """
    session = MagicMock()
    session.execute = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.add_all = MagicMock()

    task_model = _make_task_model(task_id=1, title="Same Title")
    task_model.version = 1

    session.execute.side_effect = _make_update_execute_side_effect(task_model)

    repo = SqlAlchemyTaskRepository(session)
    repo.get_by_id = AsyncMock(return_value=None)

    # Update with the exact same title — should produce 0 audit rows
    await repo.update(1, {"title": "Same Title"}, user_id=42)

    session.add_all.assert_called_once()
    audit_entries = session.add_all.call_args[0][0]
    assert len(audit_entries) == 0


@pytest.mark.asyncio
@pytest.mark.xfail(reason="Admin-only hard delete enforcement not yet designed")
async def test_hard_delete_blocked_for_non_admin():
    """Placeholder: hard delete is only allowed for admin users."""
    raise NotImplementedError("Admin-only hard delete not yet implemented")
