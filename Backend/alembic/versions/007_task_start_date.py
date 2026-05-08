"""Add start_date column to tasks table for timeline support.

Revision ID: 007_task_start_date
Revises: 006_phase14_admin_panel
Create Date: 2026-05-08

Covers:
- tasks.start_date TIMESTAMPTZ NULL — enables Gantt/timeline rendering in the
  frontend. The TimelineTab filters tasks by (start IS NOT NULL AND due IS NOT NULL);
  without this column every task was excluded, showing the empty-state message even
  when tasks had due_date values set.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "007_task_start_date"
down_revision = "006_phase14_admin_panel"
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists (PostgreSQL). Idempotent guard."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() > 0


def upgrade() -> None:
    if not _column_exists("tasks", "start_date"):
        op.add_column(
            "tasks",
            sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    if _column_exists("tasks", "start_date"):
        op.drop_column("tasks", "start_date")
