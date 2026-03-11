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
    # Relationships (not exercised in soft-delete unit tests)
    m.project = None
    m.column = None
    m.assignee = None
    m.parent = None
    m.subtasks = []
    return m


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
    """
    session = MagicMock()
    session.execute = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.add_all = MagicMock()

    task_model = _make_task_model(task_id=1, title="Original Title")
    task_model.version = 1

    # Only the first execute matters: fetch current model for update
    fetch_result = MagicMock()
    fetch_result.scalar_one_or_none.return_value = task_model
    session.execute.return_value = fetch_result

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


@pytest.mark.asyncio
async def test_update_task_no_audit_row_for_unchanged_fields():
    """update() does NOT create audit rows for fields that did not change."""
    session = MagicMock()
    session.execute = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.add_all = MagicMock()

    task_model = _make_task_model(task_id=1, title="Same Title")
    task_model.version = 1

    fetch_result = MagicMock()
    fetch_result.scalar_one_or_none.return_value = task_model
    session.execute.return_value = fetch_result

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
