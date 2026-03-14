import { apiClient } from '@/lib/api-client'

export interface CommentAuthor {
  id: number
  full_name: string
  avatar_path: string | null
}

export interface Comment {
  id: number
  task_id: number
  content: string
  author: CommentAuthor
  created_at: string
  updated_at: string | null
  is_edited: boolean
}

const commentService = {
  list: (taskId: number): Promise<Comment[]> =>
    apiClient.get(`/comments/task/${taskId}`).then(r => r.data),

  create: (data: { task_id: number; content: string }): Promise<Comment> =>
    apiClient.post('/comments/', data).then(r => r.data),

  update: (commentId: number, content: string): Promise<Comment> =>
    apiClient.patch(`/comments/${commentId}`, { content }).then(r => r.data),

  delete: (commentId: number): Promise<void> =>
    apiClient.delete(`/comments/${commentId}`).then(r => r.data),
}

export default commentService
