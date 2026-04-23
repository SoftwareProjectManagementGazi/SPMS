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
import type { Task } from "@/services/task-service"

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

  const { data: tasksData } = useTasks(project.id)
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

  // Apply search + phase filters client-side. Sort is status-first so cards
  // land in the correct column grouping regardless of incoming order.
  const filteredTasks = React.useMemo<Task[]>(() => {
    const q = pd.searchQuery.trim().toLowerCase()
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !t.key.toLowerCase().includes(q)) {
        return false
      }
      if (pd.phaseFilter && t.phaseId !== pd.phaseFilter) {
        return false
      }
      return true
    })
  }, [tasks, pd.searchQuery, pd.phaseFilter])

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

  // Group tasks by column. Matches by case-insensitive status vs. column name;
  // unmatched tasks fall into the first column so they remain visible rather
  // than disappearing when backend statuses drift from the configured columns.
  const grouped = React.useMemo<Record<string, Task[]>>(() => {
    const g: Record<string, Task[]> = {}
    columnNames.forEach((cn) => {
      g[cn] = []
    })
    filteredTasks.forEach((t) => {
      const match = columnNames.find(
        (cn) => cn.toLowerCase() === (t.status ?? "").toLowerCase()
      )
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
    </div>
  )
}
