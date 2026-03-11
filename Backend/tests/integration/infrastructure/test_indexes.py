"""
Integration tests for database index existence verification.

All tests are marked xfail — stubs for Nyquist compliance.
Implementation is pending Plan 01-04 (DB index creation).
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-04 — DB indexes not yet created")
async def test_tasks_project_id_index_exists(db_session: AsyncSession):
    """DB reflection confirms index on tasks.project_id."""
    # Stub: will use SQLAlchemy inspect() to verify index existence
    raise NotImplementedError("tasks.project_id index not yet created")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-04 — DB indexes not yet created")
async def test_tasks_assignee_id_index_exists(db_session: AsyncSession):
    """DB reflection confirms index on tasks.assignee_id."""
    # Stub: will use SQLAlchemy inspect() to verify index existence
    raise NotImplementedError("tasks.assignee_id index not yet created")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-04 — DB indexes not yet created")
async def test_tasks_parent_task_id_index_exists(db_session: AsyncSession):
    """DB reflection confirms index on tasks.parent_task_id."""
    # Stub: will use SQLAlchemy inspect() to verify index existence
    raise NotImplementedError("tasks.parent_task_id index not yet created")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-04 — DB indexes not yet created")
async def test_projects_manager_id_index_exists(db_session: AsyncSession):
    """DB reflection confirms index on projects.manager_id."""
    # Stub: will use SQLAlchemy inspect() to verify index existence
    raise NotImplementedError("projects.manager_id index not yet created")
