"use client"

// ProjectDetailShell — the 8-tab container that mounts inside
// /projects/[id]/page.tsx per PAGE-03 + D-09. Tab state lives in local
// React.useState (not URL param) matching the prototype + D-09 decision.
//
// Phase 11 scope (D-10, D-11):
//   - board                         — BoardTab (Plan 11-05) + BacklogPanel cross-drop (Plan 11-06)
//   - list                          — ListTab (Plan 11-07) — TanStack Table
//   - timeline                      — TimelineTab (Plan 11-07) — custom SVG Gantt
//   - calendar                      — CalendarTab (Plan 11-07) — 6×7 grid + scroll-zoom
//   - activity                      — ActivityStubTab re-exports the
//                                     canonical <ActivityTab projectId={id}
//                                     variant="full"/> (Phase 13 Plan 13-04)
//   - lifecycle                     — LifecycleTab (Phase 12 Plan 12-02)
//   - members                       — Manager card (Plan 11-04)
//   - settings                      — 4 sub-tabs (Plan 11-04)
//
// Plan 11-06 lifts <ProjectDnDProvider> from BoardTab UP to shell level so the
// BacklogPanel can share the Board's drag space. Cross-container drops
// (backlog row → board column) are resolved by handleBoardDragEnd with the
// BACKLOG_COLUMN_ID sentinel as sourceColumnId — the result is always a
// "different column" so `moved: true` and the shell fires useMoveTask. After
// the PATCH settles, the shell also invalidates ['tasks', 'backlog',
// projectId] so the row disappears from the panel.

import * as React from "react"
import {
  Activity,
  Calendar,
  GitBranch,
  Grid3x3,
  LineChart,
  List,
  Settings,
  Users,
} from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Tabs } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { apiClient } from "@/lib/api-client"
import { ProjectDnDProvider } from "@/lib/dnd/dnd-provider"
import { handleBoardDragEnd, type BoardColumnInfo } from "@/lib/dnd/board-dnd"
import { useMoveTask, useTasks } from "@/hooks/use-tasks"
import { useMilestones } from "@/hooks/use-milestones"
import type { Project } from "@/services/project-service"

import { ActivityStubTab } from "./activity-stub-tab"
import { BoardTab } from "./board-tab"
import { BoardCardGhost } from "./board-card"
import { CalendarTab } from "./calendar-view"
import { LifecycleTab } from "@/components/lifecycle/lifecycle-tab"
import { ListTab } from "./list-tab"
import { MembersTab } from "./members-tab"
import { ProjectDetailProvider } from "./project-detail-context"
import { TimelineTab } from "./timeline-tab"
import { BacklogPanel, useBacklogOpenState } from "./backlog-panel"
import { BacklogToggle } from "./backlog-toggle"

// Settings tab is lazy-loaded to keep the shell bundle lean — the 4 sub-tabs
// import TanStack Query + methodology-matrix + confirm-dialog etc. which users
// who never open Settings should not pay for.
const SettingsTabLazy = React.lazy(async () => ({
  default: (await import("./settings-tab")).SettingsTab,
}))

type TabId =
  | "board"
  | "list"
  | "timeline"
  | "calendar"
  | "activity"
  | "lifecycle"
  | "members"
  | "settings"

interface ProjectDetailShellProps {
  project: Project
  isArchived: boolean
}

// Column meta DTO from GET /projects/{id}/columns — same shape used by BoardTab.
interface ColumnMetaDTO {
  id: number
  name: string
  order_index: number
  wip_limit: number
  task_count: number
}

