"use client"

// BoardTab — Phase 11 Plan 05 main export (DnD wrapper lifted to the shell in
// Plan 11-06).
//
// Renders the 4-column kanban. Plan 11-06 moved <ProjectDnDProvider> UP to
// ProjectDetailShell so the Backlog panel can share the Board's drag space
// (cross-container drop: backlog row → board column). The shell owns the
// DnD context + the onTaskDropped / renderGhost callbacks now; BoardTab here
// only renders the toolbar + the column grid.
//
// Columns are derived from GET /projects/{id}/columns (wipLimit + name) when
// available, otherwise we fall back to project.columns which is the status
// string list from the project payload. Filtering (search + phase) happens
// client-side against ProjectDetailContext state.

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/lib/api-client"
import { useTasks } from "@/hooks/use-tasks"
import type { Project } from "@/services/project-service"
import { normalizeStatus, type Task } from "@/services/task-service"
import { DataState } from "@/components/primitives"

import { BoardColumn } from "./board-column"
import { BoardToolbar } from "./board-toolbar"
import { useProjectDetail } from "./project-detail-context"

interface ColumnMetaDTO {
  id: number
  name: string
  order_index: number
  wip_limit: number
  task_count: number
}

function useColumns(projectId: number) {
  return useQuery({
    queryKey: ["columns", projectId],
    queryFn: async () => {
      const resp = await apiClient.get<ColumnMetaDTO[]>(
        `/projects/${projectId}/columns`
      )
      return resp.data
    },
    staleTime: 60_000,
  })
}

export function BoardTab({ project }: { project: Project }) {
  const pd = useProjectDetail()

  const { data: tasksData, isLoading, error, refetch } = useTasks(project.id)
  // Defensive: if the task query returns anything non-array (stale cache
  // populated by a malformed query elsewhere, or a backend contract change),
  // treat it as empty instead of crashing the board render.
  const tasks: Task[] = Array.isArray(tasksData) ? tasksData : []
  const { data: columnsMeta = [] } = useColumns(project.id)

  const cfg = (project.processConfig ?? {}) as {
    enable_phase_assignment?: boolean
    workflow?: { nodes?: Array<{ id: string; name: string }> }
  }
  const enablePhaseBadge = !!cfg.enable_phase_assignment
  const phaseNodes = cfg.workflow?.nodes ?? []

  // Apply search + sprint + phase filters client-side.
  const filteredTasks = React.useMemo<Task[]>(() => {
    const q = pd.searchQuery.trim().toLowerCase()
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !t.key.toLowerCase().includes(q)) {
        return false
      }
      // Sprint filter: null means "all tasks", number means specific sprint
      if (pd.sprintFilter !== null && t.cycleId !== pd.sprintFilter) {
        return false
      }
      if (pd.phaseFilter && t.phaseId !== pd.phaseFilter) {
        return false
      }
      return true
    })
  }, [tasks, pd.searchQuery, pd.sprintFilter, pd.phaseFilter])

  // Prefer the /columns meta response for column list + WIP; fall back to
  // project.columns (the string[] status list) when the meta fetch is empty.
  const columnNames: string[] =
    columnsMeta.length > 0
      ? columnsMeta.map((c) => c.name)
      : project.columns ?? []

  const wipLimits = React.useMemo<Map<string, number>>(() => {
    const m = new Map<string, number>()
    columnsMeta.forEach((c) => m.set(c.name.toLowerCase(), c.wip_limit))
    return m
  }, [columnsMeta])

  // Group tasks by column. Match on the NORMALIZED status token on BOTH sides
  // (normalizeStatus maps in_progress/in-progress→progress and hyphens→spaces).
  // task.status is already normalized by the service, but column names come raw
  // from /columns; normalizing the column side too means a column stored as
  // "In-Progress" or a legacy slug still matches its tasks instead of dumping
  // them all into the leftmost column. Unmatched tasks still fall into the first
  // column so they stay visible.
  //
  // Known limitation: normalizeStatus collapses hyphens→spaces, so two columns
  // whose names differ ONLY by a hyphen/space ("To-Do" vs "To Do") normalize to
  // the same token and the first one wins (the second renders empty). This is
  // unreachable on the live backend (it sets task.status = column.name.lower()
  // one-to-one) and can't be disambiguated here regardless — mapTask already
  // normalized the hyphen away before tasks reach this layer. A true fix needs
  // column_id on the Task entity to group by id; deferred so the just-hardened
  // K3/K4 name-based drag-drop path isn't disturbed.
  const grouped = React.useMemo<Record<string, Task[]>>(() => {
    const g: Record<string, Task[]> = {}
    columnNames.forEach((cn) => {
      g[cn] = []
    })
    filteredTasks.forEach((t) => {
      const taskNorm = normalizeStatus(t.status ?? "")
      const match = columnNames.find((cn) => normalizeStatus(cn) === taskNorm)
      const key = match ?? columnNames[0] ?? t.status
      if (!g[key]) g[key] = []
      g[key].push(t)
    })
    return g
  }, [columnNames, filteredTasks])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "100%",
        minHeight: 0,
      }}
    >
      <BoardToolbar project={project} />
      {/* M-P1 — distinguish a fetch error from an empty board (the toolbar
          stays; only the column area swaps to skeleton/error). Columns always
          render once loaded, so there's no separate "empty" state here. */}
      <DataState
        loading={isLoading}
        error={error}
        onRetry={refetch}
        loadingFallback={
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columnNames.length || 4}, minmax(260px, 1fr))`,
              gap: 12,
              flex: 1,
              minHeight: 0,
            }}
          >
            {Array.from({ length: columnNames.length || 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ borderRadius: "var(--radius)", minHeight: 240 }}
              />
            ))}
          </div>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(columnNames.length, 1)}, minmax(260px, 1fr))`,
            gap: 12,
            flex: 1,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          {columnNames.map((cn) => (
            <BoardColumn
              key={cn}
              columnId={cn}
              columnName={cn}
              wipLimit={wipLimits.get(cn.toLowerCase()) ?? 0}
              tasks={grouped[cn] ?? []}
              projectId={project.id}
              densityMode={pd.densityMode}
              phaseNodes={phaseNodes}
              enablePhaseBadge={enablePhaseBadge}
            />
          ))}
        </div>
      </DataState>
    </div>
  )
}
