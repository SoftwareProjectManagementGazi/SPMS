"""D-17 team leader endpoints integration tests."""
import pytest
from sqlalchemy import text


@pytest.mark.asyncio
async def test_patch_team_leader_admin_only(authenticated_client, db_session):
    # Seed a user + team
    await db_session.execute(text(
        "INSERT INTO users (email, full_name, password_hash, is_active) "
        "VALUES ('tladmin@testexample.com', 'TLA', 'h', true) ON CONFLICT DO NOTHING"
    ))
    await db_session.execute(text(
        "INSERT INTO teams (name, owner_id, is_deleted) "
        "SELECT 'TLATeam', u.id, false FROM users u WHERE u.email='tladmin@testexample.com' "
        "ON CONFLICT DO NOTHING"
    ))
    await db_session.flush()
    tid = (await db_session.execute(text("SELECT id FROM teams WHERE name='TLATeam'"))).scalar()
    uid = (await db_session.execute(text("SELECT id FROM users WHERE email='tladmin@testexample.com'"))).scalar()

    async with authenticated_client(role="admin") as client:
        r = await client.patch(f"/api/v1/teams/{tid}/leader", json={"leader_id": uid})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["leader_id"] == uid


@pytest.mark.asyncio
async def test_patch_team_leader_non_admin_forbidden(authenticated_client, db_session):
    tid = (await db_session.execute(text("SELECT id FROM teams LIMIT 1"))).scalar()
    if tid is None:
        pytest.skip("No team in DB to test")
    async with authenticated_client(role="member") as client:
        r = await client.patch(f"/api/v1/teams/{tid}/leader", json={"leader_id": None})
        assert r.status_code == 403


@pytest.mark.asyncio
async def test_get_my_led_teams(authenticated_client, db_session):
    async with authenticated_client(role="admin") as client:
        r = await client.get("/api/v1/users/me/led-teams")
        assert r.status_code == 200
        body = r.json()
        assert "teams" in body and "project_ids" in body
        assert isinstance(body["teams"], list)
        assert isinstance(body["project_ids"], list)
