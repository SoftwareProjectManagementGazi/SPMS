"""Single source of truth for RBAC bootstrap data (permissions table rows
and the PM / Member starter cells in role_permissions), AND the idempotent
runtime function that materialises them.

Why this module owns the lists (not migration 012):

- Migration 012 created the SCHEMA for permissions / role_permissions. It
  used to also carry the data lists, but two callers ended up needing the
  same data — the migration (one-shot, at upgrade time) AND
  ``seed_rbac()`` (every boot, to top up the simulator snapshot that
  intentionally truncates these tables). Two parallel copies of the
  matrix were drifting; consolidating here removes that risk.
- ``alembic/versions/012_phase15_rbac.py`` imports these constants now,
  so any list edit lands in BOTH the historical migration replay and the
  runtime top-up automatically. This is a pragmatic deviation from the
  "migrations must be self-contained" guideline — justified because:
    a) we never roll back migrations in production,
    b) the runtime seed_rbac re-applies on every boot and is itself
       idempotent (ON CONFLICT DO NOTHING),
    c) drift between the two surfaces was a real, recurring source of
       missing-permissions bugs.

The simulator snapshot at ``Backend/fixtures/simulated_quarter.sql.gz``
is generated AFTER the simulator's TRUNCATE wipes permissions /
role_permissions, so the snapshot itself carries zero rows for these
tables. The lifespan hook calls ``seed_rbac()`` immediately after the
snapshot loader to backfill them.
"""
from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# CANONICAL — alembic/versions/012_phase15_rbac.py imports this list.
# Edit here only; both the migration replay and the runtime top-up will
# pick the change up automatically.
PERMISSIONS_SEED: list[tuple[str, str, str, str]] = [
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
    # Phase 15 D-3.5 LIFE-related project-scope perms — 12
    ("comment.create", "Yorum ekle", "Create comment", "project"),
    ("comment.edit", "Yorum düzenle", "Edit comment", "project"),
    ("comment.delete", "Yorum sil", "Delete comment", "project"),
    ("milestone.create", "Kilometre tasi olustur", "Create milestone", "project"),
    ("milestone.edit", "Kilometre tasi duzenle", "Edit milestone", "project"),
    ("milestone.delete", "Kilometre tasi sil", "Delete milestone", "project"),
    ("artifact.create", "Cikti olustur", "Create artifact", "project"),
    ("artifact.edit", "Cikti duzenle", "Edit artifact", "project"),
    ("artifact.delete", "Cikti sil", "Delete artifact", "project"),
    ("phase_report.create", "Faz raporu olustur", "Create phase report", "project"),
    ("phase_report.edit", "Faz raporu duzenle", "Edit phase report", "project"),
    ("phase_report.delete", "Faz raporu sil", "Delete phase report", "project"),
]


PM_PERMS: list[str] = [
    "project.create", "project.edit", "project.archive",
    "task.create", "task.change_assignee", "task.change_status", "task.delete",
    "member.invite", "member.remove", "role.assign",
    "workflow.edit", "lifecycle.edit", "template.publish",
    "milestone.create", "milestone.edit", "milestone.delete",
    "artifact.create", "artifact.edit",
    "phase_report.create", "phase_report.edit", "phase_report.delete",
    "comment.edit", "comment.delete",
]

MEMBER_PERMS: list[str] = [
    "task.create", "task.change_assignee", "task.change_status",
    "comment.create",
    "artifact.create",
]


async def seed_rbac(session: AsyncSession) -> None:
    """Idempotently seed the 38 permissions + PM/Member bootstrap matrix.

    Runs after the snapshot loader (or normal seed) so that whichever path
    populated the rest of the DB, the RBAC tables are guaranteed to carry
    their reference data and the Admin → /admin/permissions matrix renders.
    """
    # Migration may not have created the tables on a fresh container — bail
    # silently if so; the next migration run will set them up.
    table_check = await session.execute(
        text(
            "SELECT to_regclass('public.permissions') IS NOT NULL "
            "AND to_regclass('public.role_permissions') IS NOT NULL"
        )
    )
    if not table_check.scalar():
        logger.info("SEEDER: RBAC tables missing — skipping permission seed")
        return

    # Flip is_system_role for the three pre-existing roles + insert Guest.
    # Migration 012 already does this, but the simulator's TRUNCATE wipes
    # the column back to its default for any roles re-seeded afterwards.
    await session.execute(
        text(
            "UPDATE roles SET is_system_role = true "
            "WHERE LOWER(name) IN ('admin', 'project manager', 'member')"
        )
    )
    await session.execute(
        text(
            "INSERT INTO roles (name, description, is_system_role) "
            "SELECT 'Guest', 'Salt okunur misafir hesabı (D-2.4)', true "
            "WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(name) = 'guest')"
        )
    )

    # `permissions.key` carries a UNIQUE constraint (see migration 012), so
    # ON CONFLICT (key) DO NOTHING is the idempotent insert. We deliberately
    # avoid the `INSERT … SELECT :key … WHERE NOT EXISTS (… WHERE key = :key)`
    # pattern: asyncpg's prepared-statement type inference flags it with
    # AmbiguousParameterError because the same placeholder is read as TEXT in
    # the projection and VARCHAR in the existence check.
    inserted_perms = 0
    for key, label_tr, label_en, scope in PERMISSIONS_SEED:
        res = await session.execute(
            text(
                "INSERT INTO permissions (key, label_tr, label_en, scope) "
                "VALUES (:key, :tr, :en, :scope) "
                "ON CONFLICT (key) DO NOTHING"
            ),
            {"key": key, "tr": label_tr, "en": label_en, "scope": scope},
        )
        inserted_perms += res.rowcount or 0

    inserted_cells = 0
    for perm_key in PM_PERMS:
        res = await session.execute(
            text(
                "INSERT INTO role_permissions (role_id, permission_id) "
                "SELECT r.id, p.id FROM roles r, permissions p "
                "WHERE LOWER(r.name) = 'project manager' AND p.key = :pk "
                "ON CONFLICT (role_id, permission_id) DO NOTHING"
            ),
            {"pk": perm_key},
        )
        inserted_cells += res.rowcount or 0

    for perm_key in MEMBER_PERMS:
        res = await session.execute(
            text(
                "INSERT INTO role_permissions (role_id, permission_id) "
                "SELECT r.id, p.id FROM roles r, permissions p "
                "WHERE LOWER(r.name) = 'member' AND p.key = :pk "
                "ON CONFLICT (role_id, permission_id) DO NOTHING"
            ),
            {"pk": perm_key},
        )
        inserted_cells += res.rowcount or 0

    await session.commit()

    if inserted_perms or inserted_cells:
        logger.info(
            f"SEEDER: RBAC top-up — inserted {inserted_perms} permissions, "
            f"{inserted_cells} bootstrap matrix cells"
        )
