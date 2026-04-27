// Phase 13 Plan 13-01 Task 2 — audit-event-mapper unit tests.
// Phase 14 Plan 14-10 Task 1 — extended with 13 NEW SemanticEventType cases
// + cross-phase regression for Pitfall 1 + chip routing for Pitfall 9.
//
// 10-case coverage of the original SemanticEventType union (CONTEXT D-B1)
// PLUS 13 new Phase 14 mappings (D-D3) PLUS the silent-drop behavior for
// unrecognized shapes (T-13-01-09 mitigation).

import { describe, it, expect } from "vitest"
import { mapAuditToSemantic, semanticToFilterChip } from "./audit-event-mapper"

describe("mapAuditToSemantic", () => {
  it("Test 1: maps task updated column_id → task_status_changed", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "updated", field_name: "column_id",
      }),
    ).toBe("task_status_changed")
  })

  it("Test 2: maps task updated assignee_id → task_assigned", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "updated", field_name: "assignee_id",
      }),
    ).toBe("task_assigned")
  })

  it("Test 3: maps task created → task_created", () => {
    expect(
      mapAuditToSemantic({ entity_type: "task", action: "created" }),
    ).toBe("task_created")
  })

  it("Test 3b: maps task deleted → task_deleted", () => {
    expect(
      mapAuditToSemantic({ entity_type: "task", action: "deleted" }),
    ).toBe("task_deleted")
  })

  it("Test 4: maps phase_transition action regardless of entity_type", () => {
    expect(
      mapAuditToSemantic({ entity_type: "project", action: "phase_transition" }),
    ).toBe("phase_transition")
    expect(
      mapAuditToSemantic({ entity_type: "task", action: "phase_transition" }),
    ).toBe("phase_transition")
  })

  it("Test 5: maps comment created → comment_created", () => {
    expect(
      mapAuditToSemantic({ entity_type: "comment", action: "created" }),
    ).toBe("comment_created")
  })

  it("Test 6: maps milestone created → milestone_created and updated → milestone_updated", () => {
    expect(
      mapAuditToSemantic({ entity_type: "milestone", action: "created" }),
    ).toBe("milestone_created")
    expect(
      mapAuditToSemantic({ entity_type: "milestone", action: "updated" }),
    ).toBe("milestone_updated")
  })

  it("Test 7: maps artifact updated status → artifact_status_changed", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "artifact", action: "updated", field_name: "status",
      }),
    ).toBe("artifact_status_changed")
  })

  it("Test 7b: artifact updated NON-status field returns null (not a recognized semantic event)", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "artifact", action: "updated", field_name: "version",
      }),
    ).toBeNull()
  })

  it("Test 8: maps phase_report created → phase_report_created", () => {
    expect(
      mapAuditToSemantic({ entity_type: "phase_report", action: "created" }),
    ).toBe("phase_report_created")
  })

  it("Test 9: returns null for unrecognized shapes (silent drop)", () => {
    expect(
      mapAuditToSemantic({ entity_type: "foo", action: "bar" }),
    ).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Phase 14 Plan 14-10 — 13 new SemanticEventType mappings (D-D3).
  // -------------------------------------------------------------------------

  it("P14-T1: task updated NON-status NON-assign field → task_field_updated (NEW catch-all)", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "updated", field_name: "title",
      }),
    ).toBe("task_field_updated")
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "updated", field_name: "due_date",
      }),
    ).toBe("task_field_updated")
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "updated", field_name: "priority",
      }),
    ).toBe("task_field_updated")
  })

  it("P14-T2: project archived → project_archived", () => {
    expect(
      mapAuditToSemantic({ entity_type: "project", action: "archived" }),
    ).toBe("project_archived")
  })

  it("P14-T3: project updated status → project_status_changed", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "project", action: "updated", field_name: "status",
      }),
    ).toBe("project_status_changed")
  })

  it("P14-T4: comment updated → comment_edited", () => {
    expect(
      mapAuditToSemantic({ entity_type: "comment", action: "updated" }),
    ).toBe("comment_edited")
  })

  it("P14-T5: comment deleted → comment_deleted", () => {
    expect(
      mapAuditToSemantic({ entity_type: "comment", action: "deleted" }),
    ).toBe("comment_deleted")
  })

  it("P14-T6: user invited → user_invited", () => {
    expect(
      mapAuditToSemantic({ entity_type: "user", action: "invited" }),
    ).toBe("user_invited")
  })

  it("P14-T7: user deactivated → user_deactivated", () => {
    expect(
      mapAuditToSemantic({ entity_type: "user", action: "deactivated" }),
    ).toBe("user_deactivated")
  })

  it("P14-T8: user activated → user_activated", () => {
    expect(
      mapAuditToSemantic({ entity_type: "user", action: "activated" }),
    ).toBe("user_activated")
  })

  it("P14-T9: user role_changed → user_role_changed", () => {
    expect(
      mapAuditToSemantic({ entity_type: "user", action: "role_changed" }),
    ).toBe("user_role_changed")
  })

  it("P14-T10: user password_reset_requested → user_password_reset_requested", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "user", action: "password_reset_requested",
      }),
    ).toBe("user_password_reset_requested")
  })

  it("P14-T11: project_join_request created → project_join_request_created", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "project_join_request", action: "created",
      }),
    ).toBe("project_join_request_created")
  })

  it("P14-T12: project_join_request approved → project_join_request_approved", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "project_join_request", action: "approved",
      }),
    ).toBe("project_join_request_approved")
  })

  it("P14-T13: project_join_request rejected → project_join_request_rejected", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "project_join_request", action: "rejected",
      }),
    ).toBe("project_join_request_rejected")
  })

  // -------------------------------------------------------------------------
  // Cross-phase regression — Pitfall 1 mitigation.
  // The new task_field_updated catch-all MUST NOT shadow task_status_changed
  // or task_assigned. Phase 13 ActivityTab depends on these resolutions.
  // -------------------------------------------------------------------------

  it("Pitfall 1 regression: task updated column_id still maps to task_status_changed (NOT task_field_updated)", () => {
    // Same shape Phase 13 has shipped against; Plan 14-10 must not shadow it.
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "updated", field_name: "column_id",
      }),
    ).toBe("task_status_changed")
  })

  it("Pitfall 1 regression: task updated assignee_id still maps to task_assigned (NOT task_field_updated)", () => {
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "updated", field_name: "assignee_id",
      }),
    ).toBe("task_assigned")
  })

  it("Pitfall 1 regression: phase_transition still maps regardless of entity_type", () => {
    // The phase_transition branch must remain FIRST so unrelated entity_type
    // values don't divert it.
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "phase_transition",
      }),
    ).toBe("phase_transition")
  })

  it("Pitfall 1 regression: task updated empty/null field_name still returns null (not task_field_updated)", () => {
    // The catch-all guards against `f != null && f !== ""` — empty/null
    // field_name should not promote a meaningless update event.
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "updated", field_name: null,
      }),
    ).toBeNull()
    expect(
      mapAuditToSemantic({
        entity_type: "task", action: "updated", field_name: "",
      }),
    ).toBeNull()
  })
})

