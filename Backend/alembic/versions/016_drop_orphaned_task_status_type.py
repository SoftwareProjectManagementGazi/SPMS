"""Cleanup: drop the orphaned task_status_type enum.

Revision ID: 016_drop_orphaned_task_status_type
Revises: 015_iterative_enum_and_system_config
Create Date: 2026-05-29

Why this migration exists
-------------------------
The ``task_status_type`` enum (TODO / IN_PROGRESS / DONE / REVIEW) was created
in ``database/init.sql`` but is used by ZERO columns: task status is derived
from the board-column name at read time (manage_tasks.py), never persisted on
the tasks table. The parallel Python ``TaskStatus`` enum was likewise unused
and was removed from ``app/domain/entities/task.py`` in the same change.

This also realigns the alembic head: the live DB had been stamped at 014 while
015's content (the ITERATIVE enum value + system_config table) was already
present; 015 is idempotent, so ``alembic upgrade head`` no-ops 015 then applies
this drop and advances the stamp to 016.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "016_drop_orphaned_task_status_type"
down_revision = "015_iterative_enum_and_system_config"
branch_labels = None
depends_on = None


def _type_exists(name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT COUNT(*) FROM pg_type WHERE typname = :n"),
        {"n": name},
    )
    return result.scalar() > 0


def upgrade() -> None:
    # DROP TYPE fails loudly if any column still depends on the type — the safe
    # behavior, since this migration's premise is that none does. Guarded so a
    # re-run (or a DB that never had the type) is a no-op.
    if _type_exists("task_status_type"):
        op.execute("DROP TYPE task_status_type")


def downgrade() -> None:
    if not _type_exists("task_status_type"):
        op.execute(
            "CREATE TYPE task_status_type AS ENUM "
            "('TODO', 'IN_PROGRESS', 'DONE', 'REVIEW')"
        )
