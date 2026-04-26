// Phase 13 Plan 13-01 Task 2 — profile data service.
//
// Two read-only fetchers used by /users/[id]/page.tsx (Plan 13-05):
// - getUserSummary  → existing GET /users/{id}/summary (Phase 9 D-48 endpoint)
// - getUserTasks    → existing GET /tasks?assignee_id={id} (filtered by status)
//
// Snake_case → camelCase mapping mirrors phase-report-service. UserTasks
// reuses the existing Task interface from task-service so the Tasks tab can
// render with the same primitives as the rest of the app.

import { apiClient } from "@/lib/api-client"
import type { Task } from "@/services/task-service"

// ---------------------------------------------------------------------------
// User Summary (PROF-02 D-C8) — feeds 3 StatCards on profile header
// ---------------------------------------------------------------------------

export interface UserSummaryStats {
  activeTasks: number
  completedLast30d: number
  projectCount: number
}

export interface UserSummaryProject {
  id: number
  key: string
  name: string
  status: string
}

export interface UserSummary {
  stats: UserSummaryStats
  projects: UserSummaryProject[]
  recentActivity: Array<Record<string, unknown>>
}

interface UserSummaryStatsDTO {
  active_tasks?: number
  completed_last_30d?: number
  project_count?: number
}

interface UserSummaryProjectDTO {
  id: number
  key: string
  name: string
  status: string
}

interface UserSummaryResponseDTO {
  stats: UserSummaryStatsDTO
  projects: UserSummaryProjectDTO[]
  recent_activity: Array<Record<string, unknown>>
}

function mapSummary(d: UserSummaryResponseDTO): UserSummary {
  return {
    stats: {
      activeTasks: d.stats.active_tasks ?? 0,
      completedLast30d: d.stats.completed_last_30d ?? 0,
      projectCount: d.stats.project_count ?? 0,
    },
    projects: d.projects.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      status: p.status,
    })),
    recentActivity: d.recent_activity ?? [],
  }
}

// ---------------------------------------------------------------------------
// User Tasks (PROF-02 D-C4) — Tasks tab filtered list
// ---------------------------------------------------------------------------

export type UserTaskStatusFilter = "active" | "completed" | "all"

export interface UserTasksResponse {
  tasks: Task[]
}

// ---------------------------------------------------------------------------
// Public service object
// ---------------------------------------------------------------------------

export const profileService = {
  getUserSummary: async (userId: number): Promise<UserSummary> => {
    const resp = await apiClient.get<UserSummaryResponseDTO>(
      `/users/${userId}/summary`,
    )
    return mapSummary(resp.data)
  },

  /**
   * Lists tasks assigned to a user. The backend `/tasks` endpoint accepts
   * `assignee_id` for filtering; status filter is applied client-side
   * (Phase 13 D-C4 Aktif/Tamamlanan/Tümü) so callers don't need to know the
   * column-name → status mapping. The chosen filter is encoded into the
   * query key by the hook layer (useUserTasks → ['tasks', 'user', id, filter]).
   */
  getUserTasks: async (
    userId: number,
    _filter: UserTaskStatusFilter = "all",
  ): Promise<UserTasksResponse> => {
    const resp = await apiClient.get<Task[]>("/tasks", {
      params: { assignee_id: userId },
    })
    // The backend returns a Task[] for /tasks listing endpoints. Wrap in an
    // envelope so future schema changes (pagination total, etc.) don't break
    // the caller signature.
    return { tasks: Array.isArray(resp.data) ? resp.data : [] }
  },
}
