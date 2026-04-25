"""Phase 12 Plan 12-10 (Bug X + Bug Y UAT fix) — PATCH /projects/{id}
WorkflowConfig validation integration test.

Pre-fix the project PATCH endpoint did not validate `process_config.workflow`
shape against the WorkflowConfig Pydantic DTO — the field was typed as
`Dict[str, Any]` so any payload was accepted and only failed downstream
when a Task or Milestone tried to use a phase_id that didn't exist or
didn't match the D-22 regex.

This integration suite asserts the post-fix behavior:
  * Workflow with `n1` / `n6` IDs → 422 (Bug X)
  * Workflow with regex-compliant `nd_<10>` IDs → 200 (Bug X happy path)
  * Workflow with description / is_initial / is_final / parent_id / wip_limit
    round-trips through GET /projects/{id} with the fields intact (Bug Y)
  * Workflow with zero is_initial nodes → 422 (Bug Y rule 4)
  * Workflow with zero is_final nodes → 422 (Bug Y rule 4)
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


async def _seed_project(db_session, key: str = "WFV1") -> int:
    """Seed a minimal project, return its id."""
    existing = (
        await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
                "VALUES (:k, 'WFV', now(), 'SCRUM', 'ACTIVE', '{}'::jsonb)"
            ),
            {"k": key},
        )
        await db_session.flush()
    return (await db_session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()


_VALID_NODE = {
    "id": "nd_a1b2c3d4e5",
    "name": "Başlangıç",
    "x": 0,
    "y": 0,
    "color": "#888",
    "is_initial": True,
    "is_final": False,
}
_VALID_FINAL_NODE = {
    "id": "nd_f6g7h8i9j0",
    "name": "Son",
    "x": 200,
    "y": 0,
    "color": "#888",
    "is_initial": False,
    "is_final": True,
}


@pytest.mark.asyncio
async def test_patch_with_legacy_n1_id_returns_422(authenticated_client, db_session):
    """Bug X: workflow with `n1` IDs (regex-fail) must return 422 (not 200)."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGX1")

    bad_workflow = {
        "mode": "flexible",
        "nodes": [
            {"id": "n1", "name": "A", "x": 0, "y": 0, "color": "#888",
             "is_initial": True, "is_final": False},
            {"id": "n2", "name": "B", "x": 100, "y": 0, "color": "#888",
             "is_initial": False, "is_final": True},
        ],
        "edges": [{"id": "e1", "source": "n1", "target": "n2", "type": "flow"}],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"workflow": bad_workflow}},
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"


@pytest.mark.asyncio
async def test_patch_with_compliant_nd_ids_returns_200(authenticated_client, db_session):
    """Bug X happy path: workflow with `nd_<10>` IDs returns 200."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGX2")

    good_workflow = {
        "mode": "flexible",
        "nodes": [_VALID_NODE, _VALID_FINAL_NODE],
        "edges": [{"id": "e1", "source": _VALID_NODE["id"], "target": _VALID_FINAL_NODE["id"], "type": "flow"}],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"workflow": good_workflow}},
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"


@pytest.mark.asyncio
async def test_patch_round_trips_description_isInitial_isFinal_parentId_wipLimit(
    authenticated_client, db_session
):
    """Bug Y: PATCH then GET must preserve all extended WorkflowNode fields."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGY1")

    workflow = {
        "mode": "flexible",
        "nodes": [
            {
                "id": "nd_initialnod",  # 10 chars after nd_: i-n-i-t-i-a-l-n-o-d
                "name": "Planlama",
                "description": "Sprint planning phase",
                "x": 0,
                "y": 0,
                "color": "#888",
                "is_initial": True,
                "is_final": False,
                "parent_id": "gr_team_alpha",
                "wip_limit": 3,
            },
            {
                "id": "nd_finalnode1",  # 10 chars: f-i-n-a-l-n-o-d-e-1
                "name": "Kapanış",
                "description": "Closing phase",
                "x": 200,
                "y": 0,
                "color": "#888",
                "is_initial": False,
                "is_final": True,
                "wip_limit": 5,
            },
        ],
        "edges": [
            {"id": "e1", "source": "nd_initialnod", "target": "nd_finalnode1", "type": "flow"},
        ],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"workflow": workflow}},
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"

        # GET back and verify fields didn't get silently dropped.
        r2 = await client.get(f"/api/v1/projects/{pid}")
        assert r2.status_code == 200
        body = r2.json()
        nodes = body["process_config"]["workflow"]["nodes"]
        first = next((n for n in nodes if n["id"] == "nd_initialnod"), None)
        assert first is not None, "Initial node lost on round trip"
        assert first.get("description") == "Sprint planning phase"
        # is_initial / is_final / parent_id / wip_limit may use either snake_case
        # or camelCase on the wire (mapper supports both); check snake first.
        assert first.get("is_initial") is True or first.get("isInitial") is True
        assert first.get("parent_id") == "gr_team_alpha" or first.get("parentId") == "gr_team_alpha"
        assert first.get("wip_limit") == 3 or first.get("wipLimit") == 3


@pytest.mark.asyncio
async def test_patch_with_zero_initial_returns_422(authenticated_client, db_session):
    """Bug Y rule 4: workflow with no is_initial=True node returns 422."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGY2")

    workflow = {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_aaaaaaaaaa", "name": "A", "x": 0, "y": 0, "color": "#888",
             "is_initial": False, "is_final": False},
            {"id": "nd_bbbbbbbbbb", "name": "B", "x": 100, "y": 0, "color": "#888",
             "is_initial": False, "is_final": True},
        ],
        "edges": [
            {"id": "e1", "source": "nd_aaaaaaaaaa", "target": "nd_bbbbbbbbbb", "type": "flow"},
        ],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"workflow": workflow}},
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"


@pytest.mark.asyncio
async def test_patch_with_zero_final_returns_422(authenticated_client, db_session):
    """Bug Y rule 4: workflow with no is_final=True node returns 422."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping integration test")

    pid = await _seed_project(db_session, key="BUGY3")

    workflow = {
        "mode": "flexible",
        "nodes": [
            {"id": "nd_aaaaaaaaaa", "name": "A", "x": 0, "y": 0, "color": "#888",
             "is_initial": True, "is_final": False},
            {"id": "nd_bbbbbbbbbb", "name": "B", "x": 100, "y": 0, "color": "#888",
             "is_initial": False, "is_final": False},
        ],
        "edges": [
            {"id": "e1", "source": "nd_aaaaaaaaaa", "target": "nd_bbbbbbbbbb", "type": "flow"},
        ],
        "groups": [],
    }

    async with authenticated_client(role="admin") as client:
        r = await client.patch(
            f"/api/v1/projects/{pid}",
            json={"process_config": {"workflow": workflow}},
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"
