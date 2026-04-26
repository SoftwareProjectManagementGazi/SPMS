"use client"

// Phase 13 Plan 13-05 Task 1 — ProfileTasksTab.
//
// PROF-04 + 13-CONTEXT D-C4: prototype filter (Aktif / Tamamlanan / Tümü)
// + group-by-project + MTTaskRow density="compact" rows.
//
// Data flow:
//   useQuery(profile-tasks, userId) → profileService.getUserTasks(userId)
//                                  → GET /tasks?assignee_id={userId}
//   Status filter is applied client-side (D-C4 — backend doesn't gate on
//   our 3-bucket scheme). Done detection uses the lowercase substring on
//   `task.status` to catch backend variants ("done", "completed", "DONE",
//   "tamamlandı") without coupling to the column-name lookup table.
//
// Group-by-project: Map keyed by projectId preserves insertion order so
// the UI renders projects in the order tasks first appear (which mirrors
// the prototype's Object.entries pattern but is type-safe against
// numeric vs string keys — task.projectId is always a number).
//
// Empty state: D-C4 prototype line 102-106 — "Bu filtreyle görev bulunamadı."
// rendered via DataState's emptyFallback.

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, SegmentedControl, Badge, DataState } from "@/components/primitives"
import { TaskRow } from "@/components/my-tasks/task-row"
import { useApp } from "@/context/app-context"
import { profileService } from "@/services/profile-service"
import type { Task } from "@/services/task-service"

type TaskFilter = "active" | "completed" | "all"

export interface ProfileTasksTabProps {
  userId: number
}

// The Task entity from task-service.ts doesn't carry projectKey/projectName
// inline (it has projectId only). For the group-by-project UI we read those
// off the row via a defensive lookup; the backend currently embeds them in
// the listing response when requested, but we fall back to safe placeholders
// so the UI never blanks out a group header.
type ProfileTask = Task & {
  projectKey?: string
  projectName?: string
}

// done detection — substring check against the lowercased status. Catches
// "done" / "completed" / "DONE" / "tamamlandı" without needing the
// column-name lookup table. False positives (e.g. a hypothetical "doneish"
// status) would be a Phase 13 polish item; current backend writes "done"
// or the lowercased column name only.
function isDone(status: string | null | undefined): boolean {
  const s = String(status ?? "").toLowerCase()
  return s.includes("done") || s.includes("completed") || s.includes("tamamla")
}

interface TasksResponse {
  tasks: ProfileTask[]
}

export function ProfileTasksTab({ userId }: ProfileTasksTabProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)
  const [filter, setFilter] = React.useState<TaskFilter>("active")

  const query = useQuery<TasksResponse>({
    queryKey: ["profile-tasks", userId],
    queryFn: () => profileService.getUserTasks(userId) as Promise<TasksResponse>,
    enabled: !!userId,
    staleTime: 30_000,
  })

  const allTasks = query.data?.tasks ?? []

  const filtered = React.useMemo(() => {
    return allTasks.filter((t) => {
      const done = isDone(t.status)
      if (filter === "active") return !done
      if (filter === "completed") return done
      return true
    })
  }, [allTasks, filter])

  // Group by projectId — Map preserves insertion order so projects render in
  // the order they first appear in the filtered list.
  const grouped = React.useMemo(() => {
    const map = new Map<
      number,
      { projectId: number; projectKey: string; projectName: string; tasks: ProfileTask[] }
    >()
    for (const t of filtered) {
      const pid = t.projectId
      if (!map.has(pid)) {
        map.set(pid, {
          projectId: pid,
          projectKey: t.projectKey || `#${pid}`,
          projectName: t.projectName || `Project ${pid}`,
          tasks: [],
        })
      }
      map.get(pid)!.tasks.push(t)
    }
    return Array.from(map.values())
  }, [filtered])

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <SegmentedControl
          size="sm"
          options={[
            { id: "active", label: T("Aktif", "Active") },
            { id: "completed", label: T("Tamamlanan", "Completed") },
            { id: "all", label: T("Tümü", "All") },
          ]}
          value={filter}
          onChange={(v) => setFilter(v as TaskFilter)}
        />
        <div style={{ flex: 1 }} />
        <span
          className="mono"
          style={{ fontSize: 11.5, color: "var(--fg-muted)" }}
        >
          {filtered.length} {T("görev", "tasks")}
        </span>
      </div>
      <DataState
        loading={query.isLoading}
        error={query.error}
        empty={filtered.length === 0}
        emptyFallback={
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--fg-subtle)",
              fontSize: 13,
            }}
          >
            {T(
              "Bu filtreyle görev bulunamadı.",
              "No tasks found with this filter.",
            )}
          </div>
        }
      >
        {grouped.map((group) => (
          <Card
            key={group.projectId}
            padding={0}
            style={{ marginBottom: 12 }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: "var(--surface-2)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 3,
                  background: `var(--av-${(group.projectId % 8) + 1})`,
                }}
                aria-hidden
              />
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: "var(--fg-muted)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: 0.3,
                }}
              >
                {group.projectKey}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                {group.projectName}
              </span>
              <Badge size="xs" tone="neutral">
                {group.tasks.length}
              </Badge>
            </div>
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                density="compact"
                showProject={false}
                starred={false}
                onToggleStar={() => {
                  /* read-only profile context — star toggling is owned by
                     MyTasks, not the profile view. Noop intentional. */
                }}
              />
            ))}
          </Card>
        ))}
      </DataState>
    </div>
  )
}
