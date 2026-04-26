// Phase 13 Plan 13-01 D-X1 — audit_log → semantic event mapper.
//
// THE single most-critical hidden contract in Phase 13 (RESEARCH §Pitfall 1).
// The prototype eventMeta(type) keys off a curated `type` like "create" /
// "status" / "assign" / "comment" / "delete" / "phase" — but the real
// audit_log table only has (entity_type, action, field_name) columns. This
// mapper bridges the two so the activity timeline renders icons + colors +
// labels correctly at runtime.
//
// `null` is a deliberate "drop silently" — unrecognized audit_log shapes do
// not appear in the timeline. This is safe because misclassification would
// only hide an unknown row, not leak data the viewer wasn't already
// authorized to see (T-13-01-09 accept).
//
// SemanticEventType union must stay in sync with CONTEXT D-B1's 10 types
// (6 prototype + 4 lifecycle) so the activity SegmentedControl filter chips
// resolve every value via `semanticToFilterChip`.

// Inline ActivityItem shape (NOT imported from @/services/activity-service)
// so the mapper stays standalone-testable and free of circular deps. Plan
// 13-04 keeps the canonical ActivityItem in activity-service.ts.
interface ActivityItem {
  entity_type?: string | null
  action: string
  field_name?: string | null
}

export type SemanticEventType =
  | "task_created"
  | "task_status_changed"
  | "task_assigned"
  | "comment_created"
  | "task_deleted"
  | "phase_transition"
  | "milestone_created"
  | "milestone_updated"
  | "artifact_status_changed"
  | "phase_report_created"

export type ActivityFilterChip = "create" | "status" | "assign" | "comment" | "lifecycle" | "all"

/**
 * Map a raw audit_log item into a semantic event type the prototype eventMeta
 * map understands. Returns `null` for unrecognized shapes so the caller can
 * filter them out of the rendered timeline.
 */
export function mapAuditToSemantic(item: ActivityItem): SemanticEventType | null {
  // Phase transitions never look at entity_type — the action alone is
  // unique. Check first so we don't shadow it with later rules.
  if (item.action === "phase_transition") return "phase_transition"

  // Task event family.
  if (item.entity_type === "task") {
    if (item.action === "created") return "task_created"
    if (item.action === "deleted") return "task_deleted"
    if (item.action === "updated") {
      if (item.field_name === "column_id") return "task_status_changed"
      if (item.field_name === "assignee_id") return "task_assigned"
    }
  }

  // Comment family.
  if (item.entity_type === "comment" && item.action === "created") {
    return "comment_created"
  }

  // Lifecycle entities (Phase 12).
  if (item.entity_type === "milestone") {
    if (item.action === "created") return "milestone_created"
    if (item.action === "updated") return "milestone_updated"
  }
  if (
    item.entity_type === "artifact" &&
    item.action === "updated" &&
    item.field_name === "status"
  ) {
    return "artifact_status_changed"
  }
  if (item.entity_type === "phase_report" && item.action === "created") {
    return "phase_report_created"
  }

  // Unrecognized — silently drop from timeline render.
  return null
}

/**
 * Map a semantic event type to its activity-tab SegmentedControl filter chip.
 * Lifecycle types fold into a single "lifecycle" chip per CONTEXT D-B1.
 */
export function semanticToFilterChip(t: SemanticEventType): ActivityFilterChip {
  if (t === "task_created") return "create"
  if (t === "task_status_changed") return "status"
  if (t === "task_assigned") return "assign"
  if (t === "comment_created") return "comment"
  if (
    t === "phase_transition" ||
    t === "milestone_created" ||
    t === "milestone_updated" ||
    t === "artifact_status_changed" ||
    t === "phase_report_created"
  ) {
    return "lifecycle"
  }
  // task_deleted (and any future additions) fall through — UI shows them
  // under "all" but they have no dedicated chip.
  return "all"
}