describe("semanticToFilterChip", () => {
  it("Test 10: lifecycle types all collapse to the lifecycle chip", () => {
    expect(semanticToFilterChip("phase_transition")).toBe("lifecycle")
    expect(semanticToFilterChip("milestone_created")).toBe("lifecycle")
    expect(semanticToFilterChip("milestone_updated")).toBe("lifecycle")
    expect(semanticToFilterChip("artifact_status_changed")).toBe("lifecycle")
    expect(semanticToFilterChip("phase_report_created")).toBe("lifecycle")
  })

  it("maps task_created → create", () => {
    expect(semanticToFilterChip("task_created")).toBe("create")
  })

  it("maps task_status_changed → status", () => {
    expect(semanticToFilterChip("task_status_changed")).toBe("status")
  })

  it("maps task_assigned → assign", () => {
    expect(semanticToFilterChip("task_assigned")).toBe("assign")
  })

  it("maps comment_created → comment", () => {
    expect(semanticToFilterChip("comment_created")).toBe("comment")
  })

  it("maps task_deleted → all (no dedicated chip per CONTEXT D-B1)", () => {
    expect(semanticToFilterChip("task_deleted")).toBe("all")
  })

  // -------------------------------------------------------------------------
  // Phase 14 Plan 14-10 — Pitfall 9 mitigation. Every NEW SemanticEventType
  // must have a chip mapping. 10 of 13 fold into the new "admin" chip;
  // 3 of 13 fold into the existing "status" chip.
  // -------------------------------------------------------------------------

  it("Pitfall 9: user_* lifecycle types fold into the admin chip", () => {
    expect(semanticToFilterChip("user_invited")).toBe("admin")
    expect(semanticToFilterChip("user_deactivated")).toBe("admin")
    expect(semanticToFilterChip("user_activated")).toBe("admin")
    expect(semanticToFilterChip("user_role_changed")).toBe("admin")
    expect(semanticToFilterChip("user_password_reset_requested")).toBe("admin")
  })

  it("Pitfall 9: project_join_request_* types fold into the admin chip", () => {
    expect(semanticToFilterChip("project_join_request_created")).toBe("admin")
    expect(semanticToFilterChip("project_join_request_approved")).toBe("admin")
    expect(semanticToFilterChip("project_join_request_rejected")).toBe("admin")
  })

  it("Pitfall 9: comment_edited / comment_deleted fold into the admin chip", () => {
    expect(semanticToFilterChip("comment_edited")).toBe("admin")
    expect(semanticToFilterChip("comment_deleted")).toBe("admin")
  })

  it("Pitfall 9: task_field_updated folds into the status chip", () => {
    expect(semanticToFilterChip("task_field_updated")).toBe("status")
  })

  it("Pitfall 9: project_status_changed folds into the status chip", () => {
    expect(semanticToFilterChip("project_status_changed")).toBe("status")
  })

  it("Pitfall 9: project_archived folds into the status chip", () => {
    expect(semanticToFilterChip("project_archived")).toBe("status")
  })
})
