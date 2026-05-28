import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"
import { useEffect, useState } from "react"
import {
  notificationService,
  type NotificationItem,
  type NotificationListResponse,
} from "@/services/notification-service"

const PAGE_SIZE = 20
const POLL_INTERVAL =
  typeof window !== "undefined"
    ? Number(process.env.NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL_MS) || 30000
    : false

const NOTIF_KEY = ["notifications"] as const
type NotifData = InfiniteData<NotificationListResponse, number>

export function useNotifications() {
  const [isTabActive, setIsTabActive] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    const handle = () => setIsTabActive(!document.hidden)
    document.addEventListener("visibilitychange", handle)
    return () => document.removeEventListener("visibilitychange", handle)
  }, [])

  // Infinite list so the page can load past the first 20 (previously the only
  // page that ever loaded). unread_count / total are server-side totals carried
  // on every page response.
  const query = useInfiniteQuery({
    queryKey: NOTIF_KEY,
    queryFn: ({ pageParam }) =>
      notificationService.list({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.notifications.length, 0)
      return loaded < lastPage.total ? loaded : undefined
    },
    refetchInterval: isTabActive ? POLL_INTERVAL : false,
    refetchIntervalInBackground: false,
  })

  // Optimistic mutations (rollback on error). Operate across every loaded page
  // so the row state + badge update instantly — clicking a row to navigate no
  // longer races the read state behind the round-trip.
  const cancel = () => queryClient.cancelQueries({ queryKey: NOTIF_KEY })
  const snapshot = () => queryClient.getQueryData<NotifData>(NOTIF_KEY)
  const rollback = (ctx: { prev?: NotifData } | undefined) => {
    if (ctx?.prev) queryClient.setQueryData(NOTIF_KEY, ctx.prev)
  }
  const settle = () => queryClient.invalidateQueries({ queryKey: NOTIF_KEY })

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onMutate: async (id) => {
      await cancel()
      const prev = snapshot()
      queryClient.setQueryData<NotifData>(NOTIF_KEY, (old) => {
        if (!old) return old
        const wasUnread = old.pages.some((p) =>
          p.notifications.some((n) => n.id === id && !n.is_read),
        )
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            unread_count: Math.max(0, page.unread_count - (wasUnread ? 1 : 0)),
            notifications: page.notifications.map((n) =>
              n.id === id ? { ...n, is_read: true } : n,
            ),
          })),
        }
      })
      return { prev }
    },
    onError: (_e, _id, ctx) => rollback(ctx),
    onSettled: settle,
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: async () => {
      await cancel()
      const prev = snapshot()
      queryClient.setQueryData<NotifData>(NOTIF_KEY, (old) =>
        old && {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            unread_count: 0,
            notifications: page.notifications.map((n) =>
              n.is_read ? n : { ...n, is_read: true },
            ),
          })),
        },
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: settle,
  })

  const deleteNotif = useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onMutate: async (id) => {
      await cancel()
      const prev = snapshot()
      queryClient.setQueryData<NotifData>(NOTIF_KEY, (old) => {
        if (!old) return old
        const target = old.pages
          .flatMap((p) => p.notifications)
          .find((n) => n.id === id)
        const wasUnread = target ? !target.is_read : false
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            total: Math.max(0, page.total - (target ? 1 : 0)),
            unread_count: Math.max(0, page.unread_count - (wasUnread ? 1 : 0)),
            notifications: page.notifications.filter((n) => n.id !== id),
          })),
        }
      })
      return { prev }
    },
    onError: (_e, _id, ctx) => rollback(ctx),
    onSettled: settle,
  })

  const clearRead = useMutation({
    mutationFn: () => notificationService.clearRead(),
    onMutate: async () => {
      await cancel()
      const prev = snapshot()
      queryClient.setQueryData<NotifData>(NOTIF_KEY, (old) => {
        if (!old) return old
        const removed = old.pages
          .flatMap((p) => p.notifications)
          .filter((n) => n.is_read).length
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            total: Math.max(0, page.total - removed),
            notifications: page.notifications.filter((n) => !n.is_read),
          })),
        }
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: settle,
  })

  const pages = query.data?.pages ?? []
  const notifications: NotificationItem[] = pages.flatMap((p) => p.notifications)
  const unreadCount = pages[0]?.unread_count ?? 0

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => query.fetchNextPage(),
    markRead: (id: number) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
    deleteNotif: (id: number) => deleteNotif.mutate(id),
    clearRead: () => clearRead.mutate(),
  }
}
