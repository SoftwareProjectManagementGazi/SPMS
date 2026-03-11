"""Phase 1 schema: TimestampedMixin columns, AuditLogModel, recurrence columns, and indexes.

Revision ID: 001_phase1
Revises: None
Create Date: 2026-03-11

Covers:
- DATA-01: Soft-delete columns (is_deleted, deleted_at) on all 7 main tables
- DATA-02: Optimistic locking (version) + updated_at on all 7 main tables
- DATA-03: Recurring task schema columns (recurrence_interval, recurrence_end_date, recurrence_count)
- DATA-04: AuditLogModel table creation
- DATA-05: DB indexes on tasks.project_id, tasks.assignee_id, tasks.parent_task_id, projects.manager_id
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "001_phase1"
down_revision = None
branch_labels = None
depends_on = None

# Tables that receive TimestampedMixin columns
MIXIN_TABLES = ["tasks", "projects", "users", "comments", "files", "labels", "sprints"]


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists in a table (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :col"
        ),
        {"table": table_name, "col": column_name},
    )
    return result.scalar() > 0


def _index_exists(index_name: str) -> bool:
    """Check if an index already exists (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM pg_indexes WHERE indexname = :name"
        ),
        {"name": index_name},
    )
    return result.scalar() > 0


def _add_column_if_missing(table_name: str, column_name: str, column: sa.Column) -> None:
    """Add column only if it does not already exist."""
    if not _column_exists(table_name, column_name):
        op.add_column(table_name, column)


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # DATA-01/DATA-02: Add TimestampedMixin columns to all 7 main tables
    # Each table gets: version, updated_at, is_deleted, deleted_at
    # -------------------------------------------------------------------------
    for table in MIXIN_TABLES:
        _add_column_if_missing(
            table,
            "version",
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        )
        _add_column_if_missing(
            table,
            "updated_at",
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                nullable=True,
                server_default=sa.text("now()"),
            ),
        )
        _add_column_if_missing(
            table,
            "is_deleted",
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        )
        _add_column_if_missing(
            table,
            "deleted_at",
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )

    # -------------------------------------------------------------------------
    # DATA-03: Recurring task schema columns on tasks table
    # -------------------------------------------------------------------------
    _add_column_if_missing(
        "tasks",
        "recurrence_interval",
        sa.Column(
            "recurrence_interval",
            sa.String(20),
            nullable=True,
            comment="daily, weekly, monthly",
        ),
    )
    _add_column_if_missing(
        "tasks",
        "recurrence_end_date",
        sa.Column("recurrence_end_date", sa.Date(), nullable=True),
    )
    _add_column_if_missing(
        "tasks",
        "recurrence_count",
        sa.Column("recurrence_count", sa.Integer(), nullable=True),
    )

    # -------------------------------------------------------------------------
    # DATA-04: Create audit_log table
    # -------------------------------------------------------------------------
    conn = op.get_bind()
    table_exists = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_name = 'audit_log'"
        )
    ).scalar()

    if not table_exists:
        op.create_table(
            "audit_log",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("entity_type", sa.String(50), nullable=False),
            sa.Column("entity_id", sa.Integer(), nullable=False),
            sa.Column("field_name", sa.String(100), nullable=False),
            sa.Column("old_value", sa.Text(), nullable=True),
            sa.Column("new_value", sa.Text(), nullable=True),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("action", sa.String(50), nullable=False),
            sa.Column(
                "timestamp",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.ForeignKeyConstraint(
                ["user_id"],
                ["users.id"],
                ondelete="SET NULL",
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_audit_log_id", "audit_log", ["id"], unique=False)
        op.create_index("ix_audit_log_entity_id", "audit_log", ["entity_id"], unique=False)

    # -------------------------------------------------------------------------
    # DATA-05: DB indexes on FK columns
    # -------------------------------------------------------------------------
    if not _index_exists("ix_tasks_project_id"):
        op.create_index("ix_tasks_project_id", "tasks", ["project_id"], unique=False)
    if not _index_exists("ix_tasks_assignee_id"):
        op.create_index("ix_tasks_assignee_id", "tasks", ["assignee_id"], unique=False)
    if not _index_exists("ix_tasks_parent_task_id"):
        op.create_index("ix_tasks_parent_task_id", "tasks", ["parent_task_id"], unique=False)
    if not _index_exists("ix_projects_manager_id"):
        op.create_index("ix_projects_manager_id", "projects", ["manager_id"], unique=False)


def downgrade() -> None:
    # -------------------------------------------------------------------------
    # Reverse in opposite order from upgrade
    # -------------------------------------------------------------------------

    # DATA-05: Drop FK indexes
    if _index_exists("ix_projects_manager_id"):
        op.drop_index("ix_projects_manager_id", table_name="projects")
    if _index_exists("ix_tasks_parent_task_id"):
        op.drop_index("ix_tasks_parent_task_id", table_name="tasks")
    if _index_exists("ix_tasks_assignee_id"):
        op.drop_index("ix_tasks_assignee_id", table_name="tasks")
    if _index_exists("ix_tasks_project_id"):
        op.drop_index("ix_tasks_project_id", table_name="tasks")

    # DATA-04: Drop audit_log table
    conn = op.get_bind()
    table_exists = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_name = 'audit_log'"
        )
    ).scalar()
    if table_exists:
        op.drop_index("ix_audit_log_entity_id", table_name="audit_log")
        op.drop_index("ix_audit_log_id", table_name="audit_log")
        op.drop_table("audit_log")

    # DATA-03: Drop recurrence columns from tasks
    for col in ["recurrence_count", "recurrence_end_date", "recurrence_interval"]:
        if _column_exists("tasks", col):
            op.drop_column("tasks", col)

    # DATA-01/DATA-02: Drop TimestampedMixin columns (reverse table order)
    for table in reversed(MIXIN_TABLES):
        for col in ["deleted_at", "is_deleted", "updated_at", "version"]:
            if _column_exists(table, col):
                op.drop_column(table, col)
