"use client"

// Phase 13 Plan 13-05 Task 2 — User profile route /users/[id].
// Phase 13 Plan 13-06 Task 1 — Activity tab branch wired to ActivityTab,
// ProfileProjectsTab stub replaced with full ProjectCard grid impl.
//
// Page layout (D-C2..D-C8 + UI-SPEC §Surface D):
//   1. ProfileHeader (Avatar 64 + name/role/Sen + email + 3 inline metrics + Düzenle)
//   2. 3 StatCards row (Atanan Görevler / Tamamlanan / Projeler)
//   3. Tabs primitive (Görevler / Projeler / Aktivite) with badges
//   4. Active tab content — ProfileTasksTab + ProfileProjectsTab (3-col
//      ProjectCard grid) + ActivityTab (userId variant; Plan 13-04 component
//      with viewer-privacy filter applied server-side per Plan 13-01 D-X4)
//
// Data sources:
//   - useUserSummary(id) → /users/{id}/summary (Plan 13-01) — stats + projects
//   - profileService.getUser(id) → /auth/users list lookup — name + email + avatar
//     (backend does NOT return user info from /summary; getUser is a Plan 13-05
//      helper layered on the existing UserListDTO endpoint)
//   - useAuth().user → currentUser for self detection AND role enrichment
//
// Tab routing: ?tab=tasks|projects|activity URL query param (Phase 11 D-04
// ProjectDetail pattern). Initial tab read from useSearchParams(); subsequent
// tab clicks call router.replace so the URL stays in sync without pushing
// a new history entry per click.
//
// Self-only role enrichment: profileService.getUser doesn't include role
// (UserListDTO limitation). For self profiles we layer in useAuth().user.role
// so the role badge still renders. For other users the role badge gracefully
// omits — documented as a v2.1 polish item alongside the dedicated user
// profile endpoint candidate.
//
// 404 + loading: rendered before any tab content evaluates so error states
// stay simple; the 404 path covers both NaN userId and missing user lookup.

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { CheckSquare, CircleCheck, Folder } from "lucide-react"
import { Card, Tabs } from "@/components/primitives"
import { StatCard } from "@/components/dashboard/stat-card"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileTasksTab } from "@/components/profile/profile-tasks-tab"
import { ProfileProjectsTab } from "@/components/profile/profile-projects-tab"
import { ActivityTab } from "@/components/activity/activity-tab"
import { useUserSummary } from "@/hooks/use-user-summary"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { profileService, type ProfileUser } from "@/services/profile-service"

type TabId = "tasks" | "projects" | "activity"

const VALID_TABS: TabId[] = ["tasks", "projects", "activity"]

export default function UserProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language } = useApp()
  const { user: currentUser } = useAuth()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  // params.id can be string | string[] from Next 16's dynamic route. Coerce
  // to a number; NaN flows through enabled flags in the hooks and renders
  // the 404 path.
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const userId = Number(rawId)

  const tabParam = searchParams.get("tab") as TabId | null
  const initialTab: TabId =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "tasks"
  const [activeTab, setActiveTab] = React.useState<TabId>(initialTab)

  // Sync URL on tab change. router.replace (not push) keeps the back button
  // tied to the user-arrival event rather than each tab click.
  const handleTabChange = (id: string) => {
    setActiveTab(id as TabId)
    router.replace(`/users/${userId}?tab=${id}`)
  }

  const { data: summary, isLoading: summaryLoading } = useUserSummary(
    Number.isFinite(userId) ? userId : null,
  )

  // User-info query — separate from useUserSummary because the backend
  // /summary endpoint doesn't include user identity fields (Phase 9 D-48).
  const userQuery = useQuery<ProfileUser | null>({
    queryKey: ["profile-user", userId],
    queryFn: () => profileService.getUser(userId),
    enabled: Number.isFinite(userId) && userId > 0,
    staleTime: 60_000,
  })

  if (summaryLoading || userQuery.isLoading) {
    return (
      <div
        style={{ padding: 40, textAlign: "center", color: "var(--fg-muted)" }}
      >
        {T("Yükleniyor…", "Loading…")}
      </div>
    )
  }

  // 404 path: missing user lookup OR missing summary OR NaN userId.
  if (!userQuery.data || !Number.isFinite(userId)) {
    return (
      <Card padding={40}>
        <div style={{ textAlign: "center", color: "var(--fg-muted)" }}>
          {T("Kullanıcı bulunamadı.", "User not found.")}
        </div>
      </Card>
    )
  }

  const user = userQuery.data

  // Self-only role enrichment: layer in useAuth().user.role when the viewer
  // IS the profile owner. For other users the role badge gracefully omits.
  const isSelf =
    currentUser != null && String(currentUser.id) === String(user.id)
  const enrichedUser: ProfileUser =
    isSelf && currentUser?.role
      ? { ...user, role: currentUser.role }
      : user

  // summary may still be undefined if the /summary endpoint failed but the
  // user lookup succeeded. Default to zero stats so the header / cards never
  // crash on a partial-success path.
  const stats = summary?.stats ?? {
    activeTasks: 0,
    completedLast30d: 0,
    projectCount: 0,
  }
  const projects = summary?.projects ?? []
  const completionTotal = stats.activeTasks + stats.completedLast30d
  const completionRate =
    completionTotal > 0
      ? Math.round((stats.completedLast30d / completionTotal) * 100)
      : 0

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 1100,
      }}
    >
      <ProfileHeader
        user={enrichedUser}
        stats={{
          projectsTotal: stats.projectCount,
          assignedTasks: stats.activeTasks,
          completedTasks: stats.completedLast30d,
        }}
      />
      <div
        className="profile-statcards-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {/* aria-label wrappers (Plan 13-09 D-G2 a11y) — StatCard primitive
            doesn't accept aria-label directly; the wrapper announces the
            full "{label}: {value}" string to screen readers. */}
        <div
          aria-label={`${T("Atanan Görevler", "Assigned Tasks")}: ${stats.activeTasks}`}
        >
          <StatCard
            label={T("Atanan Görevler", "Assigned Tasks")}
            value={stats.activeTasks}
            delta={`${stats.activeTasks + stats.completedLast30d} ${T("toplam", "total")}`}
            tone="primary"
            icon={<CheckSquare size={14} />}
          />
        </div>
        <div aria-label={`${T("Tamamlanan", "Completed")}: ${stats.completedLast30d}`}>
          <StatCard
            label={T("Tamamlanan", "Completed")}
            value={stats.completedLast30d}
            delta={`%${completionRate} ${T("oran", "rate")}`}
            tone="success"
            icon={<CircleCheck size={14} />}
          />
        </div>
        <div aria-label={`${T("Projeler", "Projects")}: ${stats.projectCount}`}>
          <StatCard
            label={T("Projeler", "Projects")}
            value={stats.projectCount}
            delta={`${projects.length} ${T("üye", "member")}`}
            tone="info"
            icon={<Folder size={14} />}
          />
        </div>
      </div>
      <Tabs
        size="md"
        active={activeTab}
        onChange={handleTabChange}
        tabs={[
          { id: "tasks", label: T("Görevler", "Tasks") },
          {
            id: "projects",
            label: T("Projeler", "Projects"),
            badge: projects.length,
          },
          { id: "activity", label: T("Aktivite", "Activity") },
        ]}
      />
      {activeTab === "tasks" && <ProfileTasksTab userId={userId} />}
      {activeTab === "projects" && <ProfileProjectsTab userId={userId} />}
      {activeTab === "activity" && (
        <ActivityTab userId={userId} variant="full" />
      )}
    </div>
  )
}
