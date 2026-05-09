"use client"

import * as React from "react"
import {
  Users as UsersIcon,
  FolderKanban,
  Zap,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  UserPlus,
  MessageCircle,
  Activity as ActivityIcon,
} from "lucide-react"
import Link from "next/link"
import type { Team, TeamProject, TeamActivityItem } from "@/services/team-service"

interface Props {
  team: Team
  lang: string
  projects: TeamProject[]
  activity: TeamActivityItem[]
}

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || "#6366f1").replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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

const AVATAR_PALETTE = ["#6366f1", "#0891b2", "#15803d", "#b45309", "#be185d", "#7c3aed"]
function colorForId(id: number): string {
  return AVATAR_PALETTE[id % AVATAR_PALETTE.length]
}

function projectKey(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 3)
      .toUpperCase() || "PRJ"
  )
}

function timeAgo(iso: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  const tr = lang === "tr"
  if (diff < 60) return tr ? "Az önce" : "Just now"
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return tr ? `${m} dak. önce` : `${m}m ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return tr ? `${h} saat önce` : `${h}h ago`
  }
  const d = Math.floor(diff / 86400)
  return tr ? `${d} gün önce` : `${d}d ago`
}

function getActivityMeta(action: string): {
  Icon: React.ComponentType<{ size?: number }>
  color: string
  bg: string
} {
  const a = action.toLowerCase()
  if (a.includes("complet") || (a.includes("task") && a.includes("done")))
    return { Icon: CheckCircle, color: "#15803d", bg: "#dcfce7" }
  if (a.includes("member") || a.includes("join") || a.includes("add"))
    return { Icon: UserPlus, color: "#475569", bg: "#f1f5f9" }
  if (a.includes("comment"))
    return { Icon: MessageCircle, color: "#0891b2", bg: "#cffafe" }
  return { Icon: ActivityIcon, color: "#6366f1", bg: "#e0e7ff" }
}

export function TeamOverviewPanel({ team, lang, projects, activity }: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)
  const teamColor = team.color || "#1e40af"

  // Proje listesinden gerçek görev istatistiklerini türet
  const totalTasks = projects.reduce((s, p) => s + (p.task_count ?? 0), 0)
  const doneTasks = projects.reduce((s, p) => s + (p.done_count ?? 0), 0)
  const activeTasks = totalTasks - doneTasks
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : null

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 280px",
        gap: 16,
        alignItems: "start",
      }}
    >
      {/* ============ MAIN COLUMN ============ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        {/* 4 stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <StatCard
            Icon={UsersIcon}
            iconColor="#b45309"
            iconBg="#fef3c7"
            value={team.members.length}
            label={T("AKTİF ÜYE", "ACTIVE MEMBERS")}
          />
          <StatCard
            Icon={FolderKanban}
            iconColor="#475569"
            iconBg="#f1f5f9"
            value={projects.length}
            label={T("PROJELER", "PROJECTS")}
          />
          <StatCard
            Icon={Zap}
            iconColor="#b45309"
            iconBg="#fef3c7"
            value={activeTasks}
            label={T("AKTİF GÖREV", "ACTIVE TASKS")}
          />
          <StatCard
            Icon={TrendingUp}
            iconColor="#15803d"
            iconBg="#dcfce7"
            value={completionPct != null ? `${completionPct}%` : "—"}
            label={T("TAMAMLANMA", "COMPLETION")}
          />
        </div>

        {/* Aktif Projeler */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: "0 0 10px" }}>
            {T("Aktif Projeler", "Active Projects")}
          </p>
          {projects.length === 0 ? (
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: "var(--radius-md, 8px)",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
                {T("Henüz proje yok.", "No projects yet.")}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {projects.map((p) => {
                const pct = p.progress != null ? Math.round(p.progress * 100) : null
                const key = projectKey(p.name)
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    style={{ textDecoration: "none", display: "block" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "14px 16px",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md, 8px)",
                        background: "var(--surface)",
                        cursor: "pointer",
                        transition: "border-color 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = teamColor
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)"
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: hexToRgba(teamColor, 0.15),
                          color: teamColor,
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {key}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <p
                            style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}
                          >
                            {p.name}
                          </p>
                          {p.status && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "var(--fg-muted)",
                                background: "var(--bg-subtle, #f1f1ee)",
                                border: "1px solid var(--border)",
                                borderRadius: 999,
                                padding: "2px 8px",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.status}
                            </span>
                          )}
                        </div>
                        {pct != null && (
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: 5,
                                background: "var(--bg-subtle, #f1f1ee)",
                                borderRadius: 999,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: "100%",
                                  background: teamColor,
                                  borderRadius: 999,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "var(--fg-muted)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {pct}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <UsersIcon size={12} color="var(--fg-muted)" />
                        <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                          {p.member_count}
                        </span>
                        <ChevronRight size={14} color="var(--fg-muted)" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============ RIGHT SIDEBAR ============ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        {/* Üyeler */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 8px)",
            background: "var(--surface)",
            padding: 18,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-muted)",
              margin: "0 0 14px",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {T("Üyeler", "Members")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {team.members.slice(0, 6).map((m) => {
              const c = colorForId(m.id)
              const isLeader = team.leader_id === m.id
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: c,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(m.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--fg)",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {m.full_name}
                    </p>
                    {isLeader && (
                      <p
                        style={{
                          fontSize: 10,
                          color: "#b45309",
                          margin: "1px 0 0",
                          fontWeight: 600,
                        }}
                      >
                        {T("Lider", "Lead")}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
            {team.members.length > 6 && (
              <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "4px 0 0" }}>
                +{team.members.length - 6} {T("daha", "more")}
              </p>
            )}
          </div>
        </div>

        {/* Son aktivite */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 8px)",
            background: "var(--surface)",
            padding: 18,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-muted)",
              margin: "0 0 14px",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {T("Son Aktivite", "Recent Activity")}
          </p>
          {activity.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
              {T("Aktivite yok.", "No activity yet.")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activity.slice(0, 6).map((a) => {
                const { Icon, color, bg } = getActivityMeta(a.action)
                return (
                  <div key={a.id} style={{ display: "flex", gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: bg,
                        color: color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: "var(--fg)", margin: 0, lineHeight: 1.5 }}>
                        {a.actor_name && (
                          <span style={{ fontWeight: 600 }}>{a.actor_name} </span>
                        )}
                        <span style={{ color: "var(--fg-muted)" }}>{a.action}</span>
                        {a.target_label && (
                          <span style={{ color: "var(--fg-muted)" }}> — {a.target_label}</span>
                        )}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: "2px 0 0" }}>
                        {timeAgo(a.created_at, lang)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============= Helper components =============

function StatCard({
  Icon,
  iconColor,
  iconBg,
  value,
  label,
}: {
  Icon: React.ComponentType<{ size?: number }>
  iconColor: string
  iconBg: string
  value: number | string
  label: string
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md, 8px)",
        background: "var(--surface)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: iconBg,
          color: iconColor,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon size={16} />
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--fg-muted)",
          margin: "6px 0 0",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </p>
    </div>
  )
}
