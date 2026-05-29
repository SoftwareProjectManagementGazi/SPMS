"""Integration tests for SqlAlchemyTaskDependencyRepository.

The unit tests in tests/unit/application/test_task_dependencies.py can only
assert that the use case *propagates* a cycle error — the self-/reverse-cycle
rule itself lives in this repository (SQL-backed). These tests run the REAL repo
against Postgres so that mutating the cycle checks (or the blocks/blocked_by
split) fails here. Tasks are seeded into the transactional ``db_session`` and
rolled back after each test.
"""
import pytest
from sqlalchemy import text

from app.infrastructure.database.repositories.task_dependency_repo import (
    SqlAlchemyTaskDependencyRepository,
)

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


async def _seed_project_and_tasks(db_session, key: str, n: int):
    existing = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES (:k, 'Dependency Test', now(), 'KANBAN', 'ACTIVE')"
            ),
            {"k": key},
        )
        await db_session.flush()
    pid = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    ids: list[int] = []
    for i in range(n):
        await db_session.execute(
            text("INSERT INTO tasks (title, project_id, priority) VALUES (:t, :p, 'MEDIUM')"),
            {"t": f"Dep Task {i}", "p": pid},
        )
        await db_session.flush()
        ids.append(
            (
                await db_session.execute(
                    text("SELECT id FROM tasks WHERE project_id=:p ORDER BY id DESC LIMIT 1"),
                    {"p": pid},
                )
            ).scalar()
        )
    return pid, ids


@pytest.mark.asyncio
async def test_add_creates_dependency(db_session):
    """add() persists a 'blocks' relation visible on list_for_task."""
    _, ids = await _seed_project_and_tasks(db_session, "DEPADD", 2)
    repo = SqlAlchemyTaskDependencyRepository(db_session)

    dep = await repo.add(ids[0], ids[1], "blocks")

    assert dep.id is not None
    assert dep.task_id == ids[0]
    assert dep.depends_on_id == ids[1]
    listed = await repo.list_for_task(ids[0])
    assert [d.depends_on_id for d in listed["blocks"]] == [ids[1]]


@pytest.mark.asyncio
async def test_self_dependency_rejected(db_session):
    """A task cannot depend on itself (kills mutation: dropping the self-check)."""
    _, ids = await _seed_project_and_tasks(db_session, "DEPSELF", 1)
    repo = SqlAlchemyTaskDependencyRepository(db_session)

    with pytest.raises(ValueError, match="Self-dependency"):
        await repo.add(ids[0], ids[0], "blocks")


@pytest.mark.asyncio
async def test_reverse_cycle_rejected(db_session):
    """If A blocks B, B cannot also block A (kills mutation: dropping the cycle check)."""
    _, ids = await _seed_project_and_tasks(db_session, "DEPCYC", 2)
    repo = SqlAlchemyTaskDependencyRepository(db_session)

    await repo.add(ids[0], ids[1], "blocks")
    with pytest.raises(ValueError, match="Circular"):
        await repo.add(ids[1], ids[0], "blocks")


@pytest.mark.asyncio
async def test_list_splits_blocks_and_blocked_by(db_session):
    """list_for_task separates outgoing (blocks) from incoming (blocked_by)."""
    _, ids = await _seed_project_and_tasks(db_session, "DEPLIST", 3)
    repo = SqlAlchemyTaskDependencyRepository(db_session)

    # ids[0] blocks ids[1]; ids[2] blocks ids[0].
    await repo.add(ids[0], ids[1], "blocks")
    await repo.add(ids[2], ids[0], "blocks")

    listed = await repo.list_for_task(ids[0])
    # kills mutation: swapping the two WHERE clauses would flip these buckets.
    assert [d.depends_on_id for d in listed["blocks"]] == [ids[1]]
    assert [d.task_id for d in listed["blocked_by"]] == [ids[2]]


@pytest.mark.asyncio
async def test_remove_deletes_dependency(db_session):
    """remove() deletes the relation and reports whether a row was removed."""
    _, ids = await _seed_project_and_tasks(db_session, "DEPRM", 2)
    repo = SqlAlchemyTaskDependencyRepository(db_session)
    dep = await repo.add(ids[0], ids[1], "blocks")

    assert await repo.remove(dep.id) is True
    listed = await repo.list_for_task(ids[0])
    assert listed["blocks"] == []
    # Removing a non-existent row returns False (kills mutation: always-True remove).
    assert await repo.remove(dep.id) is False
