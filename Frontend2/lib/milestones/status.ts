// Milestone display-status derivation — single source of truth shared by the
// lifecycle MilestonesSubtab list AND the project-detail TimelineTab Gantt
// popover, so both surfaces show the SAME status for a given milestone.
//
// Before extraction TimelineTab rendered the RAW stored enum (e.g. "PLANNED")
// while MilestonesSubtab showed the date-derived effective status (e.g.
// "Gecikmeli" for an overdue milestone) — a visible divergence. These pure
// functions were lifted verbatim from components/lifecycle/milestones-subtab.tsx;
// the names are preserved so the subtab's call sites stay unchanged.

export type MilestoneTone = "neutral" | "info" | "success" | "warning"

// Derive the effective display status from stored status + start/target dates.
// If stored status is PENDING but start_date is today or in the past →
// treat as IN_PROGRESS for display purposes only (not persisted).
export function effectiveStatus(
  status: string,
  startDate?: string | null,
  targetDate?: string,
): string {
  const s = (status ?? "").toUpperCase()
  // Manuel tamamlandı/gecikmeli → değiştirme
  if (s === "COMPLETED" || s === "DONE") return s
  const today = new Date().setHours(0, 0, 0, 0)
  // Bitiş tarihi geçtiyse ve tamamlanmadıysa → Gecikmeli
  if (targetDate) {
    const end = new Date(targetDate).setHours(0, 0, 0, 0)
    if (today > end) return "DELAYED"
  }
  // PENDING ise başlangıç tarihine bak
  if (s === "PENDING") {
    if (!startDate) return "IN_PROGRESS"
    const start = new Date(startDate).setHours(0, 0, 0, 0)
    return start <= today ? "IN_PROGRESS" : "PENDING"
  }
  return s
}

export function statusTone(
  status: string,
  startDate?: string | null,
  targetDate?: string,
): MilestoneTone {
  const s = effectiveStatus(status, startDate, targetDate)
  if (s === "COMPLETED" || s === "DONE") return "success"
  if (s === "IN_PROGRESS" || s === "ACTIVE") return "info"
  if (s === "DELAYED") return "warning"
  return "neutral"
}

export function statusLabel(
  status: string,
  startDate: string | null | undefined,
  targetDate: string | undefined,
  tr: boolean,
): string {
  const s = effectiveStatus(status, startDate, targetDate)
  if (s === "COMPLETED" || s === "DONE") return tr ? "Tamamlandı" : "Done"
  if (s === "IN_PROGRESS" || s === "ACTIVE")
    return tr ? "Devam Ediyor" : "In Progress"
  if (s === "DELAYED") return tr ? "Gecikmeli" : "Delayed"
  return tr ? "Bekliyor" : "Pending"
}
