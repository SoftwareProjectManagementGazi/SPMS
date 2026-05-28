"""Add ITERATIVE methodology enum value + create system_config table.

Revision ID: 015_iterative_enum_and_system_config
Revises: 014_template_default_columns
Create Date: 2026-05-28

Why this migration exists
-------------------------
The historical Python migration ``app/.../migrations/migration_005.py`` was
the only path that:

  * Extended the ``methodology_type`` enum with ``ITERATIVE`` (consumed by
    the simulator, the AI workflow suggester, and the iterative process
    template).
  * Created the ``system_config`` key/value table that the admin Settings
    panel reads from.

Both were missing from the alembic chain, which meant a fresh DB that ran
only ``alembic upgrade head`` and never booted uvicorn (e.g. CI infra,
manual schema-only setup) lacked both. This migration plugs the gap so
the Python migration can be deleted in a follow-up commit.

The row seed for ``system_config`` lives in
``app/infrastructure/database/_seed_system.py`` and runs on every boot,
so new default keys land on existing installs automatically.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "015_iterative_enum_and_system_config"
down_revision = "014_template_default_columns"
branch_labels = None
depends_on = None


def _enum_value_exists(enum_name: str, value: str) -> bool:
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


def _table_exists(name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t"
        ),
        {"t": name},
    )
    return result.scalar() > 0


def upgrade() -> None:
    # ---------------------------------------------------------------------
    # 1. ITERATIVE enum value
    # ALTER TYPE ADD VALUE can't run inside a transaction block. Pop out to
    # an autocommit connection just for this statement.
    # ---------------------------------------------------------------------
    if not _enum_value_exists("methodology_type", "ITERATIVE"):
        with op.get_context().autocommit_block():
            op.execute(
                "ALTER TYPE methodology_type ADD VALUE IF NOT EXISTS 'ITERATIVE'"
            )

    # ---------------------------------------------------------------------
    # 2. system_config key/value table.
    # Default rows are inserted at runtime by
    # _seed_system.seed_system_config — keeping the seed there means new
    # keys land on every install at next boot instead of only on first
    # table creation.
    # ---------------------------------------------------------------------
    if not _table_exists("system_config"):
        op.create_table(
            "system_config",
            sa.Column("key", sa.String(100), primary_key=True),
            sa.Column("value", sa.Text, nullable=False),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
            ),
        )


def downgrade() -> None:
    # Enum values can't be dropped cleanly in Postgres (would require
    # recreating the type). Down-migrations elsewhere in this chain
    # similarly accept the asymmetric loss. The system_config table is
    # safe to drop on rollback.
    if _table_exists("system_config"):
        op.drop_table("system_config")
