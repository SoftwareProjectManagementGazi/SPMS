// Phase 13 Plan 13-01 Task 2 — useIteration hook (D-X3).
//
// TanStack Query wrapper around chartService.getIteration. The chart card
// (Plan 13-08) gates rendering on caps.iteration from useChartCapabilities
// (Reports v2 Strategy D) before mounting this hook so projects without
// sprints never fire the request. Wave 4 perf-defaults sweep added
// staleTime + retry + keepPreviousData.

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { chartService, type IterationResponse } from "@/services/chart-service"

export function useIteration(
  projectId: number | null | undefined,
  count: 3 | 4 | 6,
) {
  return useQuery<IterationResponse>({
    queryKey: ["chart", "iteration", projectId, count],
    queryFn: () => chartService.getIteration(projectId!, count),
    enabled: !!projectId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    retry: 1,
  })
}
