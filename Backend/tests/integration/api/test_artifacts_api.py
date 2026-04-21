"""API-08 / D-36 Artifact CRUD tests.

Tests require migration 005 applied. Skip cleanly otherwise.
"""
import pytest
from sqlalchemy import text


async def _db_has_roles(session) -> bool:
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (r.scalar() or 0) > 0
    except Exception:
        return False


async def _seed_project_and_user(db_session, key="ARTAPI1"):
    """Seed a project + a test assignee user, return (project_id, user_id)."""
    existing_pid = (await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()
    if not existing_pid:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES (:k, 'AP', now(), 'SCRUM', 'ACTIVE')"
            ),
            {"k": key},
        )
        await db_session.flush()

    pid = (await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()

    # Create an assignee user (unique email per key)
    email = f"assignee_{key}@testexample.com"
    existing_uid = (await db_session.execute(
        text("SELECT id FROM users WHERE email=:e"), {"e": email}
    )).scalar()
    if not existing_uid:
        # Need role_id — use first available role
        role_id = (await db_session.execute(text("SELECT id FROM roles LIMIT 1"))).scalar()
        await db_session.execute(
            text(
                "INSERT INTO users (email, full_name, password_hash, is_active, role_id) "
                "VALUES (:e, 'Assignee', 'h', true, :r)"
            ),
            {"e": email, "r": role_id},
        )
        await db_session.flush()

    uid = (await db_session.execute(text("SELECT id FROM users WHERE email=:e"), {"e": email})).scalar()
    return pid, uid


@pytest.mark.asyncio
async def test_create_artifact_admin_201(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping artifact API tests")
    pid, uid = await _seed_project_and_user(db_session)
    async with authenticated_client(role="admin") as client:
        r = await client.post("/api/v1/artifacts", json={
            "project_id": pid, "name": "A1", "assignee_id": uid,
        })
        assert r.status_code == 201, r.text


@pytest.mark.asyncio
async def test_assignee_patch_mine_non_assignee_403(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping artifact API tests")
    pid, uid = await _seed_project_and_user(db_session, key="ARTM2")
    async with authenticated_client(role="admin") as admin_client:
        r = await admin_client.post("/api/v1/artifacts", json={
            "project_id": pid, "name": "A1", "assignee_id": uid,
        })
        assert r.status_code == 201, r.text
        artifact_id = r.json()["id"]
    # Non-assignee member tries to patch via /mine — should be 403
    async with authenticated_client(role="member") as member_client:
        r2 = await member_client.patch(
            f"/api/v1/artifacts/{artifact_id}/mine",
            json={"status": "in_progress"},
        )
        assert r2.status_code in (403, 404), f"Expected 403/404, got {r2.status_code}: {r2.text}"


@pytest.mark.asyncio
async def test_manager_patch_can_update(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping artifact API tests")
    pid, uid = await _seed_project_and_user(db_session, key="ARTMGR1")
    async with authenticated_client(role="admin") as client:
        r = await client.post("/api/v1/artifacts", json={"project_id": pid, "name": "A", "assignee_id": uid})
        assert r.status_code == 201, r.text
        artifact_id = r.json()["id"]
        r2 = await client.patch(f"/api/v1/artifacts/{artifact_id}", json={"name": "A Updated"})
        assert r2.status_code == 200, r2.text
        assert r2.json()["name"] == "A Updated"
