// Phase 13 Plan 13-01 Task 2 — useCFD hook (D-X1).
//
// TanStack Query wrapper around chartService.getCFD. refetchOnWindowFocus
// per CONTEXT D-B3 so re-focus triggers a fresh aggregation pull.

import { useQuery } from "@tanstack/react-query"
import { chartService, type CFDResponse } from "@/services/chart-service"

export function useCFD(
  projectId: number | null | undefined,
  range: 7 | 30 | 90,
) {
  return useQuery<CFDResponse>({
    queryKey: ["chart", "cfd", projectId, range],
    queryFn: () => chartService.getCFD(projectId!, range),
    enabled: !!projectId,
    refetchOnWindowFocus: true,
  })
}
