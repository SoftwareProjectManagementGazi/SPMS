// Pure audit-log localization helper (Phase 11 Plan 09).
//
// Per RESEARCH §Audit Log Shape: the backend returns raw rows with DB column
// names in `field_name` and stringified snake_case values in old_value /
// new_value. The UI must translate BOTH the field label and the value using
// per-project maps (column map, phase map) and the user cache, then emit a
// single sentence localized in tr or en.
//
// This module has ZERO React imports so it stays unit-testable in vitest
// without jsdom. The React consumers live in
// Frontend2/components/task-detail/history-section.tsx.

export interface AuditEntry {
  field_name?: string
  old_value?: string | null
  new_value?: string | null
  user_id: number
  /** Denormalized actor name from the backend's users JOIN (audit_repo
   *  get_by_entity). Preferred over the per-project `users` map so actors who
   *  aren't in the (manager-only) member pool still resolve to a real name
   *  instead of the "Bilinmeyen kullanıcı" placeholder. */
  user_name?: string | null
  /** Denormalized actor avatar URL from the same JOIN. */
  user_avatar?: string | null
  action: "created" | "updated" | "deleted" | string
  timestamp: string
}

export interface UserLite {
  id: number
  name: string
  /** Optional resolved avatar URL — consumers (e.g. HistorySection) plumb it
   *  through to the Avatar primitive. Backwards-compatible default: null. */
  avatarUrl?: string | null
}

export interface FormatContext {
  users: Map<number, UserLite>
  columnMap?: Record<string, string> // status code -> display name
  phaseMap?: Record<string, string> // phase_id -> name
}

const FIELD_LABELS_TR: Record<string, string> = {
  status: "durumu",
  assignee_id: "atananı",
  reporter_id: "bildireni",
  priority: "önceliği",
  points: "puanı",
  due: "bitiş tarihini",
  start: "başlangıç tarihini",
  cycle_id: "döngüsünü",
  phase_id: "fazını",
  title: "başlığı",
  description: "açıklamayı",
}

const FIELD_LABELS_EN: Record<string, string> = {
  status: "status",
  assignee_id: "assignee",
  reporter_id: "reporter",
  priority: "priority",
  points: "points",
  due: "due date",
  start: "start date",
  cycle_id: "cycle",
  phase_id: "phase",
  title: "title",
  description: "description",
}

// Strip HTML markup and collapse to a short single-line preview. Used for free-
// text fields (title, description) whose values may be rich-editor HTML and/or
// very long. This is a DISPLAY concern only — the full value stays in the audit
// log; the history row just shows a truncated, tag-free excerpt. Not a security
// boundary: history-section renders the result as an escaped React text child,
// so a plain regex strip (no DOMPurify dependency, keeps this module pure) is
// sufficient.
const MAX_VALUE_LEN = 60
function stripTagsAndTruncate(s: string, max = MAX_VALUE_LEN): string {
  const text = s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

function resolveValue(
  field: string | undefined,
  v: string | null | undefined,
  ctx: FormatContext,
): string {
  if (v == null || v === "") return "—"
  if (field === "status" && ctx.columnMap) return ctx.columnMap[v] ?? v
  if (field === "phase_id" && ctx.phaseMap) return ctx.phaseMap[v] ?? v
  if (field === "assignee_id" || field === "reporter_id") {
    const id = Number(v)
    if (!Number.isNaN(id)) {
      return ctx.users.get(id)?.name ?? `#${id}`
    }
    return String(v)
  }
  // Free-text fields (title, description, …): strip any rich-editor HTML and
  // truncate so the log row stays compact and never shows raw "<strong>" tags.
  return stripTagsAndTruncate(String(v))
}

/**
 * formatAuditEntry — translate a raw audit row into a single human-readable
 * sentence. Works for created / updated / deleted actions. Falls back to the
 * raw field name when no localization key is known.
 */
export function formatAuditEntry(
  entry: AuditEntry,
  lang: "tr" | "en",
  ctx: FormatContext,
): string {
  // Prefer the backend's denormalized actor name, then the per-project user
  // map, then the localized placeholder. Trim guards against empty strings
  // ("" should fall through to the map rather than render a blank actor).
  const embeddedName = entry.user_name?.trim()
  const actor =
    (embeddedName ? embeddedName : undefined) ??
    ctx.users.get(entry.user_id)?.name ??
    (lang === "tr" ? "Bilinmeyen kullanıcı" : "Unknown user")
  const labels = lang === "tr" ? FIELD_LABELS_TR : FIELD_LABELS_EN

  if (entry.action === "created") {
    return lang === "tr"
      ? `${actor} görevi oluşturdu`
      : `${actor} created the task`
  }
  if (entry.action === "deleted") {
    return lang === "tr"
      ? `${actor} görevi sildi`
      : `${actor} deleted the task`
  }

  // updated (default for any other action string too — safer than throwing)
  const fieldLabel = entry.field_name
    ? (labels[entry.field_name] ?? entry.field_name)
    : lang === "tr"
      ? "bir alanı"
      : "a field"
  const oldV = resolveValue(entry.field_name, entry.old_value, ctx)
  const newV = resolveValue(entry.field_name, entry.new_value, ctx)
  return lang === "tr"
    ? `${actor} ${fieldLabel} '${oldV}' → '${newV}' olarak değiştirdi`
    : `${actor} changed ${fieldLabel} from '${oldV}' to '${newV}'`
}

/**
 * relativeTime — Turkish/English relative-time formatter. Returns absolute
 * date when the delta is >=30 days (avoids "120 gün önce" which reads poorly).
 */
export function relativeTime(iso: string, lang: "tr" | "en"): string {
  const delta = Date.now() - new Date(iso).getTime()
  const m = Math.floor(delta / 60000)
  if (m < 1) return lang === "tr" ? "az önce" : "just now"
  if (m < 60) return lang === "tr" ? `${m} dk önce` : `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return lang === "tr" ? `${h} sa önce` : `${h} h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return lang === "tr" ? `${d} gün önce` : `${d} d ago`
  return new Date(iso).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")
}
