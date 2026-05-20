// Reports migration v2 Wave 2 — Phase Progress chart hook.
//
// Wraps reportService.getPhaseProgress (Reports v2 endpoint added in
// Wave 1a). The Phase Progress card is capability-gated by
// caps.phase_progress (= phase_workflow.nodes.length > 0).
//
// The BE response is already pre-ordered + zipped with archived nodes
// skipped — the hook just needs to surface the data.

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  reportService,
  type PhaseProgressData,
} from "@/services/report-service"

export function usePhaseProgress(
  projectId: number | null | undefined,
  enabled: boolean = true,
) {
  return useQuery<PhaseProgressData>({
    queryKey: ["report", "phase-progress", projectId],
    queryFn: () => reportService.getPhaseProgress(projectId!),
    enabled: enabled && !!projectId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  })
}
