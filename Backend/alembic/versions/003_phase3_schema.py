"""Phase 3 schema: task_dependencies table + task_key/series_id/task_seq/file_size columns.

Revision ID: 003_phase3
Revises: 002_phase2
Create Date: 2026-03-14

Covers:
- TASK-02/TASK-03: task_dependencies table (finish-to-start dependency tracking)
- TASK-04: task_key column on tasks (e.g. "MP-42")
- TASK-05: series_id column on tasks (UUID string linking recurring instances)
- TASK-07: task_seq column on projects (per-project task key counter)
- TASK-08: file_size column on files (bytes; stored at upload time)
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "003_phase3"
down_revision = "002_phase2"
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    """Check if a table already exists (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t"
        ),
        {"t": table_name},
    )
    return result.scalar() > 0


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists in a table (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() > 0


def _constraint_exists(constraint_name: str) -> bool:
    """Check if a table constraint already exists (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.table_constraints "
            "WHERE constraint_name=:n"
        ),
        {"n": constraint_name},
    )
    return result.scalar() > 0


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # TASK-02/03: task_dependencies table (hard delete only — no TimestampedMixin)
    # -------------------------------------------------------------------------
    if not _table_exists("task_dependencies"):
        op.create_table(
            "task_dependencies",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("task_id", sa.Integer(), nullable=False),
            sa.Column("depends_on_id", sa.Integer(), nullable=False),
            sa.Column(
                "dependency_type",
                sa.String(20),
                nullable=False,
                server_default="blocks",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.ForeignKeyConstraint(
                ["task_id"], ["tasks.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(
                ["depends_on_id"], ["tasks.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("task_id", "depends_on_id", name="uq_task_dependency"),
        )

    # -------------------------------------------------------------------------
    # TASK-04: tasks.task_key (e.g. "MP-42")
    # -------------------------------------------------------------------------
    if not _column_exists("tasks", "task_key"):
        op.add_column(
            "tasks",
            sa.Column("task_key", sa.String(20), nullable=True),
        )

    # -------------------------------------------------------------------------
    # TASK-05: tasks.series_id (UUID string linking recurring instances)
    # -------------------------------------------------------------------------
    if not _column_exists("tasks", "series_id"):
        op.add_column(
            "tasks",
            sa.Column("series_id", sa.String(36), nullable=True),
        )

    # -------------------------------------------------------------------------
    # TASK-07: projects.task_seq (per-project task key counter)
    # -------------------------------------------------------------------------
    if not _column_exists("projects", "task_seq"):
        op.add_column(
            "projects",
            sa.Column(
                "task_seq",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
        )

    # -------------------------------------------------------------------------
    # TASK-08: files.file_size (bytes; stored at upload time)
    # -------------------------------------------------------------------------
    if not _column_exists("files", "file_size"):
        op.add_column(
            "files",
            sa.Column("file_size", sa.Integer(), nullable=True),
        )

    # -------------------------------------------------------------------------
    # Backfill: populate task_key for existing tasks that have none
    # Format: "<project.key>-<task.id>"
    # -------------------------------------------------------------------------
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE tasks "
            "SET task_key = (SELECT key FROM projects WHERE projects.id = tasks.project_id) "
            "|| '-' || tasks.id "
            "WHERE task_key IS NULL"
        )
    )


def downgrade() -> None:
    if _column_exists("files", "file_size"):
        op.drop_column("files", "file_size")
    if _column_exists("projects", "task_seq"):
        op.drop_column("projects", "task_seq")
    if _column_exists("tasks", "series_id"):
        op.drop_column("tasks", "series_id")
    if _column_exists("tasks", "task_key"):
        op.drop_column("tasks", "task_key")
    if _table_exists("task_dependencies"):
        op.drop_table("task_dependencies")
