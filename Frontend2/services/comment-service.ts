import { apiClient } from "@/lib/api-client"

export interface Comment {
  id: number
  taskId: number
  body: string
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string | null
  deleted: boolean
}

interface CommentResponseDTO {
  id: number
  task_id: number
  body: string
  author_id: number
  author_name: string
  created_at: string
  updated_at: string | null
  deleted?: boolean
}

function mapComment(d: CommentResponseDTO): Comment {
  return {
    id: d.id,
    taskId: d.task_id,
    body: d.body,
    authorId: d.author_id,
    authorName: d.author_name ?? "",
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    deleted: d.deleted ?? false,
  }
}

export const commentService = {
  getByTask: async (taskId: number): Promise<Comment[]> => {
    const resp = await apiClient.get<CommentResponseDTO[]>(`/comments`, {
      params: { task_id: taskId },
    })
    return resp.data.map(mapComment)
  },
  create: async (taskId: number, body: string): Promise<Comment> => {
    const resp = await apiClient.post<CommentResponseDTO>(`/comments`, { task_id: taskId, body })
    return mapComment(resp.data)
  },
  update: async (id: number, body: string): Promise<Comment> => {
    const resp = await apiClient.patch<CommentResponseDTO>(`/comments/${id}`, { body })
    return mapComment(resp.data)
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/comments/${id}`)
  },
}
