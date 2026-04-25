"use client"

// BoardColumn — a single droppable kanban column rendered inside BoardTab.
// Visual spec: UI-SPEC §3 BoardColumn (lines 353-381). Behaviour spec:
// CONTEXT D-20 Warn+Allow (WIP violation shows AlertBanner + red-tint bg,
// drop still succeeds — the decision is enforced in lib/dnd/board-dnd.ts).
//
// The column registers as a droppable via useDroppable so the @dnd-kit
// provider can assign `over` when the pointer enters. SortableContext
// inside handles card ordering within the column (Plan 11-05 keeps simple
// vertical ordering; horizontal cross-column moves are handled by the
// provider's onDragEnd → handleBoardDragEnd pipeline).

import * as React from "react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import { AlertBanner, Badge, StatusDot } from "@/components/primitives"
import type { StatusValue } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Task } from "@/services/task-service"
import type { DensityMode } from "./project-detail-context"
import { BoardCard } from "./board-card"

interface BoardColumnProps {
  columnId: string
  columnName: string
  wipLimit: number
  tasks: Task[]
  projectId: number
  densityMode: DensityMode
  phaseNodes: Array<{ id: string; name: string }>
  enablePhaseBadge: boolean
}

const KNOWN_STATUSES: StatusValue[] = [
  "todo",
  "progress",
  "review",
  "done",
  "blocked",
]

function asStatusValue(id: string): StatusValue {
  const lower = id.toLowerCase()
  return (KNOWN_STATUSES as string[]).includes(lower)
    ? (lower as StatusValue)
    : "todo"
}

export function BoardColumn({
  columnId,
  columnName,
  wipLimit,
  tasks,
  projectId,
  densityMode,
  phaseNodes,
  enablePhaseBadge,
}: BoardColumnProps) {
  const { language } = useApp()
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${columnId}`,
    data: { columnId },
  })

  const overLimit = wipLimit > 0 && tasks.length > wipLimit
  const atLimit = wipLimit > 0 && tasks.length === wipLimit

  const bg = overLimit
    ? "color-mix(in oklch, var(--priority-critical) 6%, var(--bg-2))"
    : atLimit
      ? "color-mix(in oklch, var(--status-review) 4%, var(--bg-2))"
      : "var(--bg-2)"

  const countTone: "danger" | "warning" | "neutral" = overLimit
    ? "danger"
    : atLimit
      ? "warning"
      : "neutral"

  return (
    <div
      ref={setNodeRef}
      data-column-id={columnId}
      style={{
        background: bg,
        borderRadius: "var(--radius)",
        boxShadow: isOver
          ? "inset 0 0 0 2px var(--primary)"
          : "inset 0 0 0 1px var(--border)",
        transition: "box-shadow 0.1s, background 0.15s",
        display: "flex",
        flexDirection: "column",
        minHeight: 240,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <StatusDot status={asStatusValue(columnId)} />
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--fg)",
          }}
        >
          {columnName}
        </span>
        <Badge size="xs" tone={countTone}>
          {wipLimit > 0 ? `${tasks.length}/${wipLimit}` : String(tasks.length)}
        </Badge>
        <div style={{ flex: 1 }} />
      </div>

      {/* WIP violation banner (D-20 Warn + Allow) — UI-sweep: animation matches
          column tint transition (D-13 150-200ms band). */}
      {overLimit && (
        <div
          style={{
            margin: "8px 8px 0",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <AlertBanner tone="danger">
            {language === "tr" ? "WIP limiti aşıldı" : "WIP limit exceeded"}
          </AlertBanner>
        </div>
      )}

      {/* Cards list */}
      <div
        style={{
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          flex: 1,
        }}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "var(--fg-subtle)",
                fontSize: 12,
              }}
            >
              {language === "tr"
                ? "Bu kolonda görev yok"
                : "No tasks in this column"}
            </div>
          ) : (
            tasks.map((t) => (
              <BoardCard
                key={t.id}
                task={t}
                columnId={columnId}
                projectId={projectId}
                densityMode={densityMode}
                phaseNodes={phaseNodes}
                enablePhaseBadge={enablePhaseBadge}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
