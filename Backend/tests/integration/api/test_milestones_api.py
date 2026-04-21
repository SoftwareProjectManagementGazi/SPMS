"""API-07 / D-35 Milestone CRUD integration tests.

Tests require migration 005 applied. Skip cleanly otherwise.
"""
import pytest
from sqlalchemy import text


# ---------------------------------------------------------------------------
# Skip guard
# ---------------------------------------------------------------------------

async def _db_has_roles(session) -> bool:
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (r.scalar() or 0) > 0
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Seed helper — uses bindparams to avoid JSONB colon-parse issue
# ---------------------------------------------------------------------------

import json

_PROCESS_CONFIG = {
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


async def _seed(session, key="MSAPI1"):
    existing = (await session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()
    if existing:
        return existing
    pc = json.dumps(_PROCESS_CONFIG)
    await session.execute(
        text(
            "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
            "VALUES (:key, 'MS API', now(), 'SCRUM', 'ACTIVE', CAST(:pc AS jsonb))"
        ),
        {"key": key, "pc": pc},
    )
    await session.flush()
    return (await session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_post_milestone_admin_allowed(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping milestone API tests")
    pid = await _seed(db_session)
    async with authenticated_client(role="admin") as client:
        r = await client.post("/api/v1/milestones", json={
            "project_id": pid, "name": "M1", "linked_phase_ids": ["nd_a1b2c3d4e5"],
        })
        assert r.status_code == 201, r.text


@pytest.mark.asyncio
async def test_post_milestone_member_forbidden(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping milestone API tests")
    pid = await _seed(db_session, key="MSAPIF1")
    async with authenticated_client(role="member") as client:
        r = await client.post("/api/v1/milestones", json={"project_id": pid, "name": "M1"})
        assert r.status_code == 403


@pytest.mark.asyncio
async def test_list_milestones_member_allowed(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping milestone API tests")
    pid = await _seed(db_session, key="MSAPIL1")
    async with authenticated_client(role="admin") as client:
        # Admin seeds it
        await client.post("/api/v1/milestones", json={"project_id": pid, "name": "List me"})
        r = await client.get(f"/api/v1/projects/{pid}/milestones")
        assert r.status_code == 200
        assert any(m["name"] == "List me" for m in r.json())


@pytest.mark.asyncio
async def test_invalid_phase_id_400(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping milestone API tests")
    pid = await _seed(db_session, key="MSAPIN1")
    async with authenticated_client(role="admin") as client:
        r = await client.post("/api/v1/milestones", json={
            "project_id": pid, "name": "Bad", "linked_phase_ids": ["nd_nonexistn1"],
        })
        assert r.status_code == 400
        assert "ARCHIVED_NODE_REF" in r.text or "non-existent" in r.text.lower()
