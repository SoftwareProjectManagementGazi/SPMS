"use client"
import {
  Bell,
  Trash2,
  Check,
  MessageCircle,
  UserCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { NotificationItem as NotificationItemType } from "@/services/notification-service"

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return "az önce"
  } else if (diffMinutes < 60) {
    return `${diffMinutes} dakika önce`
  } else if (diffHours < 24) {
    return `${diffHours} saat önce`
  } else if (diffDays === 1) {
    return "1 gün önce"
  } else {
    return `${diffDays} gün önce`
  }
}

function NotificationTypeIcon({ type }: { type: string }) {
  const iconClass = "h-4 w-4 flex-shrink-0"
  switch (type) {
    case "TASK_ASSIGNED":
      return <UserCheck className={iconClass} />
    case "COMMENT_ADDED":
      return <MessageCircle className={iconClass} />
    case "DEADLINE_APPROACHING":
      return <AlertCircle className={iconClass} />
    case "STATUS_CHANGE":
      return <Check className={iconClass} />
    case "TASK_DELETED":
      return <Trash2 className={iconClass} />
    case "PROJECT_CREATED":
    case "PROJECT_DELETED":
    case "PROJECT_UPDATED":
    case "PROJECT_UPDATE":
      return <ExternalLink className={iconClass} />
    default:
      return <Bell className={iconClass} />
  }
}

interface NotificationItemProps {
  notification: NotificationItemType
  onMarkRead: (id: number) => void
  onDelete: (id: number) => void
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  const router = useRouter()

  const handleRowClick = () => {
    onMarkRead(notification.id)
    if (
      notification.type !== "TASK_DELETED" &&
      notification.related_entity_id !== null
    ) {
      if (notification.related_entity_type === "task") {
        router.push(`/tasks/${notification.related_entity_id}`)
      } else {
        router.push(`/projects/${notification.related_entity_id}`)
      }
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(notification.id)
  }

  return (
    <div
      onClick={handleRowClick}
      className={`flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors ${
        notification.is_read ? "bg-background" : "bg-accent/30"
      }`}
    >
      <div className="mt-0.5 text-muted-foreground">
        <NotificationTypeIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug break-words">{notification.message}</p>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(notification.created_at)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
        onClick={handleDeleteClick}
        title="Bildirimi sil"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
