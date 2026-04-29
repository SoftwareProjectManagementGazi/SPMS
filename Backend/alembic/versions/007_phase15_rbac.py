"""Phase 15 RBAC schema: permissions + role_permissions + roles ALTER + 38-perm seed + matrix bootstrap.

Revision ID: 007_phase15_rbac
Revises: 006_phase14_admin_panel
Create Date: 2026-04-29

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


# revision identifiers, used by Alembic.
revision = "007_phase15_rbac"
down_revision = "006_phase14_admin_panel"
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


# ---------------------------------------------------------------------------
# 38 permissions seed (D-1.8 / D-3.5) — 26 project + 12 admin.* (system scope)
# Project = 14 base CRUD + 12 LIFE-related (comment/milestone/artifact/phase_report).
# ---------------------------------------------------------------------------

PERMISSIONS_SEED = [
    # Project lifecycle (project scope) — 4
    ("project.create", "Proje oluştur", "Create project", "project"),
    ("project.edit", "Proje düzenle", "Edit project", "project"),
    ("project.delete", "Proje sil", "Delete project", "project"),
    ("project.archive", "Proje arşivle", "Archive project", "project"),
    # Task lifecycle (project scope) — 4
    ("task.create", "Görev oluştur", "Create task", "project"),
    ("task.change_assignee", "Atanan değiştir", "Change assignee", "project"),
    ("task.change_status", "Durum değiştir", "Change status", "project"),
    ("task.delete", "Görev sil", "Delete task", "project"),
    # Membership (project scope) — 2
    ("member.invite", "Üye davet et", "Invite member", "project"),
    ("member.remove", "Üye çıkar", "Remove member", "project"),
    # Workflow / lifecycle (project scope) — 4
    ("workflow.edit", "Workflow düzenle", "Edit workflow", "project"),
    ("lifecycle.edit", "Yaşam döngüsü düzenle", "Edit lifecycle", "project"),
    ("template.publish", "Şablon yayınla", "Publish template", "project"),
    ("role.assign", "Rol ata", "Assign role", "project"),
    # Admin endpoints (system scope) — 12
    ("admin.access", "Admin paneli", "Admin panel access", "system"),
    ("admin.users.invite", "Kullanıcı davet et", "Invite user", "system"),
    ("admin.users.deactivate", "Kullanıcı deaktive et", "Deactivate user", "system"),
    ("admin.users.role_change", "Kullanıcı rolü değiştir", "Change user role", "system"),
    ("admin.users.bulk", "Toplu kullanıcı işlemi", "Bulk user action", "system"),
    ("admin.audit.read", "Denetim kaydı oku", "Read audit log", "system"),
    ("admin.audit.export", "Denetim kaydı dışa aktar", "Export audit log", "system"),
    ("admin.stats.read", "İstatistikleri oku", "Read admin stats", "system"),
    ("admin.summary.export", "PDF rapor dışa aktar", "Export PDF summary", "system"),
    ("admin.join_requests.approve", "Katılım isteğini onayla", "Approve join request", "system"),
    ("admin.settings.update", "Ayarları güncelle", "Update settings", "system"),
    ("permission.matrix.update", "İzin matrisi düzenle", "Update permission matrix", "system"),
    # Phase 15 D-3.5 LIFE-related project-scope perms — 12 NEW
    # Comment family (3) — Phase 9 comments-related endpoints
    ("comment.create", "Yorum ekle", "Create comment", "project"),
    ("comment.edit", "Yorum düzenle", "Edit comment", "project"),
    ("comment.delete", "Yorum sil", "Delete comment", "project"),
    # Milestone family (3) — Phase 12 LIFE-05 endpoints
    ("milestone.create", "Kilometre tasi olustur", "Create milestone", "project"),
    ("milestone.edit", "Kilometre tasi duzenle", "Edit milestone", "project"),
    ("milestone.delete", "Kilometre tasi sil", "Delete milestone", "project"),
    # Artifact family (3) — Phase 12 LIFE-06 endpoints
    ("artifact.create", "Cikti olustur", "Create artifact", "project"),
    ("artifact.edit", "Cikti duzenle", "Edit artifact", "project"),
    ("artifact.delete", "Cikti sil", "Delete artifact", "project"),
    # Phase report family (3) — Phase 12 LIFE-07 endpoints
    ("phase_report.create", "Faz raporu olustur", "Create phase report", "project"),
    ("phase_report.edit", "Faz raporu duzenle", "Edit phase report", "project"),
    ("phase_report.delete", "Faz raporu sil", "Delete phase report", "project"),
]


# Matrix bootstrap (D-1.8) — PM 23, Member 5, Admin 0, Guest 0
PM_PERMS = [
    # 13 base perms (Phase 14 baseline + Phase 15 governance)
    "project.create", "project.edit", "project.archive",
    "task.create", "task.change_assignee", "task.change_status", "task.delete",
    "member.invite", "member.remove", "role.assign",
    "workflow.edit", "lifecycle.edit", "template.publish",
    # 10 LIFE-related perms (CONTEXT D-3.1 — PM is project leader, owns lifecycle artifacts; D-3.5)
    "milestone.create", "milestone.edit", "milestone.delete",
    "artifact.create", "artifact.edit",
    "phase_report.create", "phase_report.edit", "phase_report.delete",
    "comment.edit", "comment.delete",
    # PM intentionally does NOT have artifact.delete (PM does not delete others' files)
]

# Member is regular contributor (D-3.1) — write own content, no admin-of-others
MEMBER_PERMS = [
    "task.create", "task.change_assignee", "task.change_status",
    "comment.create",   # Members can post comments
    "artifact.create",  # Members can attach files
]


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
