// Phase 13 Plan 13-01 Task 2 — useIteration hook (D-X3).
//
// TanStack Query wrapper around chartService.getIteration. The chart card
// (Plan 13-08) gates rendering on chartApplicabilityFor(methodology).iteration
// before mounting this hook so non-cycle methodologies never fire the request.
// refetchOnWindowFocus per CONTEXT D-B3.

import { useQuery } from "@tanstack/react-query"
import { chartService, type IterationResponse } from "@/services/chart-service"

export function useIteration(
  projectId: number | null | undefined,
  count: 3 | 4 | 6,
) {
  return useQuery<IterationResponse>({
    queryKey: ["chart", "iteration", projectId, count],
    queryFn: () => chartService.getIteration(projectId!, count),
    enabled: !!projectId,
    refetchOnWindowFocus: true,
  })
}
