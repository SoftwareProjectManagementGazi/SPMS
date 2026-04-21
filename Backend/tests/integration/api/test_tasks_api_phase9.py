"""API-05 Task.phase_id filter integration test.

Tests require migration 005 applied and roles seeded. Skip cleanly otherwise.
"""
import pytest
from sqlalchemy import text


async def _db_has_roles(session) -> bool:
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (r.scalar() or 0) > 0
    except Exception:
        return False


async def _migration_005_applied(session) -> bool:
    """Check that phase_id column exists on tasks table (added by migration 005)."""
    try:
        result = await session.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.columns "
                "WHERE table_name='tasks' AND column_name='phase_id'"
            )
        )
        return (result.scalar() or 0) > 0
    except Exception:
        return False


@pytest.mark.asyncio
async def test_phase_id_filter(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping task API phase9 tests")
    if not await _migration_005_applied(db_session):
        pytest.skip("Migration 005 not applied (tasks.phase_id column absent) — skipping")

    existing = (await db_session.execute(text("SELECT id FROM projects WHERE key='TPF1'"))).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES ('TPF1', 'T', now(), 'SCRUM', 'ACTIVE')"
            )
        )
    await db_session.flush()
    pid = (await db_session.execute(text("SELECT id FROM projects WHERE key='TPF1'"))).scalar()

    # Seed two tasks: one with phase_id, one without
    await db_session.execute(
        text(
            "INSERT INTO tasks (title, project_id, priority, phase_id) "
            "VALUES ('TaskA', :p, 'MEDIUM', 'nd_a1b2c3d4e5')"
        ),
        {"p": pid},
    )
    await db_session.execute(
        text("INSERT INTO tasks (title, project_id, priority) VALUES ('TaskB', :p, 'MEDIUM')"),
        {"p": pid},
    )
    await db_session.flush()

    async with authenticated_client(role="admin") as client:
        r = await client.get(f"/api/v1/tasks/project/{pid}?phase_id=nd_a1b2c3d4e5")
        assert r.status_code == 200, r.text
        data = r.json()
        # Response might be paginated
        if isinstance(data, dict) and "items" in data:
            titles = [t["title"] for t in data["items"]]
        else:
            titles = [t["title"] for t in data]
        assert "TaskA" in titles, f"TaskA not in {titles}"
        assert "TaskB" not in titles, f"TaskB should be filtered out but is in {titles}"
