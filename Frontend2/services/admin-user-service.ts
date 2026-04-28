// Phase 14 Plan 14-01 — Admin user-management service.
//
// 7 service methods backed by /admin/users (Backend Plan 14-01 Task 3 router).
// CSV export returns a URL string. Plan 14-13 (Cluster A 401 fix) replaced
// the consumer-side caller from csv-export.downloadCsv() (anchor-trigger,
// strips Authorization header → 401) to download-authenticated.ts which
// uses fetch() with an explicit Bearer header. The CSV itself is still
// server-rendered (D-W3 — UTF-8 BOM + Content-Disposition).

import { apiClient } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Domain shapes
// ---------------------------------------------------------------------------

export type AdminRole = "Admin" | "Project Manager" | "Member"

export interface InviteUserRequest {
  email: string
  role: AdminRole
  name?: string
  team_id?: number
}

export interface InviteUserResponse {
  user_id: number
  email: string
  invite_token_expires_at: string
}

export interface BulkInviteRow {
  email: string
  name?: string
  role: AdminRole
}

export interface BulkInviteRowFailure {
  row_number: number
  email: string | null
  errors: string[]
}

export interface BulkInviteResponse {
  successful: InviteUserResponse[]
  failed: BulkInviteRowFailure[]
}

export interface BulkActionRequest {
  user_ids: number[]
  action: "deactivate" | "activate" | "role_change"
  payload?: { role?: AdminRole } | null
}

export interface BulkActionResult {
  user_id: number
  status: "success" | "failed"
  error?: string | null
}

export interface BulkActionResponse {
  results: BulkActionResult[]
  success_count: number
  failed_count: number
}

export interface AdminUserListFilter {
  role?: AdminRole
  status?: "active" | "inactive"
  q?: string
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export const adminUserService = {
  invite: async (req: InviteUserRequest): Promise<InviteUserResponse> => {
    const resp = await apiClient.post<InviteUserResponse>("/admin/users", req)
    return resp.data
  },

  bulkInvite: async (
    rows: BulkInviteRow[],
  ): Promise<BulkInviteResponse> => {
    const resp = await apiClient.post<BulkInviteResponse>(
      "/admin/users/bulk-invite",
      { rows },
    )
    return resp.data
  },

  deactivate: async (userId: number): Promise<void> => {
    await apiClient.patch(`/admin/users/${userId}/deactivate`)
  },

  resetPassword: async (userId: number): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/password-reset`)
  },

  changeRole: async (userId: number, role: AdminRole): Promise<void> => {
    await apiClient.patch(`/admin/users/${userId}/role`, { role })
  },

  bulkAction: async (req: BulkActionRequest): Promise<BulkActionResponse> => {
    const resp = await apiClient.post<BulkActionResponse>(
      "/admin/users/bulk-action",
      req,
    )
    return resp.data
  },

  list: async (filter?: AdminUserListFilter) => {
    // Phase 14 Plan 14-03 — /admin/users returns {items: AdminUserListItem[],
    // total: number}. Items carry role + is_active (richer than /auth/users
    // UserListDTO) so the Users tab can render role badges + status dots
    // without a second lookup.
    const resp = await apiClient.get("/admin/users", { params: filter })
    return resp.data
  },

  /**
   * D-W3 — return the CSV export URL string. Caller wraps in
   * `downloadAuthenticated()` from `@/lib/admin/download-authenticated`
   * (Plan 14-13 Cluster A 401 fix) to trigger the browser download with
   * an Authorization: Bearer header. NO axios call here, NO blob assembly
   * — server ships UTF-8 BOM + Content-Disposition: attachment.
   */
  exportCsv: (filter?: AdminUserListFilter): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
    const params = new URLSearchParams()
    if (filter?.role) params.set("role", filter.role)
    if (filter?.status) params.set("status", filter.status)
    if (filter?.q) params.set("q", filter.q)
    if (filter?.limit !== undefined) params.set("limit", String(filter.limit))
    if (filter?.offset !== undefined) params.set("offset", String(filter.offset))
    const qs = params.toString()
    return `${baseUrl}/admin/users.csv${qs ? "?" + qs : ""}`
  },
}
