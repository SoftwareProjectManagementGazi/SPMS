import { apiClient } from "@/lib/api-client"

export interface Label {
  id: number
  projectId: number
  name: string
  color: string
  usageCount: number
}

interface LabelResponseDTO {
  id: number
  project_id: number
  name: string
  color: string
  usage_count: number
}

function mapLabel(d: LabelResponseDTO): Label {
  return {
    id: d.id,
    projectId: d.project_id,
    name: d.name,
    color: d.color,
    usageCount: d.usage_count ?? 0,
  }
}

export const labelService = {
  getByProject: async (projectId: number): Promise<Label[]> => {
    const resp = await apiClient.get<LabelResponseDTO[]>(`/projects/${projectId}/labels`)
    return resp.data.map(mapLabel)
  },
  create: async (projectId: number, name: string, color?: string): Promise<Label> => {
    try {
      const resp = await apiClient.post<LabelResponseDTO>(`/labels`, {
        project_id: projectId,
        name,
        color,
      })
      return mapLabel(resp.data)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      // Pitfall 7: auto-create race — re-fetch and return existing label by name.
      if (status === 409) {
        const existing = await labelService.getByProject(projectId)
        const match = existing.find((l) => l.name.toLowerCase() === name.toLowerCase())
        if (match) return match
      }
      throw err
    }
  },
}
