import { apiClient } from "@/lib/api-client"

export interface Attachment {
  id: number
  taskId: number
  filename: string
  size: number
  uploaderId: number
  uploaderName: string
  uploadedAt: string
  url: string
  type: "file" | "link"
  linkUrl: string | null
}

interface AttachmentResponseDTO {
  id: number
  task_id: number
  filename: string
  size: number
  uploader_id: number
  uploader_name?: string
  uploaded_at: string
  url: string
  type?: "file" | "link"
  link_url?: string | null
}

function mapAttachment(d: AttachmentResponseDTO): Attachment {
  return {
    id: d.id,
    taskId: d.task_id,
    filename: d.filename,
    size: d.size,
    uploaderId: d.uploader_id,
    uploaderName: d.uploader_name ?? "",
    uploadedAt: d.uploaded_at,
    url: d.url,
    type: d.type ?? "file",
    linkUrl: d.link_url ?? null,
  }
}

export const attachmentService = {
  getByTask: async (taskId: number): Promise<Attachment[]> => {
    const resp = await apiClient.get<AttachmentResponseDTO[]>(`/attachments/task/${taskId}`)
    return resp.data.map(mapAttachment)
  },
  upload: async (taskId: number, file: File): Promise<Attachment> => {
    const form = new FormData()
    form.append("task_id", String(taskId))
    form.append("file", file)
    const resp = await apiClient.post<AttachmentResponseDTO>(`/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return mapAttachment(resp.data)
  },
  createLink: async (taskId: number, url: string, title?: string): Promise<Attachment> => {
    const resp = await apiClient.post<AttachmentResponseDTO>(`/attachments`, {
      task_id: taskId,
      type: "link",
      link_url: url,
      filename: title ?? url,
    })
    return mapAttachment(resp.data)
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/attachments/${id}`)
  },
}
