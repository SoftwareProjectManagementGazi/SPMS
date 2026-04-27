// Phase 14 Plan 14-01 — usePendingJoinRequests hook (D-W1).
//
// staleTime 30s admin-data convention; refetchOnWindowFocus picks up new
// requests when admin tabs back to the dashboard.

import { useQuery } from "@tanstack/react-query"
import { adminJoinRequestService } from "@/services/admin-join-request-service"

export function usePendingJoinRequests(limit = 5) {
  return useQuery({
    queryKey: ["admin", "join-requests", "pending", { limit }],
    queryFn: () => adminJoinRequestService.listPending(limit, 0),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}
