// Phase 13 Plan 13-04 Task 1 — groupByDate(events, language).
//
// Pure function: takes an ActivityItem[] and returns a DateGroup[] where each
// group's `label` is produced by formatActivityDate (Today / Yesterday /
// This Week / exact-date for events older than 7 days — D-B5).
//
// Order contract:
//   - Events are sorted reverse-chronological (most recent first) BEFORE
//     grouping, so the resulting groups list naturally arrives most-recent
//     first (Map iteration preserves insertion order).
//   - Within each group, events keep their reverse-chronological order from
//     the sort — most recent event in a group renders first.
//
// Items with no/invalid timestamp fall under a localized "Bilinmeyen" /
// "Unknown" bucket so they remain visible instead of silently dropped.

import type { ActivityItem } from "@/services/activity-service"
import { formatActivityDate } from "@/lib/activity-date-format"

export interface DateGroup {
  /** "Bugün" / "Dün" / "Bu Hafta" / exact-date string. */
  label: string
  events: ActivityItem[]
}

export function groupByDate(
  events: ActivityItem[],
  language: "tr" | "en",
): DateGroup[] {
  // Reverse-chronological sort first; missing timestamps sort to the end.
  const sorted = [...events].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return tb - ta
  })

  const map = new Map<string, ActivityItem[]>()
  for (const ev of sorted) {
    const label = ev.timestamp
      ? formatActivityDate(ev.timestamp, language)
      : language === "tr"
        ? "Bilinmeyen"
        : "Unknown"
    const existing = map.get(label)
    if (existing) {
      existing.push(ev)
    } else {
      map.set(label, [ev])
    }
  }

  return Array.from(map, ([label, events]) => ({ label, events }))
}
