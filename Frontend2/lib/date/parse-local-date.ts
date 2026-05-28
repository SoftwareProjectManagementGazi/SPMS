// parseLocalDate — parse a date(-time) string into a Date at LOCAL midnight of
// its calendar date.
//
// Why this exists: `new Date("2026-05-28")` parses a date-only ISO string as
// UTC midnight, so for users behind UTC (negative offset) it represents the
// previous local day. Comparing that against a locally-built "today" shifts due
// buckets, calendar highlights, and chart axes by a day. This helper takes the
// calendar-date portion (YYYY-MM-DD) — whether the input is date-only,
// "...T00:00:00", or has a Z/offset — and rebuilds it at local midnight, which
// is the correct frame for date-only (due-date) semantics.

export function parseLocalDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) {
    const fallback = new Date(iso)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const d = new Date(year, month - 1, day)
  return Number.isNaN(d.getTime()) ? null : d
}

// startOfToday — local midnight for the current day, the correct reference for
// comparing against parseLocalDate() results.
export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}
