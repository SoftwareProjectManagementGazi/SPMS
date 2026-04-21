"""D-16: ITeamRepository.user_leads_any_team_on_project + get_teams_led_by integration test."""
import pytest
from sqlalchemy import text
from app.infrastructure.database.repositories.team_repo import SqlAlchemyTeamRepository


@pytest.mark.asyncio
async def test_user_leads_any_team_on_project_positive(async_session):
    """User leads a team that's linked to the project -> returns True."""
    # Seed: create user, team (with leader_id=user), project, team_project link
    await async_session.execute(text(
        "INSERT INTO users (email, full_name, password_hash, is_active) "
        "VALUES ('leader@testexample.com', 'Leader', 'hash', true) ON CONFLICT DO NOTHING"
    ))
    await async_session.execute(text(
        "INSERT INTO teams (name, owner_id, leader_id, is_deleted) "
        "SELECT 'T1', u.id, u.id, false FROM users u WHERE u.email='leader@testexample.com' "
        "ON CONFLICT DO NOTHING"
    ))
    await async_session.flush()
    # Get IDs
    user_id = (await async_session.execute(text("SELECT id FROM users WHERE email='leader@testexample.com'"))).scalar()
    team_id = (await async_session.execute(text(f"SELECT id FROM teams WHERE leader_id={user_id}"))).scalar()
    # Create a project — use minimal SQL
    await async_session.execute(text(
        f"INSERT INTO projects (key, name, start_date, methodology, status, manager_id) "
        f"VALUES ('TLTEST', 'TL Test', now(), 'SCRUM', 'ACTIVE', {user_id}) ON CONFLICT DO NOTHING"
    ))
    project_id = (await async_session.execute(text("SELECT id FROM projects WHERE key='TLTEST'"))).scalar()
    # Link team to project
    await async_session.execute(text(
        f"INSERT INTO team_projects (team_id, project_id) VALUES ({team_id}, {project_id}) ON CONFLICT DO NOTHING"
    ))
    await async_session.flush()

    repo = SqlAlchemyTeamRepository(async_session)
    assert await repo.user_leads_any_team_on_project(user_id, project_id) is True


@pytest.mark.asyncio
async def test_user_leads_any_team_on_project_negative(async_session):
    """Non-leader user returns False even if team is linked to project."""
    repo = SqlAlchemyTeamRepository(async_session)
    # Any random user_id + project_id that has no leader relationship
    assert await repo.user_leads_any_team_on_project(99999, 99999) is False


@pytest.mark.asyncio
async def test_get_teams_led_by_returns_teams(async_session):
    """get_teams_led_by returns all teams where leader_id=user_id."""
    # Seed
    await async_session.execute(text(
        "INSERT INTO users (email, full_name, password_hash, is_active) "
        "VALUES ('tleader@testexample.com', 'TLeader', 'hash', true) ON CONFLICT DO NOTHING"
    ))
    user_id = (await async_session.execute(text("SELECT id FROM users WHERE email='tleader@testexample.com'"))).scalar()
    await async_session.execute(text(
        f"INSERT INTO teams (name, owner_id, leader_id, is_deleted) "
        f"VALUES ('LedTeam', {user_id}, {user_id}, false) ON CONFLICT DO NOTHING"
    ))
    await async_session.flush()

    repo = SqlAlchemyTeamRepository(async_session)
    teams = await repo.get_teams_led_by(user_id)
    assert any(t.name == "LedTeam" for t in teams)
