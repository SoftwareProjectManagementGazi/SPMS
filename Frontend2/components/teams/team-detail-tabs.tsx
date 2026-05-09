"use client"

import * as React from "react"

export type TeamTab = "overview" | "members" | "projects" | "activity"

interface Props {
  active: TeamTab
  onChange: (tab: TeamTab) => void
  memberCount: number
  projectCount?: number
  activityCount?: number
  color: string
  lang: string
}

export function TeamDetailTabs({
  active,
  onChange,
  memberCount,
  projectCount,
  activityCount,
  color,
  lang,
}: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  const tabs: { id: TeamTab; label: string; badge?: number }[] = [
    { id: "overview", label: T("Genel Bakış", "Overview") },
    { id: "members", label: T("Üyeler", "Members"), badge: memberCount },
    { id: "projects", label: T("Projeler", "Projects"), badge: projectCount },
    { id: "activity", label: T("Aktivite", "Activity"), badge: activityCount },
  ]

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        borderBottom: "1px solid var(--border)",
        marginBottom: 20,
        overflowX: "auto",
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? color : "var(--fg-muted)",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${isActive ? color : "transparent"}`,
              cursor: "pointer",
              transition: "color 0.1s, border-color 0.1s",
              whiteSpace: "nowrap",
              marginBottom: -1,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--fg)"
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--fg-muted)"
            }}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isActive ? color : "var(--fg-muted)",
                  minWidth: 14,
                  textAlign: "center",
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}