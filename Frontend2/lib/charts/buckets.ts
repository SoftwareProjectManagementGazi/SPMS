// Phase 13 Plan 13-01 Task 2 — Lead/Cycle Time bucket constants.
//
// Single source of truth for the 5 histogram buckets used by both the
// Lead/Cycle chart card (Plan 13-07) and any future BE→FE bucket-label
// integrity check. Mirrors backend chart_dtos.LeadCycleStatsDTO bucket
// labels exactly (RESEARCH §Code Examples line 875).

export const LEAD_CYCLE_BUCKETS = ["0-1d", "1-3d", "3-5d", "5-10d", "10d+"] as const

export type LeadCycleBucket = typeof LEAD_CYCLE_BUCKETS[number]
