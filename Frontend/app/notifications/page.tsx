"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { notificationService, type NotificationItem as NotificationItemType } from "@/services/notification-service"
import { NotificationItem } from "@/components/notifications/notification-item"

const LIMIT = 20

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [offset, setOffset] = React.useState(0)
  const [accumulated, setAccumulated] = React.useState<NotificationItemType[]>([])
  const [total, setTotal] = React.useState(0)
  const [activeTab, setActiveTab] = React.useState<"all" | "unread">("all")

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-page", offset],
    queryFn: () => notificationService.list({ limit: LIMIT, offset }),
    staleTime: 30_000,
  })

  // Accumulate results as offset changes
  React.useEffect(() => {
    if (!data) return
    setTotal(data.total)
    if (offset === 0) {
      setAccumulated(data.notifications)
    } else {
      setAccumulated((prev) => {
        const existingIds = new Set(prev.map((n) => n.id))
        const newItems = data.notifications.filter((n) => !existingIds.has(n.id))
        return [...prev, ...newItems]
      })
    }
  }, [data, offset])

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: (_data, id) => {
      setAccumulated((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onSuccess: (_data, id) => {
      setAccumulated((prev) => prev.filter((n) => n.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      setAccumulated((prev) => prev.map((n) => ({ ...n, is_read: true })))
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const clearReadMutation = useMutation({
    mutationFn: () => notificationService.clearRead(),
    onSuccess: () => {
      const unread = accumulated.filter((n) => !n.is_read)
      setAccumulated(unread)
      setTotal(unread.length)
      setOffset(0)
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const handleLoadMore = () => {
    setOffset((prev) => prev + LIMIT)
  }

  const displayedNotifications =
    activeTab === "unread"
      ? accumulated.filter((n) => !n.is_read)
      : accumulated

  const showLoadMore = activeTab === "all" && total > accumulated.length

  return (
    <AppShell>
      <div className="max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Bildirimler</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Tümünü Okundu İşaretle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearReadMutation.mutate()}
              disabled={clearReadMutation.isPending}
            >
              Temizle
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="unread">Okunmamış</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading && offset === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-md bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Tüm bildirimlerinizi okudunuz!
              </div>
            ) : (
              <div className="rounded-md border divide-y">
                {displayedNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={(id) => markReadMutation.mutate(id)}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            )}

            {showLoadMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? "Yükleniyor..." : "Daha Fazla Yükle"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
