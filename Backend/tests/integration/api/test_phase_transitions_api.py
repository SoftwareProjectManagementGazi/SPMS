"""API-01 Phase Gate endpoint integration tests."""
import uuid
import pytest
from sqlalchemy import text
from app.application.services import idempotency_cache


@pytest.fixture(autouse=True)
def reset_cache():
    idempotency_cache.reset_for_tests()


async def _seed_test_project_and_user(async_session, key="PGTEST"):
    """Insert a minimal project with a source+target phase node for testing."""
    await async_session.execute(text(
        "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
        f"VALUES ('{key}', 'PG Test {key}', now(), 'SCRUM', 'ACTIVE', "
        "'{\"schema_version\":1,\"workflow\":{\"mode\":\"flexible\",\"nodes\":["
        "{\"id\":\"nd_Src123DXYZ\",\"name\":\"Source\",\"x\":0,\"y\":0,\"color\":\"#888\",\"is_archived\":false},"
        "{\"id\":\"nd_Tgt456DXYZ\",\"name\":\"Target\",\"x\":100,\"y\":0,\"color\":\"#888\",\"is_archived\":false}"
        "],\"edges\":[],\"groups\":[]},\"phase_completion_criteria\":{},"
        "\"enable_phase_assignment\":true,\"enforce_sequential_dependencies\":false,"
        f"\"enforce_wip_limits\":false,\"restrict_expired_sprints\":false}}'::jsonb) "
        f"ON CONFLICT (key) DO NOTHING"
    ))
    await async_session.flush()
    pid = (await async_session.execute(text(f"SELECT id FROM projects WHERE key='{key}'"))).scalar()
    return pid


@pytest.mark.asyncio
async def test_successful_transition_returns_200(authenticated_client, db_session):
    project_id = await _seed_test_project_and_user(db_session)
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
    project_id = await _seed_test_project_and_user(db_session, key="PGRL01")
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
    project_id = await _seed_test_project_and_user(db_session, key="PGIDM1")
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
    await db_session.execute(text(
        "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
        "VALUES ('PGCONT1', 'PG Cont', now(), 'KANBAN', 'ACTIVE', "
        "'{\"schema_version\":1,\"workflow\":{\"mode\":\"continuous\",\"nodes\":["
        "{\"id\":\"nd_Src123DXYZ\",\"name\":\"S\",\"x\":0,\"y\":0,\"color\":\"#888\",\"is_archived\":false},"
        "{\"id\":\"nd_Tgt456DXYZ\",\"name\":\"T\",\"x\":1,\"y\":1,\"color\":\"#888\",\"is_archived\":false}"
        "],\"edges\":[],\"groups\":[]},\"phase_completion_criteria\":{},"
        "\"enable_phase_assignment\":false,\"enforce_sequential_dependencies\":false,"
        "\"enforce_wip_limits\":false,\"restrict_expired_sprints\":false}'::jsonb) "
        "ON CONFLICT (key) DO NOTHING"
    ))
    await db_session.flush()
    pid = (await db_session.execute(text("SELECT id FROM projects WHERE key='PGCONT1'"))).scalar()
    async with authenticated_client(role="admin") as client:
        r = await client.post(
            f"/api/v1/projects/{pid}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Tgt456DXYZ"},
        )
        assert r.status_code == 400
        assert "not applicable" in r.text.lower() or "NOT_APPLICABLE" in r.text


@pytest.mark.asyncio
async def test_archived_node_400(authenticated_client, db_session):
    """Transition to an archived node returns 400."""
    await db_session.execute(text(
        "INSERT INTO projects (key, name, start_date, methodology, status, process_config) "
        "VALUES ('PGARCH1', 'PG Arch', now(), 'SCRUM', 'ACTIVE', "
        "'{\"schema_version\":1,\"workflow\":{\"mode\":\"flexible\",\"nodes\":["
        "{\"id\":\"nd_Src123DXYZ\",\"name\":\"S\",\"x\":0,\"y\":0,\"color\":\"#888\",\"is_archived\":false},"
        "{\"id\":\"nd_Arc0000001\",\"name\":\"A\",\"x\":1,\"y\":1,\"color\":\"#888\",\"is_archived\":true}"
        "],\"edges\":[],\"groups\":[]},\"phase_completion_criteria\":{},"
        "\"enable_phase_assignment\":false,\"enforce_sequential_dependencies\":false,"
        "\"enforce_wip_limits\":false,\"restrict_expired_sprints\":false}'::jsonb) "
        "ON CONFLICT (key) DO NOTHING"
    ))
    await db_session.flush()
    pid = (await db_session.execute(text("SELECT id FROM projects WHERE key='PGARCH1'"))).scalar()
    async with authenticated_client(role="admin") as client:
        r = await client.post(
            f"/api/v1/projects/{pid}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Arc0000001"},
        )
        assert r.status_code == 400


@pytest.mark.asyncio
async def test_non_member_403(authenticated_client, db_session):
    project_id = await _seed_test_project_and_user(db_session, key="PGMBR1")
    async with authenticated_client(role="member") as client:
        r = await client.post(
            f"/api/v1/projects/{project_id}/phase-transitions",
            json={"source_phase_id": "nd_Src123DXYZ", "target_phase_id": "nd_Tgt456DXYZ"},
        )
        # 403 if project found but user unauthorized; 404 possible if require_project_transition_authority does project lookup
        assert r.status_code in (403, 404)


@pytest.mark.asyncio
async def test_audit_envelope_complete(authenticated_client, db_session):
    """Audit log row contains full D-08 envelope after successful transition."""
    project_id = await _seed_test_project_and_user(db_session, key="PGAUD1")
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
            f"SELECT metadata FROM audit_log WHERE entity_id={project_id} "
            f"AND action='phase_transition' ORDER BY timestamp DESC LIMIT 1"
        ))).scalar()
        assert row is not None
        assert row["source_phase_id"] == "nd_Src123DXYZ"
        assert row["target_phase_id"] == "nd_Tgt456DXYZ"
        assert row["workflow_mode"] == "flexible"
        assert row["note"] == "Test transition"
        assert "moved_task_count" in row
        assert "override_used" in row
