"use client"

// NotificationBell — header-mounted bildirim zili (Frontend2).
// Per D-01: shadcn/ui yok, inline style kullanılır.

import * as React from "react"
import { Bell, X, Check, ChevronRight } from "lucide-react"
import Link from "next/link"
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

export function NotificationBell() {
  const { language: lang } = useApp()
  const router = useRouter()
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif, clearRead } =
    useNotifications()

  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  // M-A5 — focus management: focus the panel on open, restore focus to the bell
  // trigger on close so keyboard/SR users don't lose their place.
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const wasOpenRef = React.useRef(false)

  // Click-outside dismiss
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Escape dismiss
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  // M-A5 — focus into the panel on open; restore to the trigger on close.
  React.useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      panelRef.current?.focus()
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false
      triggerRef.current?.focus()
    }
  }, [open])

  const handleRowClick = (n: NotificationItem) => {
    markRead(n.id)
    setOpen(false)

    if (!n.related_entity_id || n.type === "TASK_DELETED") return

    if (n.related_entity_type === "project") {
      router.push(`/projects/${n.related_entity_id}`)
    } else if (n.related_entity_type === "task") {
      router.push(`/tasks/${n.related_entity_id}`)
    }
  }

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null

  const triggerLabel =
    lang === "tr"
      ? `Bildirimler${unreadCount > 0 ? ` (${badgeLabel} okunmamış)` : ""}`
      : `Notifications${unreadCount > 0 ? ` (${badgeLabel} unread)` : ""}`

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex" }}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={triggerLabel}
        style={{
          color: "var(--fg-muted)",
          padding: 6,
          borderRadius: "var(--radius-sm)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: open ? "var(--surface-2)" : "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Bell size={16} />
        {badgeLabel && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              minWidth: 16,
              height: 16,
              padding: "0 3px",
              borderRadius: 999,
              background: "var(--priority-critical)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Popover panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={lang === "tr" ? "Bildirimler" : "Notifications"}
          tabIndex={-1}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            outline: "none",
            width: 320,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            zIndex: 999,
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
              {lang === "tr" ? "Bildirimler" : "Notifications"}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); markAllRead() }}
                  title={lang === "tr" ? "Tümünü okundu işaretle" : "Mark all read"}
                  style={{
                    fontSize: 11,
                    color: "var(--fg-muted)",
                    padding: "2px 6px",
                    borderRadius: "var(--radius-sm)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Check size={11} />
                  {lang === "tr" ? "Tümünü oku" : "Mark all read"}
                </button>
              )}
              {notifications.some((n) => n.is_read) && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearRead() }}
                  title={lang === "tr" ? "Okunmuşları temizle" : "Clear read"}
                  style={{
                    fontSize: 11,
                    color: "var(--fg-muted)",
                    padding: "2px 6px",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {lang === "tr" ? "Temizle" : "Clear"}
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 16px",
                gap: 8,
                color: "var(--fg-muted)",
              }}
            >
              <Bell size={32} strokeWidth={1.2} />
              <p style={{ fontSize: 13, margin: 0 }}>
                {lang === "tr" ? "Tüm bildirimleri okudunuz!" : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {notifications.map((n: NotificationItem) => {
                const isClickable = !!n.related_entity_id && n.type !== "TASK_DELETED"
                return (
                  <div
                    key={n.id}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onClick={() => handleRowClick(n)}
                    onKeyDown={(e) => {
                      // M-A5 — activate the row from the keyboard like a button.
                      if (
                        isClickable &&
                        (e.key === "Enter" || e.key === " ")
                      ) {
                        e.preventDefault()
                        handleRowClick(n)
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border)",
                      background: n.is_read ? "transparent" : "color-mix(in oklch, var(--primary) 4%, transparent)",
                      cursor: isClickable ? "pointer" : "default",
                    }}
                    onMouseEnter={(e) => {
                      if (isClickable) e.currentTarget.style.background = "var(--surface-2)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = n.is_read ? "transparent" : "color-mix(in oklch, var(--primary) 4%, transparent)"
                    }}
                  >
                    {/* Unread dot */}
                    <div style={{ flexShrink: 0, marginTop: 5 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: n.is_read ? "transparent" : "var(--primary)",
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--fg)",
                          margin: 0,
                          lineHeight: 1.4,
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
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(n.id) }}
                          title={lang === "tr" ? "Okundu işaretle" : "Mark read"}
                          aria-label={lang === "tr" ? "Okundu işaretle" : "Mark read"}
                          style={{
                            color: "var(--fg-muted)",
                            padding: 3,
                            borderRadius: "var(--radius-sm)",
                            display: "inline-flex",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(n.id) }}
                        title={lang === "tr" ? "Sil" : "Delete"}
                        aria-label={lang === "tr" ? "Bildirimi sil" : "Delete notification"}
                        style={{
                          color: "var(--fg-muted)",
                          padding: 3,
                          borderRadius: "var(--radius-sm)",
                          display: "inline-flex",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "8px 14px",
              fontSize: 12,
              color: "var(--fg-muted)",
              borderTop: "1px solid var(--border)",
              textDecoration: "none",
            }}
          >
            {lang === "tr" ? "Tüm bildirimleri gör" : "View all notifications"}
            <ChevronRight size={12} />
          </Link>
        </div>
      )}

    </div>
  )
}
