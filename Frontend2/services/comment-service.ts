import { apiClient } from "@/lib/api-client"

export interface Comment {
  id: number
  taskId: number
  body: string
  authorId: number
  authorName: string
  /** Author avatar (backend `author.avatar_path`); null → the Avatar primitive
   *  falls back to initials. */
  authorAvatarUrl: string | null
  createdAt: string
  updatedAt: string | null
  /** The backend list endpoint ALWAYS excludes soft-deleted comments
   *  (comment_repo.get_by_task → WHERE is_deleted == False), so this is always
   *  false today. Kept so the consumer's deleted-placeholder branch type-checks. */
  deleted: boolean
}

// Backend contract — Backend/app/application/dtos/comment_dtos.py:
//   { id, task_id, content, author: { id, full_name, avatar_path }, created_at,
//     updated_at, is_edited }
// i.e. `content` (NOT `body`), a NESTED `author` object (NOT flat author_id /
// author_name), and `is_edited` (NOT `deleted`). The previous mapper read
// body/author_id/author_name, so every comment rendered "Kullanıcı #undefined"
// with an initials-fallback avatar, and create/update SENT `body` (the backend
// CommentCreateDTO/UpdateDTO require `content`, so writes 422'd). This file
// realigns the whole contract.
interface CommentAuthorDTO {
  id: number
  full_name: string
  avatar_path: string | null
}

interface CommentResponseDTO {
  id: number
  task_id: number
  content: string
  author: CommentAuthorDTO
  created_at: string
  updated_at: string | null
  is_edited?: boolean
}

function mapComment(d: CommentResponseDTO): Comment {
  return {
    id: d.id,
    taskId: d.task_id,
    body: d.content ?? "",
    authorId: d.author.id,
    authorName: d.author.full_name ?? "",
    authorAvatarUrl: d.author.avatar_path ?? null,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    deleted: false,
  }
}

// Backend endpoints (Backend/app/api/v1/comments.py):
//   GET    /comments/task/{task_id}   -> list comments for a task
//   POST   /comments/                  -> create (body { task_id, content })
//   PATCH  /comments/{id}              -> update (body { content })
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
      content: body,
    })
    return mapComment(resp.data)
  },
  update: async (id: number, body: string): Promise<Comment> => {
    const resp = await apiClient.patch<CommentResponseDTO>(`/comments/${id}`, {
      content: body,
    })
    return mapComment(resp.data)
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/comments/${id}`)
  },
}
