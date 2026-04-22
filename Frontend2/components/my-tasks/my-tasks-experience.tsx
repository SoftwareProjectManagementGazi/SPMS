"use client"

// MyTasksExperience — the reusable component behind /my-tasks AND the
// Dashboard "Benim İşim" Member view (D-32 / D-33 / D-52).
//
// Props:
//   compact        — hide the saved-views tabbar + hero header (dashboard use)
//   defaultView    — initial saved view (today/overdue/upcoming/starred/all/done)
//   hideHeader     — hide the page-title hero (default auto-hidden in compact)
//   hideRightRail  — reserved for full-page right-rail (future scope, read-only)
//   hideQuickAdd   — reserved for quick-add input (future scope, read-only)
//
// Data sources:
//   tasks       ← useMyTasks()       (GET /tasks/my-tasks)
//   projects    ← useProjects()      (GET /projects) — for project key lookup
//   store       ← useMyTasksStore()  (spms.myTasksStore localStorage)

import * as React from "react"

import { useApp } from "@/context/app-context"
import { useMyTasksStore } from "@/hooks/use-my-tasks-store"
import { useProjects } from "@/hooks/use-projects"
import { useMyTasks } from "@/hooks/use-tasks"
import { dueBucket } from "@/lib/my-tasks/due-bucket"
import { smartSort } from "@/lib/my-tasks/smart-sort"

import { SavedViewsTabs, type ViewId } from "./saved-views-tabs"
import { TaskFilterBar, type GroupBy } from "./task-filter-bar"
import { TaskGroupList } from "./task-group-list"

interface MyTasksExperienceProps {
  compact?: boolean
  defaultView?: ViewId
  hideHeader?: boolean
  /** Reserved for full-page right rail (deferred). */
  hideRightRail?: boolean
  /** Reserved for inline quick-add input (deferred). */
  hideQuickAdd?: boolean
}

export function MyTasksExperience({
  compact,
  defaultView = "all",
  hideHeader,
  // Props below are reserved for the full-page right-rail + quick-add which
  // are out of scope for Phase 11 plan 10 — we accept them so the public
  // contract matches the D-33 / D-52 call sites without forcing callers to
  // pass noop props.
  hideRightRail: _hideRightRail,
  hideQuickAdd: _hideQuickAdd,
}: MyTasksExperienceProps) {
  const { language: lang } = useApp()
  const { data: tasks = [] } = useMyTasks()
  const { data: projects = [] } = useProjects()
  const [store, setStore] = useMyTasksStore()

  const [view, setView] = React.useState<ViewId>(defaultView)
  const [search, setSearch] = React.useState("")
  const [groupBy, setGroupBy] = React.useState<GroupBy>("none")

  const projectsByKey = React.useMemo(() => {
    const m = new Map<number, string>()
    for (const p of projects) m.set(p.id, p.key)
    return m
  }, [projects])

  const toggleStar = React.useCallback(
    (id: number) => {
      setStore((prev) => ({
        ...prev,
        starred: prev.starred.includes(id)
          ? prev.starred.filter((x) => x !== id)
          : [...prev.starred, id],
      }))
    },
    [setStore]
  )

  // View filter — matches prototype MT_VIEWS filter contract. Kept inline for
  // clarity and to avoid spreading the switch across a helper module.
  const viewFiltered = React.useMemo(() => {
    return tasks.filter((t) => {
      const bucket = dueBucket(t.due)
      switch (view) {
        case "today":
          return bucket === "today" && t.status !== "done"
        case "overdue":
          return bucket === "overdue" && t.status !== "done"
        case "upcoming":
          return (
            (bucket === "this_week" || bucket === "later") &&
            t.status !== "done"
          )
        case "starred":
          return store.starred.includes(t.id)
        case "done":
          return t.status === "done"
        case "all":
          return t.status !== "done"
        default:
          return true
      }
    })
  }, [tasks, view, store.starred])

  const searched = React.useMemo(() => {
    if (!search.trim()) return viewFiltered
    const q = search.toLowerCase()
    return viewFiltered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q)
    )
  }, [viewFiltered, search])

  const sorted = React.useMemo(
    () => [...searched].sort(smartSort),
    [searched]
  )

  // Count each view for the tab badges. Uses the same predicates as the
  // viewFiltered switch above, so the counts stay consistent with clicks.
  const counts = React.useMemo<Record<ViewId, number>>(() => {
    const c: Record<ViewId, number> = {
      today: 0,
      overdue: 0,
      upcoming: 0,
      starred: 0,
      all: 0,
      done: 0,
    }
    for (const t of tasks) {
      const bucket = dueBucket(t.due)
      if (t.status === "done") {
        c.done++
      } else {
        c.all++
        if (bucket === "today") c.today++
        if (bucket === "overdue") c.overdue++
        if (bucket === "this_week" || bucket === "later") c.upcoming++
      }
      if (store.starred.includes(t.id)) c.starred++
    }
    return c
  }, [tasks, store.starred])

  const showHero = !compact && !hideHeader

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 8 : 16,
      }}
    >
      {showHero && (
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: -0.6,
              margin: 0,
            }}
          >
            {lang === "tr" ? "Görevlerim" : "My Tasks"}
          </h1>
          <div
            style={{
              fontSize: 13,
              color: "var(--fg-muted)",
              marginTop: 4,
            }}
          >
            {tasks.length}{" "}
            {lang === "tr" ? "görev" : tasks.length === 1 ? "task" : "tasks"}
          </div>
        </div>
      )}

      {!compact && (
        <SavedViewsTabs value={view} onChange={setView} counts={counts} />
      )}

      <TaskFilterBar
        search={search}
        onSearch={setSearch}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />

      <TaskGroupList
        tasks={sorted}
        groupBy={groupBy}
        starred={store.starred}
        onToggleStar={toggleStar}
        compact={compact}
        projectsByKey={projectsByKey}
      />
    </div>
  )
}
