import { describe, it, expect } from "vitest"
import { resolveBacklogFilter, resolveCycleLabel, isCycleFieldEnabled } from "./methodology-matrix"

describe("resolveBacklogFilter", () => {
  // Backlog filters map to backend list params: cycle_null -> no_sprint, and
  // every methodology also excludes done tasks (exclude_done). The K4 board-drop
  // fix relies on the Scrum `no_sprint: true` shape. Contract was updated in
  // commit aad6f0d9 from the legacy cycle_id/phase_id params these assertions
  // previously expected.
  it("Scrum default -> no_sprint + exclude_done", () => {
    expect(resolveBacklogFilter({ methodology: "SCRUM", processConfig: {} })).toEqual({
      no_sprint: true,
      exclude_done: true,
    })
  })
  it("Kanban default -> leftmost column + exclude_done", () => {
    expect(
      resolveBacklogFilter({
        methodology: "KANBAN",
        columns: ["backlog", "todo", "done"],
        processConfig: {},
      })
    ).toEqual({ status: "backlog", exclude_done: true })
  })
  it("Kanban without columns -> status=backlog fallback + exclude_done", () => {
    expect(resolveBacklogFilter({ methodology: "KANBAN", processConfig: {} })).toEqual({
      status: "backlog",
      exclude_done: true,
    })
  })
  it("Waterfall default -> exclude_done (phase_id=null omitted by axios)", () => {
    expect(resolveBacklogFilter({ methodology: "WATERFALL", processConfig: {} })).toEqual({
      exclude_done: true,
    })
  })
  it("custom override -> in_backlog + exclude_done", () => {
    expect(
      resolveBacklogFilter({
        methodology: "SCRUM",
        processConfig: { backlog_definition: "custom" },
      })
    ).toEqual({ in_backlog: true, exclude_done: true })
  })
  it("process_config null is tolerated", () => {
    expect(resolveBacklogFilter({ methodology: "SCRUM", processConfig: null })).toEqual({
      no_sprint: true,
      exclude_done: true,
    })
  })
})

describe("resolveCycleLabel", () => {
  it("Scrum default Turkish = Sprint", () => {
    expect(resolveCycleLabel({ methodology: "SCRUM", processConfig: {} }, "tr")).toBe("Sprint")
  })
  it("Scrum default English = Sprint", () => {
    expect(resolveCycleLabel({ methodology: "SCRUM", processConfig: {} }, "en")).toBe("Sprint")
  })
  it("Kanban = null (hidden)", () => {
    expect(resolveCycleLabel({ methodology: "KANBAN", processConfig: {} }, "tr")).toBeNull()
  })
  it("user override wins over methodology default", () => {
    expect(
      resolveCycleLabel({ methodology: "SCRUM", processConfig: { cycle_label: "Özel" } }, "tr")
    ).toBe("Özel")
  })
  it("empty-string override falls through to methodology default", () => {
    expect(
      resolveCycleLabel({ methodology: "SCRUM", processConfig: { cycle_label: "  " } }, "tr")
    ).toBe("Sprint")
  })
  it("Iterative Turkish = İterasyon", () => {
    expect(resolveCycleLabel({ methodology: "ITERATIVE", processConfig: {} }, "tr")).toBe(
      "İterasyon"
    )
  })
  it("Waterfall Turkish = Faz", () => {
    expect(resolveCycleLabel({ methodology: "WATERFALL", processConfig: {} }, "tr")).toBe("Faz")
  })
})

describe("isCycleFieldEnabled", () => {
  it("Scrum enabled", () => {
    expect(isCycleFieldEnabled("SCRUM")).toBe(true)
  })
  it("Kanban disabled (hidden)", () => {
    expect(isCycleFieldEnabled("KANBAN")).toBe(false)
  })
  it("Iterative disabled (Phase 11 scope limit)", () => {
    expect(isCycleFieldEnabled("ITERATIVE")).toBe(false)
  })
  it("unknown methodology returns false", () => {
    expect(isCycleFieldEnabled("FANTASY_METHOD")).toBe(false)
  })
})
