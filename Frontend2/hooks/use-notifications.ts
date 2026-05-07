import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { notificationService } from "@/services/notification-service"

const POLL_INTERVAL =
  typeof window !== "undefined"
    ? Number(process.env.NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL_MS) || 30000
    : false

export function useNotifications() {
  const [isTabActive, setIsTabActive] = useState(true)
  const queryClient = useQueryClient()
  const prevUnreadCount = useRef<number>(0)

  useEffect(() => {
    const handle = () => setIsTabActive(!document.hidden)
    document.addEventListener("visibilitychange", handle)
    return () => document.removeEventListener("visibilitychange", handle)
  }, [])

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list({ limit: 20 }),
    refetchInterval: isTabActive ? POLL_INTERVAL : false,
    refetchIntervalInBackground: false,
  })

  useEffect(() => {
    prevUnreadCount.current = query.data?.unread_count ?? 0
  }, [query.data?.unread_count])

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const deleteNotif = useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const clearRead = useMutation({
    mutationFn: () => notificationService.clearRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unread_count ?? 0,
    isLoading: query.isLoading,
    markRead: (id: number) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
    deleteNotif: (id: number) => deleteNotif.mutate(id),
    clearRead: () => clearRead.mutate(),
  }
}
