// Phase 14 Plan 14-01 Task 4 — useApproveJoinRequest tests (D-W2 optimistic update).
//
// Verifies:
// - Pre-populate cache with 3 pending requests
// - Trigger mutate(2) → cache immediately has 2 items (id=2 removed) + total
//   decremented (optimistic update)
// - Mock apiClient.post to reject → cache reverts to 3 items + Toast.error
// - Happy path: cache invalidation + success toast

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useApproveJoinRequest } from "./use-approve-join-request"
import type { PendingJoinRequest } from "@/services/admin-join-request-service"

// ---- Mocks ----
vi.mock("@/lib/api-client", () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
}))
import { apiClient } from "@/lib/api-client"

// Spy-able toast — useToast must return a stable showToast reference.
const showToastMock = vi.fn()
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}))

const SEED: PendingJoinRequest[] = [
  {
    id: 1,
    project: { id: 5, key: "P1", name: "Proj 1" },
    requestedBy: { id: 10, email: "p1@x.com", full_name: "PM", avatar_url: null },
    targetUser: { id: 20, email: "t1@x.com", full_name: "T1", avatar_url: null },
    note: null,
    status: "pending",
    created_at: "2026-04-27T00:00:00Z",
    reviewed_at: null,
  },
  {
    id: 2,
    project: { id: 5, key: "P1", name: "Proj 1" },
    requestedBy: { id: 10, email: "p1@x.com", full_name: "PM", avatar_url: null },
    targetUser: { id: 21, email: "t2@x.com", full_name: "T2", avatar_url: null },
    note: null,
    status: "pending",
    created_at: "2026-04-27T00:00:00Z",
    reviewed_at: null,
  },
  {
    id: 3,
    project: { id: 5, key: "P1", name: "Proj 1" },
    requestedBy: { id: 10, email: "p1@x.com", full_name: "PM", avatar_url: null },
    targetUser: { id: 22, email: "t3@x.com", full_name: "T3", avatar_url: null },
    note: null,
    status: "pending",
    created_at: "2026-04-27T00:00:00Z",
    reviewed_at: null,
  },
]

const PENDING_KEY = ["admin", "join-requests", "pending", { limit: 5 }]

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  // Pre-populate cache so the mutation has a snapshot to operate on.
  qc.setQueryData(PENDING_KEY, { items: [...SEED], total: 3 })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
  return { qc, Wrapper }
}

describe("useApproveJoinRequest (D-W2 optimistic update)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showToastMock.mockReset()
  })

  it("optimistically removes the approved item BEFORE server response settles", async () => {
    // Make the post hang so we can observe the optimistic state.
    let resolvePost: (() => void) | undefined
    ;(apiClient.post as any).mockImplementation(
      () => new Promise<void>((res) => { resolvePost = res }),
    )

    const { qc, Wrapper } = makeWrapper()
    let mutateFn: ((id: number) => void) | undefined
    function Probe() {
      const m = useApproveJoinRequest()
      mutateFn = (id) => m.mutate(id)
      return null
    }
    render(<Probe />, { wrapper: Wrapper })

    await act(async () => {
      mutateFn!(2)
      // Yield once so onMutate runs and updates the cache.
      await Promise.resolve()
    })

    const optimistic = qc.getQueryData<{ items: PendingJoinRequest[]; total: number }>(PENDING_KEY)
    expect(optimistic).toBeDefined()
    expect(optimistic!.items.map((r) => r.id)).toEqual([1, 3])
    expect(optimistic!.total).toBe(2)

    // Resolve the server response so the mutation completes (cleanup).
    resolvePost?.()
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1))
  })

  it("reverts to the snapshot when the server call rejects", async () => {
    ;(apiClient.post as any).mockRejectedValue({
      response: { data: { detail: "Server error" } },
    })
    const { qc, Wrapper } = makeWrapper()
    let mutateFn: ((id: number) => void) | undefined
    function Probe() {
      const m = useApproveJoinRequest()
      mutateFn = (id) => m.mutate(id)
      return null
    }
    render(<Probe />, { wrapper: Wrapper })

    await act(async () => {
      mutateFn!(2)
    })
    await waitFor(() => {
      // Cache should be back to 3 items after onError
      const cur = qc.getQueryData<{ items: PendingJoinRequest[]; total: number }>(PENDING_KEY)
      expect(cur).toBeDefined()
      expect(cur!.items.length).toBe(3)
      expect(cur!.total).toBe(3)
    })
    // Error toast emitted with server detail
    expect(showToastMock).toHaveBeenCalled()
    const toastCall = showToastMock.mock.calls[0][0]
    expect(toastCall.variant).toBe("error")
    expect(toastCall.message).toContain("Server error")
  })

  it("emits success toast when the server confirms", async () => {
    ;(apiClient.post as any).mockResolvedValue({})
    const { Wrapper } = makeWrapper()
    let mutateFn: ((id: number) => void) | undefined
    function Probe() {
      const m = useApproveJoinRequest()
      mutateFn = (id) => m.mutate(id)
      return null
    }
    render(<Probe />, { wrapper: Wrapper })

    await act(async () => {
      mutateFn!(2)
    })
    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "success" }),
      )
    })
  })
})
