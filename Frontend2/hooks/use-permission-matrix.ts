// Phase 15 Plan 15-09 — usePermissionMatrix hook.
//
// Fetch the full role × permission grid from /admin/permissions/matrix. Plan
// 15-10 consumes this for the matrix uplift; the optimistic mutation in
// useUpdatePermissionCell mutates this cache slot directly via setQueryData.
//
// staleTime: 60s — the matrix is the live source of truth for the
// /admin/permissions tab. After mutations, useUpdatePermissionCell + role
// CRUD mutations invalidate this key for fresh server state.

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  adminRbacService,
  type PermissionMatrix,
} from "@/services/admin-rbac-service"

export function usePermissionMatrix() {
  return useQuery<PermissionMatrix>({
    queryKey: ["admin", "permissions", "matrix"],
    queryFn: adminRbacService.getMatrix,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
