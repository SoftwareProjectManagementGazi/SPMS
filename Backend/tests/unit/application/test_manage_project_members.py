"""TASK-04: Project member management — real unit tests for the member use-cases.

Replaces the previous ``xfail(strict=False) + assert False`` stubs (flagged as
fake passes by the test audit). Each test drives a real use case against
in-memory repositories that *record* their calls, so a regression in
``app/application/use_cases/manage_project_members.py`` fails the test.

Scope note: the original ``test_remove_member_keeps_assignee_on_done_tasks``
stub describes a *repository-layer* SQL behaviour — the use case merely
delegates to ``ITaskRepository.unassign_incomplete_tasks`` (whose WHERE clause
spares done-column tasks). Asserting that with a fake repo would only test the
fake, so the done-vs-incomplete filtering belongs in a repository integration
test (see TODO in tests/integration/infrastructure). Here we verify the use
case's real responsibility: it calls the *incomplete-only* unassign method and
removes the member, in that order.
"""
import pytest

from app.application.use_cases.manage_project_members import (
    AddProjectMemberUseCase,
    AddTeamToProjectUseCase,
    RemoveProjectMemberUseCase,
)
from app.domain.entities.user import User
from app.domain.exceptions import ProjectNotFoundError, UserNotFoundError


def _actor() -> User:
    return User(id=1, email="actor@example.com", password_hash="x", full_name="Actor")


class FakeProjectRepo:
    """Records add_member / remove_member calls into a shared ordered log."""

    def __init__(self, *, exists: bool = True, log: list | None = None):
        self._exists = exists
        self.added: list[tuple[int, int]] = []
        self.removed: list[tuple[int, int]] = []
        self.log = log if log is not None else []

    async def get_by_id(self, project_id: int):
        if not self._exists:
            return None
        # Use case only checks truthiness; return a lightweight stand-in.
        return {"id": project_id}

    async def add_member(self, project_id: int, user_id: int) -> None:
        self.added.append((project_id, user_id))
        self.log.append(("add_member", project_id, user_id))

    async def remove_member(self, project_id: int, user_id: int) -> None:
        self.removed.append((project_id, user_id))
        self.log.append(("remove_member", project_id, user_id))


class FakeUserRepo:
    def __init__(self, *, exists: bool = True):
        self._exists = exists

    async def get_by_id(self, user_id: int):
        return {"id": user_id} if self._exists else None


class FakeTeamRepo:
    def __init__(self, member_ids: list[int]):
        self._member_ids = member_ids

    async def get_members(self, team_id: int) -> list[int]:
        return list(self._member_ids)


class FakeTaskUnassignRepo:
    def __init__(self, log: list):
        self.log = log

    async def unassign_incomplete_tasks(self, project_id: int, user_id: int) -> None:
        self.log.append(("unassign_incomplete", project_id, user_id))


@pytest.mark.asyncio
async def test_add_member_adds_user_to_project():
    """AddProjectMemberUseCase persists exactly one membership for the user."""
    project_repo = FakeProjectRepo()
    user_repo = FakeUserRepo()

    await AddProjectMemberUseCase(project_repo, user_repo).execute(
        project_id=7, user_id=42, actor=_actor()
    )

    # kills mutation: dropping the add_member call leaves `added` empty.
    assert project_repo.added == [(7, 42)]


@pytest.mark.asyncio
async def test_add_member_unknown_project_raises():
    """A missing project raises ProjectNotFoundError and adds nobody."""
    project_repo = FakeProjectRepo(exists=False)
    user_repo = FakeUserRepo()

    with pytest.raises(ProjectNotFoundError):
        await AddProjectMemberUseCase(project_repo, user_repo).execute(
            project_id=999, user_id=42, actor=_actor()
        )
    assert project_repo.added == []


@pytest.mark.asyncio
async def test_add_member_unknown_user_raises():
    """A missing user raises UserNotFoundError before any membership is written."""
    project_repo = FakeProjectRepo(exists=True)
    user_repo = FakeUserRepo(exists=False)

    with pytest.raises(UserNotFoundError):
        await AddProjectMemberUseCase(project_repo, user_repo).execute(
            project_id=7, user_id=999, actor=_actor()
        )
    # kills mutation: skipping the user-existence check would add the ghost user.
    assert project_repo.added == []


@pytest.mark.asyncio
async def test_add_team_adds_all_team_members_to_project():
    """AddTeamToProjectUseCase adds every member of the team — not just the first."""
    project_repo = FakeProjectRepo()
    team_repo = FakeTeamRepo([10, 11, 12])

    await AddTeamToProjectUseCase(project_repo, team_repo).execute(
        project_id=7, team_id=3, actor=_actor()
    )

    # kills mutation: iterating member_ids[:1] would add only (7, 10).
    assert project_repo.added == [(7, 10), (7, 11), (7, 12)]


@pytest.mark.asyncio
async def test_remove_member_unassigns_incomplete_tasks_then_removes():
    """RemoveProjectMemberUseCase unassigns the member's incomplete tasks BEFORE
    removing them from the project (so no task is orphaned)."""
    log: list = []
    project_repo = FakeProjectRepo(log=log)
    user_repo = FakeUserRepo()
    task_repo = FakeTaskUnassignRepo(log=log)

    await RemoveProjectMemberUseCase(project_repo, user_repo, task_repo).execute(
        project_id=7, user_id=42, actor=_actor()
    )

    # Both real side effects happened with the right args...
    assert ("unassign_incomplete", 7, 42) in log  # kills mutation: dropping unassign
    assert ("remove_member", 7, 42) in log  # kills mutation: dropping remove_member
    # ...and in the safe order (unassign first).
    assert log.index(("unassign_incomplete", 7, 42)) < log.index(("remove_member", 7, 42))


@pytest.mark.asyncio
async def test_remove_member_unknown_user_raises():
    """A missing user raises UserNotFoundError and removes nobody."""
    log: list = []
    project_repo = FakeProjectRepo(log=log)
    user_repo = FakeUserRepo(exists=False)
    task_repo = FakeTaskUnassignRepo(log=log)

    with pytest.raises(UserNotFoundError):
        await RemoveProjectMemberUseCase(project_repo, user_repo, task_repo).execute(
            project_id=7, user_id=999, actor=_actor()
        )
    assert project_repo.removed == []
    assert log == []  # nothing unassigned or removed
