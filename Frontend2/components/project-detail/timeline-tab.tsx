"use client"

// TimelineTab — Phase 11 Plan 07 custom SVG Gantt (D-27 / D-28 per 11-CONTEXT
// and 11-RESEARCH §Gantt Library Selection). All third-party Gantt libraries
// evaluated in RESEARCH were rejected (GPLv3 license forcing on wx-react-gantt;
// stale React-18 peers everywhere else). Custom SVG costs ~200 LOC and
// inherits the CSS token system natively — no theme fight, no `!important`
// hacks, no new bundle weight.
//
// Renders a horizontal Gantt with:
//   - Day/Week/Month view toggle (D-28; default Week; day_width 48/24/8 per
//     RESEARCH POC)
//   - Today line (dashed primary stroke) when today falls inside the range
//   - Priority-colored task bars (`var(--priority-{priority})`) using the same
//     "medium → med" token bridge as PriorityChip + BoardCard
//   - Header row with month/day tick labels
//   - Alternating row backgrounds (--surface / --surface-2)
//   - Empty-state message when zero tasks have both start AND due
//
// Tasks without BOTH a start and due date are excluded — the Gantt needs both
// endpoints to draw a bar. Users can schedule them later via Task Detail.
//
// Click any bar → router.push('/projects/{id}/tasks/{taskId}') — same as
// Board card and List row.
//
// Drag-to-reschedule is a documented stretch goal (D-28) and dependency
// arrows are deferred to v3 per REQUIREMENTS.md. Not in Phase 11 scope.

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTasks } from "@/hooks/use-tasks"
import type { Project } from "@/services/project-service"

type GanttView = "day" | "week" | "month"

const DAY_WIDTH: Record<GanttView, number> = { day: 48, week: 24, month: 8 }
const ROW_HEIGHT = 32
const HEADER_HEIGHT = 40
const MS_PER_DAY = 86400000

function priorityToken(priority: string | null | undefined): string {
  // PriorityChip's contract: "medium" maps to the --priority-med CSS var.
  // All other priority strings pass through unchanged.
  const p = priority ?? "medium"
  return p === "medium" ? "med" : p
}

