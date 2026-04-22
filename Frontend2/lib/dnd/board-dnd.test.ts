import { describe, it, expect } from "vitest"
import { handleBoardDragEnd } from "./board-dnd"

describe("handleBoardDragEnd — D-20 Warn+Allow authoritative", () => {
  it("no-op when source === target", () => {
    const r = handleBoardDragEnd({
      taskId: 1,
      sourceColumnId: "todo",
      targetColumnId: "todo",
      targetColumn: { id: "todo", wipLimit: 5, taskCount: 2 },
    })
    expect(r.moved).toBe(false)
    expect(r.wipExceeded).toBe(false)
  })

  it("moves when target different and WIP not exceeded", () => {
    const r = handleBoardDragEnd({
      taskId: 1,
      sourceColumnId: "todo",
      targetColumnId: "progress",
      targetColumn: { id: "progress", wipLimit: 5, taskCount: 2 },
    })
    expect(r.moved).toBe(true)
    expect(r.wipExceeded).toBe(false)
  })

  it("ALLOWS drop when WIP exceeded (Warn + Allow per D-20)", () => {
    const r = handleBoardDragEnd({
      taskId: 1,
      sourceColumnId: "todo",
      targetColumnId: "progress",
      targetColumn: { id: "progress", wipLimit: 3, taskCount: 3 },
    })
    expect(r.moved).toBe(true) // MOVED, not blocked
    expect(r.wipExceeded).toBe(true) // but flagged for UI warn
  })

  it("wipLimit=0 disables the check (unlimited)", () => {
    const r = handleBoardDragEnd({
      taskId: 1,
      sourceColumnId: "todo",
      targetColumnId: "progress",
      targetColumn: { id: "progress", wipLimit: 0, taskCount: 999 },
    })
    expect(r.moved).toBe(true)
    expect(r.wipExceeded).toBe(false)
  })

  it("null target column info → moves without a WIP check", () => {
    const r = handleBoardDragEnd({
      taskId: 1,
      sourceColumnId: "todo",
      targetColumnId: "progress",
      targetColumn: null,
    })
    expect(r.moved).toBe(true)
    expect(r.wipExceeded).toBe(false)
  })

  it("exactly-at-limit is NOT exceeded (boundary condition)", () => {
    // projectedCount = taskCount + 1 = 3, wipLimit = 3 → 3 > 3 is false
    const r = handleBoardDragEnd({
      taskId: 1,
      sourceColumnId: "todo",
      targetColumnId: "progress",
      targetColumn: { id: "progress", wipLimit: 3, taskCount: 2 },
    })
    expect(r.moved).toBe(true)
    expect(r.wipExceeded).toBe(false)
  })

  it("empty targetColumnId produces a no-op", () => {
    const r = handleBoardDragEnd({
      taskId: 1,
      sourceColumnId: "todo",
      targetColumnId: "",
      targetColumn: null,
    })
    expect(r.moved).toBe(false)
    expect(r.wipExceeded).toBe(false)
  })
})
