"use client"

// TaskRow — a single row in the MyTasks list.
//
// 1:1 port of the prototype MTTaskRow (New_Frontend/src/pages/my-tasks-parts.jsx
// lines 201-271). Layout (left → right):
//
//   [ status circle (clickable) ] [ key (mono) ] [ bug? + title + star? ]
//   [ project tag (compact) ]?    [ 4-bar priority ]   [ due chip ]
//   [ avatar ]                    [ points / hover-actions ]
//
// `points / hover-actions` is a stacked layout: by default the points number
// shows; on hover, the points fade out and a Star + 3-dots More button slide
// in over them. This matches the prototype line 247-268 exactly.
//
// The status circle uses the interactive variant of the StatusDot primitive
// (clickable button + popover for changing status). When `onChangeStatus` is
// not provided (legacy callers), the circle renders read-only.
//
// Density mapping (prototype my-tasks-parts.jsx line 207-208):
//   compact     → 6px  / 12.5 / avatar 20
//   cozy        → 9px  / 13   / avatar 22
//   comfortable → 13px / 13.5 / avatar 24

import * as React from "react"
import { useRouter } from "next/navigation"
import { Star, MoreHorizontal, Bug, AlertCircle, Clock } from "lucide-react"

import { Avatar, PriorityChip, StatusDot } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Task } from "@/services/task-service"
import type { StatusValue } from "@/components/primitives/status-dot"

export type TaskRowDensity = "compact" | "cozy" | "comfortable"

interface TaskRowProps {
  task: Task
  /**
   * Legacy prop. When set (Dashboard Member view), forces compact density.
   * New callers should pass `density` instead.
   */
  compact?: boolean
  density?: TaskRowDensity
  starred: boolean
  onToggleStar: () => void
  /** When set, the leftmost status circle becomes interactive. */
  onChangeStatus?: (next: StatusValue) => void
  showProject?: boolean
  projectKey?: string
}

// Task.status comes from the backend as a free-form string. Coerce to one of
// the 5 canonical tokens so StatusDot renders correctly.
function resolveStatus(status: string): StatusValue {
  const s = status.toLowerCase()
  if (s === "progress" || s === "in_progress" || s === "doing") return "progress"
  if (s === "review" || s === "in_review") return "review"
  if (s === "done" || s === "completed" || s === "closed") return "done"
  if (s === "blocked") return "blocked"
  return "todo"
}

// Project key → deterministic colour (mirrors prototype mtProjectColor).
// 8-bucket modulo so the same key always picks the same hue across reloads.
function projectColor(projectId: number): string {
  return `var(--av-${(projectId % 8) + 1})`
}

interface DueDescriptor {
  label: string
  tone: "overdue" | "today" | "soon" | "week" | "muted"
  abs: string
}

function describeDue(iso: string | null, lang: "tr" | "en"): DueDescriptor | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - now.getTime()) / 86_400_000)
  const locale = lang === "tr" ? "tr-TR" : "en-US"
  const short = d.toLocaleDateString(locale, { month: "short", day: "numeric" })
  if (diff < 0) {
    return {
      label: lang === "tr" ? `${-diff}g gecikti` : `${-diff}d overdue`,
      tone: "overdue",
      abs: short,
    }
  }
  if (diff === 0) {
    return {
      label: lang === "tr" ? "Bugün" : "Today",
      tone: "today",
      abs: short,
    }
  }
  if (diff === 1) {
    return {
      label: lang === "tr" ? "Yarın" : "Tomorrow",
      tone: "soon",
      abs: short,
    }
  }
  if (diff <= 3) {
    return {
      label: lang === "tr" ? `${diff} gün` : `in ${diff}d`,
      tone: "soon",
      abs: short,
    }
  }
  if (diff <= 7) {
    return {
      label: lang === "tr" ? `${diff} gün` : `in ${diff}d`,
      tone: "week",
      abs: short,
    }
  }
  return { label: short, tone: "muted", abs: short }
}

const DUE_TONE_STYLE: Record<
  DueDescriptor["tone"],
  { bg: string; fg: string }
> = {
  overdue: {
    bg: "color-mix(in oklch, var(--priority-critical) 14%, transparent)",
    fg: "var(--priority-critical)",
  },
  today: {
    bg: "color-mix(in oklch, var(--primary) 14%, transparent)",
    fg: "var(--primary)",
  },
  soon: {
    bg: "color-mix(in oklch, var(--status-review) 14%, transparent)",
    fg: "color-mix(in oklch, var(--status-review) 80%, var(--fg))",
  },
  week: {
    bg: "var(--surface-2)",
    fg: "var(--fg-muted)",
  },
  muted: {
    bg: "transparent",
    fg: "var(--fg-muted)",
  },
}

