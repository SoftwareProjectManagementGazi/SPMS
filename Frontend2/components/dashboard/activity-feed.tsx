"use client"
import * as React from "react"
import { Card, Avatar } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export interface ActivityItem {
  id: string | number
  action: string
  user_name: string
  user_avatar?: string | null
  timestamp: string
  entity_type?: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

function formatTime(timestamp: string, language: string): string {
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ""

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)

  if (diffMin < 1) return language === "tr" ? "şimdi" : "now"
  if (diffMin < 60) return language === "tr" ? `${diffMin} dk` : `${diffMin}m`
  if (diffHr < 24) return language === "tr" ? `${diffHr} sa` : `${diffHr}h`

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (isToday) {
    return d.toLocaleTimeString(language === "tr" ? "tr-TR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return d.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
  })
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const { language } = useApp()

  return (
    <Card padding={0}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        fontSize: 13,
        fontWeight: 600,
      }}>
        {language === "tr" ? "Son aktivite" : "Recent activity"}
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div style={{
          padding: "40px 16px",
          textAlign: "center",
          fontSize: 12.5,
          color: "var(--fg-subtle)",
        }}>
          {language === "tr" ? "Henüz aktivite yok." : "No activity yet."}
        </div>
      ) : (
        <div
          style={{
            maxHeight: 360,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {items.map((item, i) => {
            const firstName = item.user_name?.split(" ")[0] ?? item.user_name
            const initials = getInitials(item.user_name ?? "?")
            const avatarUser = { initials, avColor: (i % 8) + 1 }
            const timeStr = formatTime(item.timestamp, language)

            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px 16px",
                  borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
                  alignItems: "center",
                }}
              >
                <Avatar user={avatarUser} size={22} />
                <div style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>
                  <span style={{ fontWeight: 600 }}>{firstName}</span>
                  <span style={{ color: "var(--fg-muted)" }}> {item.action}</span>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--fg-subtle)",
                    flexShrink: 0,
                  }}
                >
                  {timeStr}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
