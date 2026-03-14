"""Phase 3 schema: task_dependencies table + task_key/series_id/task_seq/file_size columns.

This file provides an idempotent async upgrade function that can be called
directly (e.g., from a management script or lifespan hook) without running
the full Alembic CLI. For Alembic-managed environments use the corresponding
file in alembic/versions/003_phase3_schema.py instead.

Covers:
- TASK-02/03: task_dependencies table (finish-to-start dependency tracking)
- TASK-04: task_key column on tasks (e.g. "MP-42")
- TASK-05: series_id column on tasks (UUID string linking recurring instances)
- TASK-07: task_seq column on projects (per-project task key counter)
- TASK-08: file_size column on files (bytes; stored at upload time)
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


async def _table_exists(conn, table_name: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t"
        ),
        {"t": table_name},
    )
    return result.scalar() > 0


async def _column_exists(conn, table_name: str, column_name: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() > 0


async def upgrade(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        # task_dependencies table (hard delete only — no TimestampedMixin)
        if not await _table_exists(conn, "task_dependencies"):
            await conn.execute(
                text("""
                    CREATE TABLE task_dependencies (
                        id SERIAL PRIMARY KEY,
                        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                        depends_on_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                        dependency_type VARCHAR(20) NOT NULL DEFAULT 'blocks',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        CONSTRAINT uq_task_dependency UNIQUE (task_id, depends_on_id)
                    )
                """)
            )

        # tasks.task_key
        if not await _column_exists(conn, "tasks", "task_key"):
            await conn.execute(
                text("ALTER TABLE tasks ADD COLUMN task_key VARCHAR(20)")
            )

        # tasks.series_id
        if not await _column_exists(conn, "tasks", "series_id"):
            await conn.execute(
                text("ALTER TABLE tasks ADD COLUMN series_id VARCHAR(36)")
            )

        # projects.task_seq
        if not await _column_exists(conn, "projects", "task_seq"):
            await conn.execute(
                text(
                    "ALTER TABLE projects ADD COLUMN task_seq INTEGER NOT NULL DEFAULT 0"
                )
            )

        # files.file_size
        if not await _column_exists(conn, "files", "file_size"):
            await conn.execute(
                text("ALTER TABLE files ADD COLUMN file_size INTEGER")
            )

        # Backfill task_key for existing tasks
        await conn.execute(
            text(
                "UPDATE tasks "
                "SET task_key = (SELECT key FROM projects WHERE projects.id = tasks.project_id) "
                "|| '-' || tasks.id "
                "WHERE task_key IS NULL"
            )
        )
