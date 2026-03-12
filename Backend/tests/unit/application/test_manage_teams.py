import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException


# AUTH-02: Team Management — unit tests for use cases


@pytest.mark.asyncio
async def test_create_team_sets_owner():
    """The creator's user_id becomes team.owner_id when a team is created."""
    from app.application.use_cases.manage_teams import CreateTeamUseCase
    from app.application.dtos.team_dtos import TeamCreateDTO
    from app.domain.entities.team import Team
    from app.domain.entities.user import User

    owner = User(id=42, email="owner@example.com", password_hash="x", full_name="Owner")
    dto = TeamCreateDTO(name="Dev Team", description="Backend devs")

    created_team = Team(id=1, name="Dev Team", description="Backend devs", owner_id=42)

    team_repo = AsyncMock()
    team_repo.create = AsyncMock(return_value=created_team)

    use_case = CreateTeamUseCase(team_repo)
    result = await use_case.execute(owner, dto)

    team_repo.create.assert_called_once_with("Dev Team", "Backend devs", 42)
    assert result.owner_id == 42


@pytest.mark.asyncio
async def test_add_member_success():
    """add_member use case successfully calls repo.add_member with correct team_id/user_id."""
    from app.application.use_cases.manage_teams import AddTeamMemberUseCase
    from app.domain.entities.team import Team
    from app.domain.entities.user import User

    owner = User(id=1, email="owner@example.com", password_hash="x", full_name="Owner")
    target = User(id=2, email="target@example.com", password_hash="x", full_name="Target")
    team = Team(id=10, name="Team A", owner_id=1)

    team_repo = AsyncMock()
    team_repo.get_by_id = AsyncMock(return_value=team)
    team_repo.add_member = AsyncMock()

    user_repo = AsyncMock()
    user_repo.get_by_id = AsyncMock(return_value=target)

    use_case = AddTeamMemberUseCase(team_repo, user_repo)
    await use_case.execute(owner, team_id=10, user_id=2)

    team_repo.add_member.assert_called_once_with(10, 2)


@pytest.mark.asyncio
async def test_add_duplicate_member_ignored_or_raises():
    """Adding the same user twice — the second add_member call is invoked (idempotency is at repo level)."""
    from app.application.use_cases.manage_teams import AddTeamMemberUseCase
    from app.domain.entities.team import Team
    from app.domain.entities.user import User

    owner = User(id=1, email="owner@example.com", password_hash="x", full_name="Owner")
    target = User(id=2, email="target@example.com", password_hash="x", full_name="Target")
    team = Team(id=10, name="Team A", owner_id=1)

    team_repo = AsyncMock()
    team_repo.get_by_id = AsyncMock(return_value=team)
    team_repo.add_member = AsyncMock()  # idempotent — no exception

    user_repo = AsyncMock()
    user_repo.get_by_id = AsyncMock(return_value=target)

    use_case = AddTeamMemberUseCase(team_repo, user_repo)
    # Call twice — should not raise unconditionally
    await use_case.execute(owner, team_id=10, user_id=2)
    await use_case.execute(owner, team_id=10, user_id=2)

    assert team_repo.add_member.call_count == 2


@pytest.mark.asyncio
async def test_remove_member_success():
    """remove_member use case calls repo.remove_member with correct team_id/user_id."""
    from app.application.use_cases.manage_teams import RemoveTeamMemberUseCase
    from app.domain.entities.team import Team
    from app.domain.entities.user import User

    owner = User(id=1, email="owner@example.com", password_hash="x", full_name="Owner")
    team = Team(id=10, name="Team A", owner_id=1)

    team_repo = AsyncMock()
    team_repo.get_by_id = AsyncMock(return_value=team)
    team_repo.remove_member = AsyncMock()

    use_case = RemoveTeamMemberUseCase(team_repo)
    await use_case.execute(owner, team_id=10, user_id=3)

    team_repo.remove_member.assert_called_once_with(10, 3)


@pytest.mark.asyncio
async def test_only_owner_can_add_member():
    """A non-owner user attempting add_member raises HTTP 403."""
    from app.application.use_cases.manage_teams import AddTeamMemberUseCase
    from app.domain.entities.team import Team
    from app.domain.entities.user import User

    non_owner = User(id=99, email="notowner@example.com", password_hash="x", full_name="Not Owner")
    team = Team(id=10, name="Team A", owner_id=1)  # owner is user 1, not 99

    team_repo = AsyncMock()
    team_repo.get_by_id = AsyncMock(return_value=team)
    team_repo.add_member = AsyncMock()

    user_repo = AsyncMock()

    use_case = AddTeamMemberUseCase(team_repo, user_repo)

    with pytest.raises(HTTPException) as exc_info:
        await use_case.execute(non_owner, team_id=10, user_id=2)

    assert exc_info.value.status_code == 403
    team_repo.add_member.assert_not_called()
