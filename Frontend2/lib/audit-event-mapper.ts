// Phase 13 Plan 13-01 D-X1 — audit_log → semantic event mapper.
// Phase 14 Plan 14-10 D-D3 — extended with 13 NEW SemanticEventType members
// and a new "admin" filter chip per Pitfall 9 mitigation.
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
// SemanticEventType union must stay in sync with CONTEXT D-B1 (10 original
// types) + CONTEXT D-D3 (13 new Phase 14 types) so the activity
// SegmentedControl filter chips resolve every value via `semanticToFilterChip`.

// Inline ActivityItem shape (NOT imported from @/services/activity-service)
// so the mapper stays standalone-testable and free of circular deps. Plan
// 13-04 keeps the canonical ActivityItem in activity-service.ts.
interface ActivityItem {
  entity_type?: string | null
  action: string
  field_name?: string | null
}

export type SemanticEventType =
  // Existing 10 (Phase 13 D-B1)
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
  // NEW Phase 14 (D-D3) — 13 additions
  | "task_field_updated"
  | "project_archived"
  | "project_status_changed"
  | "comment_edited"
  | "comment_deleted"
  | "user_invited"
  | "user_deactivated"
  | "user_activated"
  | "user_role_changed"
  | "user_password_reset_requested"
  | "project_join_request_created"
  | "project_join_request_approved"
  | "project_join_request_rejected"

export type ActivityFilterChip =
  | "create"
  | "status"
  | "assign"
  | "comment"
  | "lifecycle"
  | "admin"
  | "all"

/**
 * Map a raw audit_log item into a semantic event type the prototype eventMeta
 * map understands. Returns `null` for unrecognized shapes so the caller can
 * filter them out of the rendered timeline.
 *
 * Order-dependent — phase_transition is checked first; new Phase 14 branches
 * are added AFTER the existing Phase 13 branches per Pitfall 1 (do not
 * shadow column_id / assignee_id which are claimed by task_status_changed
 * and task_assigned respectively).
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
      const f = item.field_name
      if (f === "column_id") return "task_status_changed"
      if (f === "assignee_id") return "task_assigned"
      // NEW Phase 14 (D-D3) — catch-all for non-status, non-assign field
      // changes (title, due_date, priority, story_points, description, …).
      // Empty/null field_name still returns null — a meaningless update
      // event should not promote into a render row.
      if (f != null && f !== "") return "task_field_updated"
    }
  }

  // Comment family.
  if (item.entity_type === "comment") {
    if (item.action === "created") return "comment_created"
    // NEW Phase 14.
    if (item.action === "updated") return "comment_edited"
    if (item.action === "deleted") return "comment_deleted"
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

  // NEW Phase 14 — project lifecycle (D-D3).
  if (item.entity_type === "project") {
    if (item.action === "archived") return "project_archived"
    if (item.action === "updated" && item.field_name === "status") {
      return "project_status_changed"
    }
  }

  // NEW Phase 14 — user admin lifecycle (D-D3).
  if (item.entity_type === "user") {
    if (item.action === "invited") return "user_invited"
    if (item.action === "deactivated") return "user_deactivated"
    if (item.action === "activated") return "user_activated"
    if (item.action === "role_changed") return "user_role_changed"
    if (item.action === "password_reset_requested") {
      return "user_password_reset_requested"
    }
  }

  // NEW Phase 14 — project join request lifecycle (D-D3).
  if (item.entity_type === "project_join_request") {
    if (item.action === "created") return "project_join_request_created"
    if (item.action === "approved") return "project_join_request_approved"
    if (item.action === "rejected") return "project_join_request_rejected"
  }

  // Unrecognized — silently drop from timeline render.
  return null
}

/**
 * Map a semantic event type to its activity-tab SegmentedControl filter chip.
 *
 * Lifecycle types fold into a single "lifecycle" chip per CONTEXT D-B1.
 * Phase 14 admin-side events (user_*, project_join_request_*, comment edit /
 * delete) fold into a NEW "admin" chip per CONTEXT D-D3 + Pitfall 9 mitigation
 * (RESEARCH lines 945-953). Field-change-style events
 * (task_field_updated, project_archived, project_status_changed) fold into
 * the existing "status" chip — they're all "what changed?" affordances.
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

  // NEW Phase 14 — admin chip catches user_*, project_join_request_*,
  // comment_edited / comment_deleted (10 of 13 new types).
  if (
    t === "user_invited" ||
    t === "user_deactivated" ||
    t === "user_activated" ||
    t === "user_role_changed" ||
    t === "user_password_reset_requested" ||
    t === "project_join_request_created" ||
    t === "project_join_request_approved" ||
    t === "project_join_request_rejected" ||
    t === "comment_edited" ||
    t === "comment_deleted"
  ) {
    return "admin"
  }

  // NEW Phase 14 — status chip catches the 3 "what changed?" types.
  if (
    t === "task_field_updated" ||
    t === "project_status_changed" ||
    t === "project_archived"
  ) {
    return "status"
  }

  // task_deleted (and any future additions) fall through — UI shows them
  // under "all" but they have no dedicated chip.
  return "all"
}
