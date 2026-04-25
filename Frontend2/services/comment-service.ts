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
    // Backend returns null body for soft-deleted comments (the deleted flag
    // is set on the row, body is cleared). Coerce to empty string so
    // downstream string ops (stripHtml, etc.) never see null/undefined.
    body: d.body ?? "",
    authorId: d.author_id,
    authorName: d.author_name ?? "",
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    deleted: d.deleted ?? false,
  }
}

// Backend endpoints (Backend/app/api/v1/comments.py):
//   GET    /comments/task/{task_id}   -> list comments for a task
//   POST   /comments/                  -> create (body { task_id, body })
//   PATCH  /comments/{id}              -> update body
//   DELETE /comments/{id}              -> delete
// The previous frontend used `/comments?task_id=` which 405'd because no GET
// is registered on the bare /comments path; FastAPI's auto-redirect from
// `/comments` to `/comments/` made the failure noisy (307 + 405) on every
// task-tab switch. Hitting the trailing slash on POST avoids the same
// redirect on writes.
export const commentService = {
  getByTask: async (taskId: number): Promise<Comment[]> => {
    const resp = await apiClient.get<CommentResponseDTO[]>(
      `/comments/task/${taskId}`,
    )
    return resp.data.map(mapComment)
  },
  create: async (taskId: number, body: string): Promise<Comment> => {
    const resp = await apiClient.post<CommentResponseDTO>(`/comments/`, {
      task_id: taskId,
      body,
    })
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
