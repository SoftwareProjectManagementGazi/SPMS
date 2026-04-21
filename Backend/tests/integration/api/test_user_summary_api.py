"""API-03 user summary integration tests.

NOTE: These tests require a live PostgreSQL DB with roles seeded (via app lifespan seed_data).
When running against the isolated test DB created by conftest (no seeded data), tests skip.
"""
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def _db_has_roles(session: AsyncSession) -> bool:
    """Return True if the roles table has at least one row (seed_data has run)."""
    try:
        result = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (result.scalar() or 0) > 0
    except Exception:
        return False


@pytest.mark.asyncio
async def test_user_summary_returns_stats_projects_activity(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded — skipping user summary API integration tests")
    uid = (await db_session.execute(text("SELECT id FROM users LIMIT 1"))).scalar()
    async with authenticated_client(role="admin") as client:
        r = await client.get(f"/api/v1/users/{uid}/summary")
        assert r.status_code == 200, r.text
        body = r.json()
        assert "stats" in body and "projects" in body and "recent_activity" in body
        assert "active_tasks" in body["stats"]
        assert "completed_last_30d" in body["stats"]
        assert "project_count" in body["stats"]


@pytest.mark.asyncio
async def test_user_summary_include_archived_param(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded — skipping user summary API integration tests")
    uid = (await db_session.execute(text("SELECT id FROM users LIMIT 1"))).scalar()
    async with authenticated_client(role="admin") as client:
        r = await client.get(f"/api/v1/users/{uid}/summary?include_archived=true")
        assert r.status_code == 200
