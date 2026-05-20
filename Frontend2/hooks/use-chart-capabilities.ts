// Reports migration v2 (Strategy D) — chart capability hook.
//
// Single TanStack query against the backend's /chart-capabilities endpoint.
// The endpoint owns the rule registry; the FE stays a thin consumer that
// reads booleans and renders chart gates accordingly. This replaces the
// FE-side mirror at lib/charts/applicability.ts (now deleted) — the
// methodology-derived applicability table was an architectural debt that
// drifted from the post-Phase-17 capability-driven backend.
//
// Caching choices:
//   - staleTime 30s — capability changes rarely (workflow editor toggles,
//     sprint creation). 30s keeps card gates stable across user interaction
//     but still picks up workflow-editor mutations within half a minute.
//   - refetchOnWindowFocus: false — focus events thrash 7+ charts otherwise,
//     and capabilities almost never change purely because the user switched
//     tabs (data refetches are handled by the per-chart hooks instead).

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

/** Backend response shape for GET /projects/{id}/chart-capabilities.
 *  Each key maps 1:1 to CHART_CAPABILITY_RULES in
 *  Backend/app/domain/services/chart_applicability.py. */
export interface ChartCapabilities {
  burndown: boolean
  iteration: boolean
  cfd: boolean
  lead_cycle: boolean
  phase_progress: boolean
  team_load: boolean
  summary: boolean
}

export function useChartCapabilities(projectId: number | null | undefined) {
  return useQuery<ChartCapabilities>({
    queryKey: ["chart", "capabilities", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<ChartCapabilities>(
        `/projects/${projectId}/chart-capabilities`,
      )
      return data
    },
    enabled: !!projectId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
