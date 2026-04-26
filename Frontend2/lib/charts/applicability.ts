// Phase 13 Plan 13-01 Task 2 — frontend-side chart applicability matrix (D-A4).
//
// Mirrors Backend/app/domain/services/chart_applicability.py so the FE chart
// cards can hide / show themselves without a round trip. Backend remains the
// authoritative gate (HTTP 422 INVALID_METHODOLOGY for non-cycle methodologies
// hitting /charts/iteration); this matrix just lets the UI skip rendering a
// card the user can't ever see results for.

import type { Methodology } from "@/lib/methodology-matrix"

export interface ChartApplicability {
  cfd: boolean
  iteration: boolean
  leadCycle: boolean
  burndown: boolean
}

export const ITERATION_METHODOLOGIES: ReadonlySet<Methodology> = new Set<Methodology>([
  "SCRUM",
  "ITERATIVE",
  "INCREMENTAL",
  "EVOLUTIONARY",
  "RAD",
])

/**
 * Returns the chart applicability flags for a given methodology.
 * - CFD = Kanban only.
 * - Iteration = SCRUM / ITERATIVE / INCREMENTAL / EVOLUTIONARY / RAD.
 * - Lead/Cycle = always available.
 * - Burndown = SCRUM only (preserves v1.0 behavior).
 *
 * Tolerates `null | undefined` methodology so callers don't need to gate.
 */
export function chartApplicabilityFor(
  methodology: Methodology | null | undefined,
): ChartApplicability {
  return {
    cfd: methodology === "KANBAN",
    iteration: !!methodology && ITERATION_METHODOLOGIES.has(methodology),
    leadCycle: true,
    burndown: methodology === "SCRUM",
  }
}
