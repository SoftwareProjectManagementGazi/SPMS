"""TASK-07: Sprint API — real integration tests for the /api/v1/sprints router.

Replaces the previous ``xfail(strict=False) + assert False`` stubs (flagged as
fake passes by the test audit). These drive the real endpoints against the test
DB. The project prerequisite is seeded via the transactional ``db_session``
(shared with the API calls; rolled back after each test).
"""
import pytest
from sqlalchemy import text

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


async def _seed_project(db_session, key: str) -> int:
    existing = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES (:k, 'Sprint Test', now(), 'SCRUM', 'ACTIVE')"
            ),
            {"k": key},
        )
        await db_session.flush()
    return (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()


@pytest.mark.asyncio
async def test_sprint_requires_auth(client):
    """Sprint endpoints reject unauthenticated requests with 401."""
    r = await client.get("/api/v1/sprints/?project_id=1")
    assert r.status_code == 401, r.text


@pytest.mark.asyncio
async def test_post_sprint_creates_sprint(authenticated_client, db_session):
    pid = await _seed_project(db_session, "SPC")
    async with authenticated_client(role="admin") as client:
        r = await client.post("/api/v1/sprints/", json={"project_id": pid, "name": "Sprint 1"})
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["name"] == "Sprint 1"
        assert body["project_id"] == pid


@pytest.mark.asyncio
async def test_get_sprints_by_project_returns_list(authenticated_client, db_session):
    pid = await _seed_project(db_session, "SPL")
    async with authenticated_client(role="admin") as client:
        for name in ("S1", "S2"):
            r = await client.post("/api/v1/sprints/", json={"project_id": pid, "name": name})
            assert r.status_code == 201, r.text
        r_list = await client.get(f"/api/v1/sprints/?project_id={pid}")
        assert r_list.status_code == 200, r_list.text
        names = [s["name"] for s in r_list.json()]
        assert "S1" in names and "S2" in names


@pytest.mark.asyncio
async def test_patch_sprint_updates_sprint(authenticated_client, db_session):
    pid = await _seed_project(db_session, "SPU")
    async with authenticated_client(role="admin") as client:
        r = await client.post("/api/v1/sprints/", json={"project_id": pid, "name": "Old"})
        assert r.status_code == 201, r.text
        sid = r.json()["id"]
        r2 = await client.patch(f"/api/v1/sprints/{sid}", json={"name": "New"})
        assert r2.status_code == 200, r2.text
        assert r2.json()["name"] == "New"
        r_list = await client.get(f"/api/v1/sprints/?project_id={pid}")
        names = [s["name"] for s in r_list.json()]
        assert "New" in names and "Old" not in names


@pytest.mark.asyncio
async def test_delete_sprint_removes_sprint(authenticated_client, db_session):
    pid = await _seed_project(db_session, "SPD")
    async with authenticated_client(role="admin") as client:
        r = await client.post("/api/v1/sprints/", json={"project_id": pid, "name": "Doomed"})
        assert r.status_code == 201, r.text
        sid = r.json()["id"]
        # Present before delete.
        r_list = await client.get(f"/api/v1/sprints/?project_id={pid}")
        assert sid in [s["id"] for s in r_list.json()]
        # Delete -> 204.
        r_del = await client.delete(f"/api/v1/sprints/{sid}")
        assert r_del.status_code == 204, r_del.text
        # Gone after delete (kills mutation: a no-op delete leaves it on the list).
        r_list2 = await client.get(f"/api/v1/sprints/?project_id={pid}")
        assert sid not in [s["id"] for s in r_list2.json()]
