// Phase 14 Plan 14-03 — Admin Users tab i18n key map (UI-SPEC §Surface C).
//
// TR + EN parity contract: every key MUST have BOTH a `tr:` value AND an `en:`
// value. Surface C of UI-SPEC enumerates the full copy table (lines 335-368).
//
// Why a separate file from admin-keys.ts (Plan 14-02 territory):
//   - Wave 2 plans 14-03..14-08 each ship their own per-surface keys file so
//     same-wave files_modified arrays don't overlap.
//   - admin-keys.ts is the BARREL for the layout shell + Overview tab keys
//     (Plan 14-02). admin-users-keys.ts is the per-surface barrel for the
//     Users tab (Plan 14-03).
//
// Helper: adminUsersT(key, lang) returns ADMIN_USERS_I18N_KEYS[key][lang].
// Consumers pull the language from `useApp().language` at the call site.

export const ADMIN_USERS_I18N_KEYS = {
  // -------------------------------------------------------------------------
  // Toolbar
  // -------------------------------------------------------------------------
  "admin.users.search_placeholder": {
    tr: "Kullanıcı ara…",
    en: "Search users…",
  },
  "admin.users.filter_all": {
    tr: "Tümü",
    en: "All",
  },
  "admin.users.csv_button": {
    tr: "CSV",
    en: "CSV",
  },
  "admin.users.bulk_invite_button": {
    tr: "Toplu davet",
    en: "Bulk invite",
  },
  "admin.users.add_user_button": {
    tr: "Kullanıcı ekle",
    en: "Add user",
  },

  // -------------------------------------------------------------------------
  // Table column headers
  // -------------------------------------------------------------------------
  "admin.users.table_col_name": {
    tr: "Ad Soyad",
    en: "Name",
  },
  "admin.users.table_col_email": {
    tr: "Email",
    en: "Email",
  },
  "admin.users.table_col_role": {
    tr: "Rol",
    en: "Role",
  },
  "admin.users.table_col_projects": {
    tr: "Projeler",
    en: "Projects",
  },
  "admin.users.table_col_last_seen": {
    tr: "Son Giriş",
    en: "Last Seen",
  },
  "admin.users.table_col_status": {
    tr: "Durum",
    en: "Status",
  },

  // -------------------------------------------------------------------------
  // Status / time
  // -------------------------------------------------------------------------
  "admin.users.status_active": {
    tr: "Aktif",
    en: "Active",
  },
  "admin.users.status_inactive": {
    tr: "Pasif",
    en: "Inactive",
  },
  "admin.users.last_seen_now": {
    tr: "Şimdi",
    en: "Now",
  },

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  "admin.users.pagination_caption": {
    tr: "{N} kullanıcı",
    en: "{N} users",
  },
  "admin.users.pagination_page": {
    tr: "{P} / {M}",
    en: "{P} / {M}",
  },

  // -------------------------------------------------------------------------
  // MoreH per-row menu items
  // -------------------------------------------------------------------------
  "admin.users.more_reset_password": {
    tr: "Şifre sıfırla",
    en: "Reset password",
  },
  "admin.users.more_change_role": {
    tr: "Rolü değiştir",
    en: "Change role",
  },
  "admin.users.more_change_role_admin": {
    tr: "Admin",
    en: "Admin",
  },
  "admin.users.more_change_role_pm": {
    tr: "Project Manager",
    en: "Project Manager",
  },
  "admin.users.more_change_role_member": {
    tr: "Member",
    en: "Member",
  },
  "admin.users.more_deactivate": {
    tr: "Devre dışı bırak",
    en: "Deactivate",
  },
  "admin.users.more_reactivate": {
    tr: "Tekrar aktif et",
    en: "Reactivate",
  },
  "admin.users.more_delete": {
    tr: "Sil",
    en: "Delete",
  },
  "admin.users.more_delete_disabled_tooltip": {
    tr: "v2.1'de aktif olacak",
    en: "Available in v2.1",
  },

  // -------------------------------------------------------------------------
  // Confirm dialogs (per UI-SPEC §Surface C lines 203-207)
  // -------------------------------------------------------------------------
  "admin.users.confirm_deactivate_title": {
    tr: "Kullanıcı devre dışı bırakılsın mı?",
    en: "Deactivate user?",
  },
  "admin.users.confirm_deactivate_body": {
    tr: "{name} devre dışı bırakılacak. Tekrar aktif edilebilir.",
    en: "{name} will be deactivated. Can be reactivated later.",
  },
  "admin.users.confirm_reactivate_title": {
    tr: "Kullanıcı tekrar aktif edilsin mi?",
    en: "Reactivate user?",
  },
  "admin.users.confirm_reactivate_body": {
    tr: "{name} tekrar aktif edilecek.",
    en: "{name} will be reactivated.",
  },
  "admin.users.confirm_confirm": {
    tr: "Onayla",
    en: "Confirm",
  },
  "admin.users.confirm_cancel": {
    tr: "Vazgeç",
    en: "Cancel",
  },

  // -------------------------------------------------------------------------
  // Bulk-select toolbar (D-B7)
  // -------------------------------------------------------------------------
  "admin.users.bulk_selected": {
    tr: "{N} seçili",
    en: "{N} selected",
  },
  "admin.users.bulk_deactivate": {
    tr: "Toplu devre dışı bırak",
    en: "Deactivate selected",
  },
  "admin.users.bulk_role_change": {
    tr: "Toplu rol değiştir",
    en: "Change role for selected",
  },
  "admin.users.bulk_cancel": {
    tr: "Vazgeç",
    en: "Cancel",
  },
  "admin.users.bulk_deactivate_title": {
    tr: "{N} kullanıcı devre dışı bırakılsın mı?",
    en: "Deactivate {N} users?",
  },
  "admin.users.bulk_deactivate_body_more": {
    tr: "+ {N} daha",
    en: "+ {N} more",
  },

  // -------------------------------------------------------------------------
  // Empty states
  // -------------------------------------------------------------------------
  "admin.users.empty_no_match": {
    tr: "Aramayla eşleşen kullanıcı bulunamadı.",
    en: "No users match the search.",
  },
  "admin.users.empty_no_users": {
    tr: "Henüz kullanıcı yok.",
    en: "No users yet.",
  },

  // -------------------------------------------------------------------------
  // Add User modal (Task 2)
  // -------------------------------------------------------------------------
  "admin.users.modal_add_title": {
    tr: "Kullanıcı ekle",
    en: "Add user",
  },
  "admin.users.modal_add_email_label": {
    tr: "Email",
    en: "Email",
  },
  "admin.users.modal_add_role_label": {
    tr: "Rol",
    en: "Role",
  },
  "admin.users.modal_add_name_label": {
    tr: "Ad Soyad (opsiyonel)",
    en: "Full name (optional)",
  },
  "admin.users.modal_add_submit": {
    tr: "Davet gönder",
    en: "Send invite",
  },
  "admin.users.modal_add_cancel": {
    tr: "Vazgeç",
    en: "Cancel",
  },
  "admin.users.modal_add_email_required": {
    tr: "Email gerekli",
    en: "Email is required",
  },
  "admin.users.modal_add_email_invalid": {
    tr: "Geçersiz email",
    en: "Invalid email",
  },
  "admin.users.modal_add_name_too_long": {
    tr: "Ad en fazla 100 karakter",
    en: "Name max 100 characters",
  },

  // -------------------------------------------------------------------------
  // Bulk Invite modal (Task 2)
  // -------------------------------------------------------------------------
  "admin.users.modal_bulk_title": {
    tr: "Toplu davet",
    en: "Bulk invite",
  },
  "admin.users.modal_bulk_format_hint": {
    tr: "CSV formatı: email,name,role (3 sütun; başlık satırı opsiyonel). Maksimum 500 satır.",
    en: "CSV format: email,name,role (3 columns; header row optional). Max 500 rows.",
  },
  "admin.users.modal_bulk_select_file": {
    tr: "CSV dosyası seç",
    en: "Select CSV file",
  },
  "admin.users.modal_bulk_preview_summary": {
    tr: "{V} geçerli / {I} hatalı / {T} toplam",
    en: "{V} valid / {I} invalid / {T} total",
  },
  "admin.users.modal_bulk_warning_500": {
    tr: "Maksimum 500 satır işlenebilir. CSV {N} satır içeriyor; ilk 500 satır işlenecek.",
    en: "Max 500 rows allowed. CSV has {N} rows; only the first 500 will be processed.",
  },
  "admin.users.modal_bulk_warning_cta": {
    tr: "İlk 500'ü İşle",
    en: "Process first 500",
  },
  "admin.users.modal_bulk_submit": {
    tr: "Davetleri gönder ({N})",
    en: "Send invites ({N})",
  },
  "admin.users.modal_bulk_submitting": {
    tr: "{N} davet gönderiliyor...",
    en: "Sending {N} invites...",
  },
  "admin.users.modal_bulk_summary_title": {
    tr: "Toplu davet sonucu",
    en: "Bulk invite result",
  },
  "admin.users.modal_bulk_summary_body": {
    tr: "{S} başarılı, {F} başarısız.",
    en: "{S} successful, {F} failed.",
  },
  "admin.users.modal_bulk_close": {
    tr: "Kapat",
    en: "Close",
  },
  "admin.users.modal_bulk_preview_valid": {
    tr: "Geçerli",
    en: "Valid",
  },
  "admin.users.modal_bulk_preview_invalid": {
    tr: "Hatalı",
    en: "Invalid",
  },
  "admin.users.modal_bulk_preview_more_rows": {
    tr: "+ {N} satır daha gizlendi",
    en: "+ {N} more rows hidden",
  },
  "admin.users.modal_bulk_csv_injection_error": {
    tr: "Güvenli olmayan karakterle başlayan satır (=,+,-,@) reddedildi",
    en: "Row starting with unsafe character (=,+,-,@) was rejected",
  },
  "admin.users.modal_bulk_too_many_toast": {
    tr: "Maksimum 500 satır",
    en: "Max 500 rows",
  },
} as const

export type AdminUsersI18nKey = keyof typeof ADMIN_USERS_I18N_KEYS

/**
 * Lookup helper — returns the localized string for a key.
 * Defensive fallback: if a key is missing in EN, falls back to TR; if missing
 * entirely returns the key itself so the bug is visible in the UI.
 */
export function adminUsersT(key: AdminUsersI18nKey, lang: "tr" | "en"): string {
  const entry = ADMIN_USERS_I18N_KEYS[key]
  if (!entry) return String(key)
  return entry[lang] || entry.tr || String(key)
}
