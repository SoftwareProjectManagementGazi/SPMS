// Reports migration v2 Wave 2 — Team Load card hook.
//
// Wraps reportService.getPerformance and exposes the derived loadEntries
// projection. The Team Load card slices the top 6 entries by load_pct;
// the raw `members` array is also available for future TeamPerformance
// table consumers (if user requests).
//
// Capability-gated by caps.team_load (= member_count > 0).

import { useQuery } from "@tanstack/react-query"
import {
  reportService,
  type ReportFilters,
  type PerformanceData,
} from "@/services/report-service"

export function useTeamLoad(filters: ReportFilters, enabled: boolean = true) {
  return useQuery<PerformanceData>({
    queryKey: ["report", "team-load", filters],
    queryFn: () => reportService.getPerformance(filters),
    enabled: enabled && filters.projectId != null,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
