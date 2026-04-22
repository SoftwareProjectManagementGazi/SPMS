"use client"

// BoardTab — Phase 11 Plan 05 main export.
//
// Renders the 4-column kanban inside a ProjectDnDProvider (Plan 11-01). The
// provider's onTaskDropped callback funnels every completed drag through our
// pure handleBoardDragEnd decision (lib/dnd/board-dnd.ts) and — when the move
// is legal — fires a PATCH /tasks/{id} via useMoveTask (optimistic + rollback).
//
// Columns are derived from GET /projects/{id}/columns (wipLimit + name) when
// available, otherwise we fall back to project.columns which is the status
// string list from the project payload. Filtering (search + phase) happens
// client-side against ProjectDetailContext state.

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/lib/api-client"
import { ProjectDnDProvider } from "@/lib/dnd/dnd-provider"
import { handleBoardDragEnd } from "@/lib/dnd/board-dnd"
import { useTasks, useMoveTask } from "@/hooks/use-tasks"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import type { Project } from "@/services/project-service"
import type { Task } from "@/services/task-service"

import { BoardCardGhost } from "./board-card"
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
  const { language } = useApp()
  const { showToast } = useToast()
  const pd = useProjectDetail()

  const { data: tasks = [] } = useTasks(project.id)
  const { data: columnsMeta = [] } = useColumns(project.id)
  const moveTask = useMoveTask(project.id)

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

  const handleDropped = React.useCallback(
    (taskId: number, sourceColumnId: string, targetColumnId: string) => {
      const targetInfo = {
        id: targetColumnId,
        wipLimit: wipLimits.get(targetColumnId.toLowerCase()) ?? 0,
        taskCount: (grouped[targetColumnId] ?? []).length,
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
            language === "tr"
              ? "WIP limiti aşıldı — kolonda uyarı gösteriliyor"
              : "WIP limit exceeded — warning shown",
        })
      }
      // Backend status is the column name lowercased (established by seed in
      // project-service). Keeping the same transformation prevents drift.
      moveTask.mutate({ id: taskId, status: targetColumnId.toLowerCase() })
    },
    [grouped, wipLimits, moveTask, showToast, language]
  )

  const renderGhost = React.useCallback(
    (taskId: number | null) => {
      if (taskId == null) return null
      const t = tasks.find((x) => x.id === taskId)
      return t ? <BoardCardGhost task={t} /> : null
    },
    [tasks]
  )

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
      <ProjectDnDProvider
        projectId={project.id}
        onTaskDropped={handleDropped}
        renderGhost={renderGhost}
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
      </ProjectDnDProvider>
    </div>
  )
}
