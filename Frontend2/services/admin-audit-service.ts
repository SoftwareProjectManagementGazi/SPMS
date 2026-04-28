// Phase 14 Plan 14-01 — Admin audit service.
//
// Backend: GET /admin/audit (paginated, returns truncated flag per Pitfall 6)
// + GET /admin/audit.json (filter-aware streaming JSON export per D-B8).
//
// Pitfall 2: audit_log.metadata payload stays snake_case all the way to
// activity-row.tsx — DO NOT camelCase metadata fields. The mapper here only
// preserves the wire shape.

import { apiClient } from "@/lib/api-client"
import type { ActivityItem } from "@/services/activity-service"

// ---------------------------------------------------------------------------
// Domain shapes
// ---------------------------------------------------------------------------

export interface AdminAuditFilter {
  date_from?: string
  date_to?: string
  actor_id?: number
  action_prefix?: string
  limit?: number
  offset?: number
}

export interface AdminAuditResponse {
  items: ActivityItem[]
  total: number
  truncated: boolean  // Pitfall 6 — frontend renders AlertBanner when true
}

// ---------------------------------------------------------------------------
// Query string builder
// ---------------------------------------------------------------------------

function buildAuditQuery(filter: AdminAuditFilter | undefined): string {
  if (!filter) return ""
  const parts: string[] = []
  if (filter.date_from) parts.push(`date_from=${encodeURIComponent(filter.date_from)}`)
  if (filter.date_to) parts.push(`date_to=${encodeURIComponent(filter.date_to)}`)
  if (filter.actor_id !== undefined) parts.push(`actor_id=${filter.actor_id}`)
  if (filter.action_prefix) parts.push(`action_prefix=${encodeURIComponent(filter.action_prefix)}`)
  if (filter.limit !== undefined) parts.push(`limit=${filter.limit}`)
  if (filter.offset !== undefined) parts.push(`offset=${filter.offset}`)
  return parts.length ? `?${parts.join("&")}` : ""
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export const adminAuditService = {
  list: async (filter?: AdminAuditFilter): Promise<AdminAuditResponse> => {
    const qs = buildAuditQuery(filter)
    const resp = await apiClient.get<AdminAuditResponse>(`/admin/audit${qs}`)
    return {
      items: resp.data.items ?? [],
      total: resp.data.total ?? 0,
      truncated: Boolean(resp.data.truncated),
    }
  },

  /**
   * D-B8 — return the JSON export URL string. Caller wraps in
   * `downloadAuthenticated()` from `@/lib/admin/download-authenticated`
   * (Plan 14-13 Cluster A 401 fix) to trigger the browser download with
   * an Authorization: Bearer header. Server enforces the 50k row hard cap
   * (D-Z2).
   */
  exportJsonUrl: (filter?: AdminAuditFilter): string => {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
    const qs = buildAuditQuery(filter)
    return `${baseUrl}/admin/audit.json${qs}`
  },
}
