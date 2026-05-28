"""Phase 15 RBAC schema: permissions + role_permissions + roles ALTER + 38-perm seed + matrix bootstrap.

Revision ID: 012_phase15_rbac
Revises: 011_sprint_improvements
Create Date: 2026-04-29

NOTE — Renumbered from 007 to 012 during merge with origin/main on 2026-05-13.
Friend's parallel commits added 007_task_start_date through 011_sprint_improvements,
so this Phase 15 RBAC migration was re-chained to land after 011 to keep the
alembic linear-history invariant intact.

Covers:
- D-1.8: permissions table + 38 perm seed (26 project + 12 admin.*); project = 14 base CRUD
  + 12 LIFE-related (comment.*/milestone.*/artifact.*/phase_report.*) per D-3.5
- D-3.5: permissions.scope VARCHAR(16) + CHECK constraint (Pitfall 1 — VARCHAR over native ENUM)
- D-2.3: roles.is_system_role boolean + flip on Admin/Project Manager/Member
- D-2.8: roles.icon_key VARCHAR(32) NULLABLE + roles.color_token VARCHAR(64) NULLABLE
- D-2.4: Guest role INSERT (idempotent, salt okunur misafir hesabı)
- role_permissions junction table + matrix bootstrap (PM 23 / Member 5 / Admin 0 / Guest 0)

Idempotent: copies _table_exists / _column_exists / _index_exists from 005_phase9_schema.py:43-97.
Per Pitfall 8, every INSERT seed wraps in `WHERE NOT EXISTS` or `ON CONFLICT DO NOTHING` so
re-running `alembic upgrade head` succeeds without UNIQUE violations.
"""
from alembic import op
import sqlalchemy as sa

# Single source of truth — see docstring in _seed_rbac.py for the trade-off.
# Importing app code from a migration is normally an anti-pattern; we accept
# it here because (a) we never roll back migrations in production, and
# (b) the runtime seed_rbac() re-applies these lists idempotently every boot
# so any drift between this migration's snapshot and the live lists is
# self-healing within one restart.
from app.infrastructure.database._seed_rbac import (
    PERMISSIONS_SEED,
    PM_PERMS,
    MEMBER_PERMS,
)


# revision identifiers, used by Alembic.
revision = "012_phase15_rbac"
down_revision = "011_sprint_improvements"
branch_labels = None
depends_on = None


# ---------------------------------------------------------------------------
# Idempotent helpers — copied verbatim from 005_phase9_schema.py:43-97.
# DO NOT regenerate — battle-tested across phases 1-14.
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


# Permission seed lists and matrix bootstrap moved to
# app/infrastructure/database/_seed_rbac.py (single source of truth).
# This migration imports them at the top of the file.


# ---------------------------------------------------------------------------
# upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    # 1. roles ALTER — is_system_role, icon_key, color_token (idempotent)
    if not _column_exists("roles", "is_system_role"):
        op.add_column(
            "roles",
            sa.Column(
                "is_system_role",
                sa.Boolean,
                nullable=False,
                server_default=sa.text("false"),
            ),
        )
    if not _column_exists("roles", "icon_key"):
        op.add_column("roles", sa.Column("icon_key", sa.String(32), nullable=True))
    if not _column_exists("roles", "color_token"):
        op.add_column("roles", sa.Column("color_token", sa.String(64), nullable=True))

    # Flip is_system_role on the 3 existing system roles + INSERT Guest (idempotent)
    op.execute(
        "UPDATE roles SET is_system_role = true "
        "WHERE LOWER(name) IN ('admin', 'project manager', 'member')"
    )
    op.execute(
        """
        INSERT INTO roles (name, description, is_system_role)
        SELECT 'Guest', 'Salt okunur misafir hesabı (D-2.4)', true
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(name) = 'guest')
        """
    )

    # 2. permissions table CREATE
    if not _table_exists("permissions"):
        op.create_table(
            "permissions",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column("key", sa.String(64), unique=True, nullable=False),
            sa.Column("label_tr", sa.String(120), nullable=True),
            sa.Column("label_en", sa.String(120), nullable=True),
            sa.Column(
                "scope",
                sa.String(16),
                nullable=False,
                server_default="project",
            ),
            sa.Column("description", sa.Text, nullable=True),
            sa.CheckConstraint(
                "scope IN ('system', 'project')", name="ck_permissions_scope"
            ),
        )
    if not _index_exists("ix_permissions_key"):
        op.create_index("ix_permissions_key", "permissions", ["key"])

    # Seed 38 permissions (idempotent — INSERT … WHERE NOT EXISTS)
    for key, label_tr, label_en, scope in PERMISSIONS_SEED:
        op.execute(
            sa.text(
                """
                INSERT INTO permissions (key, label_tr, label_en, scope)
                SELECT :key, :tr, :en, :scope
                WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE key = :key)
                """
            ).bindparams(key=key, tr=label_tr, en=label_en, scope=scope)
        )

    # 3. role_permissions junction
    if not _table_exists("role_permissions"):
        op.create_table(
            "role_permissions",
            sa.Column(
                "role_id",
                sa.Integer,
                sa.ForeignKey("roles.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "permission_id",
                sa.Integer,
                sa.ForeignKey("permissions.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "granted_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("role_id", "permission_id"),
        )
    if not _index_exists("ix_role_permissions_role_id"):
        op.create_index(
            "ix_role_permissions_role_id", "role_permissions", ["role_id"]
        )

    # 4. Bootstrap matrix (PM 23 / Member 5 / Admin 0 / Guest 0) — idempotent ON CONFLICT DO NOTHING
    for perm_key in PM_PERMS:
        op.execute(
            sa.text(
                """
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id FROM roles r, permissions p
                WHERE LOWER(r.name) = 'project manager' AND p.key = :pk
                ON CONFLICT (role_id, permission_id) DO NOTHING
                """
            ).bindparams(pk=perm_key)
        )

    for perm_key in MEMBER_PERMS:
        op.execute(
            sa.text(
                """
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id FROM roles r, permissions p
                WHERE LOWER(r.name) = 'member' AND p.key = :pk
                ON CONFLICT (role_id, permission_id) DO NOTHING
                """
            ).bindparams(pk=perm_key)
        )


# ---------------------------------------------------------------------------
# downgrade
# ---------------------------------------------------------------------------

def downgrade() -> None:
    # Drop in reverse: junction → permissions → roles columns
    if _table_exists("role_permissions"):
        if _index_exists("ix_role_permissions_role_id"):
            op.drop_index(
                "ix_role_permissions_role_id", table_name="role_permissions"
            )
        op.drop_table("role_permissions")
    if _index_exists("ix_permissions_key"):
        op.drop_index("ix_permissions_key", table_name="permissions")
    if _table_exists("permissions"):
        op.drop_table("permissions")
    if _column_exists("roles", "color_token"):
        op.drop_column("roles", "color_token")
    if _column_exists("roles", "icon_key"):
        op.drop_column("roles", "icon_key")
    if _column_exists("roles", "is_system_role"):
        op.drop_column("roles", "is_system_role")
