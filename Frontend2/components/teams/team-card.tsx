"use client"

import * as React from "react"
import Link from "next/link"
import { Trash2, Shield, Users as UsersIcon, FolderKanban, Zap } from "lucide-react"
import type { Team } from "@/services/team-service"

/** True when the supplied avatar URL is a real photo (not null, empty, or the
 *  auth-service placeholder sentinel). team-service already runs
 *  resolveAvatarUrl on `m.avatar`, so the value here is either a full URL or
 *  the `/placeholder.svg` sentinel. */
function hasPhoto(url?: string | null): boolean {
  if (!url) return false
  if (url === "/placeholder.svg") return false
  return true
}

interface Props {
  team: Team
  lang: string
  isOwner: boolean
  onDelete: () => void
}

const AVATAR_PALETTE = [
  "#dc2626", // red
  "#0891b2", // cyan
  "#15803d", // green
  "#7c3aed", // violet
  "#ea580c", // orange
  "#db2777", // pink
  "#1e40af", // blue
  "#b45309", // amber
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

export function TeamCard({ team, lang, isOwner, onDelete }: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)
  const [hovered, setHovered] = React.useState(false)
  const color = team.color || "#1e40af"
  const leader = team.leader_id != null ? team.members.find((m) => m.id === team.leader_id) : null

  // Initials for the square tile (use 2 letters from team name)
  const tileInitials = getInitials(team.name, 2)

  // Stat values (backend dönmüyorsa 0)
  const projectCount = (team as any).project_count ?? 0
  const activeTaskCount = (team as any).active_task_count ?? 0

  // Diagonal stripe pattern
  const stripePattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M-1 1l10-10M0 28l28-28M21 35l14-14' stroke='%23ffffff' stroke-opacity='0.18' stroke-width='1.5'/%3E%3C/svg%3E")`

  return (
    <Link href={`/teams/${team.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md, 8px)",
          background: "var(--surface)",
          cursor: "pointer",
          overflow: "hidden",
          transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
          boxShadow: hovered ? `0 6px 20px ${hexToRgba(color, 0.15)}` : "none",
          transform: hovered ? "translateY(-2px)" : "none",
        }}
      >
        {/* Diagonal stripe banner */}
        <div
          style={{
            height: 80,
            background: `${stripePattern}, linear-gradient(135deg, ${darken(color, 0.15)} 0%, ${color} 100%)`,
            position: "relative",
          }}
        >
          {/* Department pill — top right */}
          {team.department && (
            <span
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                fontSize: 11,
                fontWeight: 500,
                color: "#fff",
                background: "rgba(0,0,0,0.18)",
                backdropFilter: "blur(4px)",
                borderRadius: 999,
                padding: "4px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {team.department}
            </span>
          )}

          {/* Delete button — top left */}
          {isOwner && hovered && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete()
              }}
              title={T("Takımı Sil", "Delete Team")}
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "rgba(0,0,0,0.2)",
                backdropFilter: "blur(4px)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* Body — avatar tile overlaps banner */}
        <div style={{ padding: "0 18px 16px", position: "relative" }}>
          {/* Square avatar tile */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${color} 0%, ${hexToRgba(color, 0.78)} 100%)`,
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid var(--surface)",
              marginTop: -28,
              marginBottom: 12,
              letterSpacing: -0.3,
            }}
          >
            {tileInitials}
          </div>

          {/* Title + description */}
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--fg)",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {team.name}
            </p>
            {team.description && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--fg-muted)",
                  margin: "4px 0 0",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {team.description}
              </p>
            )}
          </div>

          {/* Stats row: ÜYE / PROJE / AKTİF */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              padding: "12px 0",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              marginBottom: 12,
            }}
          >
            <StatItem Icon={UsersIcon} value={team.members.length} label={T("ÜYE", "MEMBERS")} />
            <StatItem Icon={FolderKanban} value={projectCount} label={T("PROJE", "PROJECTS")} />
            <StatItem Icon={Zap} value={activeTaskCount} label={T("AKTİF", "ACTIVE")} />
          </div>

          {/* Footer: avatars + lider chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex" }}>
              {team.members.slice(0, 4).map((m, i) => {
                const memberColor = colorForId(m.id)
                return (
                  <MemberAvatar
                    key={m.id}
                    initials={getInitials(m.full_name)}
                    fullName={m.full_name}
                    avatarUrl={m.avatar}
                    color={memberColor}
                    overlap={i > 0}
                    zIndex={4 - i}
                  />
                )
              })}
              {team.members.length > 4 && (
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--bg-subtle, #f1f1ee)",
                    color: "var(--fg-muted)",
                    fontSize: 10,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--surface)",
                    marginLeft: -7,
                    position: "relative",
                  }}
                >
                  +{team.members.length - 4}
                </div>
              )}
            </div>

            {leader && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px 4px 4px",
                  background: hexToRgba(colorForId(leader.id), 0.1),
                  borderRadius: 999,
                  flexShrink: 0,
                  maxWidth: "60%",
                }}
              >
                <MemberAvatar
                  initials={getInitials(leader.full_name)}
                  fullName={leader.full_name}
                  avatarUrl={leader.avatar}
                  color={colorForId(leader.id)}
                  size={22}
                  ring={false}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--fg-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {T("Lider", "Lead")}{" "}
                  <span style={{ color: "var(--fg)", fontWeight: 600 }}>
                    {leader.full_name.split(" ")[0]}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function MemberAvatar({
  initials,
  fullName,
  avatarUrl,
  color,
  size = 26,
  overlap = false,
  zIndex,
  ring = true,
}: {
  initials: string
  fullName: string
  avatarUrl?: string
  color: string
  size?: number
  overlap?: boolean
  zIndex?: number
  ring?: boolean
}) {
  const [imgFailed, setImgFailed] = React.useState(false)
  React.useEffect(() => setImgFailed(false), [avatarUrl])
  const showPhoto = hasPhoto(avatarUrl) && !imgFailed
  return (
    <div
      title={fullName}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        fontSize: size <= 22 ? 9 : Math.round(size * 0.36),
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: ring ? "2px solid var(--surface)" : "none",
        marginLeft: overlap ? -7 : 0,
        zIndex,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {showPhoto ? (
        <img
          src={avatarUrl!}
          alt={initials}
          onError={() => setImgFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        initials
      )}
    </div>
  )
}

function StatItem({
  Icon,
  value,
  label,
}: {
  Icon: React.ComponentType<{ size?: number }>
  value: number
  label: string
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          color: "var(--fg)",
        }}
      >
        <Icon size={13} />
        <span style={{ fontSize: 15, fontWeight: 700 }}>{value}</span>
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "var(--fg-muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </span>
    </div>
  )
}