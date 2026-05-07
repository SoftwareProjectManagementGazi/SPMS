import { apiClient } from "@/lib/api-client"

export type NotificationItem = {
  id: number
  message: string
  type: string
  is_read: boolean
  related_entity_id: number | null
  related_entity_type: string | null
  created_at: string
}

export type NotificationListResponse = {
  notifications: NotificationItem[]
  unread_count: number
  total: number
}

export const notificationService = {
  list: async (params?: {
    unread_only?: boolean
    limit?: number
    offset?: number
  }): Promise<NotificationListResponse> => {
    const response = await apiClient.get<NotificationListResponse>(
      "/notifications",
      { params }
    )
    return response.data
  },

  markRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post("/notifications/mark-all-read")
  },

  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`)
  },

  clearRead: async (): Promise<void> => {
    await apiClient.delete("/notifications/clear-read")
  },
}
