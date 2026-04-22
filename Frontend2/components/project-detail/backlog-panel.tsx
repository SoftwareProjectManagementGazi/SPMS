"use client"

// BacklogPanel — 300px left column that the ProjectDetail shell mounts next to
// its tab content (D-13). Panel contents are methodology-aware via
// resolveBacklogFilter(project) (D-16/D-17/D-18) → useBacklog(project) (Plan
// 11-01). Search + priority chips + assignee avatar filters run client-side
// per D-15.
//
// Cross-container DnD (Plan 11-06): the panel renders inside the same
// <ProjectDnDProvider> that wraps the Board. Rows register as draggables with
// source columnId = "__backlog__" (see backlog-task-row.tsx). Drop onto any
// board column triggers the shell's handleDropped callback which invalidates
// both the project task list AND the backlog query, causing the row to
// disappear from this panel after a successful PATCH.
//
// Bulk operations (D-15) are explicitly DEFERRED to Phase 12/13 — this file
// deliberately ships without bulk checkboxes, "Select all", or bulk action
// bars. A grep verify step in the plan asserts these strings do not exist.
//
// Responsive (D-54): <1280px viewport auto-closes. Toggle remains visible; if
// the user force-opens, a "Dar ekranda kısıtlı görünüm" hint shows in the
// header (English: "Narrow screen — limited view").

import * as React from "react"
import { Search, X } from "lucide-react"

import { Avatar, Badge, Input } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useBacklog } from "@/hooks/use-backlog"
import type { Project } from "@/services/project-service"
import type { Task } from "@/services/task-service"

import { BacklogTaskRow } from "./backlog-task-row"

type Priority = "low" | "medium" | "high" | "critical"

const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"]

const PRIO_LABEL: Record<Priority, { tr: string; en: string }> = {
  critical: { tr: "Kritik", en: "Critical" },
  high: { tr: "Yüksek", en: "High" },
  medium: { tr: "Orta", en: "Medium" },
  low: { tr: "Düşük", en: "Low" },
}

const BACKLOG_DEF_LABEL: Record<
  string,
  { tr: string; en: string }
> = {
  cycle_null: { tr: "Döngü'e atanmamış", en: "Not in cycle" },
  leftmost_column: { tr: "İlk kolon", en: "Leftmost column" },
  phase_null_or_first: { tr: "Faza atanmamış", en: "Not in phase" },
  custom: { tr: "Özel", en: "Custom" },
}

const OPEN_KEY = (projectId: number): string =>
  `spms.backlog.open.${projectId}`

/**
 * useBacklogOpenState — owns the open/closed boolean + <1280px auto-close (D-54)
 * + localStorage persistence at `spms.backlog.open.{projectId}` (D-14).
 *
 * `effectiveOpen` is what callers should gate rendering on: on narrow screens
 * (<1280px) it ignores the persisted preference and returns false, so the panel
 * auto-closes but the stored value is preserved for when the viewport grows.
 * `narrow` is exposed so callers can show the "Dar ekranda kısıtlı görünüm"
 * hint when the user force-opens despite being narrow (setOpen(true) while
 * narrow still flips `open` to true — but effectiveOpen stays true only when
 * not narrow, so rendering path keeps the user's intent separated from the
 * computed visibility).
 */
export function useBacklogOpenState(projectId: number): {
  open: boolean
  effectiveOpen: boolean
  narrow: boolean
  setOpen: (v: boolean) => void
} {
  // Default closed on first visit (D-14). Hydrate from localStorage AFTER mount
  // so SSR and first-client render match — avoids hydration mismatch when the
  // stored value differs from the server-rendered default.
  const [open, setOpenState] = React.useState<boolean>(false)
  const [narrow, setNarrow] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(OPEN_KEY(projectId))
      if (stored !== null) setOpenState(stored === "true")
    } catch {
      /* ignore — T-08-01 style defensive read */
    }
  }, [projectId])

  const setOpen = React.useCallback(
    (v: boolean) => {
      setOpenState(v)
      if (typeof window === "undefined") return
      try {
        window.localStorage.setItem(OPEN_KEY(projectId), String(v))
      } catch {
        /* ignore */
      }
    },
    [projectId]
  )

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const onResize = () => setNarrow(window.innerWidth < 1280)
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // D-54: narrow viewports force-close — but we keep `open` separate from
  // `effectiveOpen` so the user's intent is preserved when the viewport grows.
  const effectiveOpen = narrow ? false : open

  return { open, effectiveOpen, narrow, setOpen }
}

interface BacklogPanelProps {
  project: Project
  open: boolean
  onClose: () => void
  narrow: boolean
}

