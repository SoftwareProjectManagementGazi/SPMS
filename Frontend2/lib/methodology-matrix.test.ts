import { describe, it, expect } from "vitest"
import { resolveBacklogFilter, resolveCycleLabel, isCycleFieldEnabled } from "./methodology-matrix"

describe("resolveBacklogFilter", () => {
  it("Scrum default -> cycle_id=null", () => {
    expect(resolveBacklogFilter({ methodology: "SCRUM", processConfig: {} })).toEqual({
      cycle_id: null,
    })
  })
  it("Kanban default -> status=leftmost column", () => {
    expect(
      resolveBacklogFilter({
        methodology: "KANBAN",
        columns: ["backlog", "todo", "done"],
        processConfig: {},
      })
    ).toEqual({ status: "backlog" })
  })
  it("Kanban without columns -> status=backlog fallback", () => {
    expect(resolveBacklogFilter({ methodology: "KANBAN", processConfig: {} })).toEqual({
      status: "backlog",
    })
  })
  it("Waterfall default -> phase_id=null", () => {
    expect(resolveBacklogFilter({ methodology: "WATERFALL", processConfig: {} })).toEqual({
      phase_id: null,
    })
  })
  it("custom override -> in_backlog=true", () => {
    expect(
      resolveBacklogFilter({
        methodology: "SCRUM",
        processConfig: { backlog_definition: "custom" },
      })
    ).toEqual({ in_backlog: true })
  })
  it("process_config null is tolerated", () => {
    expect(resolveBacklogFilter({ methodology: "SCRUM", processConfig: null })).toEqual({
      cycle_id: null,
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
