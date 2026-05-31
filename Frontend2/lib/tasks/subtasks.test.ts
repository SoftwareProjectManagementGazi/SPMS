import { describe, it, expect } from "vitest"
import { indexSubtasks, subtaskProgress, isTaskDone } from "./subtasks"
import type { Task } from "@/services/task-service"

function mk(id: number, over: Partial<Task> = {}): Task {
  return {
    id,
    key: `T-${id}`,
    title: `Task ${id}`,
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
    createdAt: "2026-01-01T00:00:00Z",
    ...over,
  } as Task
}

describe("indexSubtasks", () => {
  it("groups subtasks under their parentTaskId, in list order", () => {
    const tasks = [
      mk(1),
      mk(2, { parentTaskId: 1, type: "subtask" }),
      mk(3, { parentTaskId: 1, type: "subtask" }),
      mk(4),
    ]
    const { childrenByParent, byId } = indexSubtasks(tasks)
    expect(childrenByParent.get(1)?.map((t) => t.id)).toEqual([2, 3])
    // A task with no children has no entry (so getCanExpand stays false).
    expect(childrenByParent.has(4)).toBe(false)
    expect(byId.get(2)?.parentTaskId).toBe(1)
    expect(byId.size).toBe(4)
  })
})

describe("isTaskDone", () => {
  it("prefers the isDone flag, then falls back to status tokens", () => {
    // isDone flag wins even if the status string says otherwise.
    expect(isTaskDone(mk(1, { isDone: true, status: "todo" }))).toBe(true)
    expect(isTaskDone(mk(2, { status: "done" }))).toBe(true)
    expect(isTaskDone(mk(3, { status: "completed" }))).toBe(true)
    expect(isTaskDone(mk(4, { status: "closed" }))).toBe(true)
    expect(isTaskDone(mk(5, { status: "progress" }))).toBe(false)
    expect(isTaskDone(mk(6, { status: "todo" }))).toBe(false)
  })
})

describe("subtaskProgress", () => {
  it("counts done over total across direct children", () => {
    const children = [
      mk(2, { isDone: true }),
      mk(3, { status: "done" }),
      mk(4, { status: "todo" }),
    ]
    expect(subtaskProgress(children)).toEqual({ done: 2, total: 3 })
  })
  it("returns zeroes for empty/undefined", () => {
    expect(subtaskProgress([])).toEqual({ done: 0, total: 0 })
    expect(subtaskProgress(undefined)).toEqual({ done: 0, total: 0 })
  })
})
