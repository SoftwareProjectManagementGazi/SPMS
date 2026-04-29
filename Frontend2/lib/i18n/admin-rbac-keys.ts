// Phase 14 Plan 14-04 (placeholder shape) → Phase 15 Plan 15-10 (RBAC active)
// — Admin RBAC i18n key map.
//
// Surface D (/admin/roles) + Surface E (/admin/permissions) per UI-SPEC.
//   - Roller tab: 4 system-role cards (Sistem badge for is_system_role=true,
//     read-only) + active "Yeni rol oluştur" trigger card opening
//     RoleCreateModal (Plan 15-11) + page-level AlertBanner explaining the
//     active state.
//   - İzin Matrisi: 14×4 matrix with auto-save toggles per cell mutation
//     (D-1.12 useUpdatePermissionCell), per-row scope badge (D-3.4), Admin
//     column read-only (D-1.5 super-role), Guest column read-only (D-2.4).
//
// Phase 15 Plan 15-10 dropped the `admin.permissions.v3_badge_label` and
// `admin.roles.v3_badge_label` keys (atomic 7-layer placeholder defense
// removal per D-2.7 — see 15-PATTERNS.md §21 atomic invariant). The
// `admin.permissions.toggle_tooltip` key was also dropped (toggles no longer
// have a placeholder tooltip — they auto-save on change).
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

  // Phase 15 Plan 15-10 (RBAC active) — AlertBanner FLIPPED from Phase 14
  // 14-04 placeholder text. Granular role CRUD now live (Plan 15-11 wires
  // RoleCreateModal); per-row scope badge live (D-3.4); auto-save toggles
  // live (D-1.12). System roles (Admin / PM / Member / Guest) are read-only
  // — Düzenle/Sil buttons hidden when is_system_role=true.
  "admin.roles.alert_banner_body": {
    tr: "RBAC altyapısı aktif. Sistem rolleri (Admin / PM / Member / Guest) salt okunur; özel roller oluşturup izinleri yönetebilirsiniz.",
    en: "RBAC layer active. System roles (Admin / PM / Member / Guest) are read-only; create custom roles and manage their permissions.",
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
  // Phase 15 Plan 15-10 — Guest description FLIPPED from Phase 14 14-04
  // placeholder. Guest is now an active read-only system role (no v3.0
  // language).
  "admin.roles.guest_description": {
    tr: "Salt-okuma — atandığı projelerde içerik görüntüler ama değişiklik yapamaz.",
    en: "Read-only — views content on assigned projects without making changes.",
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

  // Phase 15 Plan 15-10 — "Yeni rol oluştur" trigger card (renamed from
  // placeholder card). Click opens RoleCreateModal (Plan 15-11). Subtitle/
  // tooltip FLIPPED from Phase 14 14-04 v3.0 placeholder copy.
  "admin.roles.new_role_title": {
    tr: "Yeni rol oluştur",
    en: "Create new role",
  },
  "admin.roles.new_role_subtitle": {
    tr: "Özel bir rol tanımla",
    en: "Define a custom role",
  },
  "admin.roles.new_role_tooltip": {
    tr: "Yeni özel rol oluştur",
    en: "Create a new custom role",
  },

  // Phase 15 Plan 15-10 — "Sistem" badge for is_system_role=true cards.
  // Replaces the v3.0 warning Badge that Phase 14 14-04 used to mark Guest as
  // deferred. Now indicates that the role is built-in and read-only.
  "admin.roles.system_badge_label": {
    tr: "Sistem",
    en: "System",
  },

  // -------------------------------------------------------------------------
  // Surface E — /admin/permissions (İzin Matrisi — RBAC PLACEHOLDER per D-A3)
  // -------------------------------------------------------------------------

  // Phase 15 Plan 15-10 (RBAC active) — AlertBanner copy FLIPPED from Phase 14
  // 14-04 placeholder text. See Plan 15-10 layer 4 of 7-layer atomic uplift
  // (D-2.7) — RBAC infra is now active and toggle changes auto-save per
  // D-1.12 optimistic mutation in useUpdatePermissionCell.
  "admin.permissions.alert_banner_body": {
    tr: "RBAC altyapısı aktif. Toggle değişiklikleri anında kaydedilir; Admin sütunu salt okunur (sistem rolü korunur).",
    en: "RBAC layer active. Toggle changes save immediately; Admin column is read-only (system role protected).",
  },

  "admin.permissions.card_title": {
    tr: "İzin Matrisi",
    en: "Permission Matrix",
  },
  "admin.permissions.card_subtitle": {
    tr: "Rol başına tüm izinler tek bakışta — değişiklikler anında kaydedilir",
    en: "All permissions by role at a glance — changes save immediately",
  },

  // Phase 15 Plan 15-10 — Kopyala button now ENABLED (D-2.7 atomic uplift
  // layer 5). Tooltip FLIPPED from "v3.0'da gelecek" to a real action hint
  // (the button copies the matrix as JSON to clipboard for v2.0 — full CSV
  // export deferred to v2.1).
  "admin.permissions.copy_button": {
    tr: "Kopyala",
    en: "Copy",
  },
  "admin.permissions.copy_tooltip": {
    tr: "İzin matrisini panoya JSON olarak kopyala",
    en: "Copy permission matrix to clipboard as JSON",
  },
  "admin.permissions.copy_success": {
    tr: "İzin matrisi panoya kopyalandı",
    en: "Permission matrix copied to clipboard",
  },

  // Phase 15 Plan 15-10 — Per-row scope badge labels (D-3.4 — 2-tier check
  // transparency). PermissionScopeBadge renders these inline next to the
  // permission key so admins know whether the perm gates a system-level or
  // project-level action.
  "admin.permissions.scope_system": {
    tr: "(sistem)",
    en: "(system)",
  },
  "admin.permissions.scope_project": {
    tr: "(proje)",
    en: "(project)",
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
