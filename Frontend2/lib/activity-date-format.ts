// Phase 13 Plan 13-01 Task 2 — date formatting helpers for activity surfaces.
//
// Two pure functions for the project + profile activity tabs:
// - formatActivityDate(timestamp, lang) → date-bucket label (Today/Yesterday/
//   This Week / exact date for >7 days; D-B5 improvement over prototype's
//   "Daha Eski" bucket).
// - formatRelativeTime(timestamp, lang) → relative (just now / 2m / 2h / 3d /
//   exact date) — LIFTED from Frontend2/components/dashboard/activity-feed.tsx
//   `formatTime` so a single source of truth feeds both the dashboard widget
//   and the new ActivityTab (Plan 13-04 will switch the dashboard import over).

/** Concrete year/month/day comparison without timezone surprises. */
function startOfDay(input: Date): Date {
  const d = new Date(input)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Date-bucket label per CONTEXT D-B5:
 * - Today      → "Bugün" / "Today"
 * - Yesterday  → "Dün" / "Yesterday"
 * - This Week  → "Bu Hafta" / "This Week"  (≤7 days ago, not Today/Yesterday)
 * - Older      → exact date e.g. "15 Nis 2026" / "Apr 15, 2026"
 */
export function formatActivityDate(
  timestamp: string | Date,
  language: "tr" | "en",
): string {
  const raw = new Date(timestamp)
  if (isNaN(raw.getTime())) return ""
  const d = startOfDay(raw)
  const now = startOfDay(new Date())
  const yesterday = new Date(now.getTime() - 86_400_000)
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000)
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  if (d.getTime() === now.getTime()) return T("Bugün", "Today")
  if (d.getTime() === yesterday.getTime()) return T("Dün", "Yesterday")
  if (d.getTime() > weekAgo.getTime()) return T("Bu Hafta", "This Week")

  return d.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/**
 * Relative-time label, LIFTED verbatim from
 * Frontend2/components/dashboard/activity-feed.tsx::formatTime so dashboard
 * + ActivityTab share one implementation.
 *
 * Thresholds + labels:
 * - <1 minute   → "az önce" / "just now"
 * - <60 minutes → "{N} dk" / "{N}m"
 * - <24 hours   → "{N} sa" / "{N}h"
 * - <7 days     → "{N} gün" / "{N}d"
 * - older       → exact short-month + day, e.g. "15 Nis" / "Apr 15"
 */
export function formatRelativeTime(
  timestamp: string | Date,
  language: "tr" | "en",
): string {
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ""

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  if (diffMs < 60_000) return T("az önce", "just now")
  if (diffMs < 3_600_000) {
    const m = Math.floor(diffMs / 60_000)
    return T(`${m} dk`, `${m}m`)
  }
  if (diffMs < 86_400_000) {
    const h = Math.floor(diffMs / 3_600_000)
    return T(`${h} sa`, `${h}h`)
  }
  if (diffMs < 7 * 86_400_000) {
    const d_ = Math.floor(diffMs / 86_400_000)
    return T(`${d_} gün`, `${d_}d`)
  }
  return d.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
  })
}
