// Led-Teams hook (Phase 12 Plan 12-01) — TanStack Query wrapper around
// GET /users/me/led-teams. 5-min staleTime per CONTEXT D-03 — team
// memberships rarely change.

import { useQuery } from "@tanstack/react-query"
import { ledTeamsService, type LedTeam } from "@/services/led-teams-service"

export function useLedTeams() {
  return useQuery<LedTeam[]>({
    queryKey: ["users", "me", "led-teams"],
    queryFn: ledTeamsService.getMine,
    staleTime: 5 * 60 * 1000,
  })
}