export function TaskRow({
  task,
  compact,
  density,
  starred,
  onToggleStar,
  onChangeStatus,
  showProject,
  projectKey,
}: TaskRowProps) {
  const router = useRouter()
  const { language } = useApp()
  const [hover, setHover] = React.useState(false)

  // Compact bool wins over explicit density for legacy Dashboard callers.
  const effectiveDensity: TaskRowDensity = compact
    ? "compact"
    : (density ?? "cozy")

  // Padding / font / avatar sizes — mirror the prototype maps exactly.
  const padY =
    effectiveDensity === "compact"
      ? 6
      : effectiveDensity === "cozy"
        ? 9
        : 13
  const fontSize =
    effectiveDensity === "compact"
      ? 12.5
      : effectiveDensity === "comfortable"
        ? 13.5
        : 13
  const avatarSize =
    effectiveDensity === "compact"
      ? 20
      : effectiveDensity === "comfortable"
        ? 24
        : 22
  const statusSize = effectiveDensity === "compact" ? 14 : 16

  // Grid template — status / key / title / [project] / priority / due / avatar
  // / actions. Each "auto" lets the cell shrink to its content; the title
  // takes the only flexible track (1fr).
  const gridCols = showProject
    ? "18px 68px 1fr auto auto auto 28px 50px"
    : "18px 68px 1fr auto auto 28px 50px"

  const status = resolveStatus(task.status)
  const isDone = status === "done"
  const due = describeDue(task.due, language)

  const assigneeAvatar =
    task.assigneeId != null
      ? {
          initials: `#${task.assigneeId}`.slice(0, 2).toUpperCase(),
          avColor: ((task.assigneeId % 8) + 1) as number,
        }
      : null

  function navigate() {
    router.push(`/projects/${task.projectId}/tasks/${task.id}`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate()
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: gridCols,
        alignItems: "center",
        gap: 12,
        padding: `${padY}px 12px`,
        borderBottom: "1px solid var(--border)",
        background: hover ? "var(--surface-2)" : "transparent",
        cursor: "pointer",
        position: "relative",
        fontSize,
      }}
    >
      {/* Leftmost: clickable status circle */}
      <StatusDot
        status={status}
        size={statusSize}
        onChange={onChangeStatus}
      />

      {/* Mono key — small, subtle */}
      <span
        className="mono"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.8,
          color: "var(--fg-subtle)",
          letterSpacing: 0.3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {task.key}
      </span>

      {/* Title cell — bug icon + title + (starred → inline filled star) */}
      <div
        style={{
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {task.type === "bug" && (
          <Bug
            size={12}
            color="var(--priority-critical)"
            style={{ flexShrink: 0 }}
          />
        )}
        <span
          style={{
            textDecoration: isDone ? "line-through" : "none",
            color: isDone ? "var(--fg-muted)" : "var(--fg)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}
        >
          {task.title}
        </span>
        {starred && (
          <Star
            size={12}
            style={{
              color: "var(--status-review)",
              fill: "var(--status-review)",
              flexShrink: 0,
            }}
            aria-hidden
          />
        )}
      </div>

      {/* Optional project tag — compact form (dot + mono key only) */}
      {showProject && projectKey && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 2,
              background: projectColor(task.projectId),
              flexShrink: 0,
            }}
            aria-hidden
          />
          <span
            className="mono"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--fg-subtle)",
              letterSpacing: 0.3,
            }}
          >
            {projectKey}
          </span>
        </span>
      )}

      {/* 4-bar priority (compact, no label) */}
      <PriorityChip
        level={task.priority}
        lang={language}
        withLabel={false}
      />

      {/* Due chip — coloured pill for overdue/today/soon, transparent for muted */}
      {due ? (
        <span
          title={due.abs}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            background: DUE_TONE_STYLE[due.tone].bg,
            color: DUE_TONE_STYLE[due.tone].fg,
            borderRadius: 99,
            fontSize: 11.5,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {due.tone === "overdue" && <AlertCircle size={10} />}
          {due.tone === "today" && <Clock size={10} />}
          {due.label}
        </span>
      ) : (
        <span style={{ color: "var(--fg-subtle)", fontSize: 11.5 }}>—</span>
      )}

      {/* Assignee avatar */}
      {assigneeAvatar ? (
        <Avatar user={assigneeAvatar} size={avatarSize} />
      ) : (
        <span style={{ width: avatarSize }} />
      )}

      {/* Points / hover-actions overlay (rightmost, prototype lines 247-268) */}
      <div
        className="mono"
        style={{
          position: "relative",
          textAlign: "right",
          fontSize: 11,
          color: "var(--fg-subtle)",
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            gap: 2,
            opacity: hover ? 1 : 0,
            transition: "opacity 0.15s ease",
            background: "var(--surface-2)",
            paddingLeft: 4,
            pointerEvents: hover ? "auto" : "none",
          }}
        >
          <button
            type="button"
            title={
              language === "tr"
                ? starred
                  ? "Yıldızı kaldır"
                  : "Yıldızla"
                : starred
                  ? "Unstar"
                  : "Star"
            }
            aria-label={
              language === "tr"
                ? starred
                  ? "Yıldızı kaldır"
                  : "Yıldızla"
                : starred
                  ? "Unstar"
                  : "Star"
            }
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar()
            }}
            style={{
              padding: 3,
              borderRadius: 4,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: starred ? "var(--status-review)" : "var(--fg-subtle)",
              display: "inline-flex",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                "var(--accent)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                "transparent"
            }}
          >
            <Star
              size={12}
              fill={starred ? "var(--status-review)" : "transparent"}
            />
          </button>
          <button
            type="button"
            title={language === "tr" ? "Daha fazla" : "More"}
            aria-label={language === "tr" ? "Eylemler" : "Actions"}
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: 3,
              borderRadius: 4,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-subtle)",
              display: "inline-flex",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                "var(--accent)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                "transparent"
            }}
          >
            <MoreHorizontal size={12} />
          </button>
        </div>
        <span
          style={{
            opacity: hover ? 0 : 1,
            transition: "opacity 0.15s ease",
            pointerEvents: "none",
          }}
        >
          {task.points != null ? `${task.points} pt` : "—"}
        </span>
      </div>
    </div>
  )
}
