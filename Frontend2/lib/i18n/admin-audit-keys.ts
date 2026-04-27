// Phase 14 Plan 14-07 — /admin/audit (Audit) tab i18n key map.
//
// Per-surface keys file convention established by Plan 14-02 admin-keys.ts.
// Each key has BOTH a `tr:` and `en:` value (UI-SPEC §Surface H — full copy
// table, lines 457-487).
//
// Helper: adminAuditT(key, lang). Consumers pull language from
// `useApp().language` at the call site:
//
//   const { language } = useApp()
//   <h1>{adminAuditT("admin.audit.search_placeholder", language)}</h1>

export const ADMIN_AUDIT_I18N_KEYS = {
  // -------------------------------------------------------------------------
  // Toolbar
  // -------------------------------------------------------------------------
  "admin.audit.search_placeholder": {
    tr: "actor, action, target…",
    en: "actor, action, target…",
  },
  "admin.audit.last_24h": {
    tr: "Son 24 saat",
    en: "Last 24h",
  },
  "admin.audit.filter_button": {
    tr: "Filtre",
    en: "Filter",
  },
  "admin.audit.json_button": {
    tr: "JSON",
    en: "JSON",
  },

  // -------------------------------------------------------------------------
  // Table column headers
  // -------------------------------------------------------------------------
  "admin.audit.col_time": {
    tr: "Zaman",
    en: "Time",
  },
  "admin.audit.col_actor": {
    tr: "Aktör",
    en: "Actor",
  },
  "admin.audit.col_action": {
    tr: "İşlem",
    en: "Action",
  },
  "admin.audit.col_target": {
    tr: "Hedef",
    en: "Target",
  },
  "admin.audit.col_detay": {
    tr: "Detay",
    en: "Detail",
  },

  // -------------------------------------------------------------------------
  // Filter modal — title + 4 fields + 3 footer buttons
  // -------------------------------------------------------------------------
  "admin.audit.filter_modal_title": {
    tr: "Audit Filtresi",
    en: "Audit Filter",
  },
  "admin.audit.filter_date_from": {
    tr: "Başlangıç",
    en: "From",
  },
  "admin.audit.filter_date_to": {
    tr: "Bitiş",
    en: "To",
  },
  "admin.audit.filter_actor": {
    tr: "Aktör (kullanıcı)",
    en: "Actor (user)",
  },
  "admin.audit.filter_actor_all": {
    tr: "Tümü",
    en: "All",
  },
  "admin.audit.filter_action_prefix": {
    tr: "İşlem öneki (örn. task. veya project.archive)",
    en: "Action prefix (e.g. task. or project.archive)",
  },
  "admin.audit.filter_action_prefix_placeholder": {
    tr: "task. veya project.archive",
    en: "task. or project.archive",
  },
  "admin.audit.filter_apply": {
    tr: "Uygula",
    en: "Apply",
  },
  "admin.audit.filter_clear": {
    tr: "Temizle",
    en: "Clear",
  },
  "admin.audit.filter_cancel": {
    tr: "Vazgeç",
    en: "Cancel",
  },

  // -------------------------------------------------------------------------
  // Active filter chip strip (shown above the table when filters non-empty)
  // -------------------------------------------------------------------------
  "admin.audit.chip_actor_label": {
    tr: "Aktör",
    en: "Actor",
  },
  "admin.audit.chip_action_label": {
    tr: "İşlem",
    en: "Action",
  },
  "admin.audit.chip_date_range_label": {
    tr: "Tarih",
    en: "Date",
  },
  "admin.audit.chip_clear_aria": {
    tr: "Filtreyi kaldır",
    en: "Clear filter",
  },

  // -------------------------------------------------------------------------
  // Pagination toolbar
  // -------------------------------------------------------------------------
  "admin.audit.pagination_size_label": {
    tr: "Sayfa boyutu",
    en: "Page size",
  },
  "admin.audit.pagination_page": {
    tr: "Sayfa {P} / {M}",
    en: "Page {P} / {M}",
  },
  "admin.audit.pagination_total": {
    tr: "Toplam: {N} kayıt",
    en: "Total: {N} entries",
  },
  "admin.audit.pagination_prev_aria": {
    tr: "Önceki sayfa",
    en: "Previous page",
  },
  "admin.audit.pagination_next_aria": {
    tr: "Sonraki sayfa",
    en: "Next page",
  },

  // -------------------------------------------------------------------------
  // Empty + warning states
  // -------------------------------------------------------------------------
  "admin.audit.empty_no_match": {
    tr: "Filtreyle eşleşen audit kaydı yok.",
    en: "No audit entries match the filter.",
  },
  "admin.audit.empty_no_audit": {
    tr: "Henüz audit kaydı yok.",
    en: "No audit entries yet.",
  },
  "admin.audit.truncated_warning": {
    tr:
      "Filtre çok geniş ({N} satır). Sadece son 50.000 kayıt gösteriliyor; daha eski kayıtlar için JSON dışa aktarımı kullanın.",
    en:
      "Filter too wide ({N} rows). Only the most recent 50,000 are shown; use JSON export for older entries.",
  },
} as const

export type AdminAuditI18nKey = keyof typeof ADMIN_AUDIT_I18N_KEYS

/**
 * Lookup helper — returns the localized string for an admin-audit key.
 *
 * Defensive fallback chain: en lookup → tr lookup → return raw key (so
 * missing keys are visible in the UI rather than silently rendered empty).
 */
export function adminAuditT(
  key: AdminAuditI18nKey,
  lang: "tr" | "en",
): string {
  const entry = ADMIN_AUDIT_I18N_KEYS[key]
  if (!entry) return String(key)
  return entry[lang] || entry.tr || String(key)
}
