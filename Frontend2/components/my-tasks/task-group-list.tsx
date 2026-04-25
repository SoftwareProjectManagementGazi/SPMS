"use client"

// TaskGroupList — renders the filtered/sorted task list, optionally grouped.
//
// 1:1 port of the prototype MTGroupedList + MTGroupHeader (my-tasks-parts.jsx
// 371-430). Even when groupBy === "none" we render a single "_all" group with
// the same sticky header chrome — so the user always sees a "Tüm görevler · 12"
// cap (UAT round 7).
//
// Per-group decoration:
//   due       → bucket icon (Flame/Alert/Calendar/Clock) + bucket colour
//   project   → project colour square + project key meta + done %% progress bar
//   status    → coloured dot + status colour
//   priority  → 4-bar PriorityChip + priority colour
//
// Sticky header keeps the group label visible while the user scrolls long
// lists. When a group has more than 5 items we cap its body at 300px and let
// the inner div scroll, so a single 100-task project doesn't stretch the
// page beyond the viewport.

import * as React from "react"
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Circle,
  Clock,
  Flame,
} from "lucide-react"

import { useApp } from "@/context/app-context"
import { dueBucket, type DueBucket } from "@/lib/my-tasks/due-bucket"
import type { Task } from "@/services/task-service"
import type { StatusValue } from "@/components/primitives/status-dot"
import { PriorityChip } from "@/components/primitives"

import { TaskRow, type TaskRowDensity } from "./task-row"

export type GroupBy = "due" | "project" | "status" | "priority" | "none"

interface TaskGroupListProps {
  tasks: Task[]
  groupBy: GroupBy
  starred: number[]
  onToggleStar: (id: number) => void
  /** Optional — when provided, every row's leftmost status circle becomes interactive. */
  onChangeStatus?: (id: number, next: StatusValue) => void
  /** Legacy prop (Dashboard Member view). Pass `density="compact"` instead. */
  compact?: boolean
  density?: TaskRowDensity
  projectsByKey?: Map<number, string>
  /** Map of project id → project name (used by the project group label so it
   *  shows the human name instead of the mono key). */
  projectsByName?: Map<number, string>
  /** Full task list (unfiltered) — used by project groups to compute the
   *  done %% progress bar against the user's full workload, not just the
   *  current view's filtered slice. Defaults to `tasks` when not provided. */
  allTasks?: Task[]
  /** Map of group id -> collapsed flag. Defaults to all-expanded. */
  collapsed?: Record<string, boolean>
  /** Callback when the user toggles a group's collapsed state. */
  onToggleCollapse?: (groupId: string) => void
}

const DUE_ORDER: DueBucket[] = [
  "overdue",
  "today",
  "this_week",
  "later",
  "none",
]
const STATUS_ORDER = ["progress", "review", "todo", "blocked", "done"] as const
const PRIORITY_ORDER = ["critical", "high", "medium", "low"] as const

interface GroupLabel {
  tr: string
  en: string
}

const DUE_LABELS: Record<DueBucket, GroupLabel> = {
  overdue: { tr: "Gecikmiş", en: "Overdue" },
  today: { tr: "Bugün", en: "Today" },
  this_week: { tr: "Bu hafta", en: "This week" },
  later: { tr: "Daha sonra", en: "Later" },
  none: { tr: "Tarihsiz", en: "No date" },
}

const STATUS_LABELS: Record<string, GroupLabel> = {
  progress: { tr: "Devam ediyor", en: "In progress" },
  review: { tr: "İncelemede", en: "In review" },
  todo: { tr: "Yapılacak", en: "To do" },
  blocked: { tr: "Engellendi", en: "Blocked" },
  done: { tr: "Tamamlandı", en: "Done" },
}

const PRIORITY_LABELS: Record<string, GroupLabel> = {
  critical: { tr: "Kritik", en: "Critical" },
  high: { tr: "Yüksek", en: "High" },
  medium: { tr: "Orta", en: "Medium" },
  low: { tr: "Düşük", en: "Low" },
}

const DUE_BUCKET_META: Record<
  DueBucket,
  {
    color: string
    icon: "alert" | "today" | "week" | "later" | "none"
  }
> = {
  overdue: { color: "var(--priority-critical)", icon: "alert" },
  today: { color: "var(--primary)", icon: "today" },
  this_week: { color: "var(--status-progress)", icon: "week" },
  later: { color: "var(--fg-muted)", icon: "later" },
  none: { color: "var(--fg-subtle)", icon: "none" },
}

