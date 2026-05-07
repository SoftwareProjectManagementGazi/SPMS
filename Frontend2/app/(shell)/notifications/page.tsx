"use client"

import { Bell, Check, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useApp } from "@/context/app-context"
import { useNotifications } from "@/hooks/use-notifications"
import type { NotificationItem } from "@/services/notification-service"

function timeAgo(dateStr: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (lang === "tr") {
    if (diff < 60) return `${diff}sn önce`
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`
    if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`
    return `${Math.floor(diff / 86400)}g önce`
  }
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationsPage() {
  const { language: lang } = useApp()
  const router = useRouter()
  const { notifications, unreadCount, isLoading, markRead, markAllRead, deleteNotif, clearRead } =
    useNotifications()
  const handleRowClick = (n: NotificationItem) => {
    markRead(n.id)

    if (!n.related_entity_id || n.type === "TASK_DELETED") return

    if (n.related_entity_type === "project") {
      router.push(`/projects/${n.related_entity_id}`)
    } else if (n.related_entity_type === "task") {
      router.push(`/tasks/${n.related_entity_id}`)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bell size={20} color="var(--fg)" />
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
            {lang === "tr" ? "Bildirimler" : "Notifications"}
          </h1>
          {unreadCount > 0 && (
            <span
              style={{
                background: "var(--danger, #e53e3e)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 999,
                padding: "1px 7px",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: "var(--fg-muted)",
                padding: "5px 10px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <Check size={13} />
              {lang === "tr" ? "Tümünü okundu işaretle" : "Mark all as read"}
            </button>
          )}
          {notifications.some((n) => n.is_read) && (
            <button
              onClick={() => clearRead()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: "var(--fg-muted)",
                padding: "5px 10px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
              {lang === "tr" ? "Okunmuşları temizle" : "Clear read"}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ color: "var(--fg-muted)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
          {lang === "tr" ? "Yükleniyor…" : "Loading…"}
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "60px 16px",
            color: "var(--fg-muted)",
          }}
        >
          <Bell size={40} strokeWidth={1.2} />
          <p style={{ fontSize: 14, margin: 0 }}>
            {lang === "tr" ? "Hiç bildiriminiz yok." : "No notifications yet."}
          </p>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 8px)",
            overflow: "hidden",
          }}
        >
          {notifications.map((n: NotificationItem, idx) => {
            const isClickable = !!n.related_entity_id && n.type !== "TASK_DELETED"
            return (
              <div
                key={n.id}
                onClick={() => handleRowClick(n)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom:
                    idx < notifications.length - 1 ? "1px solid var(--border)" : "none",
                  background: n.is_read ? "var(--bg)" : "var(--bg-subtle, rgba(99,102,241,.04))",
                  cursor: isClickable ? "pointer" : "default",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (isClickable) e.currentTarget.style.background = "var(--bg-subtle, rgba(0,0,0,.05))"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = n.is_read ? "var(--bg)" : "var(--bg-subtle, rgba(99,102,241,.04))"
                }}
              >
                {/* Unread dot */}
                <div style={{ flexShrink: 0, marginTop: 5 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: n.is_read ? "transparent" : "var(--accent, #6366f1)",
                  }} />
                </div>

                {/* Message + time */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--fg)",
                      margin: "0 0 3px",
                      lineHeight: 1.5,
                      fontWeight: n.is_read ? 400 : 500,
                    }}
                  >
                    {n.message}
                  </p>
                  <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                    {timeAgo(n.created_at, lang)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {!n.is_read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(n.id) }}
                      title={lang === "tr" ? "Okundu işaretle" : "Mark as read"}
                      style={{
                        color: "var(--fg-muted)",
                        padding: 4,
                        borderRadius: "var(--radius-sm)",
                        display: "inline-flex",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(n.id) }}
                    title={lang === "tr" ? "Sil" : "Delete"}
                    style={{
                      color: "var(--fg-muted)",
                      padding: 4,
                      borderRadius: "var(--radius-sm)",
                      display: "inline-flex",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
