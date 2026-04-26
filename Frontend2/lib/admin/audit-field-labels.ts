// Phase 14 Plan 14-01 — Audit field-name → human-readable label localization (D-D4).
//
// TR/EN dict consumed by activity-row.tsx field-change render branch
// (Plan 14-10). Backend ships `extra_metadata.field_name` as snake_case
// (Pitfall 2) — DO NOT camelCase the metadata; just localize the field name
// for display.
//
// OCP — extend the FIELD_LABELS map without touching activity-row.tsx renderer.

export type AuditLang = "tr" | "en"

interface FieldLabel {
  tr: string
  en: string
}

// Keys mirror the snake_case field names used by audit_log entries
// (task_repo / project_repo / comment use cases / milestone / artifact /
// phase_report / user lifecycle).
const FIELD_LABELS: Record<string, FieldLabel> = {
  // --- Task fields (Plan 14-09 task_repo enrichment) ---
  due_date: { tr: "son tarih", en: "due date" },
  priority: { tr: "öncelik", en: "priority" },
  story_points: { tr: "story point", en: "story points" },
  description: { tr: "açıklama", en: "description" },
  title: { tr: "başlık", en: "title" },
  assignee_id: { tr: "atanan", en: "assignee" },
  column_id: { tr: "sütun", en: "column" },
  sprint_id: { tr: "sprint", en: "sprint" },
  parent_id: { tr: "ana görev", en: "parent task" },
  label_ids: { tr: "etiketler", en: "labels" },
  watcher_ids: { tr: "izleyenler", en: "watchers" },
  estimate: { tr: "tahmin", en: "estimate" },
  // --- Project fields (Plan 14-09 project_repo enrichment) ---
  status: { tr: "durum", en: "status" },
  methodology: { tr: "metodoloji", en: "methodology" },
  // --- Generic / user lifecycle ---
  type: { tr: "tip", en: "type" },
  target_role: { tr: "hedef rol", en: "target role" },
  source_role: { tr: "önceki rol", en: "previous role" },
}

/**
 * Resolve a field name to a localized display label.
 *
 * Falls back to the raw field name when no label is registered — graceful
 * degradation for backward compat with old audit_log rows (D-D6) and forward
 * compat with new fields added in later phases without label updates.
 */
export function getFieldLabel(name: string, lang: AuditLang): string {
  const entry = FIELD_LABELS[name]
  if (!entry) return name
  return lang === "tr" ? entry.tr : entry.en
}
