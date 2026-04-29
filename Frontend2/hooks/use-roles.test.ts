// Phase 15 Plan 15-09 — useRoles hook test.
//
// Verifies the queryKey shape + queryFn invocation. Mirrors the minimal
// pattern from PATTERNS.md for a useQuery wrapper.

import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

import { useRoles } from "./use-roles"
import { adminRbacService } from "@/services/admin-rbac-service"

vi.mock("@/services/admin-rbac-service", () => ({
  adminRbacService: {
    listRoles: vi.fn().mockResolvedValue({
      items: [{ id: 1, name: "Admin", is_system_role: true }],
      total: 1,
    }),
  },
}))

describe("useRoles", () => {
  it("fetches role list from service via expected queryKey", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)
    const { result } = renderHook(() => useRoles(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(adminRbacService.listRoles).toHaveBeenCalled()
    expect(result.current.data?.total).toBe(1)
    expect(result.current.data?.items[0].name).toBe("Admin")
  })
})
