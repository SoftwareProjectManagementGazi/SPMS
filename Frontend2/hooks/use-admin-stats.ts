// Phase 14 Plan 14-01 — useAdminStats hook (D-W1 stats variant).
//
// staleTime 60s — active users compute is more expensive than the standard
// 30s admin-data window (D-X2 SQL scans audit_log per request). refetchOn
// WindowFocus per CONTEXT D-B3 Phase 13 carry-forward.

import { useQuery } from "@tanstack/react-query"
import {
  adminStatsService,
  type AdminStats,
} from "@/services/admin-stats-service"

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => adminStatsService.getStats(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}
