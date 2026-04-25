"use client"

// MyTasksExperience — the reusable experience behind /my-tasks AND the
// Dashboard "Benim İşim" Member view (D-32 / D-33 / D-52).
//
// This is a 1:1 rebuild against the prototype `New_Frontend/src/pages/my-tasks.jsx`.
// The previous implementation only shipped saved-views + a search/group toolbar
// (~200 LOC across 5 files); the prototype includes:
//
//   - MTHero — gradient banner + greeting + 4-stat grid
//   - MTQuickAdd — inline create-task row (real backend POST /tasks)
//   - MTToolbar — saved-views pills + search + group-by + priority chips +
//     sort dropdown + density toggle
//   - Card-framed task list with footer ({N} görev · {points} puan · ⌘N yeni görev)
//   - MTRightRail — 7-day heatmap + focus-timer placeholder + recently
//     completed + quote
//
// Compact mode (Dashboard Member view) hides the hero, quick-add, saved-views,
// and right rail to fit inside the dashboard column.
//
// Data sources:
//   tasks       ← useMyTasks()       (GET /tasks/my-tasks)
//   projects    ← useProjects()      (GET /projects)
//   store       ← useMyTasksStore()  (spms.myTasksStore localStorage)
//
// Prefs persist to localStorage under the `spms.mt.*` key family, matching
// the prototype keys verbatim so the user's preferences survive reloads:
//   spms.mt.view, spms.mt.groupBy.{page|dash}, spms.mt.priFilter,
//   spms.mt.density, spms.mt.sort, spms.mt.collapsed.{page|dash}.

import * as React from "react"

import { Card, Kbd } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useMyTasksStore } from "@/hooks/use-my-tasks-store"
import { useProjects } from "@/hooks/use-projects"
import { useChangeTaskStatus, useMyTasks } from "@/hooks/use-tasks"
import { dueBucket } from "@/lib/my-tasks/due-bucket"
import type { Task } from "@/services/task-service"
import type { StatusValue } from "@/components/primitives/status-dot"

import { MTEmpty } from "./mt-empty"
import { MTHero } from "./mt-hero"
import { MTQuickAdd } from "./mt-quick-add"
import { MTRightRail } from "./mt-right-rail"
import {
  MTToolbar,
  type GroupBy,
  type Priority,
  type SortKey,
} from "./mt-toolbar"
import type { MTDensityKind } from "./mt-density-icon"
import type { ViewId } from "./saved-views-tabs"
import { TaskGroupList } from "./task-group-list"

// localStorage helpers — mirror AppContext's prefix scheme so all SPMS keys
// share the `spms.` namespace. Try/catch is required because Safari Private
// Mode and quota-exceeded errors throw on setItem.
function loadLS<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def
  try {
    const v = window.localStorage.getItem("spms." + key)
    return v !== null ? (JSON.parse(v) as T) : def
  } catch {
    return def
  }
}

function saveLS<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem("spms." + key, JSON.stringify(value))
  } catch {
    /* ignore — UX state, not data */
  }
}

interface MyTasksExperienceProps {
  compact?: boolean
  defaultView?: ViewId
  defaultGroupBy?: GroupBy
  hideHeader?: boolean
  hideRightRail?: boolean
  hideQuickAdd?: boolean
  hideFilters?: boolean
  /** Pre-scope to a single project (Dashboard project-tasks card). */
  projectFilter?: number | null
  title?: string
  subtitle?: string
}

