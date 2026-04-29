// Phase 15 Plan 15-09 — useUpdatePermissionCell test.
//
// 4 cases verify Pattern 3 (RESEARCH) — optimistic mutation lifecycle:
//   1. applyCellUpdate (pure helper): grants a missing cell.
//   2. applyCellUpdate (pure helper): revokes an existing cell.
//   3. onMutate optimistically applies cell change before server confirms.
//   4. onError rolls back to the snapshot when the backend rejects.

import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

import {
  useUpdatePermissionCell,
  applyCellUpdate,
} from "./use-update-permission-cell"
import { adminRbacService } from "@/services/admin-rbac-service"

vi.mock("@/services/admin-rbac-service", () => ({
  adminRbacService: { updateCell: vi.fn() },
}))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

function makeWrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const baseMatrix = () => ({
  roles: [{ id: 2, name: "PM", is_system_role: true }],
  permissions: [{ id: 5, key: "task.create", scope: "project" as const }],
  cells: [] as Array<{
    role_id: number
    permission_id: number
    granted: boolean
  }>,
})

describe("applyCellUpdate (pure helper)", () => {
  it("adds a granted cell when none existed", () => {
    const m = baseMatrix()
    const next = applyCellUpdate(m, 2, "task.create", true)
    expect(next?.cells).toHaveLength(1)
    expect(next?.cells[0]).toEqual({
      role_id: 2,
      permission_id: 5,
      granted: true,
    })
  })

  it("removes the cell when granted=false on an existing entry", () => {
    const m = baseMatrix()
    m.cells.push({ role_id: 2, permission_id: 5, granted: true })
    const next = applyCellUpdate(m, 2, "task.create", false)
    expect(next?.cells).toEqual([])
  })

  it("returns the matrix unchanged when permKey is unknown", () => {
    const m = baseMatrix()
    const next = applyCellUpdate(m, 2, "non.existent", true)
    expect(next?.cells).toEqual([])
  })

  it("returns undefined when the matrix is undefined", () => {
    expect(applyCellUpdate(undefined, 2, "task.create", true)).toBeUndefined()
  })
})

describe("useUpdatePermissionCell — Pattern 3 optimistic mutation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("optimistically applies cell change before the server confirms", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    qc.setQueryData(["admin", "permissions", "matrix"], baseMatrix())
    // Make updateCell hang forever so we can observe the optimistic state.
    ;(adminRbacService.updateCell as any).mockImplementation(
      () => new Promise(() => {}),
    )

    const { result } = renderHook(() => useUpdatePermissionCell(), {
      wrapper: makeWrapper(qc),
    })
    act(() => {
      result.current.mutate({
        roleId: 2,
        permKey: "task.create",
        granted: true,
      })
    })

    await waitFor(() => {
      const data = qc.getQueryData([
        "admin",
        "permissions",
        "matrix",
      ]) as ReturnType<typeof baseMatrix>
      const cell = data.cells.find(
        (c) => c.role_id === 2 && c.permission_id === 5,
      )
      expect(cell).toBeDefined()
      expect(cell!.granted).toBe(true)
    })
  })

  it("rolls back to snapshot when the server rejects", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const original = baseMatrix()
    qc.setQueryData(["admin", "permissions", "matrix"], original)
    ;(adminRbacService.updateCell as any).mockRejectedValue({
      response: { data: { detail: { error_code: "SYSTEM_ROLE_PROTECTED" } } },
    })

    const { result } = renderHook(() => useUpdatePermissionCell(), {
      wrapper: makeWrapper(qc),
    })
    act(() => {
      result.current.mutate({
        roleId: 2,
        permKey: "task.create",
        granted: true,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    const data = qc.getQueryData([
      "admin",
      "permissions",
      "matrix",
    ]) as ReturnType<typeof baseMatrix>
    // Reverted to original empty cells.
    expect(data.cells).toEqual([])
  })
})
