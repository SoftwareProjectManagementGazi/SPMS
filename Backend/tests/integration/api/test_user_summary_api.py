"""API-03 user summary integration tests."""
import pytest


@pytest.mark.asyncio
async def test_user_summary_returns_stats_projects_activity(authenticated_client, db_session):
    from sqlalchemy import text
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
    from sqlalchemy import text
    uid = (await db_session.execute(text("SELECT id FROM users LIMIT 1"))).scalar()
    async with authenticated_client(role="admin") as client:
        r = await client.get(f"/api/v1/users/{uid}/summary?include_archived=true")
        assert r.status_code == 200
