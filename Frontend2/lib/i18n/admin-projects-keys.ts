// Phase 14 Plan 14-05 — Admin Projects tab i18n key map (UI-SPEC §Surface F).
//
// TR + EN parity contract: every key MUST have BOTH a `tr:` value AND an `en:`
// value. Surface F of UI-SPEC enumerates the full copy table (lines 421-439).
//
// Why a separate file from admin-keys.ts (Plan 14-02 territory):
//   - Wave 2 plans 14-03..14-08 each ship their own per-surface keys file so
//     same-wave files_modified arrays don't overlap.
//   - admin-keys.ts is the BARREL for the layout shell + Overview tab keys
//     (Plan 14-02). admin-projects-keys.ts is the per-surface barrel for the
//     Projects tab (Plan 14-05).
//
// Helper: adminProjectsT(key, lang) returns ADMIN_PROJECTS_I18N_KEYS[key][lang].
// Consumers pull the language from `useApp().language` at the call site.

export const ADMIN_PROJECTS_I18N_KEYS = {
  // -------------------------------------------------------------------------
  // Toolbar
  // -------------------------------------------------------------------------
  "admin.projects.search_placeholder": {
    tr: "Proje ara…",
    en: "Search…",
  },
  "admin.projects.export_button": {
    tr: "Dışa aktar",
    en: "Export",
  },
  // Plan 14-01 only shipped /api/v1/admin/users.csv. /admin/projects.csv is
  // deferred — the Dışa aktar button is soft-disabled with this v2.1 tooltip.
  "admin.projects.export_disabled_tooltip": {
    tr: "v2.1'de aktif olacak",
    en: "Available in v2.1",
  },
  "admin.projects.new_project": {
    tr: "Yeni proje",
    en: "New project",
  },

  // -------------------------------------------------------------------------
  // Table column headers (verbatim per UI-SPEC §Surface F lines 428-434)
  // -------------------------------------------------------------------------
  "admin.projects.col_key": {
    tr: "Key",
    en: "Key",
  },
  "admin.projects.col_name": {
    tr: "İsim",
    en: "Name",
  },
  "admin.projects.col_method": {
    tr: "Yöntem",
    en: "Method",
  },
  "admin.projects.col_lead": {
    tr: "Yönetici",
    en: "Lead",
  },
  "admin.projects.col_tasks": {
    tr: "Görevler",
    en: "Tasks",
  },
  "admin.projects.col_progress": {
    tr: "İlerleme",
    en: "Progress",
  },
  "admin.projects.col_created": {
    tr: "Oluşturma",
    en: "Created",
  },

  // Tasks cell suffix — verbatim line 337 of admin.jsx prototype.
  "admin.projects.tasks_done_suffix": {
    tr: "bitti",
    en: "done",
  },

  // -------------------------------------------------------------------------
  // Per-row MoreH menu items (D-B5 — EXACTLY 2; NO transfer-ownership)
  // -------------------------------------------------------------------------
  "admin.projects.archive": {
    tr: "Arşivle",
    en: "Archive",
  },
  "admin.projects.unarchive": {
    tr: "Arşivden çıkar",
    en: "Unarchive",
  },
  "admin.projects.delete": {
    tr: "Sil",
    en: "Delete",
  },

  // -------------------------------------------------------------------------
  // Confirm dialogs / modals (UI-SPEC §Color lines 212-213)
  // -------------------------------------------------------------------------
  "admin.projects.archive_modal_title": {
    tr: "Projeyi arşivle",
    en: "Archive project",
  },
  "admin.projects.archive_modal_body": {
    tr: "{name} arşivlensin mi? Proje salt-okuma olur ve listelerde gizlenir.",
    en: "Archive {name}? The project becomes read-only and is hidden from lists.",
  },
  "admin.projects.unarchive_modal_title": {
    tr: "Projeyi arşivden çıkar",
    en: "Unarchive project",
  },
  "admin.projects.unarchive_modal_body": {
    tr: "{name} aktif duruma getirilsin mi?",
    en: "Restore {name} to active status?",
  },
  "admin.projects.delete_modal_title": {
    tr: "Projeyi kalıcı olarak sil",
    en: "Permanently delete project",
  },
  "admin.projects.delete_modal_body": {
    tr: "{name} silinmek üzere. Bu işlem geri alınamaz; tüm görevler ve sprintler kaybolur.",
    en: "{name} is about to be deleted. This is irreversible; all tasks and sprints will be lost.",
  },
  "admin.projects.delete_modal_typing_prompt": {
    tr: "Onaylamak için proje anahtarını yaz: {key}",
    en: "Type the project key to confirm: {key}",
  },

  // -------------------------------------------------------------------------
  // Status badges
  // -------------------------------------------------------------------------
  "admin.projects.archived_badge": {
    tr: "Arşivli",
    en: "Archived",
  },

  // -------------------------------------------------------------------------
  // Empty states (UI-SPEC §Surface F lines 438-439)
  // -------------------------------------------------------------------------
  "admin.projects.empty_no_match": {
    tr: "Filtreyle eşleşen proje yok.",
    en: "No projects match the filter.",
  },
  "admin.projects.empty_no_projects": {
    tr: "Henüz proje yok. Yeni proje oluştur ile başla.",
    en: "No projects yet. Start with New project.",
  },

  // -------------------------------------------------------------------------
  // Shared / generic
  // -------------------------------------------------------------------------
  "admin.cancel": {
    tr: "Vazgeç",
    en: "Cancel",
  },
} as const

export type AdminProjectsI18nKey = keyof typeof ADMIN_PROJECTS_I18N_KEYS

/**
 * Lookup helper — returns the localized string for a key.
 * Defensive fallback: if a key is missing in EN, falls back to TR; if missing
 * entirely returns the key itself so the bug is visible in the UI.
 */
export function adminProjectsT(
  key: AdminProjectsI18nKey,
  lang: "tr" | "en",
): string {
  const entry = ADMIN_PROJECTS_I18N_KEYS[key]
  if (!entry) return String(key)
  return entry[lang] || entry.tr || String(key)
}
