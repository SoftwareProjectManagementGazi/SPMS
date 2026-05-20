// Reports migration v2 (Strategy D) Wave 2 — v1.0 report endpoint wrappers.
//
// Sister of chart-service.ts (CFD / Lead-Cycle / Iteration). Wraps the
// existing /api/v1/reports/* endpoints used by the prototype's Summary
// StatCards, Burndown row, Team Load card, and the export buttons. Also
// includes the Reports v2 additions:
//   - /projects/{id}/charts/phase-progress (new BE endpoint, Wave 1a)
//
// snake_case BE → camelCase FE mapping per the chart-service convention.
// Each fetcher returns a typed shape suitable for direct render or
// downstream chart-component consumption.

import { apiClient } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Summary — /reports/summary
// ---------------------------------------------------------------------------

export interface SummaryData {
  activeTasks: number
  completedTasks: number
  totalTasks: number
  completionRate: number
  // Reports migration v2 — period-over-period deltas the prototype StatCards
  // expose (e.g. "+6 pts", "-0.4d"). `null` means the BE could not compute
  // a delta (first run / fresh project / disabled period); the FE renders
  // an em-dash placeholder for these.
  velocityDelta: number | null
  completedDeltaPct: number | null
  cycleTimeAvgDays: number | null
  cycleTimeDeltaDays: number | null
  blockersCount: number | null
  blockersDelta: number | null
}

interface SummaryResponseDTO {
  active_tasks: number
  completed_tasks: number
  total_tasks: number
  completion_rate: number
  velocity_delta?: number | null
  completed_delta_pct?: number | null
  cycle_time_avg_days?: number | null
  cycle_time_delta_days?: number | null
  blockers_count?: number | null
  blockers_delta?: number | null
}

function mapSummary(d: SummaryResponseDTO): SummaryData {
  return {
    activeTasks: d.active_tasks,
    completedTasks: d.completed_tasks,
    totalTasks: d.total_tasks,
    completionRate: d.completion_rate,
    velocityDelta: d.velocity_delta ?? null,
    completedDeltaPct: d.completed_delta_pct ?? null,
    cycleTimeAvgDays: d.cycle_time_avg_days ?? null,
    cycleTimeDeltaDays: d.cycle_time_delta_days ?? null,
    blockersCount: d.blockers_count ?? null,
    blockersDelta: d.blockers_delta ?? null,
  }
}

// ---------------------------------------------------------------------------
// Burndown — /reports/burndown
// ---------------------------------------------------------------------------

export interface BurndownPoint {
  date: string  // ISO YYYY-MM-DD
  remaining: number
  total: number
}

export interface BurndownData {
  sprintName: string
  sprintId: number
  series: BurndownPoint[]
}

interface BurndownResponseDTO {
  sprint_name: string
  sprint_id: number
  series: Array<{ date: string; remaining: number; total: number }>
}

function mapBurndown(d: BurndownResponseDTO): BurndownData {
  return {
    sprintName: d.sprint_name,
    sprintId: d.sprint_id,
    series: d.series.map((p) => ({
      date: p.date,
      remaining: p.remaining,
      total: p.total,
    })),
  }
}

// ---------------------------------------------------------------------------
// Performance (Team Load surface) — /reports/performance
// ---------------------------------------------------------------------------
//
// The prototype Team Load card uses a single load-pct per user; the v1.0
// /reports/performance endpoint returns richer per-member stats (assigned,
// completed, in_progress, on_time_pct). We expose both shapes:
//   - `members`: the raw rich response (future-proofs the TeamPerformance
//     table that Wave 3 may add if user requests).
//   - `loadEntries`: derived projection that matches what the Team Load
//     card actually renders — saves the component from having to know the
//     in_progress / assigned math.

export interface MemberPerformance {
  userId: number
  fullName: string
  avatarPath: string | null
  assigned: number
  completed: number
  inProgress: number
  onTimePct: number
}

export interface TeamLoadEntry {
  userId: number
  fullName: string
  avatarPath: string | null
  /** 0–100. Derived as: in_progress count clamped to a 0–100 scale where
   *  100 means "carrying more in-progress work than anyone else on the team".
   *  When the team is empty this never fires — the capability gate hides
   *  the card. */
  loadPct: number
}

export interface PerformanceData {
  members: MemberPerformance[]
  loadEntries: TeamLoadEntry[]
}

interface PerformanceResponseDTO {
  members: Array<{
    user_id: number
    full_name: string
    avatar_path: string | null
    assigned: number
    completed: number
    in_progress: number
    on_time_pct: number
  }>
}

