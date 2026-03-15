import { apiClient } from '@/lib/api-client'

export interface BoardColumn {
  id: number
  project_id: number
  name: string
  order_index: number
  wip_limit: number
  task_count: number
}

export interface CreateColumnData {
  name: string
  order_index: number
}

export interface UpdateColumnData {
  name?: string
  order_index?: number
}

export const boardColumnService = {
  getColumns: (projectId: number | string): Promise<BoardColumn[]> =>
    apiClient.get(`/projects/${projectId}/columns`).then(r => r.data),

  createColumn: (projectId: number | string, data: CreateColumnData): Promise<BoardColumn> =>
    apiClient.post(`/projects/${projectId}/columns`, data).then(r => r.data),

  updateColumn: (
    projectId: number | string,
    columnId: number,
    data: UpdateColumnData
  ): Promise<BoardColumn> =>
    apiClient.patch(`/projects/${projectId}/columns/${columnId}`, data).then(r => r.data),

  deleteColumn: (
    projectId: number | string,
    columnId: number,
    moveTasksToColumnId: number
  ): Promise<void> =>
    apiClient
      .delete(`/projects/${projectId}/columns/${columnId}`, {
        params: { move_tasks_to_column_id: moveTasksToColumnId },
      })
      .then(r => r.data),
}
