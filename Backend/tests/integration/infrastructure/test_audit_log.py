"""Integration tests for audit-log field-level change tracking.

These verify the repository layer writes an ``audit_log`` row when a task or
project is updated.

Previously each test carried a redundant ``@pytest.mark.xfail`` *on top of*
``requires_db`` and bailed with ``pytest.skip`` unless it happened to find a
pre-existing row in the DB — so with a live DB they reported XPASS (passing
tests mislabelled as expected-failures) and with an empty DB they silently
skipped. The audit flagged this: an xfail-as-skip masks real failures and a
"find any existing row" setup couples the test to leaked/shared state.

Now each test SEEDS its own project/task in the transactional ``db_session``
(rolled back after the test) and asserts the audit row deterministically. The
only gate is ``requires_db`` (auto-skip when Postgres is unreachable).
"""
import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.repositories.task_repo import SqlAlchemyTaskRepository
from app.infrastructure.database.repositories.project_repo import SqlAlchemyProjectRepository

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


async def _seed_project(db_session, key: str, name: str) -> int:
    existing = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    if existing:
        return existing
    await db_session.execute(
        text(
            "INSERT INTO projects (key, name, start_date, methodology, status) "
            "VALUES (:k, :n, now(), 'KANBAN', 'ACTIVE')"
        ),
        {"k": key, "n": name},
    )
    await db_session.flush()
    return (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()


async def _seed_task(db_session, project_id: int, title: str) -> int:
    await db_session.execute(
        text("INSERT INTO tasks (title, project_id, priority) VALUES (:t, :p, 'MEDIUM')"),
        {"t": title, "p": project_id},
    )
    await db_session.flush()
    return (
        await db_session.execute(
            text("SELECT id FROM tasks WHERE project_id=:p ORDER BY id DESC LIMIT 1"),
            {"p": project_id},
        )
    ).scalar()


@pytest.mark.asyncio
async def test_update_task_writes_audit_row(db_session: AsyncSession):
    """Updating a task's title writes one audit_log row with old/new values + action."""
    pid = await _seed_project(db_session, "AUDT1", "Audit Task Project")
    tid = await _seed_task(db_session, pid, "Original Title")

    repo = SqlAlchemyTaskRepository(db_session)
    await repo.update(tid, {"title": "Original Title (edited)"}, user_id=1)

    audit_row = (
        await db_session.execute(
            select(AuditLogModel).where(
                AuditLogModel.entity_type == "task",
                AuditLogModel.entity_id == tid,
                AuditLogModel.field_name == "title",
            )
        )
    ).scalar_one_or_none()

    # kills mutation: dropping the audit write in repo.update leaves this None.
    assert audit_row is not None, "Audit row must be created on task update"
    assert audit_row.old_value == "Original Title"
    assert audit_row.new_value == "Original Title (edited)"
    assert audit_row.action == "updated"


@pytest.mark.asyncio
async def test_update_project_writes_audit_row(db_session: AsyncSession):
    """Updating a project's name writes an audit_log row with entity_type='project'."""
    pid = await _seed_project(db_session, "AUDP1", "Original Project Name")

    repo = SqlAlchemyProjectRepository(db_session)
    project = await repo.get_by_id(pid)
    updated_project = project.model_copy(update={"name": "Renamed Project"})
    await repo.update(updated_project, user_id=1)

    audit_row = (
        await db_session.execute(
            select(AuditLogModel).where(
                AuditLogModel.entity_type == "project",
                AuditLogModel.entity_id == pid,
                AuditLogModel.field_name == "name",
            )
        )
    ).scalar_one_or_none()

    assert audit_row is not None, "Audit row must be created on project update"
    assert audit_row.old_value == "Original Project Name"
    assert audit_row.new_value == "Renamed Project"


@pytest.mark.asyncio
async def test_audit_row_has_user_id(db_session: AsyncSession):
    """The audit row records the user_id of the actor who made the change."""
    pid = await _seed_project(db_session, "AUDU1", "Audit User Project")
    tid = await _seed_task(db_session, pid, "Title For User Test")

    repo = SqlAlchemyTaskRepository(db_session)
    test_user_id = 1
    await repo.update(tid, {"title": "Title For User Test (edited)"}, user_id=test_user_id)

    audit_row = (
        await db_session.execute(
            select(AuditLogModel).where(
                AuditLogModel.entity_type == "task",
                AuditLogModel.entity_id == tid,
                AuditLogModel.field_name == "title",
            )
        )
    ).scalar_one_or_none()

    assert audit_row is not None
    # kills mutation: hard-coding user_id=None / wrong actor fails here.
    assert audit_row.user_id == test_user_id
