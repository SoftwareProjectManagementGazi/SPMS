// Phase 13 Plan 13-01 Task 2 — chart aggregation service.
//
// Read-only fetchers for the 3 NEW chart endpoints (D-X1..X3). snake_case
// from backend → camelCase for FE consumers (matches phase-report-service
// pattern). Each chart hook (use-cfd / use-lead-cycle / use-iteration)
// calls these fetchers via TanStack Query.

import { apiClient } from "@/lib/api-client"
import type { LeadCycleBucket } from "@/lib/charts/buckets"

// ---------------------------------------------------------------------------
// CFD (D-X1) — daily snapshot list + WIP / throughput summary
// ---------------------------------------------------------------------------

export interface CFDDay {
  date: string
  todo: number
  progress: number
  review: number
  done: number
}

export interface CFDResponse {
  days: CFDDay[]
  avgWip: number
  avgCompletionPerDay: number
}

interface CFDResponseDTO {
  days: Array<{
    date: string
    todo: number
    progress: number
    review: number
    done: number
  }>
  avg_wip: number
  avg_completion_per_day: number
}

function mapCFD(d: CFDResponseDTO): CFDResponse {
  return {
    days: d.days,
    avgWip: d.avg_wip,
    avgCompletionPerDay: d.avg_completion_per_day,
  }
}

// ---------------------------------------------------------------------------
// Lead / Cycle (D-X2) — paired stats with 5-bucket histograms
// ---------------------------------------------------------------------------

export interface LeadCycleBucketStat {
  range: LeadCycleBucket | string
  count: number
}

export interface LeadCycleStats {
  avgDays: number
  p50: number
  p85: number
  p95: number
  buckets: LeadCycleBucketStat[]
}

export interface LeadCycleResponse {
  lead: LeadCycleStats
  cycle: LeadCycleStats
}

interface LeadCycleStatsDTO {
  avg_days: number
  p50: number
  p85: number
  p95: number
  buckets: Array<{ range: string; count: number }>
}

interface LeadCycleResponseDTO {
  lead: LeadCycleStatsDTO
  cycle: LeadCycleStatsDTO
}

function mapStats(d: LeadCycleStatsDTO): LeadCycleStats {
  return {
    avgDays: d.avg_days,
    p50: d.p50,
    p85: d.p85,
    p95: d.p95,
    buckets: d.buckets,
  }
}

function mapLeadCycle(d: LeadCycleResponseDTO): LeadCycleResponse {
  return { lead: mapStats(d.lead), cycle: mapStats(d.cycle) }
}

// ---------------------------------------------------------------------------
// Iteration Comparison (D-X3) — last N sprints
// ---------------------------------------------------------------------------

export interface IterationSprint {
  id: number
  name: string
  planned: number
  completed: number
  carried: number
}

export interface IterationResponse {
  sprints: IterationSprint[]
}

interface IterationResponseDTO {
  sprints: Array<{
    id: number
    name: string
    planned: number
    completed: number
    carried: number
  }>
}

function mapIteration(d: IterationResponseDTO): IterationResponse {
  return { sprints: d.sprints }
}

// ---------------------------------------------------------------------------
// Public service object
// ---------------------------------------------------------------------------

export const chartService = {
  getCFD: async (
    projectId: number,
    range: 7 | 30 | 90,
  ): Promise<CFDResponse> => {
    const resp = await apiClient.get<CFDResponseDTO>(
      `/projects/${projectId}/charts/cfd`,
      { params: { range } },
    )
    return mapCFD(resp.data)
  },

  getLeadCycle: async (
    projectId: number,
    range: 7 | 30 | 90,
  ): Promise<LeadCycleResponse> => {
    const resp = await apiClient.get<LeadCycleResponseDTO>(
      `/projects/${projectId}/charts/lead-cycle`,
      { params: { range } },
    )
    return mapLeadCycle(resp.data)
  },

  getIteration: async (
    projectId: number,
    count: 3 | 4 | 6,
  ): Promise<IterationResponse> => {
    const resp = await apiClient.get<IterationResponseDTO>(
      `/projects/${projectId}/charts/iteration`,
      { params: { count } },
    )
    return mapIteration(resp.data)
  },
}
