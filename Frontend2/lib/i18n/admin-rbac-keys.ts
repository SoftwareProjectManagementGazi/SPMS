// Phase 14 Plan 14-04 — Admin RBAC placeholder i18n key map.
//
// Surface D (/admin/roles) + Surface E (/admin/permissions) per UI-SPEC.
// Both surfaces are RBAC-deferred placeholders (CONTEXT D-A2..A5):
//   - Roller tab: 4 system-role cards + dashed-border "Yeni rol oluştur"
//     placeholder + page-level AlertBanner explaining v3.0 defer.
//   - İzin Matrisi: 14×4 matrix with EVERY toggle disabled + aria-disabled
//     + tooltip + v3.0 Badge in card header.
//
// Per Plan 14-02 precedent (admin-keys.ts shipped Surface A + Surface B in
// one Task 1 commit so same-wave commits don't double-touch the same file):
// Surface D + Surface E keys ship together in this single keys module.
//
// TR + EN parity contract (every key has BOTH a `tr:` value AND an `en:`
// value). Helper: adminRbacT(key, lang).

export const ADMIN_RBAC_I18N_KEYS = {
  // -------------------------------------------------------------------------
  // Surface D — /admin/roles (Roller — RBAC PLACEHOLDER per D-A2..A5)
  // -------------------------------------------------------------------------

  "admin.roles.alert_banner_body": {
    tr: "Bu sayfa görüntüleme amaçlıdır. Granüler rol/izin yönetimi v3.0 sürümünde gelecek; şu an yetkilendirme Admin / Project Manager / Member rolü ve proje üyeliği üzerinden çalışıyor.",
    en: "This page is view-only. Granular role/permission management will arrive in v3.0; authorization currently runs through the Admin / Project Manager / Member role and project membership.",
  },

  // 4 role card titles + descriptions per UI-SPEC §Surface D + D-A5
  "admin.roles.admin_name": {
    tr: "Admin",
    en: "Admin",
  },
  "admin.roles.admin_description": {
    tr: "Sistem geneli — tüm projelerde tam yetkili. Sadece admin invite edebilir, user role değiştirebilir, proje silebilir.",
    en: "System-wide — full access in every project. Only admins can invite, change roles, and delete projects.",
  },
  "admin.roles.pm_name": {
    tr: "Project Manager",
    en: "Project Manager",
  },
  "admin.roles.pm_description": {
    tr: "Proje bazlı — her projede ayrı atanır (Settings > Üyeler). Bir kullanıcı bir projede PM, başka projede Üye olabilir.",
    en: "Project-scoped — assigned per-project in Settings > Members. A user may be PM in one project and Member in another.",
  },
  "admin.roles.member_name": {
    tr: "Member",
    en: "Member",
  },
  "admin.roles.member_description": {
    tr: "Proje bazlı — atandığı projelerde görev yönetir.",
    en: "Project-scoped — manages tasks on assigned projects.",
  },
  "admin.roles.guest_name": {
    tr: "Guest",
    en: "Guest",
  },
  "admin.roles.guest_description": {
    tr: "Yalnızca salt-okuma. v3.0'da gelecek.",
    en: "Read-only. Coming in v3.0.",
  },

  "admin.roles.users_count_label": {
    tr: "Kullanıcı",
    en: "Users",
  },

  // Plan 14-17 (Cluster E gap closure) — D-A5 cross-tab navigation affordance.
  // "Görüntüle" link in each non-disabled RoleCard navigates to
  // /admin/users?role=<id> with the role filter pre-applied. Distinct from
  // the prototype's removed "Düzenle" button (D-A4 RBAC defer) — this is a
  // navigation aid, NOT a CRUD trigger.
  "admin.roles.view_users_link_label": {
    tr: "Görüntüle",
    en: "View",
  },

  // Plan 14-17 (Cluster E / N-3) — MANDATORY AlertBanner copy when total
  // user count > 1000 (Approach 1's defensive ceiling). Without this banner
  // per-role counts silently lie past 1000 users.
  "admin.roles.count_truncation_warning_title": {
    tr: "Sayım sınırlı",
    en: "Counts truncated",
  },
  "admin.roles.count_truncation_warning_body": {
    tr: "Görüntülenen sayılar ilk 1000 kullanıcıdan ({total} toplam); tam liste için /admin/users tabına gidin.",
    en: "Counts shown are based on the first 1000 users out of {total}; visit the Users tab for the full list.",
  },

  // "Yeni rol oluştur" placeholder card per D-A4
  "admin.roles.new_role_title": {
    tr: "Yeni rol oluşturma",
    en: "Create new role",
  },
  "admin.roles.new_role_subtitle": {
    tr: "v3.0'da gelecek",
    en: "Coming in v3.0",
  },
  "admin.roles.new_role_tooltip": {
    tr: "Granüler RBAC v3.0 sürümünde gelecek.",
    en: "Granular RBAC arrives in v3.0.",
  },

  "admin.roles.v3_badge_label": {
    tr: "v3.0",
    en: "v3.0",
  },

  // -------------------------------------------------------------------------
  // Surface E — /admin/permissions (İzin Matrisi — RBAC PLACEHOLDER per D-A3)
  // -------------------------------------------------------------------------

  "admin.permissions.alert_banner_body": {
    tr: "Bu sayfa demo amaçlıdır. Granüler izin yönetimi v3.0 sürümünde gelecek; şu an yetkilendirme Admin / Project Manager / Member rolü ve proje üyeliği üzerinden çalışıyor.",
    en: "This page is demo-only. Granular permission management arrives in v3.0; authorization currently runs through the Admin / Project Manager / Member role and project membership.",
  },

  "admin.permissions.card_title": {
    tr: "İzin Matrisi",
    en: "Permission Matrix",
  },
  "admin.permissions.card_subtitle": {
    tr: "Rol başına tüm izinler tek bakışta",
    en: "All permissions by role at a glance",
  },
  "admin.permissions.v3_badge_label": {
    tr: "v3.0",
    en: "v3.0",
  },

  "admin.permissions.copy_button": {
    tr: "Kopyala",
    en: "Clone",
  },
  "admin.permissions.copy_tooltip": {
    tr: "v3.0'da gelecek",
    en: "Coming in v3.0",
  },

  "admin.permissions.toggle_tooltip": {
    tr: "RBAC altyapısı v3.0 sürümünde gelecek.",
    en: "RBAC arrives in v3.0.",
  },

  // 4 permission group labels per UI-SPEC §Surface E
  "admin.permissions.group_projects": {
    tr: "Projeler",
    en: "Projects",
  },
  "admin.permissions.group_tasks": {
    tr: "Görevler",
    en: "Tasks",
  },
  "admin.permissions.group_members_roles": {
    tr: "Üyeler & Roller",
    en: "Members & Roles",
  },
  "admin.permissions.group_workflow": {
    tr: "İş Akışı",
    en: "Workflow",
  },

  // 14 permission row labels (already in permissions-static.ts label_tr/label_en
  // but re-exposed via the keys file for the column-header "Permission" label
  // and any future override path).
  "admin.permissions.column_permission": {
    tr: "İzin",
    en: "Permission",
  },

  "admin.permissions.row_create_project": {
    tr: "Proje oluştur",
    en: "Create project",
  },
  "admin.permissions.row_edit_project": {
    tr: "Proje düzenle",
    en: "Edit project",
  },
  "admin.permissions.row_delete_project": {
    tr: "Proje sil",
    en: "Delete project",
  },
  "admin.permissions.row_archive": {
    tr: "Arşivle",
    en: "Archive",
  },
  "admin.permissions.row_create_task": {
    tr: "Görev oluştur",
    en: "Create task",
  },
  "admin.permissions.row_change_assignee": {
    tr: "Atama değiştir",
    en: "Change assignee",
  },
  "admin.permissions.row_change_status": {
    tr: "Durum değiştir",
    en: "Change status",
  },
  "admin.permissions.row_delete_task": {
    tr: "Görev sil",
    en: "Delete task",
  },
  "admin.permissions.row_invite_user": {
    tr: "Kullanıcı davet et",
    en: "Invite user",
  },
  "admin.permissions.row_assign_role": {
    tr: "Rol ata",
    en: "Assign role",
  },
  "admin.permissions.row_remove_member": {
    tr: "Üye çıkar",
    en: "Remove member",
  },
  "admin.permissions.row_edit_workflow": {
    tr: "İş akışı düzenle",
    en: "Edit workflow",
  },
  "admin.permissions.row_edit_lifecycle": {
    tr: "Yaşam döngüsü düzenle",
    en: "Edit lifecycle",
  },
  "admin.permissions.row_publish_template": {
    tr: "Şablon yayınla",
    en: "Publish template",
  },
} as const

export type AdminRbacI18nKey = keyof typeof ADMIN_RBAC_I18N_KEYS

/**
 * Lookup helper — returns the localized string for a key.
 * Defensive fallback: missing-EN falls back to TR; missing-entirely returns
 * the key itself so the bug surfaces visibly in the UI.
 */
export function adminRbacT(
  key: AdminRbacI18nKey,
  lang: "tr" | "en",
): string {
  const entry = ADMIN_RBAC_I18N_KEYS[key]
  if (!entry) return String(key)
  return entry[lang] || entry.tr || String(key)
}