export function MyTasksExperience({
  compact = false,
  defaultView = "today",
  defaultGroupBy = "due",
  hideHeader = false,
  hideRightRail = false,
  hideQuickAdd = false,
  hideFilters = false,
  projectFilter = null,
  title,
  subtitle,
}: MyTasksExperienceProps) {
  const { language: lang } = useApp()
  const { data: tasks = [] } = useMyTasks()
  const { data: projects = [] } = useProjects()
  const [store, setStore] = useMyTasksStore()

  // `nowMs` is a captured timestamp that updates roughly once per minute. We
  // use this instead of calling `Date.now()` directly inside `useMemo` so the
  // memo body stays pure (react-hooks/purity).
  const [nowMs, setNowMs] = React.useState<number>(() => Date.now())
  React.useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  // localStorage suffix differs between page (full) and compact (dashboard)
  // so the two surfaces have independent preferences.
  const lsSuffix = compact ? "dash" : "page"

  // Compact (dashboard) callers pin to the "all" view because the dashboard
  // already filters tasks by project — exposing the saved-views row would let
  // the user filter to "Bugün" inside a card scoped to one project, which
  // doesn't make sense.
  //
  // Hydration safety: every preference state ALSO has a localStorage source.
  // Calling `loadLS` inside the useState lazy initializer would return the
  // default on the server (where window is undefined) and the stored value
  // on the client, producing a hydration mismatch on the very first paint
  // for any user who has changed a preference. Instead we render the
  // defaults on first paint AND on the server, then `useEffect` swaps in
  // the stored values after mount via `setStateFromLS`. The `hydrated` ref
  // gates the persist effects so the post-mount load doesn't immediately
  // overwrite the very value it just read.
  const [view, setView] = React.useState<ViewId>(
    compact ? "all" : defaultView
  )
  const [groupBy, setGroupBy] = React.useState<GroupBy>(defaultGroupBy)
  const [search, setSearch] = React.useState("")
  const [priFilter, setPriFilter] = React.useState<Priority[]>([])
  const [density, setDensity] = React.useState<MTDensityKind>("cozy")
  const [sort, setSort] = React.useState<SortKey>("smart")
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})
  const hydrated = React.useRef(false)

  React.useEffect(() => {
    if (!compact) setView(loadLS<ViewId>("mt.view", defaultView))
    setGroupBy(loadLS<GroupBy>(`mt.groupBy.${lsSuffix}`, defaultGroupBy))
    setPriFilter(loadLS<Priority[]>("mt.priFilter", []))
    setDensity(loadLS<MTDensityKind>("mt.density", "cozy"))
    setSort(loadLS<SortKey>("mt.sort", "smart"))
    setCollapsed(loadLS<Record<string, boolean>>(`mt.collapsed.${lsSuffix}`, {}))
    hydrated.current = true
    // Mount-only — `lsSuffix`, `defaultGroupBy`, `defaultView`, `compact` are
    // stable for the lifetime of a single MyTasksExperience instance, so we
    // intentionally don't depend on them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist on change (skip view in compact mode — the value is forced).
  // The `hydrated` gate prevents the post-mount load effect from triggering
  // a clobbering write back with the same value (still a write, but harmless).
  React.useEffect(() => {
    if (hydrated.current && !compact) saveLS("mt.view", view)
  }, [view, compact])
  React.useEffect(() => {
    if (hydrated.current) saveLS(`mt.groupBy.${lsSuffix}`, groupBy)
  }, [groupBy, lsSuffix])
  React.useEffect(() => {
    if (hydrated.current) saveLS("mt.priFilter", priFilter)
  }, [priFilter])
  React.useEffect(() => {
    if (hydrated.current) saveLS("mt.density", density)
  }, [density])
  React.useEffect(() => {
    if (hydrated.current) saveLS("mt.sort", sort)
  }, [sort])
  React.useEffect(() => {
    if (hydrated.current) saveLS(`mt.collapsed.${lsSuffix}`, collapsed)
  }, [collapsed, lsSuffix])

  const projectsByKey = React.useMemo(() => {
    const m = new Map<number, string>()
    for (const p of projects) m.set(p.id, p.key)
    return m
  }, [projects])

  // Star toggle — direct write to the store; matches prototype's `toggleStar`.
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

  // Status change handler — wired through TaskGroupList → TaskRow's leftmost
  // clickable status circle. Optimistic via useChangeTaskStatus; rolls back
  // on error.
  const changeStatusMut = useChangeTaskStatus()
  const changeStatus = React.useCallback(
    (id: number, next: StatusValue) => {
      changeStatusMut.mutate({ id, status: next })
    },
    [changeStatusMut]
  )

  // -- Filter pipeline ----------------------------------------------------
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
            (bucket === "today" ||
              bucket === "this_week" ||
              bucket === "later") &&
            t.status !== "done"
          )
        case "starred":
          return store.starred.includes(t.id)
        case "done":
          return t.status === "done"
        case "all":
        default:
          return t.status !== "done"
      }
    })
  }, [tasks, view, store.starred])

  const projScoped = React.useMemo(() => {
    if (projectFilter == null) return viewFiltered
    return viewFiltered.filter((t) => t.projectId === projectFilter)
  }, [viewFiltered, projectFilter])

  const priFiltered = React.useMemo(() => {
    if (priFilter.length === 0) return projScoped
    return projScoped.filter((t) => priFilter.includes(t.priority))
  }, [projScoped, priFilter])

  const searched = React.useMemo(() => {
    if (!search.trim()) return priFiltered
    const q = search.toLowerCase()
    return priFiltered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q)
    )
  }, [priFiltered, search])

  // Sort — 4 strategies; pure functions, deterministic across renders.
  const sorted = React.useMemo(() => {
    const xs = [...searched]
    if (sort === "smart") {
      const bucketRank: Record<string, number> = {
        overdue: 0,
        today: 1,
        this_week: 2,
        later: 3,
        none: 4,
      }
      const priRank: Record<string, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      }
      xs.sort((a, b) => {
        const aB = dueBucket(a.due)
        const bB = dueBucket(b.due)
        if (bucketRank[aB] !== bucketRank[bB]) {
          return bucketRank[aB] - bucketRank[bB]
        }
        const aD = a.due ?? "9999-99-99"
        const bD = b.due ?? "9999-99-99"
        if (aD !== bD) return aD.localeCompare(bD)
        return (priRank[a.priority] ?? 99) - (priRank[b.priority] ?? 99)
      })
    } else if (sort === "priority") {
      const pr: Record<string, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      }
      xs.sort((a, b) => (pr[a.priority] ?? 99) - (pr[b.priority] ?? 99))
    } else if (sort === "due") {
      xs.sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"))
    } else if (sort === "newest") {
      xs.sort((a, b) => b.id - a.id)
    }
    return xs
  }, [searched, sort])

  // -- View counts (for the saved-view pills) -----------------------------
  const viewCounts = React.useMemo<Record<ViewId, number>>(() => {
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
        if (bucket === "today") {
          c.today++
          c.upcoming++
        } else if (bucket === "overdue") {
          c.overdue++
        } else if (bucket === "this_week" || bucket === "later") {
          c.upcoming++
        }
      }
      if (store.starred.includes(t.id)) c.starred++
    }
    return c
  }, [tasks, store.starred])

  // -- Hero stats ---------------------------------------------------------
  const heroStats = React.useMemo(() => {
    const active = tasks.filter((t) => t.status !== "done")
    let overdue = 0
    let today = 0
    let week = 0
    for (const t of active) {
      const b = dueBucket(t.due)
      if (b === "overdue") overdue++
      else if (b === "today") today++
      else if (b === "this_week") week++
    }
    // Done in the last 7 days (rough heuristic — the store keeps both ISO
    // strings AND legacy numeric timestamps, see use-my-tasks-store.ts).
    // `nowMs` is captured at render via a state slice that ticks at most once
    // per minute (see useNowFloor below) so the memo stays pure.
    const sevenDaysAgo = nowMs - 7 * 86_400_000
    const done = Object.values(store.completedAt).filter((v) => {
      const ts = typeof v === "string" ? Date.parse(v) : (v as number)
      return ts > sevenDaysAgo
    }).length
    return { overdue, today, week, done }
  }, [tasks, store.completedAt, nowMs])

  const toggleCollapse = React.useCallback((groupId: string) => {
    setCollapsed((c) => ({ ...c, [groupId]: !c[groupId] }))
  }, [])

  // Keyboard shortcut: ⌘N / Ctrl+N focuses the QuickAdd title input.
  // Wired via a ref so the same focus path works whether the user is on the
  // page or scrolled mid-list.
  const quickAddRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (compact || hideQuickAdd) return
    function onKey(e: KeyboardEvent) {
      const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform)
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "n") {
        const input = quickAddRef.current?.querySelector(
          "input[type='text']"
        ) as HTMLInputElement | null
        if (input) {
          e.preventDefault()
          input.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [compact, hideQuickAdd])

  const showHero = !compact && !hideHeader
  const showQuickAdd = !compact && !hideQuickAdd
  const showRightRail = !compact && !hideRightRail
  const totalPoints = sorted.reduce(
    (s: number, t: Task) => s + (t.points ?? 0),
    0
  )
  const isEmpty = sorted.length === 0

  // -- Render -------------------------------------------------------------
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 12 : 18,
      }}
    >
      {showHero && (
        <MTHero
          stats={heroStats}
          lang={lang}
          title={title}
          subtitle={subtitle}
        />
      )}

      {showQuickAdd && (
        <div ref={quickAddRef}>
          <MTQuickAdd lang={lang} projects={projects} />
        </div>
      )}

      {!hideFilters && (
        <MTToolbar
          compact={compact}
          lang={lang}
          view={view}
          setView={setView}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          search={search}
          setSearch={setSearch}
          priFilter={priFilter}
          setPriFilter={setPriFilter}
          density={density}
          setDensity={setDensity}
          sort={sort}
          setSort={setSort}
          viewCounts={viewCounts}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: showRightRail
            ? "minmax(0, 1fr) 300px"
            : "minmax(0, 1fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <Card padding={0} style={{ overflow: "hidden" }}>
          {isEmpty ? (
            <MTEmpty lang={lang} view={view} />
          ) : (
            <TaskGroupList
              tasks={sorted}
              groupBy={groupBy}
              starred={store.starred}
              onToggleStar={toggleStar}
              onChangeStatus={changeStatus}
              compact={compact}
              density={density}
              projectsByKey={projectsByKey}
              collapsed={collapsed}
              onToggleCollapse={toggleCollapse}
            />
          )}
          <div
            data-testid="mt-list-footer"
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11.5,
              color: "var(--fg-muted)",
              borderTop: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <span>
              {sorted.length} {lang === "tr" ? "görev" : "tasks"}
            </span>
            <span style={{ color: "var(--fg-subtle)" }}>·</span>
            <span>
              {totalPoints} {lang === "tr" ? "puan" : "points"}
            </span>
            <div style={{ flex: 1 }} />
            <Kbd>⌘</Kbd>
            <Kbd>N</Kbd>
            <span style={{ marginLeft: 4 }}>
              {lang === "tr" ? "yeni görev" : "new task"}
            </span>
          </div>
        </Card>

        {showRightRail && (
          <MTRightRail
            lang={lang}
            store={store}
            allTasks={tasks}
            projectsByKey={projectsByKey}
          />
        )}
      </div>
    </div>
  )
}
