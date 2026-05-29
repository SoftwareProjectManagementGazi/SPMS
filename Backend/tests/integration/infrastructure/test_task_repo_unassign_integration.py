"""P4: SqlAlchemyTaskRepository.unassign_incomplete_tasks integration test.

Covers the repository SQL behind "removing a project member keeps the assignee on
DONE tasks but clears it on incomplete ones" (task_repo.py). This is pure SQL — a
board-column-name ``ilike '%done%'`` carve-out on a bulk UPDATE — so it is
deliberately NOT unit-tested with a fake (the audit's P4 coverage gap). Here the
real repo runs against the DB: seed a Done + a non-Done column, assign a task in
each to a user, call unassign_incomplete_tasks, then assert the Done task keeps
its assignee while the incomplete one is cleared.

Data seeded into the transactional db_session rolls back after the test (the
repo's internal commit is undone by the connection-level rollback — see
test_phase_report_repo_integration, whose committing repo is re-runnable).
"""
import pytest
from sqlalchemy import text

from app.infrastructure.database.repositories.task_repo import SqlAlchemyTaskRepository

pytestmark = pytest.mark.requires_db


async def _assignee_of(session, task_id: int):
    return (
        await session.execute(
            text("SELECT assignee_id FROM tasks WHERE id = :i"), {"i": task_id}
        )
    ).scalar()


async def _scalar(session, sql: str, **params):
    return (await session.execute(text(sql), params)).scalar()


@pytest.mark.asyncio
async def test_unassign_incomplete_tasks_preserves_done_assignee(db_session):
    # --- Project ---
    pid = await _scalar(db_session, "SELECT id FROM projects WHERE key='UNASSIGN1'")
    if pid is None:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES ('UNASSIGN1', 'Unassign Test', now(), 'KANBAN', 'ACTIVE')"
            )
        )
        await db_session.flush()
        pid = await _scalar(db_session, "SELECT id FROM projects WHERE key='UNASSIGN1'")

    # --- Assignee user (any existing role) ---
    role_id = await _scalar(db_session, "SELECT id FROM roles ORDER BY id LIMIT 1")
    uid = await _scalar(
        db_session, "SELECT id FROM users WHERE email = :e", e="unassign-assignee@example.com"
    )
    if uid is None:
        await db_session.execute(
            text(
                "INSERT INTO users (email, full_name, password_hash, is_active, role_id) "
                "VALUES ('unassign-assignee@example.com', 'Unassign Assignee', 'x', true, :r)"
            ),
            {"r": role_id},
        )
        await db_session.flush()
        uid = await _scalar(
            db_session, "SELECT id FROM users WHERE email = :e", e="unassign-assignee@example.com"
        )

    # --- Two columns: one matches the '%done%' carve-out, one does not ---
    await db_session.execute(
        text("INSERT INTO board_columns (project_id, name, order_index) VALUES (:p, 'To Do', 0)"),
        {"p": pid},
    )
    await db_session.execute(
        text("INSERT INTO board_columns (project_id, name, order_index) VALUES (:p, 'Done', 1)"),
        {"p": pid},
    )
    await db_session.flush()
    todo_col = await _scalar(
        db_session,
        "SELECT id FROM board_columns WHERE project_id=:p AND name='To Do' ORDER BY id DESC LIMIT 1",
        p=pid,
    )
    done_col = await _scalar(
        db_session,
        "SELECT id FROM board_columns WHERE project_id=:p AND name='Done' ORDER BY id DESC LIMIT 1",
        p=pid,
    )

    # --- A task in each column, both assigned to the user ---
    await db_session.execute(
        text(
            "INSERT INTO tasks (title, project_id, priority, column_id, assignee_id) "
            "VALUES ('incomplete-task', :p, 'MEDIUM', :c, :u)"
        ),
        {"p": pid, "c": todo_col, "u": uid},
    )
    await db_session.execute(
        text(
            "INSERT INTO tasks (title, project_id, priority, column_id, assignee_id) "
            "VALUES ('done-task', :p, 'MEDIUM', :c, :u)"
        ),
        {"p": pid, "c": done_col, "u": uid},
    )
    await db_session.flush()
    incomplete_tid = await _scalar(
        db_session,
        "SELECT id FROM tasks WHERE project_id=:p AND column_id=:c AND assignee_id=:u ORDER BY id DESC LIMIT 1",
        p=pid, c=todo_col, u=uid,
    )
    done_tid = await _scalar(
        db_session,
        "SELECT id FROM tasks WHERE project_id=:p AND column_id=:c AND assignee_id=:u ORDER BY id DESC LIMIT 1",
        p=pid, c=done_col, u=uid,
    )

    # Precondition: both start assigned to the user.
    assert await _assignee_of(db_session, incomplete_tid) == uid
    assert await _assignee_of(db_session, done_tid) == uid

    # --- Act ---
    repo = SqlAlchemyTaskRepository(db_session)
    await repo.unassign_incomplete_tasks(pid, uid)

    # --- Assert ---
    # kills mutation: dropping the '%done%' carve-out would clear the done task too.
    assert await _assignee_of(db_session, done_tid) == uid
    # kills mutation: a no-op / wrong filter would leave the incomplete task assigned.
    assert await _assignee_of(db_session, incomplete_tid) is None
