// Phase 14 Plan 14-02 — Admin shell + Overview i18n key map.
//
// TR + EN parity contract: every key MUST have BOTH a `tr:` value AND an `en:`
// value (UI-SPEC §Surface A + §Surface B exhaustive copy table).
//
// Why a per-surface keys file (not the global lib/i18n.ts STRINGS tree):
//   - Wave 2 plans 14-03..14-08 each ship their own per-surface keys file
//     (admin-users-keys.ts, admin-rbac-keys.ts, admin-projects-keys.ts,
//     admin-workflows-keys.ts, admin-audit-keys.ts, admin-stats-keys.ts) so
//     same-wave files_modified arrays don't overlap.
//   - admin-keys.ts is the BARREL for the layout shell + Overview tab keys.
//
// Helper: adminT(key, lang) returns ADMIN_I18N_KEYS[key][lang]. Consumers
// pull the language from `useApp().language` at the call site:
//
//   const { language } = useApp()
//   <h1>{adminT("admin.layout.title", language)}</h1>

export const ADMIN_I18N_KEYS = {
  // -------------------------------------------------------------------------
  // Surface A — Admin Layout (page header + nav tabs strip)
  // -------------------------------------------------------------------------
  "admin.layout.title": {
    tr: "Yönetim Konsolu",
    en: "Admin Console",
  },
  "admin.layout.subtitle": {
    tr: "Organizasyon genelinde izinler, kullanıcılar ve şablonlar",
    en: "Org-wide permissions, users & templates",
  },
  "admin.layout.export": {
    tr: "Rapor al",
    en: "Export",
  },
  "admin.layout.audit_log": {
    tr: "Denetim günlüğü",
    en: "Audit log",
  },
  "admin.layout.tab_overview": {
    tr: "Genel",
    en: "Overview",
  },
  "admin.layout.tab_users": {
    tr: "Kullanıcılar",
    en: "Users",
  },
  "admin.layout.tab_roles": {
    tr: "Roller",
    en: "Roles",
  },
  "admin.layout.tab_permissions": {
    tr: "İzin Matrisi",
    en: "Permissions",
  },
  "admin.layout.tab_projects": {
    tr: "Projeler",
    en: "Projects",
  },
  "admin.layout.tab_workflows": {
    tr: "Şablonlar",
    en: "Templates",
  },
  "admin.layout.tab_audit": {
    tr: "Audit",
    en: "Audit",
  },
  "admin.layout.tab_stats": {
    tr: "İstatistik",
    en: "Stats",
  },
  "admin.layout.access_denied_toast": {
    tr: "Bu sayfaya erişim yetkiniz yok.",
    en: "You don't have permission to access this page.",
  },

  // -------------------------------------------------------------------------
  // Surface B — /admin (Overview / Genel) tab
  // -------------------------------------------------------------------------

  // 5 StatCards — labels + deltas (UI-SPEC §Surface B lines 304-308)
  "admin.overview.statcard_users": {
    tr: "Kullanıcı",
    en: "Users",
  },
  "admin.overview.statcard_users_delta": {
    tr: "+{N} bu ay",
    en: "+{N} this mo.",
  },
  "admin.overview.statcard_active_projects": {
    tr: "Aktif Proje",
    en: "Active projects",
  },
  "admin.overview.statcard_active_projects_delta": {
    tr: "+{N}",
    en: "+{N}",
  },
  "admin.overview.statcard_pending": {
    tr: "Onay Bekleyen",
    en: "Pending",
  },
  "admin.overview.statcard_pending_delta": {
    tr: "bugün",
    en: "today",
  },
  "admin.overview.statcard_templates": {
    tr: "Şablon",
    en: "Templates",
  },
  "admin.overview.statcard_templates_delta": {
    tr: "{N} özel",
    en: "{N} custom",
  },
  "admin.overview.statcard_storage": {
    tr: "Depolama",
    en: "Storage",
  },
  "admin.overview.statcard_storage_delta": {
    tr: "%{P} dolu",
    en: "{P}% used",
  },

  // Pending Requests panel
  "admin.overview.pending_requests_title": {
    tr: "Bekleyen Proje Katılım İstekleri",
    en: "Pending Project Join Requests",
  },
  "admin.overview.pending_requests_view_all": {
    tr: "Tümünü gör",
    en: "View all",
  },
  "admin.overview.pending_requests_approve": {
    tr: "Onayla",
    en: "Approve",
  },
  "admin.overview.pending_requests_reject": {
    tr: "Reddet",
    en: "Reject",
  },
  "admin.overview.pending_requests_empty": {
    tr: "Onay bekleyen istek yok.",
    en: "No pending requests.",
  },
  "admin.overview.pending_requests_modal_title": {
    tr: "Tüm bekleyen istekler",
    en: "All pending requests",
  },
  "admin.overview.pending_requests_modal_close": {
    tr: "Kapat",
    en: "Close",
  },
  // Glue spans for the verbatim primary line — kept as separate keys so the
  // composition stays clean at the call site (TR sandwich is "— X kullanıcısını
  // Y projesine eklemek istiyor"; EN is "requested X to join Y").
  "admin.overview.pending_requests_dash": {
    tr: "—",
    en: "requested",
  },
  "admin.overview.pending_requests_glue_user": {
    tr: "kullanıcısını",
    en: "to join",
  },
  "admin.overview.pending_requests_glue_project_suffix": {
    tr: "projesine eklemek istiyor",
    en: "",
  },

  // Role distribution
  "admin.overview.role_distribution_title": {
    tr: "Rol Dağılımı",
    en: "Role distribution",
  },
  "admin.overview.role_admin": {
    tr: "Admin",
    en: "Admin",
  },
  "admin.overview.role_pm": {
    tr: "Project Manager",
    en: "Project Manager",
  },
  "admin.overview.role_member": {
    tr: "Member",
    en: "Member",
  },

  // Recent admin events
  "admin.overview.recent_admin_events_title": {
    tr: "Son Yönetim Olayları",
    en: "Recent admin events",
  },
  "admin.overview.recent_admin_events_empty": {
    tr: "Son yönetim olayı yok.",
    en: "No recent admin events.",
  },
  "admin.overview.recent_admin_events_view_all": {
    tr: "Audit'a git →",
    en: "Open Audit →",
  },
} as const

export type AdminI18nKey = keyof typeof ADMIN_I18N_KEYS

/**
 * Lookup helper — returns the localized string for a key.
 * Defensive fallback: if a key happens to be missing in EN (none today, but
 * defended for future additions), falls back to TR; if missing entirely
 * returns the key itself so the bug is visible in the UI.
 */
export function adminT(key: AdminI18nKey, lang: "tr" | "en"): string {
  const entry = ADMIN_I18N_KEYS[key]
  if (!entry) return String(key)
  return entry[lang] || entry.tr || String(key)
}
