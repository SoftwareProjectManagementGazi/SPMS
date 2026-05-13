"""Add start_date column to milestones table.

Revision ID: 009_milestone_start_date
Revises: 008_team_color_department
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa

revision = "009_milestone_start_date"
down_revision = "008_team_color_department"
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
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
    if not _column_exists("milestones", "start_date"):
        op.add_column(
            "milestones",
            sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    if _column_exists("milestones", "start_date"):
        op.drop_column("milestones", "start_date")
