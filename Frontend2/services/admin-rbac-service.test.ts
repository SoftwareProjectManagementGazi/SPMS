// Phase 15 Plan 15-09 — adminRbacService unit tests.
//
// Mocks @/lib/api-client. Verifies each of the 7 service methods hits the
// expected URL with the expected body. Mirrors admin-join-request-service.test.ts
// pattern (Phase 14 14-01).

import { describe, it, expect, vi, beforeEach } from "vitest"
import { adminRbacService } from "./admin-rbac-service"

// Hoist-friendly mock — vi.mock factories run before module imports.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from "@/lib/api-client"

describe("adminRbacService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("listRoles GETs /admin/roles", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: { items: [], total: 0 },
    })
    const r = await adminRbacService.listRoles()
    expect(apiClient.get).toHaveBeenCalledWith("/admin/roles")
    expect(r.total).toBe(0)
  })

  it("createRole POSTs /admin/roles with payload", async () => {
    const role = {
      id: 5,
      name: "Designer",
      is_system_role: false,
    }
    ;(apiClient.post as any).mockResolvedValue({ data: role })
    const r = await adminRbacService.createRole({ name: "Designer" })
    expect(apiClient.post).toHaveBeenCalledWith("/admin/roles", {
      name: "Designer",
    })
    expect(r.id).toBe(5)
  })

  it("updateRole PATCHes /admin/roles/{id} with partial payload", async () => {
    ;(apiClient.patch as any).mockResolvedValue({
      data: { id: 5, name: "Senior Designer", is_system_role: false },
    })
    const r = await adminRbacService.updateRole(5, { name: "Senior Designer" })
    expect(apiClient.patch).toHaveBeenCalledWith("/admin/roles/5", {
      name: "Senior Designer",
    })
    expect(r.name).toBe("Senior Designer")
  })

  it("deleteRole DELETEs /admin/roles/{id}", async () => {
    ;(apiClient.delete as any).mockResolvedValue({ data: undefined })
    await adminRbacService.deleteRole(7)
    expect(apiClient.delete).toHaveBeenCalledWith("/admin/roles/7")
  })

  it("listPermissions GETs /admin/permissions when no scope", async () => {
    ;(apiClient.get as any).mockResolvedValue({ data: [] })
    await adminRbacService.listPermissions()
    expect(apiClient.get).toHaveBeenCalledWith("/admin/permissions")
  })

  it("listPermissions GETs /admin/permissions?scope=system when scope=system", async () => {
    ;(apiClient.get as any).mockResolvedValue({ data: [] })
    await adminRbacService.listPermissions("system")
    expect(apiClient.get).toHaveBeenCalledWith(
      "/admin/permissions?scope=system",
    )
  })

  it("listPermissions GETs /admin/permissions?scope=project when scope=project", async () => {
    ;(apiClient.get as any).mockResolvedValue({ data: [] })
    await adminRbacService.listPermissions("project")
    expect(apiClient.get).toHaveBeenCalledWith(
      "/admin/permissions?scope=project",
    )
  })

  it("getMatrix GETs /admin/permissions/matrix", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: { roles: [], permissions: [], cells: [] },
    })
    const r = await adminRbacService.getMatrix()
    expect(apiClient.get).toHaveBeenCalledWith("/admin/permissions/matrix")
    expect(r.cells).toEqual([])
  })

  it("updateCell PATCHes /admin/permissions/matrix with role_id/perm_key/granted body", async () => {
    ;(apiClient.patch as any).mockResolvedValue({ data: undefined })
    await adminRbacService.updateCell(2, "task.create", true)
    expect(apiClient.patch).toHaveBeenCalledWith(
      "/admin/permissions/matrix",
      {
        role_id: 2,
        perm_key: "task.create",
        granted: true,
      },
    )
  })

  it("updateCell sends granted:false correctly", async () => {
    ;(apiClient.patch as any).mockResolvedValue({ data: undefined })
    await adminRbacService.updateCell(3, "project.delete", false)
    expect(apiClient.patch).toHaveBeenCalledWith(
      "/admin/permissions/matrix",
      {
        role_id: 3,
        perm_key: "project.delete",
        granted: false,
      },
    )
  })
})