export function TimelineTab({ project }: { project: Project }) {
  const { language } = useApp()
  const router = useRouter()
  const { data: tasks = [] } = useTasks(project.id)
  const [view, setView] = React.useState<GanttView>("week")

  // Filter to scheduled tasks (both start + due) and sort by start ascending.
  const scheduled = React.useMemo(
    () =>
      tasks
        .filter((t) => t.start && t.due)
        .sort(
          (a, b) =>
            new Date(a.start as string).getTime() -
            new Date(b.start as string).getTime()
        ),
    [tasks]
  )

  // Compute chart bounds: earliest start to latest due, clamped to at least
  // 1 day of width so the SVG doesn't render at 0px.
  const { min, totalDays } = React.useMemo(() => {
    if (scheduled.length === 0) {
      return { min: new Date(), totalDays: 0 }
    }
    const starts = scheduled.map((t) => new Date(t.start as string).getTime())
    const ends = scheduled.map((t) => new Date(t.due as string).getTime())
    const minT = Math.min(...starts)
    const maxT = Math.max(...ends)
    const days = Math.max(1, Math.ceil((maxT - minT) / MS_PER_DAY) + 1)
    return { min: new Date(minT), totalDays: days }
  }, [scheduled])

  // Empty-state short-circuit.
  if (scheduled.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "var(--fg-subtle)",
          fontSize: 12.5,
          border: "1px dashed var(--border)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        {language === "tr"
          ? "Zaman çizelgesinde görüntülenecek görev yok (başlangıç ve bitiş tarihi olan görevler listelenir)."
          : "No tasks to display on the timeline (tasks need both start and due dates)."}
      </div>
    )
  }

  const width = Math.max(320, totalDays * DAY_WIDTH[view])
  const height = HEADER_HEIGHT + scheduled.length * ROW_HEIGHT
  const todayX = ((Date.now() - min.getTime()) / MS_PER_DAY) * DAY_WIDTH[view]

  // Tick stride: every 1 day in Day view, every 7 in Week, every 30 in Month.
  const tickStride = view === "day" ? 1 : view === "week" ? 7 : 30

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}
    >
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {language === "tr" ? "Zaman çizelgesi" : "Timeline"}
        </div>
        <div style={{ flex: 1 }} />
        {(["day", "week", "month"] as const).map((v) => (
          <Button
            key={v}
            size="sm"
            variant={view === v ? "secondary" : "ghost"}
            onClick={() => setView(v)}
          >
            {v === "day"
              ? language === "tr"
                ? "Gün"
                : "Day"
              : v === "week"
                ? language === "tr"
                  ? "Hafta"
                  : "Week"
                : language === "tr"
                  ? "Ay"
                  : "Month"}
          </Button>
        ))}
      </div>

      {/* SVG chart */}
      <div
        style={{
          overflowX: "auto",
          boxShadow: "inset 0 0 0 1px var(--border)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <svg width={width} height={height} style={{ display: "block" }}>
          {/* Header row background */}
          <rect
            x={0}
            y={0}
            width={width}
            height={HEADER_HEIGHT}
            fill="var(--surface-2)"
          />

          {/* Date tick lines + header labels */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const tickX = i * DAY_WIDTH[view]
            const d = new Date(min.getTime() + i * MS_PER_DAY)
            return (
              <g key={`tick-${i}`}>
                <line
                  x1={tickX}
                  y1={0}
                  x2={tickX}
                  y2={height}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                {i % tickStride === 0 && (
                  <text
                    x={tickX + 4}
                    y={24}
                    fontSize={10.5}
                    fill="var(--fg-subtle)"
                    fontFamily="var(--font-mono)"
                    style={{ textTransform: "uppercase", letterSpacing: 0.4 }}
                  >
                    {d.toLocaleDateString(
                      language === "tr" ? "tr-TR" : "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </text>
                )}
              </g>
            )
          })}

          {/* Today line (dashed primary stroke) */}
          {todayX >= 0 && todayX <= width && (
            <line
              x1={todayX}
              y1={HEADER_HEIGHT}
              x2={todayX}
              y2={height}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}

          {/* Task bars */}
          {scheduled.map((t, i) => {
            const rowY = HEADER_HEIGHT + i * ROW_HEIGHT
            const startDay =
              (new Date(t.start as string).getTime() - min.getTime()) /
              MS_PER_DAY
            const endDay =
              (new Date(t.due as string).getTime() - min.getTime()) /
              MS_PER_DAY
            const barX = startDay * DAY_WIDTH[view]
            const barW = Math.max(8, (endDay - startDay) * DAY_WIDTH[view])
            const prioToken = priorityToken(t.priority)
            return (
              <g
                key={t.id}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  router.push(`/projects/${project.id}/tasks/${t.id}`)
                }
              >
                {/* Alternating row background */}
                <rect
                  x={0}
                  y={rowY}
                  width={width}
                  height={ROW_HEIGHT}
                  fill={i % 2 === 0 ? "var(--surface)" : "var(--surface-2)"}
                />
                {/* Priority left accent */}
                <rect
                  x={barX}
                  y={rowY + 6}
                  width={2}
                  height={ROW_HEIGHT - 12}
                  fill={`var(--priority-${prioToken})`}
                />
                {/* Bar body (color-mix 60% over transparent gives the tinted fill) */}
                <rect
                  x={barX + 2}
                  y={rowY + 6}
                  width={Math.max(1, barW - 2)}
                  height={ROW_HEIGHT - 12}
                  rx={4}
                  style={{
                    fill: `color-mix(in oklch, var(--priority-${prioToken}) 60%, transparent)`,
                  }}
                />
                {/* Task label — React escapes text content, so XSS via
                    task.title is not possible (T-11-07-01). */}
                <text
                  x={barX + 8}
                  y={rowY + 20}
                  fontSize={12}
                  fill="var(--fg)"
                  style={{ pointerEvents: "none" }}
                >
                  {t.key} · {t.title}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
