// Pure due-date bucketing for MyTasksExperience views and group-by=due.
//
// Mirrors the prototype buckets (overdue / today / this_week / later) with an
// added "none" bucket for null due dates — previously the prototype dropped
// these into "later" which was a semantic lie (no due ≠ far away).

import { parseLocalDate } from "@/lib/date/parse-local-date"

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
  // Parse the due date in the LOCAL frame so a date-only string ("YYYY-MM-DD",
  // parsed as UTC by `new Date`) isn't compared against the locally-built
  // todayStart — that mismatch pushed "today" tasks into "overdue" for users
  // behind UTC.
  const dueDate = parseLocalDate(iso)
  if (!dueDate) return "none"
  const due = dueDate.getTime()
  if (due < todayStart) return "overdue"
  const oneDay = 86_400_000
  if (due < todayStart + oneDay) return "today"
  if (due < todayStart + 7 * oneDay) return "this_week"
  return "later"
}
