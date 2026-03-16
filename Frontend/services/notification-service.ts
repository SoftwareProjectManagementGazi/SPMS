import { apiClient } from '@/lib/api-client'

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

export type NotificationPreferences = {
  preferences: Record<string, { in_app: boolean; email: boolean }>
  email_enabled: boolean
  deadline_days: number
}

export const notificationService = {
  list: async (params?: {
    unread_only?: boolean
    limit?: number
    offset?: number
  }): Promise<NotificationListResponse> => {
    const response = await apiClient.get<NotificationListResponse>(
      '/notifications',
      { params }
    )
    return response.data
  },

  markRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read')
  },

  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`)
  },

  clearRead: async (): Promise<void> => {
    await apiClient.delete('/notifications/clear-read')
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<NotificationPreferences>(
      '/notifications/preferences'
    )
    return response.data
  },

  updatePreferences: async (
    data: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await apiClient.put<NotificationPreferences>(
      '/notifications/preferences',
      data
    )
    return response.data
  },
}
