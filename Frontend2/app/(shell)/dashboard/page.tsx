"use client"
import * as React from "react"
import Link from "next/link"
import { useProjects, useGlobalActivity, useTaskStats } from "@/hooks/use-projects"
import { useAuth } from "@/context/auth-context"
import { useApp } from "@/context/app-context"
import { StatCard } from "@/components/dashboard/stat-card"
import { PortfolioTable } from "@/components/dashboard/portfolio-table"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { MethodologyCard } from "@/components/dashboard/methodology-card"
import { Card, Button } from "@/components/primitives"
import type { ActivityItem } from "@/components/dashboard/activity-feed"

export default function DashboardPage() {
  const { user } = useAuth()
  const { language } = useApp()

  // D-27: initialize view based on role
  const isManagerRole =
    user?.role?.name === "Admin" ||
    user?.role?.name === "Manager" ||
    user?.role?.name === "Project Manager"
  const [view, setView] = React.useState<"manager" | "member">(
    isManagerRole ? "manager" : "member"
  )

  // Live data hooks (D-26)
  const { data: activeProjects = [], isLoading: projectsLoading } = useProjects("ACTIVE")
  const { data: allProjects = [] } = useProjects()
  const { data: activityData } = useGlobalActivity(20)
  // D-26: task stats for StatCard 4 — GET /tasks with status counts
  const { data: taskStats } = useTaskStats()

  const firstName = user?.name?.split(" ")[0] ?? ""
  const now = new Date()
  const dateStr = now.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  // Normalize activity feed items from backend shape
  const activityItems: ActivityItem[] = React.useMemo(() => {
    const raw = activityData?.items ?? activityData ?? []
    if (!Array.isArray(raw)) return []
    return raw.map(
      (item: Record<string, unknown>, idx: number) => ({
        id: (item.id as string | number) ?? idx,
        action: (item.action as string) ?? (item.description as string) ?? "",
        user_name:
          (item.user_name as string) ??
          (item.actor_name as string) ??
          (item.user as string) ??
          "Unknown",
        user_avatar: (item.user_avatar as string) ?? null,
        timestamp:
          (item.timestamp as string) ??
          (item.created_at as string) ??
          (item.occurred_at as string) ??
          "",
        entity_type: (item.entity_type as string) ?? "",
      })
    )
  }, [activityData])

  const completedCount = allProjects.filter((p) => p.status === "COMPLETED").length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header row */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 20,
      }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6 }}>
            {language === "tr" ? `Merhaba, ${firstName}` : `Welcome back, ${firstName}`}
          </div>
          <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>
            {dateStr} &middot; {language === "tr" ? "Güzel bir hafta olsun" : "Make it count"}
          </div>
        </div>

        {/* Manager/Member view toggle */}
        <div style={{
          display: "inline-flex",
          background: "var(--surface-2)",
          borderRadius: "var(--radius-sm)",
          padding: 3,
          gap: 2,
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}>
          {(["manager", "member"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                background: view === v ? "var(--surface)" : "transparent",
                color: view === v ? "var(--fg)" : "var(--fg-muted)",
                boxShadow:
                  view === v
                    ? "0 1px 2px oklch(0 0 0 / 0.05), inset 0 0 0 1px var(--border)"
                    : "none",
              }}
            >
              {v === "manager"
                ? language === "tr"
                  ? "Yönetim"
                  : "Management"
                : language === "tr"
                  ? "Benim İşim"
                  : "My Work"}
            </button>
          ))}
        </div>
      </div>

      {view === "manager" ? (
        <>
          {/* StatCards row — 4 cards (D-26) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <StatCard
              label={language === "tr" ? "Toplam Proje" : "Projects"}
              value={projectsLoading ? "—" : String(allProjects.length)}
              tone="primary"
              delta={language === "tr" ? "toplam" : "total"}
              icon={<span style={{ fontSize: 14 }}>📋</span>}
            />
            <StatCard
              label={language === "tr" ? "Aktif Proje" : "Active"}
              value={projectsLoading ? "—" : String(activeProjects.length)}
              tone="success"
              delta={language === "tr" ? "aktif" : "active"}
              icon={<span style={{ fontSize: 14 }}>✓</span>}
            />
            <StatCard
              label={language === "tr" ? "Tamamlanan" : "Completed"}
              value={projectsLoading ? "—" : String(completedCount)}
              tone="info"
              delta={language === "tr" ? "bu dönem" : "this period"}
              icon={<span style={{ fontSize: 14 }}>🏆</span>}
            />
            {/* StatCard 4: task stats from GET /tasks — D-26 requirement */}
            <StatCard
              label={language === "tr" ? "Açık Görevler" : "Open Tasks"}
              value={
                taskStats
                  ? String(taskStats.open + taskStats.in_progress)
                  : "—"
              }
              tone="danger"
              delta={
                taskStats
                  ? language === "tr"
                    ? `${taskStats.done} tamamlandı`
                    : `${taskStats.done} done`
                  : undefined
              }
              icon={<span style={{ fontSize: 14 }}>📌</span>}
            />
          </div>

          {/* Portfolio + Methodology/Activity row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
            {/* Portfolio table card */}
            <Card padding={0}>
              <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {language === "tr" ? "Proje Portföyü" : "Project Portfolio"}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 2 }}>
                    {language === "tr"
                      ? "Aktif projeler, ilerleme ve sahipler"
                      : "Active projects, progress & owners"}
                  </div>
                </div>
              </div>
              <PortfolioTable projects={activeProjects} />
            </Card>

            {/* Right column: methodology card + activity feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <MethodologyCard projects={allProjects} />
              <ActivityFeed items={activityItems} />
            </div>
          </div>
        </>
      ) : (
        /* MemberView placeholder — full MyTasks is Phase 11 (D-27) */
        <Card padding={40}>
          <div style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
              {language === "tr" ? "Görevlerim" : "My Tasks"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
              {language === "tr"
                ? "Görevlerim yakında bu panelde görüntülenecek."
                : "My tasks will appear here soon."}
            </div>
            <Link href="/my-tasks">
              <Button variant="primary" size="sm">
                {language === "tr" ? "Görevlerime Git" : "View My Tasks"}
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
