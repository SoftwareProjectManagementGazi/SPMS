// Pure due-date bucketing for MyTasksExperience views and group-by=due.
//
// Mirrors the prototype buckets (overdue / today / this_week / later) with an
// added "none" bucket for null due dates — previously the prototype dropped
// these into "later" which was a semantic lie (no due ≠ far away).

export type DueBucket = "overdue" | "today" | "this_week" | "later" | "none"

/**
 * Categorise a due date relative to `nowRef` (defaults to current Date).
 *
 * `iso` is the Task.due field from task-service (ISO-8601 string or null).
 * `nowRef` is injected in tests so category transitions are deterministic.
 */
export function dueBucket(iso: string | null, nowRef?: Date): DueBucket {
  if (!iso) return "none"
  const now = nowRef ?? new Date()
  // Start of "today" in the REFERENCE timezone — we intentionally use local
  // calendar fields (getFullYear/getMonth/getDate) so a due at 23:59 local
  // still counts as "today", not "overdue".
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  const due = new Date(iso).getTime()
  if (Number.isNaN(due)) return "none"
  if (due < todayStart) return "overdue"
  const oneDay = 86_400_000
  if (due < todayStart + oneDay) return "today"
  if (due < todayStart + 7 * oneDay) return "this_week"
  return "later"
}
