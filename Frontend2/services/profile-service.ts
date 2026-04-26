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
import { taskService, type Task } from "@/services/task-service"

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
// User profile lookup (Plan 13-05 — header data source)
// ---------------------------------------------------------------------------
//
// The backend `/users/{id}/summary` endpoint (Phase 9 D-48) returns stats +
// projects + recent_activity but NOT the user's own name/email/avatar. The
// profile header needs that data, so getUser() pulls from `/auth/users` (the
// existing UserListDTO endpoint — id/email/username/avatar_url) and finds
// the matching id. Role is NOT in UserListDTO (backend limitation) — for
// non-self profile views the role badge gracefully omits. Self-profile
// callers should layer in useAuth().user.role when richer role data is
// needed (Phase 13 plan 13-05 ProfileHeader handles both branches).

export interface ProfileUser {
  id: number
  full_name: string
  email: string
  role?: string | { name: string } | null
  avatar_url?: string | null
}

interface UserListEntryDTO {
  id: number
  email: string
  /** Backend ships full_name under the `username` key on UserListDTO. */
  username: string
  avatar_url?: string | null
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
    // Delegate to taskService so the snake_case → camelCase mapTask runs
    // (without it, t.projectId is undefined and ProfileTasksTab collapses
    // every task into a single group keyed by undefined → React key warning).
    const tasks = await taskService.getByAssignee(userId)
    return { tasks }
  },

  /**
   * Resolve a single user's display info (name + email + avatar) from the
   * existing /auth/users list endpoint. Returns null when the user id is
   * not found (drives the 404 path on the profile route).
   *
   * Trade-off: pulls the full user list every call (no per-id endpoint).
   * Acceptable for v2.0 — TanStack Query caches the lookup, and the user
   * list size is bounded by org seat count. v2.1 candidate: add a dedicated
   * GET /users/{id}/profile that returns name + email + avatar + role in a
   * single call so the profile route avoids the list scan.
   */
  getUser: async (userId: number): Promise<ProfileUser | null> => {
    const resp = await apiClient.get<UserListEntryDTO[]>("/auth/users")
    const entry = (resp.data ?? []).find((u) => u.id === userId)
    if (!entry) return null
    return {
      id: entry.id,
      full_name: entry.username,
      email: entry.email,
      avatar_url: entry.avatar_url ?? null,
      // Role not in UserListDTO; the consumer layers in useAuth().user.role
      // for the self branch (Plan 13-05 page.tsx).
      role: null,
    }
  },
}