export function ProjectDetailShell({
  project,
  isArchived,
}: ProjectDetailShellProps) {
  const { language: lang } = useApp()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = React.useState<TabId>("board")

  // `open` is no longer destructured here — the toggle uses the functional
  // updater form `setOpen((prev) => !prev)` so it cannot capture a stale
  // value, and `effectiveOpen` is what gates rendering. See backlog-panel.tsx.
  const { effectiveOpen, narrow, setOpen } = useBacklogOpenState(project.id)

  const moveTask = useMoveTask(project.id)

  // Columns + project tasks fetched here (same keys BoardTab uses so the
  // queries are de-duplicated by TanStack Query). Needed at shell level so the
  // cross-container drop handler can look up WIP limit + current task count
  // for the target column regardless of which tab is active.
  const { data: columns = [] } = useQuery({
    queryKey: ["columns", project.id],
    queryFn: async () => {
      const resp = await apiClient.get<ColumnMetaDTO[]>(
        `/projects/${project.id}/columns`
      )
      return resp.data
    },
    staleTime: 60_000,
  })

  // Reuse useTasks so the service layer unwraps the PaginatedResponse envelope
  // and we share the same cache entry as BoardTab/ListTab/TimelineTab/etc.
  // A duplicate inline queryFn here used to populate the cache with the raw
  // backend envelope, which then crashed every consumer with `tasks.filter is
  // not a function` (first caught during Phase 11 browser verification).
  const { data: currentTasks = [] } = useTasks(project.id)

  // Phase 12 Plan 12-05 D-51 — milestones forwarded to TimelineTab as a prop
  // so the Gantt can render vertical flag lines at each target_date. The
  // queryKey is shared with the page-level prefetch (Plan 12-04) and the
  // MilestonesSubTab — TanStack Query de-duplicates the network call across
  // all consumers via cache hit.
  const { data: milestones = [] } = useMilestones(project.id)

  const tabs = [
    { id: "board", label: lang === "tr" ? "Pano" : "Board", icon: <Grid3x3 size={13} /> },
    { id: "list", label: lang === "tr" ? "Liste" : "List", icon: <List size={13} /> },
    { id: "timeline", label: lang === "tr" ? "Zaman Çizelgesi" : "Timeline", icon: <LineChart size={13} /> },
    { id: "calendar", label: lang === "tr" ? "Takvim" : "Calendar", icon: <Calendar size={13} /> },
    { id: "activity", label: lang === "tr" ? "Aktivite" : "Activity", icon: <Activity size={13} /> },
    { id: "lifecycle", label: lang === "tr" ? "Yaşam Döngüsü" : "Lifecycle", icon: <GitBranch size={13} /> },
    { id: "members", label: lang === "tr" ? "Üyeler" : "Members", icon: <Users size={13} /> },
    { id: "settings", label: lang === "tr" ? "Ayarlar" : "Settings", icon: <Settings size={13} /> },
  ]

  // Cross-container + same-container drop handler — lifted from BoardTab so
  // Backlog→Board works. handleBoardDragEnd treats BACKLOG_COLUMN_ID as "just
  // another different column id": source !== target so `moved: true`.
  const handleDropped = React.useCallback(
    (taskId: number, sourceColumnId: string, targetColumnId: string) => {
      // Target column name lookup is case-insensitive — status strings in the
      // task DTO may diverge slightly from column.name casing (matches the
      // BoardTab fallback behaviour).
      const targetCol = columns.find(
        (c) => c.name.toLowerCase() === targetColumnId.toLowerCase()
      )
      const currentCount = currentTasks.filter(
        (t) => (t.status ?? "").toLowerCase() === targetColumnId.toLowerCase()
      ).length
      const targetInfo: BoardColumnInfo = {
        id: targetColumnId,
        wipLimit: targetCol?.wip_limit ?? 0,
        taskCount: currentCount,
      }

      const result = handleBoardDragEnd({
        taskId,
        sourceColumnId,
        targetColumnId,
        targetColumn: targetInfo,
      })
      if (!result.moved) return

      if (result.wipExceeded) {
        showToast({
          variant: "warning",
          message:
            lang === "tr"
              ? "WIP limiti aşıldı — kolonda uyarı gösteriliyor"
              : "WIP limit exceeded — warning shown",
        })
      }

      moveTask.mutate({ id: taskId, status: targetColumnId.toLowerCase() })

      // Cross-container invalidation (Plan 11-06): when the drop source was
      // the backlog, the move changes status which may no longer match the
      // backlog filter (e.g. Kanban leftmost_column status). useMoveTask's
      // onSettled invalidates ['tasks', 'project', projectId]; the backlog
      // uses a sibling key ['tasks', 'backlog', projectId, filter] so we must
      // invalidate it explicitly here to refetch the backlog list.
      qc.invalidateQueries({ queryKey: ["tasks", "backlog", project.id] })
    },
    [columns, currentTasks, moveTask, showToast, lang, qc, project.id]
  )

  const renderGhost = React.useCallback(
    (taskId: number | null) => {
      if (taskId == null) return null
      const t = currentTasks.find((x) => x.id === taskId)
      return t ? <BoardCardGhost task={t} /> : null
    },
    [currentTasks]
  )

  return (
    <ProjectDetailProvider projectId={project.id}>
      <ProjectDnDProvider
        projectId={project.id}
        onTaskDropped={handleDropped}
        renderGhost={renderGhost}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 0,
            flex: 1,
            minHeight: 0,
            height: "100%",
          }}
        >
          {/* Left edge toggle pill (UI-SPEC §12).
              UAT bug fix: explicit `width: 24` on the wrapper guarantees the
              column cannot collapse to 0 when flex sibling re-layouts after
              the panel closes. The `setOpen((prev) => !prev)` updater form
              avoids a stale-closure path where `open` could lag behind the
              latest setState during the close → reopen sequence. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingRight: 4,
              flexShrink: 0,
              width: 24,
            }}
          >
            <BacklogToggle
              open={effectiveOpen}
              onToggle={() => setOpen((prev) => !prev)}
            />
          </div>

          {/* Backlog panel (D-13 fixed column that pushes content). The panel
              returns null when !open, so there is no hidden DOM weight while
              closed. */}
          <BacklogPanel
            project={project}
            open={effectiveOpen}
            narrow={narrow}
            onClose={() => setOpen(false)}
          />

          {/* Tab content — when the backlog is open, shift right 12px for
              breathing room (the panel has its own borderRight). */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginLeft: effectiveOpen ? 12 : 0,
              transition: "margin-left 180ms ease",
              minHeight: 0,
            }}
          >
            {/* D-54 responsive: at ≤1024px the 8-tab bar becomes horizontally
                scrollable instead of wrapping onto a second line. */}
            <div className="pd-tabs-wrap">
              <Tabs
                tabs={tabs}
                active={tab}
                onChange={(id: string) => setTab(id as TabId)}
                size="md"
              />
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              {tab === "board" && <BoardTab project={project} />}
              {tab === "list" && <ListTab project={project} />}
              {tab === "timeline" && (
                <TimelineTab project={project} milestones={milestones} />
              )}
              {tab === "calendar" && <CalendarTab project={project} />}
              {tab === "activity" && <ActivityStubTab projectId={project.id} />}
              {tab === "lifecycle" && <LifecycleTab project={project} />}
              {tab === "members" && <MembersTab project={project} />}
              {tab === "settings" && (
                <React.Suspense
                  fallback={
                    <div
                      style={{
                        padding: 20,
                        color: "var(--fg-muted)",
                        fontSize: 12,
                      }}
                    >
                      {lang === "tr" ? "Yükleniyor..." : "Loading..."}
                    </div>
                  }
                >
                  <SettingsTabLazy
                    project={project}
                    isArchived={isArchived}
                  />
                </React.Suspense>
              )}
            </div>
          </div>
        </div>
      </ProjectDnDProvider>
    </ProjectDetailProvider>
  )
}
