"use client"

// BoardCard — draggable kanban card on the Board tab (Phase 11 Plan 05).
// Matches the prototype KanbanCard (New_Frontend/src/pages/project-detail.jsx
// lines 141-199) + D-21 (Compact/Rich toggle) + D-23 (click → navigate) +
// D-24 (phase badge when enable_phase_assignment=true).
//
// Drag plumbing is via @dnd-kit/sortable::useSortable. The 8px activation
// distance configured on the provider's PointerSensor (lib/dnd/dnd-provider.tsx)
// means a true click (no movement) falls through to the onClick handler —
// no need for a manual "wasDragging" ref.

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Bug } from "lucide-react"

import { Avatar, Badge, PriorityChip } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Task } from "@/services/task-service"
import type { DensityMode } from "./project-detail-context"

interface BoardCardProps {
  task: Task
  columnId: string
  projectId: number
  densityMode: DensityMode
  phaseNodes: Array<{ id: string; name: string }>
  enablePhaseBadge: boolean
}

function shortDate(iso: string | null, lang: "tr" | "en"): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
      month: "short",
      day: "numeric",
    })
  } catch {
    return ""
  }
}

// Phase-badge tone is derived from the node index — gives phases a consistent
// colour even when their names change. Falls back to "neutral" if no nodes.
const PHASE_TONES: Array<"neutral" | "info" | "warning" | "success" | "danger"> = [
  "info",
  "warning",
  "success",
  "danger",
  "neutral",
]

// Priority → --priority-{token} mapping. Matches the PriorityChip's token-bridge:
// "medium" maps to "med" at the CSS level (see priority-chip.tsx).
function priorityTokenVar(priority: Task["priority"]): string {
  const token = priority === "medium" ? "med" : priority
  return `var(--priority-${token})`
}

export function BoardCard({
  task,
  columnId,
  projectId,
  densityMode,
  phaseNodes,
  enablePhaseBadge,
}: BoardCardProps) {
  const router = useRouter()
  const { language } = useApp()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { columnId, task },
  })

  const phaseName =
    enablePhaseBadge && task.phaseId
      ? phaseNodes.find((n) => n.id === task.phaseId)?.name ?? null
      : null
  const phaseIndex =
    enablePhaseBadge && task.phaseId
      ? Math.max(0, phaseNodes.findIndex((n) => n.id === task.phaseId))
      : 0
  const phaseTone = PHASE_TONES[phaseIndex % PHASE_TONES.length]

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    background: "var(--surface)",
    borderRadius: "var(--radius-sm)",
    // UI-sweep: dropped per-side 9px/11px adjustment that compensated for the
    // 3px borderLeft. Use symmetric padding; the inner content reads with the
    // 3px asymmetry visually clearly enough (and box-sizing keeps cards aligned).
    padding: densityMode === "compact" ? "8px 10px" : "10px 12px",
    borderLeft: `3px solid ${priorityTokenVar(task.priority)}`,
    boxShadow:
      "inset 0 0 0 1px var(--border), 0 1px 2px oklch(0 0 0 / 0.03)",
    cursor: "grab",
    display: "flex",
    flexDirection: "column",
    gap: densityMode === "compact" ? 4 : 6,
    fontSize: 12.5,
  }

  function handleClick(e: React.MouseEvent) {
    // D-23: plain click → navigate to task detail. Drag events (distance > 8px)
    // never reach this handler because @dnd-kit intercepts the pointer sequence
    // before React's onClick dispatches. isDragging is a defensive short-circuit
    // for the rare case where a release fires mid-drag.
    if (isDragging) return
    e.stopPropagation()
    router.push(`/projects/${projectId}/tasks/${task.id}`)
  }

  const assigneeAvatar = task.assigneeId != null ? {
    initials: `#${task.assigneeId}`.slice(0, 2).toUpperCase(),
    avColor: ((task.assigneeId % 8) + 1) as number,
  } : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      data-column-id={columnId}
      data-task-id={task.id}
    >
      {/* Row 1: type-icon? + key + spacer + priority chip (rich mode only) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {task.type === "bug" && (
          <Bug size={12} color="var(--priority-critical)" />
        )}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--fg-subtle)",
            letterSpacing: 0.3,
          }}
        >
          {task.key}
        </span>
        <div style={{ flex: 1 }} />
        {densityMode === "rich" && (
          <PriorityChip level={task.priority} lang={language} />
        )}
      </div>

      {/* Phase badge (D-24) — only when enable_phase_assignment=true */}
      {enablePhaseBadge && phaseName && (
        <div>
          <Badge size="xs" tone={phaseTone}>
            {phaseName}
          </Badge>
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1.4,
          color: "var(--fg)",
        }}
      >
        {task.title}
      </div>

      {/* Row 3 (rich only): points + due + spacer + avatar */}
      {densityMode === "rich" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 2,
          }}
        >
          {task.points != null && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--fg-muted)",
                background: "var(--surface-2)",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {task.points}
            </span>
          )}
          {task.due && (
            <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>
              {shortDate(task.due, language)}
            </span>
          )}
          <div style={{ flex: 1 }} />
          {assigneeAvatar && <Avatar user={assigneeAvatar} size={20} />}
        </div>
      )}

      {/* Compact mode avatar row */}
      {densityMode === "compact" && assigneeAvatar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: 2,
          }}
        >
          <Avatar user={assigneeAvatar} size={18} />
        </div>
      )}
    </div>
  )
}

/** Ghost card rendered inside <DragOverlay> — no drag listeners, slight tilt. */
export function BoardCardGhost({ task }: { task: Task }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-sm)",
        padding: "10px 12px 10px 11px",
        borderLeft: `3px solid ${priorityTokenVar(task.priority)}`,
        boxShadow: "var(--shadow-lg)",
        opacity: 0.9,
        transform: "rotate(2deg)",
        pointerEvents: "none",
        maxWidth: 260,
        fontSize: 12.5,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--fg-subtle)",
            letterSpacing: 0.3,
          }}
        >
          {task.key}
        </span>
      </div>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: "var(--fg)",
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </div>
    </div>
  )
}
