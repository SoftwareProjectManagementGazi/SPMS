// Reports migration v2 Wave 2 — Burndown chart hook.
//
// Wraps reportService.getBurndown. The Burndown card is capability-gated
// (caps.burndown = sprint_count > 0); caller passes `enabled` once the
// useChartCapabilities response resolves true.
//
// `sprintId` is optional — omitted means "active sprint or most recent",
// matching the v1.0 BE behaviour. The Burndown card may eventually let
// the user pick a sprint, in which case the URL state will carry sprintId.

import { useQuery } from "@tanstack/react-query"
import {
  reportService,
  type BurndownData,
} from "@/services/report-service"

export function useBurndown(
  projectId: number | null | undefined,
  sprintId?: number,
  enabled: boolean = true,
) {
  return useQuery<BurndownData>({
    queryKey: ["report", "burndown", projectId, sprintId ?? null],
    queryFn: () => reportService.getBurndown(projectId!, sprintId),
    enabled: enabled && !!projectId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
