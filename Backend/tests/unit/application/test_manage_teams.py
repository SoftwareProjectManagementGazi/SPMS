import pytest


# AUTH-02: Team Management — xfail stubs
# These tests will be implemented in Plan 02-04.


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-02 not yet implemented", strict=False)
async def test_create_team_sets_owner():
    """The creator's user_id becomes team.owner_id when a team is created."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-02 not yet implemented", strict=False)
async def test_add_member_success():
    """add_member use case successfully adds a user to team.members."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-02 not yet implemented", strict=False)
async def test_add_duplicate_member_ignored_or_raises():
    """Adding the same user twice does not create a duplicate membership (either ignored or raises)."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-02 not yet implemented", strict=False)
async def test_remove_member_success():
    """remove_member reduces the team member count by one."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-02 not yet implemented", strict=False)
async def test_only_owner_can_add_member():
    """A non-owner user attempting add_member raises a 403-style exception."""
    assert False, "not implemented"