const STATUS_COLOR: Record<string, string> = {
  progress: "var(--status-progress)",
  review: "var(--status-review)",
  todo: "var(--status-todo)",
  blocked: "var(--status-blocked)",
  done: "var(--status-done)",
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: "var(--priority-critical)",
  high: "var(--priority-high)",
  medium: "var(--priority-med)",
  low: "var(--priority-low)",
}

function projectColor(projectId: number): string {
  // Same 8-bucket modulo as TaskRow / Avatar — same projectId always picks
  // the same hue.
  return `var(--av-${(projectId % 8) + 1})`
}

interface BuiltGroup {
  id: string
  label: string
  items: Task[]
  /** Renderable icon node (10px coloured square / dot / 4-bar / lucide icon). */
  icon?: React.ReactNode
  /** CSS colour for the icon tint and progress bar fill. */
  color?: string
  /** Optional small mono text appended to the label (e.g. project key). */
  meta?: string
  /** 0–100 — when set, header renders a 100×4 progress bar on the right. */
  progress?: number
}

function bucketIcon(kind: "alert" | "today" | "week" | "later" | "none") {
  if (kind === "alert") return <AlertCircle size={14} />
  if (kind === "today") return <Flame size={14} />
  if (kind === "week") return <Calendar size={14} />
  if (kind === "later") return <Clock size={14} />
  return <Circle size={14} />
}

