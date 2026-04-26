// Phase 13 Plan 13-01 Task 2 — audit-event-mapper unit tests.
//
// 10-case coverage of the SemanticEventType union (CONTEXT D-B1) plus the
// silent-drop behavior for unrecognized shapes (T-13-01-09 mitigation).

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
    expect(
      mapAuditToSemantic({ entity_type: "task", action: "updated", field_name: "title" }),
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
})
