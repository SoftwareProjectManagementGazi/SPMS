"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { notificationService } from "@/services/notification-service"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function useNotifications() {
  const [isTabActive, setIsTabActive] = useState(true)
  const queryClient = useQueryClient()
  const router = useRouter()
  const prevUnreadCount = useRef<number>(0)
  const pollInterval =
    typeof window !== "undefined"
      ? Number(process.env.NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL_MS) || 30000
      : false

  useEffect(() => {
    const handle = () => setIsTabActive(!document.hidden)
    document.addEventListener("visibilitychange", handle)
    return () => document.removeEventListener("visibilitychange", handle)
  }, [])

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list({ limit: 20 }),
    refetchInterval: isTabActive ? pollInterval : false,
    refetchIntervalInBackground: false,
  })

  // Detect new notifications and show toast
  useEffect(() => {
    const unread = query.data?.unread_count ?? 0
    if (unread > prevUnreadCount.current && prevUnreadCount.current !== 0) {
      const newest = query.data?.notifications?.[0]
      if (newest && !newest.is_read) {
        toast(newest.message, {
          description:
            newest.type === "TASK_DELETED" ? "Bu görev silindi" : undefined,
          action:
            newest.type !== "TASK_DELETED" && newest.related_entity_id
              ? {
                  label: "Görüntüle",
                  onClick: () => {
                    if (newest.related_entity_type === "task") {
                      router.push(`/tasks/${newest.related_entity_id}`)
                    } else {
                      router.push(`/projects/${newest.related_entity_id}`)
                    }
                  },
                }
              : undefined,
        })
      }
    }
    prevUnreadCount.current = unread
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
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    markRead: (id: number) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
    deleteNotif: (id: number) => deleteNotif.mutate(id),
    clearRead: () => clearRead.mutate(),
  }
}
