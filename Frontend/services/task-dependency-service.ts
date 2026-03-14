import { apiClient } from '@/lib/api-client'

export interface DependencySummary {
  id: number
  task_id: number
  depends_on_id: number
  dependency_type: string
  depends_on_key: string | null
  depends_on_title: string | null
}

export interface DependencyList {
  blocks: DependencySummary[]
  blocked_by: DependencySummary[]
}

const taskDependencyService = {
  list: (taskId: number): Promise<DependencyList> =>
    apiClient.get(`/tasks/${taskId}/dependencies`).then(r => r.data),

  add: (taskId: number, dependsOnId: number): Promise<DependencySummary> =>
    apiClient.post(`/tasks/${taskId}/dependencies`, {
      task_id: taskId,
      depends_on_id: dependsOnId,
      dependency_type: 'blocks',
    }).then(r => r.data),

  remove: (taskId: number, dependencyId: number): Promise<void> =>
    apiClient.delete(`/tasks/${taskId}/dependencies/${dependencyId}`).then(r => r.data),
}

export default taskDependencyService
