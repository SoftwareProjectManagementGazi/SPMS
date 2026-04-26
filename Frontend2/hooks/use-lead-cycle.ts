// Phase 13 Plan 13-01 Task 2 — useLeadCycle hook (D-X2).
//
// TanStack Query wrapper around chartService.getLeadCycle.
// refetchOnWindowFocus per CONTEXT D-B3.

import { useQuery } from "@tanstack/react-query"
import { chartService, type LeadCycleResponse } from "@/services/chart-service"

export function useLeadCycle(
  projectId: number | null | undefined,
  range: 7 | 30 | 90,
) {
  return useQuery<LeadCycleResponse>({
    queryKey: ["chart", "lead-cycle", projectId, range],
    queryFn: () => chartService.getLeadCycle(projectId!, range),
    enabled: !!projectId,
    refetchOnWindowFocus: true,
  })
}
