// Phase 15 Plan 15-09 — usePermissions hook.
//
// Fetch the permission catalog from /admin/permissions. Optional `scope` arg
// filters to system-only or project-only permissions (D-1.6 — Plan 15-10
// matrix uplift renders a scope badge per perm key).
//
// staleTime: 5 min — permission catalog is even more stable than roles
// (developers add new permissions via migrations, not the UI). The query key
// includes the scope so toggling the filter maintains independent cache slots.

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  adminRbacService,
  type Permission,
} from "@/services/admin-rbac-service"

export function usePermissions(scope?: "system" | "project") {
  return useQuery<Permission[]>({
    queryKey: ["admin", "permissions", { scope }],
    queryFn: () => adminRbacService.listPermissions(scope),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
