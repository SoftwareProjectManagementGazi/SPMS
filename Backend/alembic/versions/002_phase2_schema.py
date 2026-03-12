"""Phase 2 schema: teams, team_members, team_projects, password_reset_tokens.

Revision ID: 002_phase2
Revises: 001_phase1
Create Date: 2026-03-12

Covers:
- AUTH-02: teams, team_members, team_projects tables (global team entity + join tables)
- AUTH-03: password_reset_tokens table (append-only, no TimestampedMixin)
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "002_phase2"
down_revision = "001_phase1"
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


def _index_exists(index_name: str) -> bool:
    """Check if an index already exists (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT COUNT(*) FROM pg_indexes WHERE indexname = :name"),
        {"name": index_name},
    )
    return result.scalar() > 0


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # AUTH-02: teams table (with TimestampedMixin columns)
    # -------------------------------------------------------------------------
    if not _table_exists("teams"):
        op.create_table(
            "teams",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(100), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("owner_id", sa.Integer(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "version", sa.Integer(), nullable=False, server_default="1"
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.Column(
                "is_deleted", sa.Boolean(), nullable=False, server_default="false"
            ),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # -------------------------------------------------------------------------
    # AUTH-02: team_members join table
    # -------------------------------------------------------------------------
    if not _table_exists("team_members"):
        op.create_table(
            "team_members",
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column(
                "joined_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("team_id", "user_id"),
        )

    # -------------------------------------------------------------------------
    # AUTH-02: team_projects join table
    # -------------------------------------------------------------------------
    if not _table_exists("team_projects"):
        op.create_table(
            "team_projects",
            sa.Column("team_id", sa.Integer(), nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column(
                "assigned_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(
                ["project_id"], ["projects.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("team_id", "project_id"),
        )

    # -------------------------------------------------------------------------
    # AUTH-03: password_reset_tokens (append-only; no TimestampedMixin)
    # -------------------------------------------------------------------------
    if not _table_exists("password_reset_tokens"):
        op.create_table(
            "password_reset_tokens",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("token_hash", sa.String(64), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=True,
            ),
            sa.ForeignKeyConstraint(
                ["user_id"], ["users.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("token_hash"),
        )
        if not _index_exists("ix_password_reset_tokens_token_hash"):
            op.create_index(
                "ix_password_reset_tokens_token_hash",
                "password_reset_tokens",
                ["token_hash"],
                unique=False,
            )
        if not _index_exists("ix_password_reset_tokens_user_id"):
            op.create_index(
                "ix_password_reset_tokens_user_id",
                "password_reset_tokens",
                ["user_id"],
                unique=False,
            )


def downgrade() -> None:
    # Drop in reverse order of creation (respect FK deps)
    if _index_exists("ix_password_reset_tokens_user_id"):
        op.drop_index(
            "ix_password_reset_tokens_user_id",
            table_name="password_reset_tokens",
        )
    if _index_exists("ix_password_reset_tokens_token_hash"):
        op.drop_index(
            "ix_password_reset_tokens_token_hash",
            table_name="password_reset_tokens",
        )
    if _table_exists("password_reset_tokens"):
        op.drop_table("password_reset_tokens")
    if _table_exists("team_projects"):
        op.drop_table("team_projects")
    if _table_exists("team_members"):
        op.drop_table("team_members")
    if _table_exists("teams"):
        op.drop_table("teams")
