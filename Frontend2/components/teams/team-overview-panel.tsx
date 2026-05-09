"use client"

import * as React from "react"
import {
  Users as UsersIcon,
  FolderKanban,
  Zap,
  CheckCircle2,
  ChevronRight,
  CheckCircle,
  UserPlus,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import type { Team } from "@/services/team-service"

interface Props {
  team: Team
  lang: string
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

export function TeamOverviewPanel({ team, lang }: Props) {
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)
  const teamColor = team.color || "#1e40af"

  // Backend'in henüz dönmediği veriler için mock — gelmediğinde bunlar gözükür
  const stats = {
    activeMembers: team.members.length,
    activeMembersDelta: (team as any).members_delta ?? 2,
    projects: (team as any).project_count ?? 3,
    projectsDelta: (team as any).projects_delta ?? 1,
    activeTasks: (team as any).active_task_count ?? 18,
    activeTasksDelta: (team as any).active_tasks_delta ?? 5,
    completed: (team as any).completed_task_count ?? 124,
    completedDelta: (team as any).completed_delta ?? 12,
  }

  // Sprint velocity sparkline
  const sprintData: number[] = (team as any).sprint_velocity ?? [22, 26, 24, 30, 28, 36]
  const sprintAvg = Math.round(sprintData.reduce((a, b) => a + b, 0) / sprintData.length)

  // Aktif Projeler
  const activeProjects: { id: number; name: string; key: string; color: string; done: number; total: number }[] =
    (team as any).active_projects ?? [
      { id: 1, name: "Mobil Ödeme Altyapısı", key: "MOB", color: teamColor, done: 23, total: 47 },
      { id: 2, name: "API Gateway v2", key: "API", color: "#15803d", done: 14, total: 22 },
    ]

  // En aktif üyeler
  const topMembers: { id: number; name: string; score: number }[] =
    (team as any).top_members ??
    team.members.slice(0, 4).map((m, i) => ({
      id: m.id,
      name: m.full_name,
      score: 42 - i * 5,
    }))
  const maxScore = Math.max(...topMembers.map((m) => m.score), 1)

  // Son aktivite
  type Activity = { id: number; type: "task_done" | "member_added" | "comment"; user: string; text: string; time: string }
  const recentActivity: Activity[] =
    (team as any).recent_activity ?? [
      { id: 1, type: "task_done", user: "Selin", text: T("MOB-8 görevini tamamladı", "completed task MOB-8"), time: T("12 dak. önce", "12 min ago") },
      { id: 2, type: "member_added", user: "Ahmet", text: T("Mehmet Demir takıma eklendi", "Mehmet Demir was added to the team"), time: T("2 saat önce", "2 hours ago") },
      { id: 3, type: "comment", user: "Mehmet", text: T("AGW-3 üzerinde yorum yaptı", "commented on AGW-3"), time: T("5 saat önce", "5 hours ago") },
    ]

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
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          <StatCard
            Icon={UsersIcon}
            iconColor="#b45309"
            iconBg="#fef3c7"
            value={stats.activeMembers}
            label={T("AKTİF ÜYE", "ACTIVE MEMBERS")}
            delta={stats.activeMembersDelta}
          />
          <StatCard
            Icon={FolderKanban}
            iconColor="#475569"
            iconBg="#f1f5f9"
            value={stats.projects}
            label={T("PROJELER", "PROJECTS")}
            delta={stats.projectsDelta}
          />
          <StatCard
            Icon={Zap}
            iconColor="#b45309"
            iconBg="#fef3c7"
            value={stats.activeTasks}
            label={T("AKTİF GÖREV", "ACTIVE TASKS")}
            delta={stats.activeTasksDelta}
          />
          <StatCard
            Icon={CheckCircle2}
            iconColor="#15803d"
            iconBg="#dcfce7"
            value={stats.completed}
            label={T("TAMAMLANAN", "COMPLETED")}
            delta={stats.completedDelta}
          />
        </div>

        {/* Sprint hızı */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md, 8px)",
            background: "var(--surface)",
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 14,
              gap: 12,
            }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                {T("Sprint Hızı", "Sprint Velocity")}
              </p>
              <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "2px 0 0" }}>
                {T("Son 6 sprint, story point", "Last 6 sprints, story points")}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 26, fontWeight: 700, color: "var(--fg)", margin: 0, lineHeight: 1 }}>
                {sprintAvg}
              </p>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--fg-muted)",
                  margin: "4px 0 0",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {T("ORTALAMA", "AVERAGE")}
              </p>
            </div>
          </div>
          <Sparkline data={sprintData} color={teamColor} height={80} />
        </div>

        {/* Aktif Projeler */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: "0 0 10px" }}>
            {T("Aktif Projeler", "Active Projects")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeProjects.map((p) => (
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
                    e.currentTarget.style.borderColor = p.color
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
                      background: hexToRgba(p.color, 0.15),
                      color: p.color,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {p.key}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
                      {p.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
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
                            width: `${(p.done / p.total) * 100}%`,
                            height: "100%",
                            background: p.color,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", whiteSpace: "nowrap" }}>
                        {Math.round((p.done / p.total) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <CheckCircle size={13} color="var(--fg-muted)" />
                    <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                      {p.done}/{p.total}
                    </span>
                    <ChevronRight size={14} color="var(--fg-muted)" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ============ RIGHT SIDEBAR ============ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        {/* En aktif üyeler */}
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
            {T("En Aktif Üyeler", "Top Members")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topMembers.map((m) => {
              const c = colorForId(m.id)
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
                    {getInitials(m.name)}
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
                      {m.name}
                    </p>
                    <div
                      style={{
                        height: 3,
                        marginTop: 5,
                        background: "var(--bg-subtle, #f1f1ee)",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(m.score / maxScore) * 100}%`,
                          height: "100%",
                          background: teamColor,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", flexShrink: 0 }}>
                    {m.score}
                  </span>
                </div>
              )
            })}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recentActivity.map((a) => {
              const Icon = a.type === "task_done" ? CheckCircle : a.type === "member_added" ? UserPlus : MessageCircle
              const iconColor =
                a.type === "task_done" ? "#15803d" : a.type === "member_added" ? "#475569" : "#0891b2"
              const iconBg =
                a.type === "task_done" ? "#dcfce7" : a.type === "member_added" ? "#f1f5f9" : "#cffafe"
              return (
                <div key={a.id} style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: iconBg,
                      color: iconColor,
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
                      <span style={{ fontWeight: 600 }}>{a.user}</span>{" "}
                      <span style={{ color: "var(--fg-muted)" }}>{a.text}</span>
                    </p>
                    <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: "2px 0 0" }}>{a.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
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
  delta,
}: {
  Icon: React.ComponentType<{ size?: number }>
  iconColor: string
  iconBg: string
  value: number
  label: string
  delta?: number
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
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
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
          }}
        >
          <Icon size={16} />
        </div>
        {delta != null && delta > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "#15803d" }}>+{delta}</span>
        )}
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

function Sparkline({ data, color, height }: { data: number[]; color: string; height: number }) {
  if (data.length < 2) return null
  const width = 600
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 8
  const gradId = `spark-gradient-${color.replace("#", "")}`

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (v - min) / range) * (height - padding * 2)
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ")
  const area = `${line} L${points[points.length - 1][0]},${height - padding} L${padding},${height - padding} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill={color} />
      ))}
    </svg>
  )
}