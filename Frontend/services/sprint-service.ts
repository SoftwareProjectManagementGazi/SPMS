import { apiClient } from '@/lib/api-client'

export interface Sprint {
  id: number
  project_id: number
  name: string
  goal: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
}

export interface SprintCreateData {
  project_id: number
  name: string
  goal?: string
  start_date?: string
  end_date?: string
}

const sprintService = {
  list: (projectId: number): Promise<Sprint[]> =>
    apiClient.get('/sprints', { params: { project_id: projectId } }).then(r => r.data),

  create: (data: SprintCreateData): Promise<Sprint> =>
    apiClient.post('/sprints', data).then(r => r.data),

  update: (sprintId: number, data: Partial<Sprint>): Promise<Sprint> =>
    apiClient.patch(`/sprints/${sprintId}`, data).then(r => r.data),

  delete: (sprintId: number): Promise<void> =>
    apiClient.delete(`/sprints/${sprintId}`).then(r => r.data),
}

export default sprintService
