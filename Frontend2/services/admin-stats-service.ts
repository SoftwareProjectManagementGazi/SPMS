// Phase 14 Plan 14-01 — Admin stats composite reader.
//
// Backend: GET /admin/stats — composite payload of three sub-charts in one
// round trip (D-A7). Snake → camel applied at the top-level keys + nested
// project_velocities[].velocity_history.

import { apiClient } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Domain shapes (camelCase external API)
// ---------------------------------------------------------------------------

export interface ActiveUsersTrendPoint {
  date: string
  count: number
}

export interface ProjectVelocity {
  projectId: number
  key: string
  name: string
  progress: number
  velocityHistory: number[]
}

export interface AdminStats {
  activeUsersTrend: ActiveUsersTrendPoint[]
  methodologyDistribution: Record<string, number>
  projectVelocities: ProjectVelocity[]
}

// ---------------------------------------------------------------------------
// Backend snake_case DTOs
// ---------------------------------------------------------------------------

interface ActiveUsersTrendPointDTO {
  date: string
  count: number
}

interface ProjectVelocityDTO {
  project_id: number
  key: string
  name: string
  progress: number
  velocity_history: number[]
}

interface AdminStatsResponseDTO {
  active_users_trend: ActiveUsersTrendPointDTO[]
  methodology_distribution: Record<string, number>
  project_velocities: ProjectVelocityDTO[]
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapVelocity(d: ProjectVelocityDTO): ProjectVelocity {
  return {
    projectId: d.project_id,
    key: d.key,
    name: d.name,
    progress: d.progress,
    velocityHistory: d.velocity_history ?? [],
  }
}

function mapStats(d: AdminStatsResponseDTO): AdminStats {
  return {
    activeUsersTrend: (d.active_users_trend ?? []).map((p) => ({
      date: p.date,
      count: p.count,
    })),
    methodologyDistribution: d.methodology_distribution ?? {},
    projectVelocities: (d.project_velocities ?? []).map(mapVelocity),
  }
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export const adminStatsService = {
  getStats: async (): Promise<AdminStats> => {
    const resp = await apiClient.get<AdminStatsResponseDTO>("/admin/stats")
    return mapStats(resp.data)
  },
}
