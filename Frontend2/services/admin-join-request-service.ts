// Phase 14 Plan 14-01 — Admin join-request service.
//
// Backend: GET /admin/join-requests, POST /admin/join-requests/{id}/approve,
// POST /admin/join-requests/{id}/reject. Snake → camel mapping for the
// nested requested_by / target_user payloads (matches Phase 13
// profile-service.ts shape).
//
// NOTE on snake_case discipline: the audit_log.metadata payload (NOT the
// join-request response shape) stays snake_case all the way to
// activity-row.tsx (Pitfall 2). DO NOT add a camelCase mapper for audit
// metadata anywhere in this codebase.

import { apiClient } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Domain shapes (camelCase external API)
// ---------------------------------------------------------------------------

export interface PendingJoinRequest {
  id: number
  project: { id: number; key: string; name: string }
  requestedBy: {
    id: number
    email: string
    full_name: string | null
    avatar_url: string | null
  } | null
  targetUser: {
    id: number
    email: string
    full_name: string | null
    avatar_url: string | null
  } | null
  note: string | null
  status: "pending" | "approved" | "rejected" | "cancelled"
  created_at: string | null
  reviewed_at: string | null
}

// ---------------------------------------------------------------------------
// Backend snake_case DTOs
// ---------------------------------------------------------------------------

interface JoinRequestUserDTO {
  id: number
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface JoinRequestProjectDTO {
  id: number
  key: string
  name: string
}

interface PendingJoinRequestDTO {
  id: number
  project: JoinRequestProjectDTO | null
  requested_by: JoinRequestUserDTO | null
  target_user: JoinRequestUserDTO | null
  note: string | null
  status: "pending" | "approved" | "rejected" | "cancelled"
  created_at: string | null
  reviewed_at: string | null
}

interface PendingResponseDTO {
  items: PendingJoinRequestDTO[]
  total: number
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapPending(d: PendingJoinRequestDTO): PendingJoinRequest {
  return {
    id: d.id,
    project: d.project ?? { id: 0, key: "", name: "" },
    requestedBy: d.requested_by,
    targetUser: d.target_user,
    note: d.note,
    status: d.status,
    created_at: d.created_at,
    reviewed_at: d.reviewed_at,
  }
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export const adminJoinRequestService = {
  listPending: async (
    limit = 5,
    offset = 0,
  ): Promise<{ items: PendingJoinRequest[]; total: number }> => {
    const resp = await apiClient.get<PendingResponseDTO>(
      "/admin/join-requests",
      { params: { status: "pending", limit, offset } },
    )
    return {
      items: (resp.data.items ?? []).map(mapPending),
      total: resp.data.total ?? 0,
    }
  },

  approve: async (id: number): Promise<void> => {
    await apiClient.post(`/admin/join-requests/${id}/approve`)
  },

  reject: async (id: number): Promise<void> => {
    await apiClient.post(`/admin/join-requests/${id}/reject`)
  },
}
