// Phase 15 Plan 15-09 — useRoles hook.
//
// Fetch the role list from /admin/roles. Plan 15-11 (Roles tab) consumes this
// to render the table; Plan 15-10 also consumes it to label matrix columns.
//
// staleTime: 60s — roles change rarely (Admin creates / edits / deletes them
// from a single tab) and the matrix query covers the same data. v5 syntax —
// `placeholderData: keepPreviousData` keeps the table visible during refetches.

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  adminRbacService,
  type RoleListResponse,
} from "@/services/admin-rbac-service"

export function useRoles() {
  return useQuery<RoleListResponse>({
    queryKey: ["admin", "roles"],
    queryFn: adminRbacService.listRoles,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
