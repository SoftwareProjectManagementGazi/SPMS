// Phase 14 Plan 14-01 — useAdminUsers hook (D-W1).
//
// Filter encoded into queryKey so toggling role/status/q maintains independent
// cache slots. Plan 14-03 will fully wire the list endpoint; this hook ships
// in Wave 0 with the right key shape and staleTime contract.

import { useQuery } from "@tanstack/react-query"
import {
  adminUserService,
  type AdminUserListFilter,
} from "@/services/admin-user-service"

export function useAdminUsers(filter: AdminUserListFilter = {}) {
  return useQuery({
    queryKey: ["admin", "users", filter],
    queryFn: () => adminUserService.list(filter),
    staleTime: 30 * 1000,
  })
}
