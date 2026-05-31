// Subtask helpers — the SPMS task model is ONE level deep: a task/bug may have
// subtasks (Task.type === "subtask") linked via parentTaskId; subtasks can't
// have their own subtasks. The API returns a FLAT task list, so the frontend
// derives the parent→child relationship here. Shared by the List tab (nested
// rows), Board (parent chip + progress badge), and Task Detail (progress bar).

import type { Task } from "@/services/task-service"

export interface SubtaskIndex {
  /** parentTaskId → its direct subtasks (in the order they appear in `tasks`). */
  childrenByParent: Map<number, Task[]>
  /** id → task, for resolving a subtask's parent. */
  byId: Map<number, Task>
}

export function indexSubtasks(tasks: Task[]): SubtaskIndex {
  const childrenByParent = new Map<number, Task[]>()
  const byId = new Map<number, Task>()
  for (const t of tasks) byId.set(t.id, t)
  for (const t of tasks) {
    if (t.parentTaskId != null) {
      const arr = childrenByParent.get(t.parentTaskId)
      if (arr) arr.push(t)
      else childrenByParent.set(t.parentTaskId, [t])
    }
  }
  return { childrenByParent, byId }
}

/** Canonical "is this task done?" — prefers the backend's order-index-based
 *  `isDone` flag, falling back to a status-token check for fixtures/older data. */
export function isTaskDone(t: Task): boolean {
  if (t.isDone === true) return true
  const s = String(t.status ?? "").toLowerCase()
  return s === "done" || s === "completed" || s === "closed"
}

/** done/total over a parent's direct subtasks (1-level model). */
export function subtaskProgress(children: Task[] | undefined): {
  done: number
  total: number
} {
  const list = children ?? []
  return { total: list.length, done: list.filter(isTaskDone).length }
}
