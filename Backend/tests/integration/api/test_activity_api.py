"""API-02 activity feed integration tests.

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


async def _seed(db_session, key="ACT1"):
    await db_session.execute(text(
        f"INSERT INTO projects (key, name, start_date, methodology, status) "
        f"VALUES ('{key}', 'Act Test', now(), 'SCRUM', 'ACTIVE') ON CONFLICT DO NOTHING"
    ))
    pid = (await db_session.execute(text(f"SELECT id FROM projects WHERE key='{key}'"))).scalar()
    # Seed a few audit_log rows
    uid_row = await db_session.execute(text("SELECT id FROM users LIMIT 1"))
    uid = uid_row.scalar() or None
    if uid is None:
        await db_session.execute(text(
            "INSERT INTO users (email, full_name, password_hash, is_active) "
            "VALUES ('actuser@testexample.com', 'Act', 'h', true) ON CONFLICT DO NOTHING"
        ))
        uid = (await db_session.execute(
            text("SELECT id FROM users WHERE email='actuser@testexample.com'")
        )).scalar()
    for action in ["task_created", "phase_transition", "status_changed"]:
        await db_session.execute(text(
            f"INSERT INTO audit_log (entity_type, entity_id, field_name, action, user_id) "
            f"VALUES ('project', {pid}, 'test', '{action}', {uid})"
        ))
    await db_session.flush()
    return pid


@pytest.mark.asyncio
async def test_activity_returns_items_and_total(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded — skipping activity API integration tests")
    pid = await _seed(db_session)
    async with authenticated_client(role="admin") as client:
        r = await client.get(f"/api/v1/projects/{pid}/activity")
        assert r.status_code == 200, r.text
        body = r.json()
        assert "items" in body and "total" in body
        assert body["total"] >= 3


@pytest.mark.asyncio
async def test_activity_type_filter(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded — skipping activity API integration tests")
    pid = await _seed(db_session, key="ACTF1")
    async with authenticated_client(role="admin") as client:
        r = await client.get(f"/api/v1/projects/{pid}/activity?type[]=phase_transition")
        assert r.status_code == 200
        body = r.json()
        assert all(i["action"] == "phase_transition" for i in body["items"])


@pytest.mark.asyncio
async def test_activity_pagination(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded — skipping activity API integration tests")
    pid = await _seed(db_session, key="ACTP1")
    async with authenticated_client(role="admin") as client:
        r1 = await client.get(f"/api/v1/projects/{pid}/activity?limit=2&offset=0")
        r2 = await client.get(f"/api/v1/projects/{pid}/activity?limit=2&offset=2")
        assert r1.status_code == 200 and r2.status_code == 200
        assert r1.json()["total"] == r2.json()["total"]
        # items on page 1 differ from page 2
        ids1 = {i["id"] for i in r1.json()["items"]}
        ids2 = {i["id"] for i in r2.json()["items"]}
        assert not (ids1 & ids2)
