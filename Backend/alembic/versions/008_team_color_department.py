"""Add color and department columns to teams table.

Revision ID: 008_team_color_department
Revises: 007_task_start_date
Create Date: 2026-05-09

Covers:
- teams.color VARCHAR(7) NOT NULL DEFAULT '#3b82f6' — hex color for UI banner
- teams.department VARCHAR(50) NULL — Engineering/Design/Product/Marketing/Operations
"""

from alembic import op
import sqlalchemy as sa


revision = "008_team_color_department"
down_revision = "007_task_start_date"
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
    if not _column_exists("teams", "color"):
        op.add_column(
            "teams",
            sa.Column("color", sa.String(7), nullable=False, server_default="#3b82f6"),
        )
    if not _column_exists("teams", "department"):
        op.add_column(
            "teams",
            sa.Column("department", sa.String(50), nullable=True),
        )


def downgrade() -> None:
    if _column_exists("teams", "department"):
        op.drop_column("teams", "department")
    if _column_exists("teams", "color"):
        op.drop_column("teams", "color")