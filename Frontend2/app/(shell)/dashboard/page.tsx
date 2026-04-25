"use client"
import * as React from "react"
import { Folder, CheckSquare, CircleCheck, AlertTriangle } from "lucide-react"
import { useProjects, useGlobalActivity, useTaskStats } from "@/hooks/use-projects"
import { useAuth } from "@/context/auth-context"
import { useApp } from "@/context/app-context"
import { StatCard } from "@/components/dashboard/stat-card"
import { PortfolioTable } from "@/components/dashboard/portfolio-table"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { MethodologyCard } from "@/components/dashboard/methodology-card"
import { Card, SegmentedControl } from "@/components/primitives"
import type { ActivityItem } from "@/components/dashboard/activity-feed"
import { MyTasksExperience } from "@/components/my-tasks/my-tasks-experience"

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

  // Normalize activity feed items from backend shape.
  // FL-04 fix (Phase 10 review): the previous `as string` / `as string | number`
  // casts were type-system-only lies — TypeScript would not catch a backend
  // that shipped `{ action: { type: "task_created", ... } }` instead of a plain
  // string, and the UI would render `[object Object]` in the activity feed.
  // Use runtime typeof guards so non-string/number values fall through to the
  // fallback instead of being coerced via String() stringification.
  const activityItems: ActivityItem[] = React.useMemo(() => {
    const raw = activityData?.items ?? activityData ?? []
    if (!Array.isArray(raw)) return []

    const asString = (v: unknown): string =>
      typeof v === "string" ? v : ""
    const asStringOrNumber = (v: unknown, fallback: string | number): string | number =>
      typeof v === "string" || typeof v === "number" ? v : fallback

    return raw.map((item: Record<string, unknown>, idx: number) => ({
      id: asStringOrNumber(item.id, idx),
      action: asString(item.action) || asString(item.description),
      user_name:
        asString(item.user_name) ||
        asString(item.actor_name) ||
        "Unknown",
      user_avatar: typeof item.user_avatar === "string" ? item.user_avatar : null,
      timestamp: asString(item.timestamp) || asString(item.created_at),
      entity_type: asString(item.entity_type),
    }))
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
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.6 }}>
            {language === "tr" ? `Merhaba, ${firstName}` : `Welcome back, ${firstName}`}
          </div>
          <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>
            {dateStr} &middot; {language === "tr" ? "Güzel bir hafta olsun" : "Make it count"}
          </div>
        </div>

        {/* Manager/Member view toggle (UI-sweep: hand-rolled SegmentedPills replaced with primitive) */}
        <SegmentedControl
          options={[
            {
              id: "manager",
              label: language === "tr" ? "Yönetim" : "Management",
            },
            {
              id: "member",
              label: language === "tr" ? "Benim İşim" : "My Work",
            },
          ]}
          value={view}
          onChange={(id) => setView(id as "manager" | "member")}
        />
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
              icon={<Folder size={14} />}
            />
            <StatCard
              label={language === "tr" ? "Aktif Proje" : "Active"}
              value={projectsLoading ? "—" : String(activeProjects.length)}
              tone="success"
              delta={language === "tr" ? "aktif" : "active"}
              icon={<CheckSquare size={14} />}
            />
            <StatCard
              label={language === "tr" ? "Tamamlanan" : "Completed"}
              value={projectsLoading ? "—" : String(completedCount)}
              tone="info"
              delta={language === "tr" ? "bu dönem" : "this period"}
              icon={<CircleCheck size={14} />}
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
              icon={<AlertTriangle size={14} />}
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
        /* MemberView — D-52: compact MyTasksExperience inside the dashboard.
           hideHeader drops the hero (dashboard already has its greeting row).
           defaultView="today" greets the user with their day's work first. */
        <MyTasksExperience
          compact
          defaultView="today"
          hideHeader
          hideRightRail
          hideQuickAdd
        />
      )}
    </div>
  )
}
