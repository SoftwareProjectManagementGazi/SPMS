// Phase 15 Plan 15-09 — Admin RBAC service.
//
// Service layer for /admin/roles + /admin/permissions endpoints. Plan 15-10
// (matrix uplift) consumes getMatrix() + updateCell(); Plan 15-11 (Roles tab
// CRUD) consumes listRoles / createRole / updateRole / deleteRole.
//
// Backend contracts:
//   - GET    /admin/roles                 → RoleListResponse {items, total}
//   - POST   /admin/roles                 → Role (Plan 15-06 task)
//   - PATCH  /admin/roles/{id}            → Role
//   - DELETE /admin/roles/{id}            → 204 (Plan 15-06; orphans → Member)
//   - GET    /admin/permissions[?scope=]  → Permission[] (Plan 15-04)
//   - GET    /admin/permissions/matrix    → PermissionMatrix
//   - PATCH  /admin/permissions/matrix    → 204 {role_id, perm_key, granted}
//
// Mirrors admin-user-service.ts shape verbatim (PATTERNS §11).

import { apiClient } from "@/lib/api-client"

// ---------------------------------------------------------------------------
// Domain shapes (mirror Backend Plan 15-05/06 DTOs)
// ---------------------------------------------------------------------------

export interface Role {
  id: number
  name: string
  description?: string | null
  icon_key?: string | null
  color_token?: string | null
  is_system_role: boolean
}

export interface Permission {
  id: number
  key: string
  label_tr?: string | null
  label_en?: string | null
  scope: "system" | "project"
}

export interface MatrixCell {
  role_id: number
  permission_id: number
  granted: boolean
}

export interface PermissionMatrix {
  roles: Role[]
  permissions: Permission[]
  cells: MatrixCell[]
}

export interface RoleCreateRequest {
  name: string
  description?: string
  icon_key?: string
  color_token?: string
}

export type RoleUpdateRequest = Partial<RoleCreateRequest>

export interface RoleListResponse {
  items: Role[]
  total: number
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export const adminRbacService = {
  listRoles: async (): Promise<RoleListResponse> => {
    const r = await apiClient.get<RoleListResponse>("/admin/roles")
    return r.data
  },

  createRole: async (req: RoleCreateRequest): Promise<Role> => {
    const r = await apiClient.post<Role>("/admin/roles", req)
    return r.data
  },

  updateRole: async (id: number, req: RoleUpdateRequest): Promise<Role> => {
    const r = await apiClient.patch<Role>(`/admin/roles/${id}`, req)
    return r.data
  },

  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/roles/${id}`)
  },

  listPermissions: async (
    scope?: "system" | "project",
  ): Promise<Permission[]> => {
    const url = scope
      ? `/admin/permissions?scope=${scope}`
      : "/admin/permissions"
    const r = await apiClient.get<Permission[]>(url)
    return r.data
  },

  getMatrix: async (): Promise<PermissionMatrix> => {
    const r = await apiClient.get<PermissionMatrix>("/admin/permissions/matrix")
    return r.data
  },

  updateCell: async (
    roleId: number,
    permKey: string,
    granted: boolean,
  ): Promise<void> => {
    await apiClient.patch("/admin/permissions/matrix", {
      role_id: roleId,
      perm_key: permKey,
      granted,
    })
  },
}
