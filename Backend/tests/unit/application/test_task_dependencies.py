import pytest


# TASK-05: Task Dependencies — unit test stubs
# These tests will be implemented in a later plan.


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_add_dependency_creates_blocks_relation():
    """AddTaskDependencyUseCase creates a 'blocks' relation between two tasks."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_add_dependency_prevents_circular_dependency():
    """AddTaskDependencyUseCase raises an error when the dependency would create a cycle."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_remove_dependency_deletes_relation():
    """RemoveTaskDependencyUseCase deletes the blocks relation between two tasks."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_list_dependencies_returns_blocks_and_blocked_by():
    """ListTaskDependenciesUseCase returns both 'blocks' and 'blocked_by' relations for a task."""
    assert False, "not implemented"
