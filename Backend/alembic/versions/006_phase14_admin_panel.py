"""Phase 14 admin panel schema: project_join_requests table only.

Revision ID: 006_phase14_admin_panel
Revises: 005_phase9
Create Date: 2026-04-27

Covers:
- D-A1: project_join_requests table (CASCADE on project, SET NULL on users)
- ix_project_join_requests_status_created on (status, created_at DESC)

NOT in scope (D-A2):
- Role-based access control schema (role_table / perm_table / junction) —
  DEFERRED to v3.0; users.role enum (Phase 1) preserved unchanged.

Idempotent: copies _table_exists / _index_exists helpers verbatim from
005_phase9_schema.py (lines 39-97). Re-runnable against environments where
the table was already created via Base.metadata.create_all() (test conftest).
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "006_phase14_admin_panel"
down_revision = "005_phase9"
branch_labels = None
depends_on = None


# ---------------------------------------------------------------------------
# Idempotent helpers — copied verbatim from 005_phase9_schema.py lines 43-97.
# DO NOT regenerate — these are battle-tested across phases 1-9.
# ---------------------------------------------------------------------------

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


def _index_exists(index_name: str) -> bool:
    """Check if an index already exists in the public schema (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM pg_indexes "
            "WHERE schemaname='public' AND indexname=:n"
        ),
        {"n": index_name},
    )
    return result.scalar() > 0


# ---------------------------------------------------------------------------
# upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    if not _table_exists("project_join_requests"):
        op.create_table(
            "project_join_requests",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column(
                "project_id",
                sa.Integer,
                sa.ForeignKey("projects.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "requested_by_user_id",
                sa.Integer,
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "target_user_id",
                sa.Integer,
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "status",
                sa.String(20),
                nullable=False,
                server_default="pending",
            ),
            sa.Column("note", sa.Text, nullable=True),
            sa.Column(
                "reviewed_by_admin_id",
                sa.Integer,
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                onupdate=sa.func.now(),
                nullable=False,
            ),
        )
    if not _index_exists("ix_project_join_requests_status_created"):
        op.create_index(
            "ix_project_join_requests_status_created",
            "project_join_requests",
            ["status", sa.text("created_at DESC")],
        )


# ---------------------------------------------------------------------------
# downgrade
# ---------------------------------------------------------------------------

def downgrade() -> None:
    # Drop index then table; both wrapped in IF EXISTS for idempotent rollback.
    if _index_exists("ix_project_join_requests_status_created"):
        op.drop_index("ix_project_join_requests_status_created")
    if _table_exists("project_join_requests"):
        op.drop_table("project_join_requests")
