"""D-44 apply-to-projects integration test.

Tests require migration 005 applied and roles seeded. Skip cleanly otherwise.
"""
import pytest
from sqlalchemy import text


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
        assert isinstance(body.get("applied", []), list)
        assert isinstance(body.get("failed", []), list)
