// Led-Teams service (Phase 12 Plan 12-01) — single endpoint for the
// transition-authority hook (CONTEXT D-03).
//
// GET /users/me/led-teams (Phase 9 D-17) — returns the teams this user leads
// plus the project IDs each team is mapped to. Cached 5 min via TanStack
// staleTime in use-led-teams.ts.

import { apiClient } from "@/lib/api-client"

export interface LedTeam {
  id: number
  name: string
  /** Project IDs this team is mapped to via TeamProjects. */
  project_ids: number[]
}

interface LedTeamResponseDTO {
  id: number
  name: string
  project_ids?: number[]
  /** Some backend versions return camelCase. */
  projectIds?: number[]
}

function mapLedTeam(d: LedTeamResponseDTO): LedTeam {
  return {
    id: d.id,
    name: d.name,
    project_ids: d.project_ids ?? d.projectIds ?? [],
  }
}

export const ledTeamsService = {
  getMine: async (): Promise<LedTeam[]> => {
    const resp = await apiClient.get<LedTeamResponseDTO[]>(`/users/me/led-teams`)
    return (resp.data ?? []).map(mapLedTeam)
  },
}
