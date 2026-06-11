"""D-44 apply-to-projects integration test.

Tests require migration 005 applied and roles seeded. Skip cleanly otherwise.
"""
import pytest
from sqlalchemy import text

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


async def _db_has_roles(session) -> bool:
    try:
        r = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (r.scalar() or 0) > 0
    except Exception:
        return False


@pytest.mark.asyncio
async def test_apply_template_to_projects(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping process template apply tests")

    # Seed template + two projects
    existing_tpl = (await db_session.execute(
        text("SELECT id FROM process_templates WHERE name='TestTpl'")
    )).scalar()
    if not existing_tpl:
        await db_session.execute(
            text(
                "INSERT INTO process_templates (name) VALUES ('TestTpl')"
            )
        )
    await db_session.flush()
    tid = (await db_session.execute(
        text("SELECT id FROM process_templates WHERE name='TestTpl'")
    )).scalar()

    for key in ["APPL1", "APPL2"]:
        existing = (await db_session.execute(
            text("SELECT id FROM projects WHERE key=:k"), {"k": key}
        )).scalar()
        if not existing:
            await db_session.execute(
                text(
                    "INSERT INTO projects (key, name, start_date, methodology, status) "
                    "VALUES (:k, 'P', now(), 'SCRUM', 'ACTIVE')"
                ),
                {"k": key},
            )
    await db_session.flush()

    pids = [
        (await db_session.execute(text("SELECT id FROM projects WHERE key='APPL1'"))).scalar(),
        (await db_session.execute(text("SELECT id FROM projects WHERE key='APPL2'"))).scalar(),
    ]

    async with authenticated_client(role="admin") as client:
        r = await client.post(f"/api/v1/process-templates/{tid}/apply", json={
            "project_ids": pids, "require_pm_approval": False,
        })
        assert r.status_code == 200, r.text
        body = r.json()
        applied = body.get("applied", [])
        failed = body.get("failed", [])
        # kills mutation: applied=[] / failed=[all] (e.g. repo.update raising) satisfied
        # the old isinstance-only check. Pin the actual outcome + the DB side-effect.
        assert failed == [], f"unexpected failures: {failed}"
        assert set(applied) == set(pids), f"expected {pids} applied, got {applied}"
    # Verify the template was actually stamped onto each project row.
    for pid in pids:
        row = (await db_session.execute(
            text(
                "SELECT process_template_id, process_config->>'schema_version' AS sv "
                "FROM projects WHERE id=:i"
            ),
            {"i": pid},
        )).first()
        assert row is not None
        assert row[0] == tid, f"project {pid} process_template_id not stamped"
        assert row.sv == "2", f"project {pid} process_config schema_version not bumped to 2"


@pytest.mark.asyncio
async def test_delete_in_use_builtin_template_clears_project_links(
    authenticated_client, db_session
):
    """DELETE works on an in-use BUILT-IN template: 204, the row is gone, and
    referencing projects get process_template_id=NULL (their copied workflow
    stays untouched)."""
    if not await _db_has_roles(db_session):
        pytest.skip("DB has no roles — skipping process template delete test")

    await db_session.execute(
        text("DELETE FROM process_templates WHERE name='DelTpl'")
    )
    await db_session.execute(
        text(
            "INSERT INTO process_templates (name, is_builtin) "
            "VALUES ('DelTpl', true)"
        )
    )
    await db_session.flush()
    tid = (await db_session.execute(
        text("SELECT id FROM process_templates WHERE name='DelTpl'")
    )).scalar()

    existing = (await db_session.execute(
        text("SELECT id FROM projects WHERE key='DELP1'")
    )).scalar()
    if not existing:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status) "
                "VALUES ('DELP1', 'P', now(), 'SCRUM', 'ACTIVE')"
            )
        )
    await db_session.execute(
        text("UPDATE projects SET process_template_id=:t WHERE key='DELP1'"),
        {"t": tid},
    )
    await db_session.flush()
    pid = (await db_session.execute(
        text("SELECT id FROM projects WHERE key='DELP1'")
    )).scalar()

    async with authenticated_client(role="admin") as client:
        r = await client.delete(f"/api/v1/process-templates/{tid}")
        assert r.status_code == 204, r.text

    gone = (await db_session.execute(
        text("SELECT id FROM process_templates WHERE id=:i"), {"i": tid}
    )).scalar()
    assert gone is None, "template row should be deleted"

    link = (await db_session.execute(
        text("SELECT process_template_id FROM projects WHERE id=:i"), {"i": pid}
    )).scalar()
    assert link is None, "project link should be cleared, not block the delete"