function mapPerformance(d: PerformanceResponseDTO): PerformanceData {
  const members: MemberPerformance[] = d.members.map((m) => ({
    userId: m.user_id,
    fullName: m.full_name,
    avatarPath: m.avatar_path,
    assigned: m.assigned,
    completed: m.completed,
    inProgress: m.in_progress,
    onTimePct: m.on_time_pct,
  }))
  // Derive a 0–100 load pct for the Team Load card.
  // Peer-relative scaling so the busiest teammate always saturates at 100
  // and the rest read as relative load. Falls back to in_progress*20 when
  // the team is a singleton (peer max is themselves), capping at 100 so a
  // 6-task user doesn't flow over.
  const peakInProgress = members.reduce(
    (acc, m) => (m.inProgress > acc ? m.inProgress : acc),
    0,
  )
  const loadEntries: TeamLoadEntry[] = members
    .map((m) => ({
      userId: m.userId,
      fullName: m.fullName,
      avatarPath: m.avatarPath,
      loadPct:
        peakInProgress > 0
          ? Math.round((m.inProgress / peakInProgress) * 100)
          : 0,
    }))
    // Heaviest load first — the Team Load card slices the first 6.
    .sort((a, b) => b.loadPct - a.loadPct)

  return { members, loadEntries }
}

// ---------------------------------------------------------------------------
// Phase Progress — /projects/{id}/charts/phase-progress (Reports v2 endpoint)
// ---------------------------------------------------------------------------

export interface PhaseProgressEntry {
  id: string
  name: string
  order: number
  total: number
  done: number
  inProgress: number
  todo: number
}

export interface PhaseProgressData {
  phases: PhaseProgressEntry[]
}

interface PhaseProgressResponseDTO {
  phases: Array<{
    id: string
    name: string
    order: number
    total: number
    done: number
    in_progress: number
    todo: number
  }>
}

function mapPhaseProgress(d: PhaseProgressResponseDTO): PhaseProgressData {
  return {
    phases: d.phases.map((p) => ({
      id: p.id,
      name: p.name,
      order: p.order,
      total: p.total,
      done: p.done,
      inProgress: p.in_progress,
      todo: p.todo,
    })),
  }
}

// ---------------------------------------------------------------------------
// Filters helper — shared by every report endpoint that takes a date range
// ---------------------------------------------------------------------------

export interface ReportFilters {
  projectId: number | null
  /** ISO date YYYY-MM-DD. `null` omits the param entirely (BE treats
   *  missing as "no filter"). */
  dateFrom: string | null
  dateTo: string | null
}

function buildParams(
  filters: ReportFilters,
  extra?: Record<string, string>,
): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.projectId != null) params.project_id = String(filters.projectId)
  if (filters.dateFrom) params.date_from = filters.dateFrom
  if (filters.dateTo) params.date_to = filters.dateTo
  if (extra) Object.assign(params, extra)
  return params
}

// ---------------------------------------------------------------------------
// Public service object
// ---------------------------------------------------------------------------

export const reportService = {
  getSummary: async (filters: ReportFilters): Promise<SummaryData> => {
    const { data } = await apiClient.get<SummaryResponseDTO>(
      "/reports/summary",
      { params: buildParams(filters) },
    )
    return mapSummary(data)
  },

  getBurndown: async (
    projectId: number,
    sprintId?: number,
  ): Promise<BurndownData> => {
    const params: Record<string, string> = { project_id: String(projectId) }
    if (sprintId != null) params.sprint_id = String(sprintId)
    const { data } = await apiClient.get<BurndownResponseDTO>(
      "/reports/burndown",
      { params },
    )
    return mapBurndown(data)
  },

  getPerformance: async (filters: ReportFilters): Promise<PerformanceData> => {
    const { data } = await apiClient.get<PerformanceResponseDTO>(
      "/reports/performance",
      { params: buildParams(filters) },
    )
    return mapPerformance(data)
  },

  getPhaseProgress: async (projectId: number): Promise<PhaseProgressData> => {
    const { data } = await apiClient.get<PhaseProgressResponseDTO>(
      `/projects/${projectId}/charts/phase-progress`,
    )
    return mapPhaseProgress(data)
  },

  exportPdf: async (filters: ReportFilters): Promise<Blob> => {
    const { data } = await apiClient.get("/reports/export/pdf", {
      params: buildParams(filters),
      responseType: "blob",
    })
    return data as Blob
  },

  exportExcel: async (filters: ReportFilters): Promise<Blob> => {
    const { data } = await apiClient.get("/reports/export/excel", {
      params: buildParams(filters),
      responseType: "blob",
    })
    return data as Blob
  },
}
