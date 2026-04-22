"use client"

// BacklogTaskRow — draggable condensed backlog row used inside <BacklogPanel>.
//
// Cross-container DnD (Phase 11 Plan 06): the row registers as a draggable in
// the SAME <DndContext> that wraps the Board. The source columnId sentinel
// `"__backlog__"` signals to handleBoardDragEnd that a successful drop should
// PATCH status AND (when the project's backlog definition is cycle-based) the
// move also removes the task from the backlog query — since the backlog filter
// returns `cycle_id:null`, assigning any status on the board does not itself
// drop the task from the backlog; the TanStack Query invalidation on
// ['tasks', 'backlog', projectId] handled by the shell's handleDropped is what
// causes the row to disappear from the panel after a successful drop.
//
// Click vs drag: @dnd-kit's PointerSensor on the shared provider is configured
// with `activationConstraint: { distance: 8 }` — true clicks (no movement)
// fall through to onClick so clicking a row navigates to the task detail page
// (D-23 same semantics as board card). isDragging guards the rare mid-drag
// release.

import * as React from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useRouter } from "next/navigation"

import { Avatar, PriorityChip } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Task } from "@/services/task-service"

/** Source column sentinel used by handleBoardDragEnd to detect backlog→board drops. */
export const BACKLOG_COLUMN_ID = "__backlog__"

interface BacklogTaskRowProps {
  task: Task
  projectId: number
}

// Priority → --priority-{token} CSS var. Uses the same "medium" → "med" bridge
// as PriorityChip / BoardCard so the left-border accent stays consistent.
function priorityTokenVar(priority: Task["priority"]): string {
  const token = priority === "medium" ? "med" : priority
  return `var(--priority-${token})`
}

export function BacklogTaskRow({ task, projectId }: BacklogTaskRowProps) {
  const router = useRouter()
  const { language } = useApp()
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { columnId: BACKLOG_COLUMN_ID, task },
    })

  const assigneeAvatar =
    task.assigneeId != null
      ? {
          initials: `#${task.assigneeId}`.slice(0, 2).toUpperCase(),
          avColor: ((task.assigneeId % 8) + 1) as number,
        }
      : null

  function handleClick(e: React.MouseEvent) {
    // D-23 parity: click navigates to task detail. Drag events never reach
    // onClick because the 8px activation distance means @dnd-kit intercepts
    // the pointer sequence first. isDragging is defensive for mid-drag release.
    if (isDragging) return
    e.stopPropagation()
    router.push(`/projects/${projectId}/tasks/${task.id}`)
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      data-column-id={BACKLOG_COLUMN_ID}
      data-task-id={task.id}
      aria-label={language === "tr" ? `Backlog görevi: ${task.title}` : `Backlog task: ${task.title}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
        borderLeft: `3px solid ${priorityTokenVar(task.priority)}`,
        background: isDragging ? "var(--surface-2)" : "transparent",
        cursor: "grab",
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--fg-subtle)",
          letterSpacing: 0.3,
          minWidth: 60,
        }}
      >
        {task.key}
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: "var(--fg)",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {task.title}
      </span>
      <PriorityChip level={task.priority} lang={language} withLabel={false} />
      {assigneeAvatar && <Avatar user={assigneeAvatar} size={20} />}
    </div>
  )
}
