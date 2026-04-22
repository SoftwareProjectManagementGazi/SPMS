import { describe, it, expect } from "vitest"
import { smartSort } from "./smart-sort"
import type { Task } from "@/services/task-service"

// Tiny factory — unit-test only. Defaults mirror a minimally-valid Task
// ignoring fields the sort doesn't consult (status, assigneeId, projectId…).
function t(over: Partial<Task> = {}): Task {
  return {
    id: 0,
    key: "X-1",
    title: "A",
    description: "",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    reporterId: null,
    parentTaskId: null,
    projectId: 1,
    cycleId: null,
    phaseId: null,
    points: null,
    start: null,
    due: null,
    labels: [],
    watcherCount: 0,
    type: "task",
    createdAt: "2026-04-22T00:00:00Z",
    ...over,
  }
}

describe("smartSort", () => {
  it("higher priority comes first", () => {
    const list = [t({ priority: "low" }), t({ priority: "critical" }), t({ priority: "medium" })]
    list.sort(smartSort)
    expect(list[0].priority).toBe("critical")
    expect(list[1].priority).toBe("medium")
    expect(list[2].priority).toBe("low")
  })

  it("same priority → earlier due first", () => {
    const list = [
      t({ priority: "high", due: "2026-06-01", title: "B" }),
      t({ priority: "high", due: "2026-05-01", title: "A" }),
    ]
    list.sort(smartSort)
    expect(list[0].due).toBe("2026-05-01")
  })

  it("tasks without due date come last within same priority", () => {
    const list = [t({ priority: "high", due: null }), t({ priority: "high", due: "2026-05-01" })]
    list.sort(smartSort)
    expect(list[0].due).toBe("2026-05-01")
    expect(list[1].due).toBeNull()
  })

  it("tiebreak by title alpha", () => {
    const list = [t({ title: "Zeus" }), t({ title: "Aurora" })]
    list.sort(smartSort)
    expect(list[0].title).toBe("Aurora")
  })

  it("unknown priority sorts last (treated as 0)", () => {
    const list = [
      t({ priority: "low" }),
      // runtime-only bad value to guard against DTO drift — cast is deliberate
      t({ priority: "unknown" as unknown as Task["priority"] }),
    ]
    list.sort(smartSort)
    expect(list[0].priority).toBe("low")
  })
})
