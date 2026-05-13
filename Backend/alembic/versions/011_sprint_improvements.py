"""Sprint lifecycle improvements: add status column + sprint_snapshots table.

Revision ID: 011_sprint_improvements
Revises: 010_files_task_id_nullable
Create Date: 2026-05-12

Changes:
  1. sprints.status VARCHAR(20) NOT NULL DEFAULT 'PLANNED'
     Backfill: is_active=True → ACTIVE, rest → PLANNED
  2. CREATE TABLE sprint_snapshots (point-in-time stats at sprint close)
"""

from alembic import op
import sqlalchemy as sa

revision = "011_sprint_improvements"
down_revision = "010_files_task_id_nullable"
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


def _table_exists(table_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t"
        ),
        {"t": table_name},
    )
    return result.scalar() > 0


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. Add sprints.status column (idempotent)
    # ------------------------------------------------------------------ #
    if not _column_exists("sprints", "status"):
        with op.batch_alter_table("sprints") as batch_op:
            batch_op.add_column(
                sa.Column(
                    "status",
                    sa.String(20),
                    nullable=False,
                    server_default="PLANNED",
                )
            )

        # Backfill: active sprints → ACTIVE (only on first apply)
        op.execute(
            "UPDATE sprints SET status = 'ACTIVE' WHERE is_active = TRUE"
        )

    # ------------------------------------------------------------------ #
    # 2. Create sprint_snapshots table (idempotent)
    # ------------------------------------------------------------------ #
    if not _table_exists("sprint_snapshots"):
        op.create_table(
            "sprint_snapshots",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column(
                "sprint_id",
                sa.Integer(),
                sa.ForeignKey("sprints.id", ondelete="CASCADE"),
                nullable=False,
                unique=True,
                index=True,
            ),
            sa.Column(
                "project_id",
                sa.Integer(),
                sa.ForeignKey("projects.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column("task_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("completed_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("total_points", sa.Integer(), nullable=False, server_default="0"),
            sa.Column(
                "closed_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )


def downgrade() -> None:
    if _table_exists("sprint_snapshots"):
        op.drop_table("sprint_snapshots")
    if _column_exists("sprints", "status"):
        with op.batch_alter_table("sprints") as batch_op:
            batch_op.drop_column("status")
