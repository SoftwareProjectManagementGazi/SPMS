"""Make files.task_id nullable to support artifact file uploads (D-41).

Revision ID: 010_files_task_id_nullable
Revises: 009_milestone_start_date
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa

revision = "010_files_task_id_nullable"
down_revision = "009_milestone_start_date"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the old NOT NULL FK, recreate as nullable
    with op.batch_alter_table("files") as batch_op:
        batch_op.alter_column(
            "task_id",
            existing_type=sa.Integer(),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("files") as batch_op:
        batch_op.alter_column(
            "task_id",
            existing_type=sa.Integer(),
            nullable=False,
        )
