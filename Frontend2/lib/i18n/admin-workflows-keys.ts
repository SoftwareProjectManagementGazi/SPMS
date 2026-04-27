// Phase 14 Plan 14-06 — Admin Workflows (Şablonlar) tab i18n key map.
//
// UI-SPEC §Surface G enumerates the full copy table (lines 441-455) for the
// /admin/workflows template card grid. This file mirrors that contract:
//   - 12 keys total covering Custom badge, mode badges, footer counter,
//     MoreH labels, ConfirmDialog bodies (in-use + not-in-use), the
//     "Yine de sil" secondary checkbox copy, success Toast messages,
//     and the empty state.
//   - TR + EN parity contract: every key MUST have BOTH `tr:` AND `en:`.
//
// Why a separate file from admin-keys.ts (Plan 14-02 territory):
//   - Wave 2 plans 14-03..14-08 each ship their own per-surface keys file
//     so same-wave files_modified arrays don't overlap. Plan 14-06 owns
//     this file end-to-end.
//   - admin-keys.ts is the BARREL for the layout shell + Overview tab keys
//     (Plan 14-02). admin-workflows-keys.ts is the per-surface barrel for
//     the Workflows tab (Plan 14-06).
//
// Helper: adminWorkflowsT(key, lang) returns ADMIN_WORKFLOWS_I18N_KEYS[key][lang].
// Consumers pull the language from `useApp().language` at the call site.

export const ADMIN_WORKFLOWS_I18N_KEYS = {
  // ---------------------------------------------------------------------------
  // Card chrome — Custom badge + footer counter (UI-SPEC §Surface G lines 446 + 451)
  // ---------------------------------------------------------------------------
  "admin.workflows.custom_badge": {
    tr: "Özel",
    en: "Custom",
  },
  "admin.workflows.proje_suffix": {
    // Verbatim prototype line 381 — singular/plural same in TR ("proje").
    // EN "projects" works for any N including 1 (matches prototype line 381).
    tr: "proje",
    en: "projects",
  },

  // ---------------------------------------------------------------------------
  // Mode badges — verbatim English-only per UI-SPEC §Surface G lines 448-450.
  // The prototype kept these English-only; we localize TR for parity but the
  // tone-derived word is identical for both columns to match the prototype.
  // ---------------------------------------------------------------------------
  "admin.workflows.mode_locked": {
    tr: "Locked",
    en: "Locked",
  },
  "admin.workflows.mode_continuous": {
    tr: "Continuous",
    en: "Continuous",
  },
  "admin.workflows.mode_flexible": {
    tr: "Flexible",
    en: "Flexible",
  },

  // ---------------------------------------------------------------------------
  // Per-card MoreH menu items (UI-SPEC §Surface G lines 452-454)
  // ---------------------------------------------------------------------------
  "admin.workflows.edit": {
    tr: "Düzenle",
    en: "Edit",
  },
  "admin.workflows.clone": {
    tr: "Klonla",
    en: "Clone",
  },
  "admin.workflows.delete": {
    tr: "Sil",
    en: "Delete",
  },

  // ---------------------------------------------------------------------------
  // Sil ConfirmDialog / Modal — non-in-use branch (usage_count === 0)
  // UI-SPEC §G.4 line 1534: "ConfirmDialog → DELETE /api/v1/process_templates/{id}"
  // ---------------------------------------------------------------------------
  "admin.workflows.delete_modal_title": {
    tr: "Şablonu sil",
    en: "Delete template",
  },
  "admin.workflows.delete_modal_body": {
    tr: "{name} şablonu silinsin mi? Bu işlem geri alınamaz.",
    en: "Delete template {name}? This action cannot be undone.",
  },

  // ---------------------------------------------------------------------------
  // Sil Modal — in-use branch (usage_count > 0) — D-B6 impact-aware confirm
  // UI-SPEC §Color line 211 — the body shows the impact warning + a secondary
  // checkbox "Yine de sil" must be checked before the danger CTA enables.
  // ---------------------------------------------------------------------------
  "admin.workflows.delete_modal_body_in_use": {
    tr: "{name} şablonu {count} projede kullanılıyor. Silmek bu projelerin akışını bozabilir.",
    en: "{name} is in use by {count} projects. Deleting it may break their workflow.",
  },
  "admin.workflows.delete_in_use_checkbox_label": {
    tr: "Yine de sil",
    en: "Delete anyway",
  },

  // ---------------------------------------------------------------------------
  // Toast — Klonla / Sil success messages
  // ---------------------------------------------------------------------------
  "admin.workflows.clone_success_toast": {
    tr: "{name} şablonu kopyalandı.",
    en: "{name} template cloned.",
  },
  "admin.workflows.delete_success_toast": {
    tr: "{name} şablonu silindi.",
    en: "{name} template deleted.",
  },
  "admin.workflows.clone_error_toast": {
    tr: "Kopyalama başarısız: {error}",
    en: "Clone failed: {error}",
  },
  "admin.workflows.delete_error_toast": {
    tr: "Silme başarısız: {error}",
    en: "Delete failed: {error}",
  },

  // ---------------------------------------------------------------------------
  // Empty state (UI-SPEC §Surface G line 455)
  // ---------------------------------------------------------------------------
  "admin.workflows.empty": {
    tr: "Henüz şablon yok.",
    en: "No templates yet.",
  },

  // ---------------------------------------------------------------------------
  // Clone naming convention — appended to the cloned template's name. Keeps
  // TR/EN distinct so the user immediately sees "(Kopya)" vs "(Copy)" and
  // doesn't confuse the clone with the original.
  // ---------------------------------------------------------------------------
  "admin.workflows.clone_name_suffix": {
    tr: " (Kopya)",
    en: " (Copy)",
  },

  // ---------------------------------------------------------------------------
  // Shared / generic
  // ---------------------------------------------------------------------------
  "admin.cancel": {
    tr: "Vazgeç",
    en: "Cancel",
  },
} as const

export type AdminWorkflowsI18nKey = keyof typeof ADMIN_WORKFLOWS_I18N_KEYS

/**
 * Lookup helper — returns the localized string for a key.
 * Defensive fallback: if a key is missing in EN, falls back to TR; if missing
 * entirely returns the key itself so the bug is visible in the UI.
 */
export function adminWorkflowsT(
  key: AdminWorkflowsI18nKey,
  lang: "tr" | "en",
): string {
  const entry = ADMIN_WORKFLOWS_I18N_KEYS[key]
  if (!entry) return String(key)
  return entry[lang] || entry.tr || String(key)
}
