// Phase 13 Plan 13-01 Task 2 — useCFD hook (D-X1).
//
// TanStack Query wrapper around chartService.getCFD. Wave 4 perf-defaults
// sweep added staleTime + retry + keepPreviousData so the Reports page's
// 7-card grid doesn't thrash on every project / range / filter change.
// refetchOnWindowFocus stays true per CONTEXT D-B3 — focus events ARE a
// signal that the user expects fresh data on a chart that may already be
// stale due to background ingest.

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { chartService, type CFDResponse } from "@/services/chart-service"

export function useCFD(
  projectId: number | null | undefined,
  range: 7 | 30 | 90,
) {
  return useQuery<CFDResponse>({
    queryKey: ["chart", "cfd", projectId, range],
    queryFn: () => chartService.getCFD(projectId!, range),
    enabled: !!projectId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    retry: 1,
  })
}
