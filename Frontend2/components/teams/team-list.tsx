"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { Team } from "@/services/team-service"

interface Props {
  teams: Team[]
  lang: string
}

const AVATAR_PALETTE = [
  "#dc2626",
  "#0891b2",
  "#15803d",
  "#7c3aed",
  "#ea580c",
  "#db2777",
  "#1e40af",
  "#b45309",
]

function getInitials(name: string, count = 2): string {
  return (
    (name ?? "")
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .slice(0, count)
      .toUpperCase() || "?"
  )
}

function colorForId(id: number): string {
  return AVATAR_PALETTE[Math.abs(id) % AVATAR_PALETTE.length]
}

function darken(hex: string, amount: number): string {
  const h = (hex || "#1e40af").replace("#", "")
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - Math.round(255 * amount))
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - Math.round(255 * amount))
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - Math.round(255 * amount))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

export function TeamList({ teams, lang }: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md, 8px)",
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) 140px 120px 160px 28px",
          alignItems: "center",
          gap: 14,
          padding: "9px 16px",
          background: "var(--bg-subtle, #f1f1ee)",
          borderBottom: "1px solid var(--border)",
          fontSize: 10,
          fontWeight: 700,
          color: "var(--fg-muted)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <span>{T("TAKIM", "TEAM")}</span>
        <span>{T("DEPARTMAN", "DEPARTMENT")}</span>
        <span>{T("ÜYELER", "MEMBERS")}</span>
        <span>{T("LİDER", "LEAD")}</span>
        <span />
      </div>

      {/* Rows */}
      {teams.map((team, idx) => {
        const color = team.color || "#1e40af"
        const leader =
          team.leader_id != null ? team.members.find((m) => m.id === team.leader_id) : null
        const tileInitials = getInitials(team.name, 2)

        return (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 2fr) 140px 120px 160px 28px",
                alignItems: "center",
                gap: 14,
                padding: "10px 16px",
                borderBottom: idx === teams.length - 1 ? "none" : "1px solid var(--border)",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-subtle, #faf9f6)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              {/* TAKIM */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: `linear-gradient(135deg, ${darken(color, 0.15)} 0%, ${color} 100%)`,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    letterSpacing: -0.3,
                  }}
                >
                  {tileInitials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--fg)",
                      margin: 0,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {team.name}
                  </p>
                  {team.description && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--fg-muted)",
                        margin: "1px 0 0",
                        lineHeight: 1.3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {team.description}
                    </p>
                  )}
                </div>
              </div>

              {/* DEPARTMAN */}
              <div>
                {team.department ? (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "var(--fg)",
                      background: "var(--bg-subtle, #f1f1ee)",
                      borderRadius: 999,
                      padding: "3px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {team.department}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>—</span>
                )}
              </div>

              {/* ÜYELER */}
              <div style={{ display: "flex", alignItems: "center" }}>
                {team.members.slice(0, 3).map((m, i) => (
                  <div
                    key={m.id}
                    title={m.full_name}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: colorForId(m.id),
                      color: "#fff",
                      fontSize: 8,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--surface)",
                      marginLeft: i === 0 ? 0 : -6,
                      zIndex: 3 - i,
                      position: "relative",
                    }}
                  >
                    {getInitials(m.full_name)}
                  </div>
                ))}
                {team.members.length > 3 && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--bg-subtle, #f1f1ee)",
                      color: "var(--fg-muted)",
                      fontSize: 9,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--surface)",
                      marginLeft: -6,
                      position: "relative",
                    }}
                  >
                    +{team.members.length - 3}
                  </div>
                )}
              </div>

              {/* LİDER */}
              <div style={{ minWidth: 0 }}>
                {leader ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: colorForId(leader.id),
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(leader.full_name)}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--fg)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {leader.full_name.split(" ")[0]}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>—</span>
                )}
              </div>

              {/* Chevron */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ChevronRight size={14} color="var(--fg-muted)" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}