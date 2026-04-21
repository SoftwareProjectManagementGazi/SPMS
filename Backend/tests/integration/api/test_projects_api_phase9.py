"""API-04, API-06 Phase 9 project endpoint extension tests.

Tests require migration 005 applied and roles seeded. Skip cleanly otherwise.
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


_PROCESS_CONFIG_WITH_NODE = {
    "schema_version": 1,
    "workflow": {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_a1b2c3d4e5", "name": "N", "x": 0, "y": 0, "color": "#888", "is_archived": False}
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


@pytest.mark.asyncio
async def test_status_filter_active(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping project API phase9 tests")
    # Seed two projects with different statuses
    for key, sts in [("PS1A", "ACTIVE"), ("PS1C", "COMPLETED")]:
        existing = (await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()
        if not existing:
            await db_session.execute(
                text(
                    "INSERT INTO projects (key, name, start_date, methodology, status) "
                    "VALUES (:k, 'T', now(), 'SCRUM', :s)"
                ),
                {"k": key, "s": sts},
            )
    await db_session.flush()
    async with authenticated_client(role="admin") as client:
        r = await client.get("/api/v1/projects?status=ACTIVE")
        assert r.status_code == 200
        statuses = [p["status"] for p in r.json()]
        assert all(s == "ACTIVE" for s in statuses), f"Got non-ACTIVE: {statuses}"


@pytest.mark.asyncio
async def test_status_filter_completed(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping project API phase9 tests")
    for key, sts in [("PS2A", "ACTIVE"), ("PS2C", "COMPLETED")]:
        existing = (await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()
        if not existing:
            await db_session.execute(
                text(
                    "INSERT INTO projects (key, name, start_date, methodology, status) "
                    "VALUES (:k, 'T', now(), 'SCRUM', :s)"
                ),
                {"k": key, "s": sts},
            )
    await db_session.flush()
    async with authenticated_client(role="admin") as client:
        r = await client.get("/api/v1/projects?status=COMPLETED")
        assert r.status_code == 200
        statuses = [p["status"] for p in r.json()]
        assert all(s == "COMPLETED" for s in statuses), f"Got non-COMPLETED: {statuses}"


@pytest.mark.asyncio
async def test_phase_criteria_crud(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping project API phase9 tests")
    pc = json.dumps(_PROCESS_CONFIG_WITH_NODE)
    existing = (await db_session.execute(text("SELECT id FROM projects WHERE key='PCCRUD1'"))).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
                "VALUES ('PCCRUD1', 'PC', now(), 'SCRUM', 'ACTIVE', CAST(:pc AS jsonb))"
            ),
            {"pc": pc},
        )
    await db_session.flush()
    pid = (await db_session.execute(text("SELECT id FROM projects WHERE key='PCCRUD1'"))).scalar()

    async with authenticated_client(role="admin") as client:
        r = await client.patch(f"/api/v1/projects/{pid}/phase-criteria", json={
            "phase_id": "nd_a1b2c3d4e5",
            "auto": {"all_tasks_done": True},
            "manual": ["Paydas onayi"],
        })
        assert r.status_code == 200, r.text
        assert r.json()["criteria"]["auto"]["all_tasks_done"] is True

        r_del = await client.delete(f"/api/v1/projects/{pid}/phase-criteria?phase_id=nd_a1b2c3d4e5")
        assert r_del.status_code == 200


@pytest.mark.asyncio
async def test_phase_criteria_rejects_unknown_phase_id(authenticated_client, db_session):
    """WARNING-3 / D-19: PATCH must reject phase_id not present in workflow.nodes."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping project API phase9 tests")
    pc = json.dumps(_PROCESS_CONFIG_WITH_NODE)
    existing = (await db_session.execute(text("SELECT id FROM projects WHERE key='PCBAD1'"))).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
                "VALUES ('PCBAD1', 'PC Bad', now(), 'SCRUM', 'ACTIVE', CAST(:pc AS jsonb))"
            ),
            {"pc": pc},
        )
    await db_session.flush()
    pid = (await db_session.execute(text("SELECT id FROM projects WHERE key='PCBAD1'"))).scalar()

    async with authenticated_client(role="admin") as client:
        r = await client.patch(f"/api/v1/projects/{pid}/phase-criteria", json={
            "phase_id": "nd_nonexistent",
            "auto": {},
            "manual": [],
        })
        assert r.status_code == 400, r.text
        body = r.json()
        detail = body.get("detail", {})
        assert detail.get("error_code") == "INVALID_PHASE_ID"
        assert "nd_nonexistent" in detail.get("bad_phase_ids", [])