export function BacklogPanel({
  project,
  open,
  onClose,
  narrow,
}: BacklogPanelProps) {
  const { language } = useApp()
  const { data: tasks = [], isLoading } = useBacklog(project)
  const [search, setSearch] = React.useState<string>("")
  const [activePriorities, setActivePriorities] = React.useState<Priority[]>([])
  const [activeAssignees, setActiveAssignees] = React.useState<number[]>([])

  const togglePriority = React.useCallback((p: Priority) => {
    setActivePriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }, [])

  const toggleAssignee = React.useCallback((id: number) => {
    setActiveAssignees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const filtered = React.useMemo<Task[]>(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (q) {
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.key.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (
        activePriorities.length > 0 &&
        !activePriorities.includes(t.priority)
      ) {
        return false
      }
      if (activeAssignees.length > 0) {
        if (t.assigneeId == null) return false
        if (!activeAssignees.includes(t.assigneeId)) return false
      }
      return true
    })
  }, [tasks, search, activePriorities, activeAssignees])

  // Unique assignees on the backlog tasks (client-side) for the avatar filter.
  const uniqueAssignees = React.useMemo<number[]>(() => {
    const ids = new Set<number>()
    tasks.forEach((t) => {
      if (t.assigneeId != null) ids.add(t.assigneeId)
    })
    return Array.from(ids)
  }, [tasks])

  // Backlog definition label for the header pill (D-17 override fallback).
  const cfg = (project.processConfig ?? {}) as {
    backlog_definition?: string
  }
  const def = cfg.backlog_definition ?? "cycle_null"
  const defLabel = BACKLOG_DEF_LABEL[def] ?? { tr: "Backlog", en: "Backlog" }

  if (!open) return null

  return (
    <aside
      aria-label={language === "tr" ? "Backlog paneli" : "Backlog panel"}
      style={{
        width: 300,
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        transition: "width 180ms ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Backlog</div>
        <Badge size="xs" tone="neutral">
          {language === "tr" ? defLabel.tr : defLabel.en}
        </Badge>
        <button
          type="button"
          onClick={onClose}
          aria-label={language === "tr" ? "Kapat" : "Close"}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-muted)",
            padding: 4,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Narrow-screen hint (D-54) */}
      {narrow && (
        <div
          style={{
            padding: "8px 12px",
            background: "var(--surface-2)",
            fontSize: 11.5,
            color: "var(--fg-subtle)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {language === "tr"
            ? "Dar ekranda kısıtlı görünüm"
            : "Narrow screen — limited view"}
        </div>
      )}

      {/* Toolbar: search + priority filters + assignee filters */}
      <div
        style={{
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <Input
          icon={<Search size={12} />}
          placeholder={
            language === "tr" ? "Görevlerde ara…" : "Search tasks…"
          }
          size="sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {PRIORITIES.map((p) => {
            const active = activePriorities.includes(p)
            const tokenLevel = p === "medium" ? "med" : p
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePriority(p)}
                aria-pressed={active}
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: active
                    ? `color-mix(in oklch, var(--priority-${tokenLevel}) 25%, transparent)`
                    : "var(--surface-2)",
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  boxShadow: active
                    ? `inset 0 0 0 1px var(--priority-${tokenLevel})`
                    : "inset 0 0 0 1px var(--border)",
                  fontWeight: 500,
                }}
              >
                {PRIO_LABEL[p][language]}
              </button>
            )
          })}
        </div>
        {uniqueAssignees.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {uniqueAssignees.map((aid) => {
              const active = activeAssignees.includes(aid)
              const avatarUser = {
                initials: `#${aid}`.slice(0, 2).toUpperCase(),
                avColor: ((aid % 8) + 1) as number,
              }
              return (
                <button
                  key={aid}
                  type="button"
                  onClick={() => toggleAssignee(aid)}
                  aria-pressed={active}
                  aria-label={
                    language === "tr"
                      ? `Atanan ${aid} filtresi`
                      : `Assignee ${aid} filter`
                  }
                  style={{
                    padding: 2,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: "transparent",
                    boxShadow: active ? "0 0 0 2px var(--primary)" : "none",
                    display: "inline-flex",
                  }}
                >
                  <Avatar user={avatarUser} size={22} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {isLoading ? (
          <div
            style={{
              padding: 20,
              color: "var(--fg-muted)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {language === "tr" ? "Yükleniyor…" : "Loading…"}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: "var(--fg-subtle)",
            }}
          >
            <div
              style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}
            >
              {language === "tr" ? "Backlog boş" : "Backlog is empty"}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
              {language === "tr"
                ? "Filtreleri temizleyin veya görev ekleyin"
                : "Clear filters or add tasks"}
            </div>
          </div>
        ) : (
          filtered.map((t) => (
            <BacklogTaskRow key={t.id} task={t} projectId={project.id} />
          ))
        )}
      </div>

      {/* Footer: count */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--fg-muted)",
          flexShrink: 0,
        }}
      >
        {filtered.length} / {tasks.length}{" "}
        {language === "tr" ? "görev" : "tasks"}
      </div>
    </aside>
  )
}
