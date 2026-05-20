// Reports migration v2 Wave 2 — Summary StatCards hook.
//
// Wraps reportService.getSummary. Used by the 4 StatCards on the Reports
// page (Sprint Velocity / Cycle Time / Completed / Blockers). Gated by
// caps.summary which is always true — the hook just needs a projectId.

import { useQuery } from "@tanstack/react-query"
import {
  reportService,
  type ReportFilters,
  type SummaryData,
} from "@/services/report-service"

export function useSummary(filters: ReportFilters, enabled: boolean = true) {
  return useQuery<SummaryData>({
    queryKey: ["report", "summary", filters],
    queryFn: () => reportService.getSummary(filters),
    enabled: enabled && filters.projectId != null,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
