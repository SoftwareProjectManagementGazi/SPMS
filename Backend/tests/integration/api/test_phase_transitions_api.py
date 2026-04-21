"""API-01 Phase Gate endpoint integration tests.

NOTE: These tests require a live PostgreSQL DB with migration 005 applied:

    cd Backend && alembic upgrade head

The integration conftest uses Base.metadata.create_all (not Alembic — Pitfall 1).
Migration-added columns (projects.status, process_config) only exist when alembic
upgrade head has been run. All tests skip with a clear message otherwise.
"""
import json
import uuid
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.application.services import idempotency_cache


# ---------------------------------------------------------------------------
# Skip guard: detect whether migration 005 has been applied
# ---------------------------------------------------------------------------

async def _migration_005_applied(session: AsyncSession) -> bool:
    """Return True if alembic_version table contains the 005_phase9 row."""
    try:
        result = await session.execute(
            text("SELECT COUNT(*) FROM alembic_version WHERE version_num = '005_phase9'")
        )
        return (result.scalar() or 0) > 0
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_process_config(mode: str = "flexible", extra_nodes: list = None) -> dict:
    """Build a valid process_config dict for testing."""
    nodes = [
        {"id": "nd_Src123DXYZ", "name": "Source", "x": 0, "y": 0, "color": "#888", "is_archived": False},
        {"id": "nd_Tgt456DXYZ", "name": "Target", "x": 100, "y": 0, "color": "#888", "is_archived": False},
    ]
    if extra_nodes:
        nodes.extend(extra_nodes)
    return {
        "schema_version": 1,
        "workflow": {"mode": mode, "nodes": nodes, "edges": [], "groups": []},
        "phase_completion_criteria": {},
        "enable_phase_assignment": True,
        "enforce_sequential_dependencies": False,
        "enforce_wip_limits": False,
        "restrict_expired_sprints": False,
    }


async def _seed_project(session, key: str, mode: str = "flexible", extra_nodes: list = None) -> int:
    """Insert a test project via raw SQL using bindparams (avoids text() colon-parse issue).

    Returns the project id.
    """
    existing = (await session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()
    if existing:
        return existing
    pc_json = json.dumps(_make_process_config(mode=mode, extra_nodes=extra_nodes))
    await session.execute(
        text(
            "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
            "VALUES (:key, :name, now(), 'SCRUM', 'ACTIVE', CAST(:pc AS jsonb))"
        ),
        {"key": key, "name": f"PG Test {key}", "pc": pc_json},
    )
    await session.flush()
    return (await session.execute(text("SELECT id FROM projects WHERE key=:k"), {"k": key})).scalar()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_cache():
    idempotency_cache.reset_for_tests()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_successful_transition_returns_200(authenticated_client, db_session):
    if not await _migration_005_applied(db_session):
        pytest.skip("Migration 005 not applied — skipping phase transitions API tests")
    project_id = await _seed_project(db_session, "PGTEST1")
    async with authenticated_client(role="admin") as client:
        r = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Tgt456DXYZ"},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["moved_count"] == 0
        assert body["override_used"] is False


@pytest.mark.asyncio
async def test_rate_limit_429(authenticated_client, db_session):
    if not await _migration_005_applied(db_session):
        pytest.skip("Migration 005 not applied — skipping phase transitions API tests")
    project_id = await _seed_project(db_session, "PGRL011")
    async with authenticated_client(role="admin") as client:
        r1 = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Tgt456DXYZ"},
        )
        assert r1.status_code == 200
        r2 = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Tgt456DXYZ"},
        )
        assert r2.status_code == 429
        assert "Retry-After" in r2.headers


@pytest.mark.asyncio
async def test_idempotency_cache_hit(authenticated_client, db_session):
    if not await _migration_005_applied(db_session):
        pytest.skip("Migration 005 not applied — skipping phase transitions API tests")
    project_id = await _seed_project(db_session, "PGIDM11")
    key = str(uuid.uuid4())
    async with authenticated_client(role="admin") as client:
        r1 = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Tgt456DXYZ"},
            headers={"Idempotency-Key": key},
        )
        assert r1.status_code == 200
        # Reset rate limit so second call is not blocked by rate limiter
        idempotency_cache._last_request.clear()
        r2 = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Tgt456DXYZ"},
            headers={"Idempotency-Key": key},
        )
        assert r2.status_code == 200
        assert r1.json() == r2.json()


@pytest.mark.asyncio
async def test_continuous_mode_400(authenticated_client, db_session):
    """Project with continuous workflow mode rejects phase transition."""
    if not await _migration_005_applied(db_session):
        pytest.skip("Migration 005 not applied — skipping phase transitions API tests")
    project_id = await _seed_project(db_session, "PGCNT11", mode="continuous")
    async with authenticated_client(role="admin") as client:
        r = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Tgt456DXYZ"},
        )
        assert r.status_code == 400
        assert "not applicable" in r.text.lower() or "NOT_APPLICABLE" in r.text


@pytest.mark.asyncio
async def test_archived_node_400(authenticated_client, db_session):
    """Transition to an archived node returns 400."""
    if not await _migration_005_applied(db_session):
        pytest.skip("Migration 005 not applied — skipping phase transitions API tests")
    extra_nodes = [
        {"id": "nd_Arc0000001", "name": "Archived", "x": 1, "y": 1, "color": "#888", "is_archived": True}
    ]
    project_id = await _seed_project(db_session, "PGARCH11", extra_nodes=extra_nodes)
    async with authenticated_client(role="admin") as client:
        r = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Arc0000001"},
        )
        assert r.status_code == 400


@pytest.mark.asyncio
async def test_non_member_403(authenticated_client, db_session):
    if not await _migration_005_applied(db_session):
        pytest.skip("Migration 005 not applied — skipping phase transitions API tests")
    project_id = await _seed_project(db_session, "PGMBR11")
    async with authenticated_client(role="member") as client:
        r = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Tgt456DXYZ"},
        )
        # 403 if project found but user unauthorized; 404 if require_project_transition_authority does project lookup
        assert r.status_code in (403, 404)


@pytest.mark.asyncio
async def test_audit_envelope_complete(authenticated_client, db_session):
    """Audit log row contains full D-08 envelope after successful transition."""
    if not await _migration_005_applied(db_session):
        pytest.skip("Migration 005 not applied — skipping phase transitions API tests")
    project_id = await _seed_project(db_session, "PGAUD11")
    async with authenticated_client(role="admin") as client:
        r = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={
                "source_phase_id": "nd_Src123DXYZ",
                "target_phase_id": "nd_Tgt456DXYZ",
                "note": "Test transition",
            },
        )
        assert r.status_code == 200
        # Verify audit row was inserted
        row = (await db_session.execute(text(
            "SELECT metadata FROM audit_log WHERE entity_id=:eid "
            "AND action='phase_transition' ORDER BY timestamp DESC LIMIT 1"
        ), {"eid": project_id})).scalar()
        assert row is not None
        assert row["source_phase_id"] == "nd_Src123DXYZ"
        assert row["target_phase_id"] == "nd_Tgt456DXYZ"
        assert row["workflow_mode"] == "flexible"
        assert row["note"] == "Test transition"
        assert "moved_task_count" in row
        assert "override_used" in row
