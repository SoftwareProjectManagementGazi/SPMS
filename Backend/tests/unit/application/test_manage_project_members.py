import pytest


# TASK-04: Project Member Management — unit test stubs
# These tests will be implemented in a later plan.


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_add_member_adds_user_to_project():
    """AddProjectMemberUseCase adds the specified user as a member of the project."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_add_team_adds_all_team_members_to_project():
    """AddProjectMemberUseCase bulk-adds all members of a team to the project."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_remove_member_unassigns_incomplete_tasks():
    """RemoveProjectMemberUseCase unassigns the removed member from all incomplete tasks."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_remove_member_keeps_assignee_on_done_tasks():
    """RemoveProjectMemberUseCase leaves the assignee intact on already-completed tasks."""
    assert False, "not implemented"
