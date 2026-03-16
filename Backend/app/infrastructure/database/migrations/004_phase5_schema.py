"""Phase 5 schema: notification_type enum extension, related_entity_type column,
notification_preferences and task_watchers tables.

This file provides an idempotent async upgrade function that can be called
directly (e.g., from a management script or lifespan hook) without running
the full Alembic CLI. For Alembic-managed environments use the corresponding
file in alembic/versions/004_phase5_schema.py instead.

Covers:
- NOTIF-01/02: Extend notification_type enum with 5 new values (STATUS_CHANGE,
  TASK_DELETED, PROJECT_CREATED, PROJECT_DELETED, PROJECT_UPDATED)
- NOTIF-01: Add related_entity_type column to notifications table
- NOTIF-05: Create notification_preferences table
- NOTIF-01: Create task_watchers table
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


async def _enum_value_exists(conn, enum_name: str, value: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT COUNT(*) FROM pg_enum e "
            "JOIN pg_type t ON e.enumtypid = t.oid "
            "WHERE t.typname = :enum_name AND e.enumlabel = :value"
        ),
        {"enum_name": enum_name, "value": value},
    )
    return result.scalar() > 0


async def upgrade(engine: AsyncEngine) -> None:
    # -------------------------------------------------------------------------
    # NOTIF-01/02: Extend notification_type enum with 5 new values.
    # CRITICAL: ALTER TYPE ADD VALUE cannot run inside a transaction block.
    # Use a raw connection with AUTOCOMMIT isolation level.
    # -------------------------------------------------------------------------
    new_enum_values = [
        "STATUS_CHANGE",
        "TASK_DELETED",
        "PROJECT_CREATED",
        "PROJECT_DELETED",
        "PROJECT_UPDATED",
    ]
    autocommit_engine = engine.execution_options(isolation_level="AUTOCOMMIT")
    async with autocommit_engine.connect() as conn:
        for val in new_enum_values:
            if not await _enum_value_exists(conn, "notification_type", val):
                await conn.execute(
                    text(
                        f"ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '{val}'"
                    )
                )

    # -------------------------------------------------------------------------
    # All remaining DDL can run inside a regular transaction
    # -------------------------------------------------------------------------
    async with engine.begin() as conn:
        # notifications.related_entity_type column
        if not await _column_exists(conn, "notifications", "related_entity_type"):
            await conn.execute(
                text(
                    "ALTER TABLE notifications "
                    "ADD COLUMN related_entity_type VARCHAR(20)"
                )
            )

        # notification_preferences table (TimestampedMixin columns included)
        if not await _table_exists(conn, "notification_preferences"):
            await conn.execute(
                text("""
                    CREATE TABLE notification_preferences (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                        preferences JSON NOT NULL DEFAULT '{}',
                        email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                        deadline_days INTEGER NOT NULL DEFAULT 1,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        version INTEGER NOT NULL DEFAULT 1,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                        deleted_at TIMESTAMP WITH TIME ZONE
                    )
                """)
            )
            await conn.execute(
                text(
                    "CREATE UNIQUE INDEX ix_notification_preferences_user_id "
                    "ON notification_preferences(user_id)"
                )
            )

        # task_watchers table (lightweight join table — no TimestampedMixin)
        if not await _table_exists(conn, "task_watchers"):
            await conn.execute(
                text("""
                    CREATE TABLE task_watchers (
                        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        PRIMARY KEY (task_id, user_id)
                    )
                """)
            )
