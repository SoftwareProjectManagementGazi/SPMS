"use client"

import * as React from "react"
import { ArrowLeft, Settings, UserPlus, Shield, Calendar } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/primitives/button"
import type { Team } from "@/services/team-service"

interface Props {
  team: Team
  isOwner: boolean
  onAddMember: () => void
  onOpenSettings: () => void
  lang: string
}

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || "#1e40af").replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function darken(hex: string, amount: number): string {
  const h = (hex || "#1e40af").replace("#", "")
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - Math.round(255 * amount))
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - Math.round(255 * amount))
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - Math.round(255 * amount))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

function getInitials(name: string): string {
  return (
    (name ?? "")
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  )
}

function formatDate(iso: string | undefined, lang: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
      year: "numeric",
      month: "short",
    })
  } catch {
    return "—"
  }
}

export function TeamDetailHero({ team, isOwner, onAddMember, onOpenSettings, lang }: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)
  const color = team.color || "#1e40af"
  const leader = team.leader_id != null ? team.members.find((m) => m.id === team.leader_id) : null
  const initials = getInitials(team.name)

  // Diagonal stripe pattern — daha belirgin (kartla aynı)
  const stripePattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M-1 1l10-10M0 28l28-28M21 35l14-14' stroke='%23ffffff' stroke-opacity='0.18' stroke-width='1.5'/%3E%3C/svg%3E")`

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Breadcrumb */}
      <Link
        href="/teams"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--fg-muted)",
          textDecoration: "none",
          marginBottom: 14,
          whiteSpace: "nowrap",
        }}
      >
        <ArrowLeft size={13} />
        {T("Takımlara Dön", "Back to Teams")}
      </Link>

      {/* Diagonal banner — koyudan canlıya gradient + stripes */}
      <div
        style={{
          height: 140,
          borderRadius: "var(--radius-md, 8px) var(--radius-md, 8px) 0 0",
          background: `${stripePattern}, linear-gradient(135deg, ${darken(color, 0.15)} 0%, ${color} 100%)`,
        }}
      />

      {/* Hero body — avatar tile overlaps banner */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderTop: "none",
          borderRadius: "0 0 var(--radius-md, 8px) var(--radius-md, 8px)",
          background: "var(--surface)",
          padding: "0 24px 22px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 20,
            marginTop: -44,
            flexWrap: "wrap",
          }}
        >
          {/* Avatar tile */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${darken(color, 0.15)} 0%, ${color} 100%)`,
              color: "#fff",
              fontSize: 32,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "4px solid var(--surface)",
              flexShrink: 0,
              letterSpacing: -0.5,
            }}
          >
            {initials}
          </div>

          {/* Title + meta */}
          <div style={{ flex: "1 1 320px", minWidth: 0, paddingTop: 52 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--fg)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {team.name}
              </h1>
              {team.department && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--fg)",
                    background: "var(--bg-subtle, #f1f1ee)",
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "3px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {team.department}
                </span>
              )}
            </div>

            {team.description && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--fg-muted)",
                  margin: "6px 0 0",
                  lineHeight: 1.5,
                }}
              >
                {team.description}
              </p>
            )}

            {/* Meta row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
                marginTop: 10,
              }}
            >
              {leader && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--fg-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Shield size={13} />
                  {T("Lider", "Lead")}:{" "}
                  <span style={{ color: "var(--fg)", fontWeight: 500 }}>{leader.full_name}</span>
                </span>
              )}
              {team.created_at && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--fg-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Calendar size={13} />
                  {T("Kuruldu", "Created")}:{" "}
                  <span style={{ color: "var(--fg)", fontWeight: 500 }}>
                    {formatDate(team.created_at, lang)}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Right buttons */}
          {isOwner && (
            <div
              style={{
                display: "flex",
                gap: 8,
                paddingTop: 52,
                flexShrink: 0,
              }}
            >
              <Button variant="secondary" size="sm" icon={<UserPlus size={13} />} onClick={onAddMember}>
                {T("Üye Ekle", "Add Member")}
              </Button>
              <Button variant="secondary" size="sm" icon={<Settings size={13} />} onClick={onOpenSettings}>
                {T("Ayarlar", "Settings")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}