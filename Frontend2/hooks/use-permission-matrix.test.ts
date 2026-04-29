// Phase 15 Plan 15-09 — usePermissionMatrix hook test.
//
// Verifies the queryKey is a 3-tuple (admin/permissions/matrix) so the
// optimistic mutation in useUpdatePermissionCell can target it directly via
// setQueryData.

import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

import { usePermissionMatrix } from "./use-permission-matrix"
import { adminRbacService } from "@/services/admin-rbac-service"

vi.mock("@/services/admin-rbac-service", () => ({
  adminRbacService: {
    getMatrix: vi.fn().mockResolvedValue({
      roles: [{ id: 1, name: "Admin", is_system_role: true }],
      permissions: [{ id: 5, key: "task.create", scope: "project" }],
      cells: [{ role_id: 1, permission_id: 5, granted: true }],
    }),
  },
}))

describe("usePermissionMatrix", () => {
  it("fetches the permission matrix and exposes roles/permissions/cells", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children)
    const { result } = renderHook(() => usePermissionMatrix(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(adminRbacService.getMatrix).toHaveBeenCalled()
    expect(result.current.data?.roles[0].name).toBe("Admin")
    expect(result.current.data?.permissions[0].key).toBe("task.create")
    expect(result.current.data?.cells[0].granted).toBe(true)
  })
})
