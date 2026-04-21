"""API-09 PhaseReport CRUD + PDF integration tests.

Tests require migration 005 applied. Skip cleanly otherwise.
"""
import json
import pytest
from sqlalchemy import text


async def _db_has_roles(session) -> bool:
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (r.scalar() or 0) > 0
    except Exception:
        return False


_PROCESS_CONFIG = {
    "schema_version": 1,
    "workflow": {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_a1b2c3d4e5", "name": "Tasarim", "x": 0, "y": 0, "color": "#888", "is_archived": False}
        ],
        "edges": [],
        "groups": [],
    },
    "phase_completion_criteria": {},
    "enable_phase_assignment": False,
    "enforce_sequential_dependencies": False,
    "enforce_wip_limits": False,
    "restrict_expired_sprints": False,
}


async def _seed(db_session, key="PRAPI1"):
    existing = (await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()
    if existing:
        return existing
    pc = json.dumps(_PROCESS_CONFIG)
    await db_session.execute(
        text(
            "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
            "VALUES (:key, 'PR API', now(), 'SCRUM', 'ACTIVE', CAST(:pc AS jsonb))"
        ),
        {"key": key, "pc": pc},
    )
    await db_session.flush()
    return (await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()


@pytest.mark.asyncio
async def test_create_and_pdf_export(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping phase report API tests")
    pid = await _seed(db_session)
    async with authenticated_client(role="admin") as client:
        r = await client.post("/api/v1/phase-reports", json={
            "project_id": pid, "phase_id": "nd_a1b2c3d4e5",
            "summary_task_count": 10, "summary_done_count": 8,
            "issues": "Test", "lessons": "Learned", "recommendations": "Apply",
        })
        assert r.status_code == 201, r.text
        report_id = r.json()["id"]
        assert r.json()["cycle_number"] == 1
        assert r.json()["revision"] == 1

        # Patch -> revision increments
        r2 = await client.patch(f"/api/v1/phase-reports/{report_id}", json={"issues": "Updated"})
        assert r2.status_code == 200
        assert r2.json()["revision"] == 2

        # PDF export
        r3 = await client.get(f"/api/v1/phase-reports/{report_id}/pdf")
        assert r3.status_code == 200, r3.text
        assert "application/pdf" in r3.headers["content-type"]
        assert r3.content.startswith(b"%PDF")


@pytest.mark.asyncio
async def test_pdf_rate_limit(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping phase report API tests")
    pid = await _seed(db_session, key="PRRL1")
    async with authenticated_client(role="admin") as client:
        r_post = await client.post("/api/v1/phase-reports", json={
            "project_id": pid, "phase_id": "nd_a1b2c3d4e5",
        })
        assert r_post.status_code == 201, r_post.text
        report_id = r_post.json()["id"]

        r1 = await client.get(f"/api/v1/phase-reports/{report_id}/pdf")
        r2 = await client.get(f"/api/v1/phase-reports/{report_id}/pdf")
        # Second request within 30s should 429
        assert r1.status_code == 200, r1.text
        assert r2.status_code == 429
        assert "Retry-After" in r2.headers
