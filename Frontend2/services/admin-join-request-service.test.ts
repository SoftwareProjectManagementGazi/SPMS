// Phase 14 Plan 14-01 Task 4 — admin-join-request-service tests.
//
// Mocks @/lib/api-client. Verifies:
// - listPending calls GET /admin/join-requests with correct params
// - mapPending output uses camelCase requestedBy / targetUser BUT preserves
//   snake_case keys inside nested user objects (full_name / avatar_url) AND
//   on top-level fields like created_at (matches profile-service.ts shape)
// - approve / reject hit the correct POST URLs

import { describe, it, expect, vi, beforeEach } from "vitest"
import { adminJoinRequestService } from "./admin-join-request-service"

// Hoist-friendly mock — vi.mock factories run before module imports.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiClient } from "@/lib/api-client"

describe("adminJoinRequestService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("listPending calls GET /admin/join-requests with status=pending and limit/offset params", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: { items: [], total: 0 },
    })
    await adminJoinRequestService.listPending(5, 0)
    expect(apiClient.get).toHaveBeenCalledWith(
      "/admin/join-requests",
      { params: { status: "pending", limit: 5, offset: 0 } },
    )
  })

  it("mapPending camelCases requestedBy/targetUser top-level keys but keeps nested snake_case", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: {
        items: [
          {
            id: 7,
            project: { id: 5, key: "TEST", name: "Test Project" },
            requested_by: {
              id: 10,
              email: "pm@example.com",
              full_name: "PM User",
              avatar_url: null,
            },
            target_user: {
              id: 20,
              email: "tgt@example.com",
              full_name: "Target User",
              avatar_url: null,
            },
            note: "Wants in",
            status: "pending",
            created_at: "2026-04-27T12:00:00Z",
            reviewed_at: null,
          },
        ],
        total: 1,
      },
    })
    const result = await adminJoinRequestService.listPending()
    expect(result.total).toBe(1)
    const item = result.items[0]
    // Top-level camelCase
    expect(item.requestedBy).not.toBeNull()
    expect(item.targetUser).not.toBeNull()
    // Nested keys stay snake (full_name / avatar_url match profile-service pattern)
    expect(item.requestedBy?.full_name).toBe("PM User")
    expect(item.targetUser?.full_name).toBe("Target User")
    expect(item.requestedBy?.avatar_url).toBeNull()
    // Top-level created_at stays snake (mirrors profile-service)
    expect(item.created_at).toBe("2026-04-27T12:00:00Z")
  })

  it("approve POSTs to /admin/join-requests/{id}/approve", async () => {
    ;(apiClient.post as any).mockResolvedValue({})
    await adminJoinRequestService.approve(42)
    expect(apiClient.post).toHaveBeenCalledWith("/admin/join-requests/42/approve")
  })

  it("reject POSTs to /admin/join-requests/{id}/reject", async () => {
    ;(apiClient.post as any).mockResolvedValue({})
    await adminJoinRequestService.reject(99)
    expect(apiClient.post).toHaveBeenCalledWith("/admin/join-requests/99/reject")
  })
})
