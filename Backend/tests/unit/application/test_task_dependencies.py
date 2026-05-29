"""TASK-05: Task dependency use-cases — real unit tests.

Replaces the previous ``xfail(strict=False) + assert False`` stubs, which the
test audit flagged as fake passes: they declared "not implemented yet" even
though the use cases ship in
``app/application/use_cases/manage_task_dependencies.py``. Each test drives a
real use case against in-memory fakes so a regression in the use case fails the
test.

Cycle-detection note: ``AddDependencyUseCase`` delegates persistence *and* the
self-/reverse-cycle rule to the repository (the rule is SQL-backed). At the
use-case layer the testable contract is therefore that the use case *surfaces*
(does not swallow) the repo's cycle error. The actual SQL cycle rule is covered
by an integration test against the real ``SqlAlchemyTaskDependencyRepository``
(``tests/integration/infrastructure/test_task_dependency_repo_integration.py``).
The fake below mirrors that rule so the propagation test is realistic.
"""
from types import SimpleNamespace

import pytest

from app.application.use_cases.manage_task_dependencies import (
    AddDependencyUseCase,
    ListDependenciesUseCase,
    RemoveDependencyUseCase,
)
from app.domain.entities.task_dependency import TaskDependency
from app.domain.entities.user import User


def _make_actor(user_id: int = 3) -> User:
    return User(
        id=user_id,
        email=f"u{user_id}@example.com",
        password_hash="x",
        full_name="Actor",
    )


class FakeDependencyRepository:
    """In-memory stand-in mirroring ``SqlAlchemyTaskDependencyRepository``'s
    observable contract: assigns ids on ``add``, rejects self- and direct
    reverse-cycle dependencies, and splits ``list_for_task`` into ``blocks``
    (this task blocks others) and ``blocked_by`` (others block this task).
    """

    def __init__(self):
        self._rows: list[TaskDependency] = []
        self._next_id = 1

    async def add(self, task_id, depends_on_id, dep_type="blocks"):
        if depends_on_id == task_id:
            raise ValueError("Self-dependency not allowed")
        if any(
            r.task_id == depends_on_id and r.depends_on_id == task_id
            for r in self._rows
        ):
            raise ValueError("Circular dependency: reverse dependency already exists")
        dep = TaskDependency(
            id=self._next_id,
            task_id=task_id,
            depends_on_id=depends_on_id,
            dependency_type=dep_type,
        )
        self._next_id += 1
        self._rows.append(dep)
        return dep

    async def remove(self, dependency_id) -> bool:
        before = len(self._rows)
        self._rows = [r for r in self._rows if r.id != dependency_id]
        return len(self._rows) < before

    async def list_for_task(self, task_id):
        return {
            "blocks": [r for r in self._rows if r.task_id == task_id],
            "blocked_by": [r for r in self._rows if r.depends_on_id == task_id],
        }


class FakeTaskReader:
    """Minimal ``ITaskRepository.get_by_id`` used by ListDependenciesUseCase
    to enrich each relation with the *other* task's key + title."""

    def __init__(self, tasks: dict):
        self._tasks = tasks

    async def get_by_id(self, task_id):
        return self._tasks.get(task_id)


def _task(tid: int, key: str, title: str):
    # ListDependenciesUseCase reads .task_key, .project, .id, .title
    return SimpleNamespace(id=tid, task_key=key, title=title, project=None)


@pytest.mark.asyncio
async def test_add_dependency_creates_blocks_relation():
    """AddDependencyUseCase persists a 'blocks' relation and maps it to a DTO."""
    repo = FakeDependencyRepository()

    result = await AddDependencyUseCase(repo).execute(
        task_id=10, depends_on_id=20, dep_type="blocks", actor=_make_actor()
    )

    assert result.id is not None
    assert result.task_id == 10
    assert result.depends_on_id == 20  # kills mutation: depends_on_id dropped/hard-coded
    assert result.dependency_type == "blocks"
    # Actually persisted: it appears in task 10's "blocks" bucket.
    listed = await ListDependenciesUseCase(
        repo, FakeTaskReader({20: _task(20, "P-20", "Other")})
    ).execute(task_id=10)
    assert [d.depends_on_id for d in listed["blocks"]] == [20]


@pytest.mark.asyncio
async def test_add_dependency_prevents_circular_dependency():
    """A reverse dependency raises a cycle error — and the use case must surface
    it rather than swallow it (kills mutation: wrapping add() in try/except pass).
    """
    repo = FakeDependencyRepository()
    uc = AddDependencyUseCase(repo)
    await uc.execute(task_id=1, depends_on_id=2, dep_type="blocks", actor=_make_actor())

    with pytest.raises(ValueError, match="Circular"):
        await uc.execute(task_id=2, depends_on_id=1, dep_type="blocks", actor=_make_actor())


@pytest.mark.asyncio
async def test_remove_dependency_deletes_relation():
    """RemoveDependencyUseCase deletes the relation it is given."""
    repo = FakeDependencyRepository()
    created = await AddDependencyUseCase(repo).execute(
        task_id=10, depends_on_id=20, dep_type="blocks", actor=_make_actor()
    )

    await RemoveDependencyUseCase(repo).execute(
        dependency_id=created.id, actor=_make_actor()
    )

    listed = await ListDependenciesUseCase(repo, FakeTaskReader({})).execute(task_id=10)
    # kills mutation: a no-op remove would leave the relation in "blocks".
    assert listed["blocks"] == []


@pytest.mark.asyncio
async def test_list_dependencies_returns_blocks_and_blocked_by():
    """ListDependenciesUseCase returns BOTH directions, each enriched with the
    *other* task's key/title (blocks → the depends-on task; blocked_by → the
    blocking task)."""
    repo = FakeDependencyRepository()
    add = AddDependencyUseCase(repo)
    # task 100 blocks task 200; task 50 blocks task 100 (so 100 is blocked_by 50).
    await add.execute(task_id=100, depends_on_id=200, dep_type="blocks", actor=_make_actor())
    await add.execute(task_id=50, depends_on_id=100, dep_type="blocks", actor=_make_actor())

    reader = FakeTaskReader(
        {200: _task(200, "P-200", "Downstream"), 50: _task(50, "P-50", "Upstream")}
    )
    result = await ListDependenciesUseCase(repo, reader).execute(task_id=100)

    # blocks: 100 -> 200, enriched from the depends-on task (200).
    assert [d.depends_on_id for d in result["blocks"]] == [200]
    assert result["blocks"][0].depends_on_key == "P-200"
    assert result["blocks"][0].depends_on_title == "Downstream"
    # blocked_by: 50 -> 100, enriched from the blocking task (50).
    # kills mutation: merging/swapping the two buckets breaks these.
    assert [d.task_id for d in result["blocked_by"]] == [50]
    assert result["blocked_by"][0].depends_on_key == "P-50"
    assert result["blocked_by"][0].depends_on_title == "Upstream"
