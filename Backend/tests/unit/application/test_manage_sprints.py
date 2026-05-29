"""TASK-01: Sprint management use-cases — real unit tests.

Replaces the previous ``xfail(strict=False) + assert False`` stubs, which the
test audit flagged as fake passes: they declared "not implemented yet" even
though the use cases ship in ``app/application/use_cases/manage_sprints.py``.
Each test drives a real use case against an in-memory ``ISprintRepository``
fake so a regression in the use case fails the test.
"""
import pytest

from app.application.dtos.sprint_dtos import SprintCreateDTO, SprintUpdateDTO
from app.application.use_cases.manage_sprints import (
    CreateSprintUseCase,
    DeleteSprintUseCase,
    ListSprintsUseCase,
    UpdateSprintUseCase,
)
from app.domain.entities.sprint import Sprint, SprintStatus
from app.domain.entities.user import User
from app.domain.exceptions import SprintNotFoundError


def _make_user(user_id: int = 5) -> User:
    return User(
        id=user_id,
        email=f"u{user_id}@example.com",
        password_hash="x",
        full_name="PM",
    )


class FakeSprintRepository:
    """In-memory ``ISprintRepository`` stand-in (duck-typed like the comment
    fake). Assigns ids on create, applies partial field updates, removes on
    delete, and records ``move_tasks_to_sprint`` calls so the delete flow's
    task-reparenting can be asserted."""

    def __init__(self):
        self._rows: dict[int, Sprint] = {}
        self._next_id = 1
        self.moved: list[tuple] = []

    async def create(self, sprint: Sprint) -> Sprint:
        sprint.id = self._next_id
        self._next_id += 1
        self._rows[sprint.id] = sprint
        return sprint

    async def get_by_id(self, sprint_id):
        return self._rows.get(sprint_id)

    async def get_by_project(self, project_id):
        return [s for s in self._rows.values() if s.project_id == project_id]

    async def get_active_sprint(self, project_id):
        return next(
            (s for s in self._rows.values() if s.project_id == project_id and s.is_active),
            None,
        )

    async def update(self, sprint_id, fields: dict):
        sprint = self._rows.get(sprint_id)
        if sprint is None:
            return None
        for key, value in fields.items():
            setattr(sprint, key, value)
        return sprint

    async def delete(self, sprint_id) -> bool:
        return self._rows.pop(sprint_id, None) is not None

    async def move_tasks_to_sprint(self, from_sprint_id, to_sprint_id, incomplete_only=False) -> int:
        self.moved.append((from_sprint_id, to_sprint_id, incomplete_only))
        return 0


@pytest.mark.asyncio
async def test_create_sprint_creates_sprint_in_project():
    """CreateSprintUseCase creates a PLANNED, inactive sprint under the project."""
    repo = FakeSprintRepository()

    result = await CreateSprintUseCase(repo).execute(
        SprintCreateDTO(project_id=42, name="Sprint 1", goal="Ship MVP")
    )

    assert result.id is not None
    assert result.project_id == 42  # kills mutation: project_id dropped/hard-coded
    assert result.name == "Sprint 1"
    assert result.status == SprintStatus.PLANNED  # new sprints start PLANNED
    assert result.is_active is False
    # Actually persisted under that project.
    listed = await ListSprintsUseCase(repo).execute(project_id=42)
    assert [s.id for s in listed] == [result.id]


@pytest.mark.asyncio
async def test_list_sprints_returns_project_sprints():
    """ListSprintsUseCase returns only sprints belonging to the given project."""
    repo = FakeSprintRepository()
    create = CreateSprintUseCase(repo)
    await create.execute(SprintCreateDTO(project_id=1, name="A"))
    await create.execute(SprintCreateDTO(project_id=1, name="B"))
    await create.execute(SprintCreateDTO(project_id=2, name="other-project"))

    result = await ListSprintsUseCase(repo).execute(project_id=1)

    # kills mutation: get_by_project ignoring project_id would leak "other-project".
    assert sorted(s.name for s in result) == ["A", "B"]
    assert all(s.project_id == 1 for s in result)


@pytest.mark.asyncio
async def test_update_sprint_updates_fields():
    """UpdateSprintUseCase applies the patched fields and persists them."""
    repo = FakeSprintRepository()
    created = await CreateSprintUseCase(repo).execute(
        SprintCreateDTO(project_id=1, name="Old")
    )

    updated = await UpdateSprintUseCase(repo).execute(
        created.id, SprintUpdateDTO(name="New", goal="Revised"), _make_user()
    )

    assert updated.name == "New"  # kills mutation: fields not applied
    assert updated.goal == "Revised"
    # Persisted, not just echoed.
    listed = await ListSprintsUseCase(repo).execute(project_id=1)
    assert listed[0].name == "New"


@pytest.mark.asyncio
async def test_update_sprint_missing_raises_not_found():
    """Updating a non-existent sprint raises SprintNotFoundError (not a silent pass)."""
    repo = FakeSprintRepository()
    with pytest.raises(SprintNotFoundError):
        await UpdateSprintUseCase(repo).execute(
            999, SprintUpdateDTO(name="x"), _make_user()
        )


@pytest.mark.asyncio
async def test_delete_sprint_removes_sprint():
    """DeleteSprintUseCase reparents tasks to the backlog, then removes the sprint."""
    repo = FakeSprintRepository()
    created = await CreateSprintUseCase(repo).execute(
        SprintCreateDTO(project_id=1, name="Doomed")
    )

    await DeleteSprintUseCase(repo).execute(created.id, _make_user())

    # kills mutation: a no-op delete would leave it listed.
    listed = await ListSprintsUseCase(repo).execute(project_id=1)
    assert listed == []
    # Tasks were moved off the sprint (to backlog = None) before deletion.
    assert repo.moved == [(created.id, None, False)]


@pytest.mark.asyncio
async def test_delete_sprint_missing_raises_not_found():
    """Deleting a non-existent sprint raises SprintNotFoundError."""
    repo = FakeSprintRepository()
    with pytest.raises(SprintNotFoundError):
        await DeleteSprintUseCase(repo).execute(123, _make_user())
