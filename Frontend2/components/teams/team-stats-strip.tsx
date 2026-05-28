"use client"

import * as React from "react"
import type { TeamsStats } from "@/services/team-service"

interface Props {
  stats: TeamsStats | null
  teamCount: number
  loading?: boolean
  lang: string
}

export function TeamStatsStrip({ stats, teamCount, loading, lang }: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  const items = [
    { value: teamCount, label: T("TAKIM", "TEAMS") },
    { value: stats?.total_members ?? 0, label: T("TOPLAM ÜYE", "TOTAL MEMBERS") },
    { value: stats?.active_projects ?? 0, label: T("AKTİF PROJE", "ACTIVE PROJECTS") },
    { value: stats?.active_tasks ?? 0, label: T("AKTİF GÖREV", "ACTIVE TASKS") },
  ]

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 8px)",
            background: "var(--surface)",
            padding: "14px 18px",
          }}
        >
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--fg)",
              margin: 0,
              lineHeight: 1,
              opacity: loading ? 0.4 : 1,
              transition: "opacity 0.2s",
              letterSpacing: -0.5,
            }}
          >
            {it.value}
          </p>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--fg-muted)",
              margin: "8px 0 0",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {it.label}
          </p>
        </div>
      ))}
    </div>
  )
}