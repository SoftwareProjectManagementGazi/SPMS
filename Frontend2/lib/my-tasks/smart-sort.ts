import type { Task } from "@/services/task-service"

// Priority-rank mapping mirrors the prototype algorithm
// (critical > high > medium > low) used for the default
// "smart" sort in MY_TASKS and the MyTasksExperience list.
const PRIORITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

/** Smart default sort: priority desc → due asc (nulls last) → title asc */
export function smartSort(a: Task, b: Task): number {
  const pa = PRIORITY_RANK[a.priority] ?? 0
  const pb = PRIORITY_RANK[b.priority] ?? 0
  if (pa !== pb) return pb - pa
  const da = a.due ? new Date(a.due).getTime() : Number.POSITIVE_INFINITY
  const db = b.due ? new Date(b.due).getTime() : Number.POSITIVE_INFINITY
  if (da !== db) return da - db
  return a.title.localeCompare(b.title)
}
