"""DELETE column → backlog: tasks leave the board (column + sprint cleared)."""
import pytest
from sqlalchemy import text

pytestmark = pytest.mark.requires_db


async def _db_has_roles(session) -> bool:
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (r.scalar() or 0) > 0
    except Exception:
        return False


@pytest.mark.asyncio
async def test_delete_column_to_backlog_clears_task_links(
    authenticated_client, db_session
):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping column backlog delete test")

    # Project + two columns + a sprint + a task sitting in column A w/ sprint.
    existing = (await db_session.execute(
        text("SELECT id FROM projects WHERE key='BKLG1'")
    )).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES ('BKLG1', 'P', now(), 'SCRUM', 'ACTIVE')"
            )
        )
    pid = (await db_session.execute(
        text("SELECT id FROM projects WHERE key='BKLG1'")
    )).scalar()

    await db_session.execute(
        text("DELETE FROM tasks WHERE project_id=:p"), {"p": pid}
    )
    await db_session.execute(
        text("DELETE FROM board_columns WHERE project_id=:p"), {"p": pid}
    )
    await db_session.execute(
        text(
            "INSERT INTO board_columns (project_id, name, order_index) VALUES "
            "(:p, 'Silinecek', 0), (:p, 'Kalan', 1)"
        ),
        {"p": pid},
    )
    col_a = (await db_session.execute(
        text("SELECT id FROM board_columns WHERE project_id=:p AND name='Silinecek'"),
        {"p": pid},
    )).scalar()

    await db_session.execute(
        text("INSERT INTO sprints (project_id, name) VALUES (:p, 'S1')"),
        {"p": pid},
    )
    sprint_id = (await db_session.execute(
        text("SELECT id FROM sprints WHERE project_id=:p AND name='S1'"),
        {"p": pid},
    )).scalar()

    await db_session.execute(
        text(
            "INSERT INTO tasks (project_id, title, column_id, sprint_id) "
            "VALUES (:p, 'Görev', :c, :s)"
        ),
        {"p": pid, "c": col_a, "s": sprint_id},
    )
    await db_session.flush()

    async with authenticated_client(role="admin") as client:
        r = await client.delete(
            f"/api/v1/projects/{pid}/columns/{col_a}?move_tasks_to_backlog=true"
        )
        assert r.status_code == 204, r.text

        # Neither target nor backlog → 422.
        r2 = await client.delete(f"/api/v1/projects/{pid}/columns/999999")
        assert r2.status_code == 422, r2.text

    row = (await db_session.execute(
        text("SELECT column_id, sprint_id FROM tasks WHERE project_id=:p"),
        {"p": pid},
    )).first()
    assert row is not None
    assert row[0] is None, "task column link should be cleared (off the board)"
    assert row[1] is None, "task sprint link should be cleared (lands in backlog)"

    gone = (await db_session.execute(
        text("SELECT id FROM board_columns WHERE id=:c"), {"c": col_a}
    )).scalar()
    assert gone is None
