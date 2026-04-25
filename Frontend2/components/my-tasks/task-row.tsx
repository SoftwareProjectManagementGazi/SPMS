"use client"

// TaskRow — a single row in the MyTasks list.
//
// Ports the prototype MTTaskRow from `my-tasks-parts.jsx` (lines 40-120) with
// the "cozy" density baseline and a `compact` flag for dashboard embedding.
// The row is a pointer target: clicking anywhere navigates to the task detail
// page. Clicks on the star / more buttons stop propagation.
//
// UI-SPEC §17 MTTaskRow grid template (showProject=true vs false), font/padding
// by density, and done-task strikethrough are mirrored here.

import * as React from "react"
import { useRouter } from "next/navigation"
import { Star, MoreHorizontal } from "lucide-react"

import { Avatar, Badge, PriorityChip, StatusDot } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Task } from "@/services/task-service"
import type { StatusValue } from "@/components/primitives/status-dot"

interface TaskRowProps {
  task: Task
  compact?: boolean
  starred: boolean
  onToggleStar: () => void
  showProject?: boolean
  projectKey?: string
}

// Task.status is a free-form string from the backend, but StatusDot expects
// one of the 5 canonical status tokens. Fall back to "todo" for unmapped
// values so the dot still renders rather than throwing.
function resolveStatus(status: string): StatusValue {
  const s = status.toLowerCase()
  if (s === "progress" || s === "in_progress" || s === "doing") return "progress"
  if (s === "review" || s === "in_review") return "review"
  if (s === "done" || s === "completed" || s === "closed") return "done"
  if (s === "blocked") return "blocked"
  return "todo"
}

export function TaskRow({
  task,
  compact,
  starred,
  onToggleStar,
  showProject,
  projectKey,
}: TaskRowProps) {
  const router = useRouter()
  const { language } = useApp()

  const gridCols = showProject
    ? "18px 68px 1fr auto auto auto 28px 40px"
    : "18px 68px 1fr auto auto 28px 40px"
  const padY = compact ? 4 : 8
  const fontSize = compact ? 12.5 : 13
  const isDone = resolveStatus(task.status) === "done"

  const assigneeAvatar =
    task.assigneeId != null
      ? {
          initials: `#${task.assigneeId}`.slice(0, 2).toUpperCase(),
          avColor: ((task.assigneeId % 8) + 1) as number,
        }
      : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() =>
        router.push(`/projects/${task.projectId}/tasks/${task.id}`)
      }
      onKeyDown={(e) => {
        if (e.key === "Enter")
          router.push(`/projects/${task.projectId}/tasks/${task.id}`)
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background =
          "var(--surface-2)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background = "transparent"
      }}
      style={{
        display: "grid",
        gridTemplateColumns: gridCols,
        padding: `${padY}px 12px`,
        gap: 10,
        alignItems: "center",
        fontSize,
        cursor: "pointer",
        borderBottom: "1px solid var(--border)",
        background: "transparent",
      }}
    >
      {/* Star toggle — stops propagation so clicking the star never navigates */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleStar()
        }}
        aria-label={
          language === "tr"
            ? starred
              ? "Yıldızı kaldır"
              : "Yıldızla"
            : starred
              ? "Unstar"
              : "Star"
        }
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: starred ? "var(--status-review)" : "var(--fg-subtle)",
          display: "inline-flex",
        }}
      >
        <Star
          size={14}
          fill={starred ? "var(--status-review)" : "transparent"}
        />
      </button>

      {/* Key — mono, subtle. UI-sweep: 10.8 -> 10.5 (in-bucket, matches every
          other mono key column). */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--fg-subtle)",
          letterSpacing: 0.3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {task.key}
      </span>

      {/* Title row with status dot */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          textDecoration: isDone ? "line-through" : "none",
          color: isDone ? "var(--fg-muted)" : "var(--fg)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <StatusDot status={resolveStatus(task.status)} size={10} />
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {task.title}
        </span>
      </span>

      <PriorityChip level={task.priority} lang={language} withLabel={false} />

      {showProject && projectKey && (
        <Badge
          size="xs"
          tone="neutral"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {projectKey}
        </Badge>
      )}

      {assigneeAvatar ? (
        <Avatar user={assigneeAvatar} size={compact ? 18 : 20} />
      ) : (
        <span style={{ width: compact ? 18 : 20 }} />
      )}

      {/* Placeholder action button — future: row action menu */}
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        aria-label={language === "tr" ? "Eylemler" : "Actions"}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--fg-subtle)",
          display: "inline-flex",
        }}
      >
        <MoreHorizontal size={14} />
      </button>
    </div>
  )
}