function squareDot(color: string, shape: "round" | "square" = "square") {
  return (
    <span
      aria-hidden
      style={{
        width: 10,
        height: 10,
        borderRadius: shape === "round" ? "50%" : 3,
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  )
}

function groupKeyFor(task: Task, groupBy: GroupBy): string {
  if (groupBy === "project") return String(task.projectId)
  if (groupBy === "status") return task.status
  if (groupBy === "priority") return task.priority
  return dueBucket(task.due)
}

function buildGroups(
  tasks: Task[],
  groupBy: GroupBy,
  lang: "tr" | "en",
  projectsByKey?: Map<number, string>,
  projectsByName?: Map<number, string>,
  allTasks?: Task[]
): BuiltGroup[] {
  // None / empty — render a single "_all" group so the sticky header chrome
  // still appears above the list (UAT round 7 explicit ask).
  if (groupBy === "none" || tasks.length === 0) {
    return [
      {
        id: "_all",
        label: lang === "tr" ? "Tüm görevler" : "All tasks",
        items: tasks,
      },
    ]
  }

  const buckets = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = groupKeyFor(t, groupBy)
    const list = buckets.get(key)
    if (list) list.push(t)
    else buckets.set(key, [t])
  }

  let order: string[]
  if (groupBy === "due") order = DUE_ORDER as unknown as string[]
  else if (groupBy === "status") order = STATUS_ORDER as unknown as string[]
  else if (groupBy === "priority") order = PRIORITY_ORDER as unknown as string[]
  else {
    // project — order by group size descending so the busiest project floats
    // to the top (matches my-tasks.jsx:270).
    order = Array.from(buckets.keys()).sort(
      (a, b) => (buckets.get(b)?.length ?? 0) - (buckets.get(a)?.length ?? 0)
    )
  }

  const out: BuiltGroup[] = []
  for (const id of order) {
    const items = buckets.get(id) ?? []
    if (items.length === 0) continue

    if (groupBy === "due") {
      const meta = DUE_BUCKET_META[id as DueBucket]
      const lbl =
        lang === "tr"
          ? DUE_LABELS[id as DueBucket].tr
          : DUE_LABELS[id as DueBucket].en
      out.push({
        id,
        label: lbl,
        items,
        icon: <span style={{ color: meta.color }}>{bucketIcon(meta.icon)}</span>,
        color: meta.color,
      })
      continue
    }

    if (groupBy === "status") {
      const lbl =
        lang === "tr" ? STATUS_LABELS[id]?.tr ?? id : STATUS_LABELS[id]?.en ?? id
      const color = STATUS_COLOR[id] ?? "var(--fg-muted)"
      out.push({
        id,
        label: lbl,
        items,
        icon: squareDot(color, "round"),
        color,
      })
      continue
    }

    if (groupBy === "priority") {
      const lbl =
        lang === "tr"
          ? PRIORITY_LABELS[id]?.tr ?? id
          : PRIORITY_LABELS[id]?.en ?? id
      const color = PRIORITY_COLOR[id] ?? "var(--fg-muted)"
      out.push({
        id,
        label: lbl,
        items,
        icon: (
          <PriorityChip
            level={id as "low" | "medium" | "high" | "critical"}
            lang={lang}
            withLabel={false}
          />
        ),
        color,
      })
      continue
    }

    // project — id is the projectId stringified.
    const pid = Number(id)
    const color = projectColor(pid)
    const friendlyName =
      projectsByName?.get(pid) ?? projectsByKey?.get(pid) ?? `#${pid}`
    const projKey = projectsByKey?.get(pid)
    // Progress: share of done tasks across this user's full workload in this
    // project (allTasks includes everything, not just the current view).
    const inProj = (allTasks ?? tasks).filter((t) => t.projectId === pid)
    const pct = inProj.length
      ? Math.round(
          (100 * inProj.filter((t) => t.status === "done").length) /
            inProj.length
        )
      : 0
    out.push({
      id,
      label: friendlyName,
      items,
      icon: squareDot(color, "square"),
      color,
      meta: projKey,
      progress: pct,
    })
  }
  return out
}

export function TaskGroupList({
  tasks,
  groupBy,
  starred,
  onToggleStar,
  onChangeStatus,
  compact,
  density,
  projectsByKey,
  projectsByName,
  allTasks,
  collapsed,
  onToggleCollapse,
}: TaskGroupListProps) {
  const { language: lang } = useApp()
  const groups = React.useMemo(
    () =>
      buildGroups(
        tasks,
        groupBy,
        lang,
        projectsByKey,
        projectsByName,
        allTasks
      ),
    [tasks, groupBy, lang, projectsByKey, projectsByName, allTasks]
  )

  return (
    <div
      data-testid={
        groupBy === "none" ? "mt-flat-list" : "mt-grouped-list"
      }
    >
      {groups.map((g) => {
        const isCollapsed = collapsed?.[g.id] ?? false
        const items = g.items
        // Cap tall groups at 300px scroll viewport (prototype my-tasks-parts.jsx
        // line 416). 5 is a small enough list that no scroll feels natural.
        const maxHeight = items.length > 5 ? 300 : undefined

        return (
          <div key={g.id} data-group-id={g.id}>
            <button
              type="button"
              onClick={() => onToggleCollapse?.(g.id)}
              aria-expanded={!isCollapsed}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "var(--surface-2)",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                position: "sticky",
                top: 0,
                zIndex: 2,
                boxShadow: isCollapsed
                  ? "none"
                  : "0 1px 3px oklch(0 0 0 / 0.06)",
                color: "var(--fg)",
                border: "none",
                textAlign: "left",
                font: "inherit",
              }}
            >
              <ChevronRight
                size={12}
                style={{
                  color: "var(--fg-subtle)",
                  transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
                  transition: "transform 0.15s",
                }}
                aria-hidden
              />
              {g.icon}
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{g.label}</span>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {items.length}
              </span>
              {g.meta && (
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--fg-muted)",
                    marginLeft: 4,
                  }}
                >
                  · {g.meta}
                </span>
              )}
              <div style={{ flex: 1 }} />
              {g.progress !== undefined && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 100,
                      height: 4,
                      borderRadius: 2,
                      background: "var(--surface)",
                      overflow: "hidden",
                      boxShadow: "inset 0 0 0 1px var(--border)",
                      display: "inline-block",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: `${g.progress}%`,
                        height: "100%",
                        background: g.color || "var(--primary)",
                      }}
                    />
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: "var(--fg-muted)",
                      width: 28,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {g.progress}%
                  </span>
                </span>
              )}
            </button>
            {!isCollapsed && (
              <div
                style={{
                  maxHeight,
                  overflowY: maxHeight ? "auto" : "visible",
                }}
              >
                {items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    compact={compact}
                    density={density}
                    starred={starred.includes(task.id)}
                    onToggleStar={() => onToggleStar(task.id)}
                    onChangeStatus={
                      onChangeStatus
                        ? (next) => onChangeStatus(task.id, next)
                        : undefined
                    }
                    showProject={
                      groupBy !== "project" && !!projectsByKey
                    }
                    projectKey={projectsByKey?.get(task.projectId)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
