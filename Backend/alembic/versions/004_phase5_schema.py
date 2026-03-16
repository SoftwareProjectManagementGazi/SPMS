"""Phase 5 schema: notification_type enum extension, related_entity_type column,
notification_preferences and task_watchers tables.

Revision ID: 004_phase5
Revises: 003_phase3
Create Date: 2026-03-16

Covers:
- NOTIF-01/02: Extend notification_type enum with 5 new values
- NOTIF-01: Add related_entity_type column to notifications
- NOTIF-05: notification_preferences table (user_id unique, preferences JSON)
- NOTIF-01: task_watchers table (composite PK task_id + user_id)
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "004_phase5"
down_revision = "003_phase3"
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


def _enum_value_exists(enum_name: str, value: str) -> bool:
    """Check if an enum value already exists in a PostgreSQL enum type."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM pg_enum e "
            "JOIN pg_type t ON e.enumtypid = t.oid "
            "WHERE t.typname = :enum_name AND e.enumlabel = :value"
        ),
        {"enum_name": enum_name, "value": value},
    )
    return result.scalar() > 0


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # NOTIF-01/02: Extend notification_type enum with 5 new values
    # CRITICAL: ALTER TYPE ADD VALUE cannot run inside a transaction block.
    # Use autocommit_block() to execute these statements outside a transaction.
    # -------------------------------------------------------------------------
    new_enum_values = [
        "STATUS_CHANGE",
        "TASK_DELETED",
        "PROJECT_CREATED",
        "PROJECT_DELETED",
        "PROJECT_UPDATED",
    ]
    with op.get_context().autocommit_block():
        for val in new_enum_values:
            op.execute(
                f"ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '{val}'"
            )

    # -------------------------------------------------------------------------
    # NOTIF-01: Add related_entity_type column to notifications
    # -------------------------------------------------------------------------
    if not _column_exists("notifications", "related_entity_type"):
        op.add_column(
            "notifications",
            sa.Column("related_entity_type", sa.String(20), nullable=True),
        )

    # -------------------------------------------------------------------------
    # NOTIF-05: notification_preferences table
    # -------------------------------------------------------------------------
    if not _table_exists("notification_preferences"):
        op.create_table(
            "notification_preferences",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column(
                "preferences",
                sa.JSON(),
                nullable=False,
                server_default="{}",
            ),
            sa.Column(
                "email_enabled",
                sa.Boolean(),
                nullable=False,
                server_default="true",
            ),
            sa.Column(
                "deadline_days",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "version",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "is_deleted",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            ),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(
                ["user_id"], ["users.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", name="uq_notification_preferences_user_id"),
        )
        op.create_index(
            "ix_notification_preferences_id",
            "notification_preferences",
            ["id"],
            unique=False,
        )
        op.create_index(
            "ix_notification_preferences_user_id",
            "notification_preferences",
            ["user_id"],
            unique=True,
        )

    # -------------------------------------------------------------------------
    # NOTIF-01: task_watchers table (composite PK — lightweight join table)
    # -------------------------------------------------------------------------
    if not _table_exists("task_watchers"):
        op.create_table(
            "task_watchers",
            sa.Column("task_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
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
                ["user_id"], ["users.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("task_id", "user_id"),
        )


def downgrade() -> None:
    # Drop tables in reverse order of creation
    if _table_exists("task_watchers"):
        op.drop_table("task_watchers")

    if _table_exists("notification_preferences"):
        op.drop_index(
            "ix_notification_preferences_user_id",
            table_name="notification_preferences",
        )
        op.drop_index(
            "ix_notification_preferences_id",
            table_name="notification_preferences",
        )
        op.drop_table("notification_preferences")

    if _column_exists("notifications", "related_entity_type"):
        op.drop_column("notifications", "related_entity_type")

    # NOTE: PostgreSQL does not support removing enum values.
    # The 5 new values added to notification_type cannot be reverted.
