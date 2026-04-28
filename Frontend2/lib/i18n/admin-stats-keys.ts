// Phase 14 Plan 14-08 — Admin Stats (İstatistik) tab i18n key map.
//
// UI-SPEC §Surface I lines 490-510 enumerates the full copy table for the
// /admin/stats charts. This file mirrors that contract:
//   - Active users trend card (title + subtitle + tooltip + delta Badge).
//   - Methodology distribution bars (title + per-row labels + percentage).
//   - Velocity per project (title + 30-project cap notice).
//   - Empty states for both the trend (no audit_log activity in 30d) and
//     the velocity grid (no projects with iteration history).
//   - TR + EN parity contract: every key MUST have BOTH a `tr:` value AND
//     an `en:` value.
//
// Why a separate file from admin-keys.ts (Plan 14-02 territory):
//   - Wave 2 plans 14-03..14-08 each ship their own per-surface keys file
//     (admin-users-keys, admin-rbac-keys, admin-projects-keys,
//     admin-workflows-keys, admin-audit-keys, admin-stats-keys) so
//     same-wave files_modified arrays don't overlap.
//   - admin-keys.ts is the BARREL for the layout shell + Overview tab keys.
//   - admin-stats-keys.ts is the per-surface barrel for the Stats tab.
//
// Helper: adminStatsT(key, lang) returns ADMIN_STATS_I18N_KEYS[key][lang].
// Consumers pull the language from `useApp().language` at the call site:
//
//   const { language } = useApp()
//   <h3>{adminStatsT("admin.stats.active_users_title", language)}</h3>

export const ADMIN_STATS_I18N_KEYS = {
  // ---------------------------------------------------------------------------
  // Active users trend card (UI-SPEC §Surface I lines 494-497)
  // ---------------------------------------------------------------------------
  "admin.stats.active_users_title": {
    tr: "Aktif kullanıcı eğilimi",
    en: "Active users trend",
  },
  "admin.stats.active_users_subtitle": {
    tr: "Son 30 gün",
    en: "Last 30 days",
  },
  "admin.stats.tooltip_active_users_suffix": {
    // Tooltip body — interpolated inline as "{date}: {N} aktif kullanıcı".
    // The suffix word is what's localized; the date + count are number+string
    // primitives controlled by recharts' formatter.
    tr: "aktif kullanıcı",
    en: "active users",
  },

  // ---------------------------------------------------------------------------
  // Methodology distribution bars (UI-SPEC §Surface I lines 498-504)
  // ---------------------------------------------------------------------------
  "admin.stats.methodology_title": {
    tr: "Metodoloji Kullanımı",
    en: "Methodology usage",
  },
  // Plan 14-18 (Cluster F UAT Test 31 side-finding) — disambiguates the
  // unit. Without the subtitle admins didn't know if the bars represented
  // project counts, task counts, or seat licenses. Backend's
  // methodology_distribution counts NON-archived projects per methodology
  // (Backend/app/infrastructure/database/repositories/project_repo.py
  // methodology_distribution() — see project_repo.py source). The subtitle
  // calls that out explicitly.
  "admin.stats.methodology_subtitle": {
    tr: "Aktif proje sayısı (arşivlenmiş projeler hariç)",
    en: "Active project count (archived projects excluded)",
  },
  "admin.stats.methodology_row_scrum": {
    tr: "Scrum",
    en: "Scrum",
  },
  "admin.stats.methodology_row_kanban": {
    tr: "Kanban",
    en: "Kanban",
  },
  "admin.stats.methodology_row_waterfall": {
    tr: "Waterfall",
    en: "Waterfall",
  },
  "admin.stats.methodology_row_iterative": {
    tr: "Iterative",
    en: "Iterative",
  },
  "admin.stats.methodology_row_other": {
    tr: "Diğer",
    en: "Other",
  },

  // ---------------------------------------------------------------------------
  // Velocity per project card (UI-SPEC §Surface I lines 505-508)
  // ---------------------------------------------------------------------------
  // Plan 14-18 (Cluster F UAT Test 31 side-finding) — renamed from
  // "velocity" / "Velocity" to a methodology-neutral term. "Velocity" is
  // Scrum-specific (story points per sprint); Kanban/Waterfall users found
  // it confusing because their methodologies don't use the concept. The
  // chart actually shows completion-rate / throughput across recent
  // iterations, which makes "Tamamlama hızı" / "Throughput" the right
  // generic label. The KEY name is preserved (still
  // admin.stats.velocity_title) so existing call sites keep working — only
  // the rendered VALUE changed.
  "admin.stats.velocity_title": {
    tr: "Tamamlama hızı",
    en: "Throughput",
  },
  "admin.stats.velocity_top30_note": {
    // {N} is the total count before the top-30 slice. Shown only when
    // velocities.length > 30 (D-X4 defensive client-side cap).
    tr: "İlk 30 aktif proje gösteriliyor.",
    en: "Showing top 30 active projects.",
  },

  // ---------------------------------------------------------------------------
  // Empty states (UI-SPEC §Surface I lines 509-510 — D-F2)
  // ---------------------------------------------------------------------------
  "admin.stats.empty_trend": {
    tr: "Son 30 günde aktivite yok.",
    en: "No activity in the last 30 days.",
  },
  "admin.stats.empty_velocity": {
    tr: "Hiç proje velocity verisi yok.",
    en: "No project velocity data.",
  },
} as const

export type AdminStatsI18nKey = keyof typeof ADMIN_STATS_I18N_KEYS

/**
 * Lookup helper — returns the localized string for a key.
 * Defensive fallback: if a key is missing in EN, falls back to TR; if missing
 * entirely returns the key itself so the bug is visible in the UI.
 */
export function adminStatsT(
  key: AdminStatsI18nKey,
  lang: "tr" | "en",
): string {
  const entry = ADMIN_STATS_I18N_KEYS[key]
  if (!entry) return String(key)
  return entry[lang] || entry.tr || String(key)
}
