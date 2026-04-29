// Phase 15 Plan 15-09 — usePermissions hook test.
//
// Verifies the queryKey encodes the optional scope arg + queryFn invocation
// passes the scope through to the service.

import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

import { usePermissions } from "./use-permissions"
import { adminRbacService } from "@/services/admin-rbac-service"

vi.mock("@/services/admin-rbac-service", () => ({
  adminRbacService: {
    listPermissions: vi
      .fn()
      .mockResolvedValue([
        { id: 1, key: "task.create", scope: "project" },
      ]),
  },
}))

describe("usePermissions", () => {
  it("fetches permission list without scope", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)
    const { result } = renderHook(() => usePermissions(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(adminRbacService.listPermissions).toHaveBeenCalledWith(undefined)
    expect(result.current.data?.[0].key).toBe("task.create")
  })

  it("passes scope=system to the service when provided", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)
    const { result } = renderHook(() => usePermissions("system"), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(adminRbacService.listPermissions).toHaveBeenCalledWith("system")
  })
})
