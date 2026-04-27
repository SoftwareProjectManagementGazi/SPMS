// Phase 14 Plan 14-01 — useAdminAudit hook (D-W1).
//
// Filter encoded into queryKey so each filter combo gets its own cache
// slot. refetchOnWindowFocus picks up new audit rows when admin returns to
// the tab (mirrors useUserActivity per CONTEXT D-B3 carry-forward).

import { useQuery } from "@tanstack/react-query"
import {
  adminAuditService,
  type AdminAuditFilter,
  type AdminAuditResponse,
} from "@/services/admin-audit-service"

export function useAdminAudit(filter: AdminAuditFilter = {}) {
  return useQuery<AdminAuditResponse>({
    queryKey: ["admin", "audit", filter],
    queryFn: () => adminAuditService.list(filter),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}
