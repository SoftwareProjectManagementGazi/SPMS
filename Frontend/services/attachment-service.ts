import { apiClient } from '@/lib/api-client'

export interface AttachmentUploader {
  id: number
  full_name: string
}

export interface Attachment {
  id: number
  task_id: number
  file_name: string
  file_path: string
  file_size: number | null
  uploader: AttachmentUploader | null
  uploaded_at: string
}

const BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.ps1', '.msi', '.dmg']

const attachmentService = {
  list: (taskId: number): Promise<Attachment[]> =>
    apiClient.get(`/attachments/task/${taskId}`).then(r => r.data),

  upload: (taskId: number, file: File): Promise<Attachment> => {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return Promise.reject(new Error(`File type ${ext} is not allowed`))
    }
    const form = new FormData()
    form.append('task_id', String(taskId))
    form.append('file', file)
    return apiClient.post('/attachments/', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data)
  },

  downloadUrl: (fileId: number): string =>
    `/api/v1/attachments/download/${fileId}`,

  delete: (fileId: number): Promise<void> =>
    apiClient.delete(`/attachments/${fileId}`).then(r => r.data),
}

export default attachmentService
