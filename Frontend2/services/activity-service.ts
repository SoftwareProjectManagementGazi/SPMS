// Phase 13 Plan 13-01 Task 2 — activity feed service.
//
// Two read-only fetchers consumed by ActivityTab (Plan 13-04 + 13-06) and
// the dashboard ActivityFeed widget (existing Phase 10 D-26 — to be migrated
// onto this service in a follow-up):
// - getProjectActivity(projectId, params) → existing /projects/{id}/activity
//   (broadened in Phase 13 Plan 13-01 backend to include task events)
// - getUserActivity(userId, params) → NEW /users/{id}/activity (D-X4)
//
// The `type[]` query alias is preserved verbatim so the existing Phase 9
// D-46 backend filter contract continues to work. axios serializes a
// `type[]: ["a", "b"]` params object as `?type[]=a&type[]=b` by default in
// modern versions, but we add a manual paramsSerializer fallback to guard
// against older axios versions (Phase 9 D-46 manual-pair pattern).

import { apiClient } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Domain shapes
// ---------------------------------------------------------------------------

/** Mirrors Backend/app/application/dtos/activity_dtos.ActivityItemDTO. */
export interface ActivityItem {
  id: number
  action: string
  entity_type?: string | null
  entity_id?: number | null
  entity_label?: string | null
  field_name?: string | null
  old_value?: string | null
  new_value?: string | null
  user_id?: number | null
  user_name?: string | null
  user_avatar?: string | null
  timestamp?: string | null
  metadata?: Record<string, unknown> | null
}

export interface ActivityResponse {
  items: ActivityItem[]
  total: number
}

export interface ActivityFilter {
  type?: string[]
  user_id?: number
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// Query string helper (Phase 9 D-46 manual-pair fallback)
// ---------------------------------------------------------------------------

function buildActivityQuery(filter: ActivityFilter | undefined): string {
  if (!filter) return ""
  const parts: string[] = []
  for (const t of filter.type ?? []) {
    parts.push(`type[]=${encodeURIComponent(t)}`)
  }
  if (filter.user_id !== undefined) parts.push(`user_id=${filter.user_id}`)
  if (filter.date_from) parts.push(`date_from=${encodeURIComponent(filter.date_from)}`)
  if (filter.date_to) parts.push(`date_to=${encodeURIComponent(filter.date_to)}`)
  if (filter.limit !== undefined) parts.push(`limit=${filter.limit}`)
  if (filter.offset !== undefined) parts.push(`offset=${filter.offset}`)
  return parts.length ? `?${parts.join("&")}` : ""
}

// ---------------------------------------------------------------------------
// Public service object
// ---------------------------------------------------------------------------

export const activityService = {
  getProjectActivity: async (
    projectId: number,
    filter?: ActivityFilter,
  ): Promise<ActivityResponse> => {
    const qs = buildActivityQuery(filter)
    const resp = await apiClient.get<ActivityResponse>(
      `/projects/${projectId}/activity${qs}`,
    )
    return {
      items: resp.data.items ?? [],
      total: resp.data.total ?? 0,
    }
  },

  getUserActivity: async (
    userId: number,
    filter?: ActivityFilter,
  ): Promise<ActivityResponse> => {
    const qs = buildActivityQuery(filter)
    const resp = await apiClient.get<ActivityResponse>(
      `/users/${userId}/activity${qs}`,
    )
    return {
      items: resp.data.items ?? [],
      total: resp.data.total ?? 0,
    }
  },
}
