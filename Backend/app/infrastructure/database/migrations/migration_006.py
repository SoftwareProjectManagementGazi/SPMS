"""Migration 006: Make files.task_id nullable to support artifact file uploads (D-41).

Idempotent async upgrade — called from lifespan hook in main.py.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


async def upgrade(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        # Check current nullable status
        result = await conn.execute(
            text(
                "SELECT is_nullable FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name='files' AND column_name='task_id'"
            )
        )
        row = result.fetchone()
        if row is None:
            # Table/column doesn't exist yet — nothing to do
            return
        if row[0] == "YES":
            # Already nullable
            return

        # Drop FK constraint, alter column, re-add FK
        await conn.execute(
            text(
                "ALTER TABLE files "
                "DROP CONSTRAINT IF EXISTS files_task_id_fkey"
            )
        )
        await conn.execute(
            text("ALTER TABLE files ALTER COLUMN task_id DROP NOT NULL")
        )
        await conn.execute(
            text(
                "ALTER TABLE files "
                "ADD CONSTRAINT files_task_id_fkey "
                "FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE"
            )
        )
