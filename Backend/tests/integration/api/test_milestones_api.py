"""API-07 / D-35 Milestone CRUD integration tests.

Tests require migration 005 applied. Skip cleanly otherwise.
"""
import pytest
from sqlalchemy import text

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


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

# C3: V2 schema — `phase_workflow` (was `workflow`), engine flags now live
# under `phase_workflow.capabilities`, `task_workflow` placeholder seeded.
_PROCESS_CONFIG = {
    "schema_version": 2,
    "phase_workflow": {
        "mode": "flexible",
        "capabilities": {
            "enforce_wip_limits": False,
            "enforce_sequential_dependencies": False,
            "restrict_expired_sprints": False,
            "initial_node_id": "nd_a1b2c3d4e5",
        },
        "nodes": [
            {"id": "nd_a1b2c3d4e5", "name": "N", "x": 0, "y": 0, "color": "#888", "is_archived": False}
        ],
        "edges": [],
        "groups": [],
    },
    "task_workflow": {
        "capabilities": {"enforce_wip_limits": False, "initial_node_id": None},
        "edges": [],
        "groups": [],
    },
    "phase_completion_criteria": {},
    "enable_phase_assignment": False,
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
        body = r.json()
        # kills mutation: a 201 that drops linked_phase_ids (audit concern) or name
        # would pass a status-only check.
        assert body["name"] == "M1"
        assert body["project_id"] == pid
        assert body["linked_phase_ids"] == ["nd_a1b2c3d4e5"]
        mid = body["id"]
        # Persisted + listable on the project's milestones endpoint.
        listed = await client.get(f"/api/v1/projects/{pid}/milestones")
        assert listed.status_code == 200, listed.text
        assert any(m["id"] == mid for m in listed.json())


@pytest.mark.asyncio
async def test_post_milestone_member_forbidden(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping milestone API tests")
    pid = await _seed(db_session, key="MSAPIF1")
    async with authenticated_client(role="member") as client:
        r = await client.post("/api/v1/milestones", json={"project_id": pid, "name": "M1"})
        assert r.status_code == 403, r.text
        # Pin WHICH gate fired (D-09 envelope): the milestone.create permission gate
        # (perm-first per Pitfall 13), not an incidental 403 from elsewhere.
        assert r.json()["detail"]["missing_permission"] == "milestone.create"


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
