"use client"

// TaskGroupList — renders the filtered/sorted task list, optionally grouped.
//
// When `groupBy === "none"`, the rows render as a flat sequence with bottom
// borders. When grouping is active, the list shows ONE collapsible header per
// group followed by its rows. The groupKey mapping is:
//   project  → project key (via projectsByKey map)
//   status   → task.status raw string
//   priority → task.priority raw string
//   due      → dueBucket(task.due) output ("overdue"/"today"/...)
//
// Group ordering matches the prototype's deterministic order (e.g. due:
// overdue → today → this_week → later → none) instead of insertion order.
// Groups with zero items are dropped so the list never shows an empty header.

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { useApp } from "@/context/app-context"
import { dueBucket, type DueBucket } from "@/lib/my-tasks/due-bucket"
import type { Task } from "@/services/task-service"

import { TaskRow, type TaskRowDensity } from "./task-row"

export type GroupBy = "due" | "project" | "status" | "priority" | "none"

interface TaskGroupListProps {
  tasks: Task[]
  groupBy: GroupBy
  starred: number[]
  onToggleStar: (id: number) => void
  /** Legacy prop (Dashboard Member view). Pass `density="compact"` instead. */
  compact?: boolean
  density?: TaskRowDensity
  projectsByKey?: Map<number, string>
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

interface BuiltGroup {
  id: string
  label: string
  items: Task[]
}

function groupKeyFor(task: Task, groupBy: GroupBy, projectsByKey?: Map<number, string>): string {
  if (groupBy === "project") {
    return projectsByKey?.get(task.projectId) ?? `#${task.projectId}`
  }
  if (groupBy === "status") return task.status
  if (groupBy === "priority") return task.priority
  return dueBucket(task.due)
}

function buildGroups(
  tasks: Task[],
  groupBy: GroupBy,
  lang: "tr" | "en",
  projectsByKey?: Map<number, string>
): BuiltGroup[] {
  if (groupBy === "none" || tasks.length === 0) {
    return [
      {
        id: "_all",
        label: lang === "tr" ? "Tüm görevler" : "All tasks",
        items: tasks,
      },
    ]
  }

  // Bucket the tasks first.
  const buckets = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = groupKeyFor(t, groupBy, projectsByKey)
    const list = buckets.get(key)
    if (list) list.push(t)
    else buckets.set(key, [t])
  }

  // Determine display order. due/status/priority follow a fixed order; project
  // is sorted by group size descending (matches the prototype, lines 270-285).
  let order: string[]
  if (groupBy === "due") order = DUE_ORDER as unknown as string[]
  else if (groupBy === "status") order = STATUS_ORDER as unknown as string[]
  else if (groupBy === "priority") order = PRIORITY_ORDER as unknown as string[]
  else {
    order = Array.from(buckets.keys()).sort(
      (a, b) => (buckets.get(b)?.length ?? 0) - (buckets.get(a)?.length ?? 0)
    )
  }

  const out: BuiltGroup[] = []
  for (const id of order) {
    const items = buckets.get(id) ?? []
    if (items.length === 0) continue
    let label = id
    if (groupBy === "due" && id in DUE_LABELS) {
      label = lang === "tr" ? DUE_LABELS[id as DueBucket].tr : DUE_LABELS[id as DueBucket].en
    } else if (groupBy === "status" && id in STATUS_LABELS) {
      label = lang === "tr" ? STATUS_LABELS[id].tr : STATUS_LABELS[id].en
    } else if (groupBy === "priority" && id in PRIORITY_LABELS) {
      label = lang === "tr" ? PRIORITY_LABELS[id].tr : PRIORITY_LABELS[id].en
    }
    out.push({ id, label, items })
  }
  // Append any unclassified buckets at the end (e.g. backend introduces a new
  // status token we don't have a label for yet — Open/Closed Principle: extend
  // by data, never crash by missing).
  for (const [id, items] of buckets) {
    if (!out.find((g) => g.id === id) && items.length > 0) {
      out.push({ id, label: id, items })
    }
  }
  return out
}

export function TaskGroupList({
  tasks,
  groupBy,
  starred,
  onToggleStar,
  compact,
  density,
  projectsByKey,
  collapsed,
  onToggleCollapse,
}: TaskGroupListProps) {
  const { language: lang } = useApp()
  const groups = React.useMemo(
    () => buildGroups(tasks, groupBy, lang, projectsByKey),
    [tasks, groupBy, lang, projectsByKey]
  )

  // Single flat list (no group headers). Renders rows directly so the parent
  // Card frame wraps everything cleanly.
  if (groupBy === "none") {
    return (
      <div data-testid="mt-flat-list">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            compact={compact}
            density={density}
            starred={starred.includes(task.id)}
            onToggleStar={() => onToggleStar(task.id)}
            showProject={!!projectsByKey}
            projectKey={projectsByKey?.get(task.projectId)}
          />
        ))}
      </div>
    )
  }

  return (
    <div data-testid="mt-grouped-list">
      {groups.map((g) => {
        const isCollapsed = collapsed?.[g.id] ?? false
        const Chevron = isCollapsed ? ChevronRight : ChevronDown
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
                gap: 8,
                padding: "10px 14px",
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
                borderTop: "1px solid var(--border)",
                fontSize: 11.5,
                fontWeight: 600,
                color: "var(--fg-muted)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                cursor: "pointer",
              }}
            >
              <Chevron
                size={12}
                style={{ color: "var(--fg-subtle)" }}
                aria-hidden
              />
              <span>{g.label}</span>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: "var(--fg-subtle)",
                  fontWeight: 500,
                  letterSpacing: 0.3,
                  textTransform: "none",
                }}
              >
                · {g.items.length}
              </span>
            </button>
            {!isCollapsed &&
              g.items.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  compact={compact}
                  density={density}
                  starred={starred.includes(task.id)}
                  onToggleStar={() => onToggleStar(task.id)}
                  // When grouping by project, the key is already shown in the
                  // header — hide the per-row badge to avoid redundancy.
                  showProject={
                    groupBy !== "project" && !!projectsByKey
                  }
                  projectKey={projectsByKey?.get(task.projectId)}
                />
              ))}
          </div>
        )
      })}
    </div>
  )
}
