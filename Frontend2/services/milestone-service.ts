// Milestone service (Phase 12 Plan 12-01) — CRUD for project milestones.
//
// Endpoints (Phase 9 API-07):
//   GET /projects/{id}/milestones
//   POST /projects/{id}/milestones
//   PATCH /milestones/{id}
//   DELETE /milestones/{id}

import { apiClient } from "@/lib/api-client"

export interface Milestone {
  id: number
  projectId: number
  name: string
  targetDate: string
  status: string
  linkedPhaseIds: string[]
  createdAt: string
  updatedAt?: string | null
}

interface MilestoneResponseDTO {
  id: number
  project_id: number
  name: string
  target_date: string
  status: string
  linked_phase_ids?: string[]
  created_at: string
  updated_at?: string | null
}

export interface MilestoneCreateDTO {
  name: string
  target_date: string
  linked_phase_ids?: string[]
}

export interface MilestoneUpdateDTO {
  name?: string
  target_date?: string
  status?: string
  linked_phase_ids?: string[]
}

function mapMilestone(d: MilestoneResponseDTO): Milestone {
  return {
    id: d.id,
    projectId: d.project_id,
    name: d.name,
    targetDate: d.target_date,
    status: d.status,
    linkedPhaseIds: d.linked_phase_ids ?? [],
    createdAt: d.created_at,
    updatedAt: d.updated_at ?? null,
  }
}

export const milestoneService = {
  getByProject: async (projectId: number): Promise<Milestone[]> => {
    const resp = await apiClient.get<MilestoneResponseDTO[]>(
      `/projects/${projectId}/milestones`,
    )
    return resp.data.map(mapMilestone)
  },
  create: async (projectId: number, dto: MilestoneCreateDTO): Promise<Milestone> => {
    const resp = await apiClient.post<MilestoneResponseDTO>(
      `/projects/${projectId}/milestones`,
      dto,
    )
    return mapMilestone(resp.data)
  },
  update: async (id: number, dto: MilestoneUpdateDTO): Promise<Milestone> => {
    const resp = await apiClient.patch<MilestoneResponseDTO>(`/milestones/${id}`, dto)
    return mapMilestone(resp.data)
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/milestones/${id}`)
  },
}
