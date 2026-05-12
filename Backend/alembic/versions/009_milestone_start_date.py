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


def upgrade() -> None:
    op.add_column(
        "milestones",
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("milestones", "start_date")
