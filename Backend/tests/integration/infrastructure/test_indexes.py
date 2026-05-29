"""Integration tests verifying the performance indexes on hot FK columns exist.

These were ``xfail(reason="DB indexes not yet created") + raise NotImplementedError``
stubs — but the indexes ARE present on the migrated schema (ix_tasks_project_id,
ix_tasks_assignee_id, ix_tasks_parent_task_id, ix_projects_manager_id), so the stubs
were stale fake-passes that never verified anything. Each test now reflects the
catalog (pg_index/pg_attribute) and asserts a real index covers the column — so a
dropped index (silent seq-scan regression on a hot join/filter column) fails here.
"""
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# requires_db: real catalog reflection against Postgres.
pytestmark = pytest.mark.requires_db


async def _column_is_indexed(session: AsyncSession, table: str, column: str) -> bool:
    """True if ``column`` participates in at least one index on ``table``."""
    row = (
        await session.execute(
            text(
                "SELECT 1 FROM pg_index i "
                "JOIN pg_class t ON t.oid = i.indrelid "
                "JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey) "
                "WHERE t.relname = :t AND a.attname = :c LIMIT 1"
            ),
            {"t": table, "c": column},
        )
    ).scalar()
    return row is not None


@pytest.mark.asyncio
async def test_tasks_project_id_index_exists(db_session: AsyncSession):
    """tasks.project_id must be indexed (hot filter: tasks-by-project)."""
    assert await _column_is_indexed(db_session, "tasks", "project_id")


@pytest.mark.asyncio
async def test_tasks_assignee_id_index_exists(db_session: AsyncSession):
    """tasks.assignee_id must be indexed (my-tasks / assignee filters)."""
    assert await _column_is_indexed(db_session, "tasks", "assignee_id")


@pytest.mark.asyncio
async def test_tasks_parent_task_id_index_exists(db_session: AsyncSession):
    """tasks.parent_task_id must be indexed (subtask lookups)."""
    assert await _column_is_indexed(db_session, "tasks", "parent_task_id")


@pytest.mark.asyncio
async def test_projects_manager_id_index_exists(db_session: AsyncSession):
    """projects.manager_id must be indexed (manager dashboards / ownership checks)."""
    assert await _column_is_indexed(db_session, "projects", "manager_id")
