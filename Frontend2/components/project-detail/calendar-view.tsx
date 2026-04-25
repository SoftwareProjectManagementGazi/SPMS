"use client"

// CalendarTab — Phase 11 Plan 07 custom 6×7 calendar grid (D-29/D-30/D-31
// per 11-CONTEXT + 11-UI-SPEC §15). No third-party calendar library — the
// prototype's theme tokens are adopted natively and FullCalendar/react-big-
// calendar both ship default CSS that fights our `color-mix` tokens.
//
// Key decisions:
//   - 7-column weekday header (Pzt ... Paz in TR) + 6 rows × 7 cells = 42 cells
//     so any month fits without shifting layout (D-29).
//   - Today cell's day-number circle uses var(--primary) background (D-29).
//   - Up to 3 task chips per day; "+N more" chip opens a per-day popover
//     listing the full task list (D-31).
//   - Ctrl+wheel scroll-zoom adjusts cell minHeight in [60, 160] px
//     (D-30 Outlook pattern). Persisted to spms.calendar.zoom.{projectId}
//     with a 300 ms debounce (RESEARCH Pitfall 5 — avoid write-on-every-frame).
//   - Priority color on chips via color-mix() using the same "medium → med"
//     token bridge as PriorityChip / BoardCard / TimelineTab.
//   - Click chip → router.push('/projects/{id}/tasks/{taskId}') — same
//     navigation contract as every other task-display surface in Phase 11.

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { Button, Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTasks } from "@/hooks/use-tasks"
import type { Project } from "@/services/project-service"
import type { Task } from "@/services/task-service"

const ZOOM_KEY = (pid: number) => `spms.calendar.zoom.${pid}`
const MIN_CELL = 60
const MAX_CELL = 160
const DEFAULT_CELL = 100
const ZOOM_STEP = -2 // deltaY * ZOOM_STEP — negative so scroll-down shrinks

function priorityToken(priority: Task["priority"] | null | undefined): string {
  const p = priority ?? "medium"
  return p === "medium" ? "med" : p
}

function keyForDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

export function CalendarTab({ project }: { project: Project }) {
  const { language } = useApp()
  const router = useRouter()
  const { data: tasks = [] } = useTasks(project.id)

  // `today` is captured ONCE per render cycle so Ctrl+wheel and month-nav
  // re-renders don't thrash the "today highlight" calculation.
  const today = React.useMemo(() => new Date(Date.now()), [])
  const [cursor, setCursor] = React.useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [cellHeight, setCellHeight] = React.useState<number>(DEFAULT_CELL)
  const [popoverDay, setPopoverDay] = React.useState<string | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load persisted zoom on mount (per projectId).
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const v = window.localStorage.getItem(ZOOM_KEY(project.id))
      if (v) {
        const n = Number(v)
        if (!Number.isNaN(n) && n >= MIN_CELL && n <= MAX_CELL) {
          setCellHeight(n)
        }
      }
    } catch {
      /* T-08-01 accept disposition — corrupted value falls back to default */
    }
  }, [project.id])

  // Persist zoom (debounced 300 ms — Pitfall 5). Effect cleans up its own
  // pending write on unmount to avoid hitting a dead localStorage.
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(ZOOM_KEY(project.id), String(cellHeight))
      } catch {
        /* ignore */
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [project.id, cellHeight])

  // Group tasks by ISO due-date key.
  const tasksByDay = React.useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.due) continue
      const k = keyForDate(new Date(t.due))
      const arr = map.get(k)
      if (arr) {
        arr.push(t)
      } else {
        map.set(k, [t])
      }
    }
    return map
  }, [tasks])

  // Build the 42-cell grid (6 weeks × 7 days). Grid starts on Monday.
  const grid = React.useMemo(() => {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const first = new Date(y, m, 1)
    // JS getDay: Sunday=0 .. Saturday=6. Shift so Monday=0.
    const firstDow = (first.getDay() + 6) % 7
    const startDate = new Date(y, m, 1 - firstDow)
    const cells: Array<{ date: Date; inMonth: boolean }> = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + i
      )
      cells.push({ date: d, inMonth: d.getMonth() === m })
    }
    return cells
  }, [cursor])

  function handleWheel(e: React.WheelEvent) {
    if (!e.ctrlKey) return
    e.preventDefault()
    const delta = e.deltaY
    setCellHeight((prev) => {
      const next = Math.min(MAX_CELL, Math.max(MIN_CELL, prev + delta * ZOOM_STEP))
      return Math.round(next)
    })
  }

  function prevMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  const weekdays =
    language === "tr"
      ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const monthLabel = cursor.toLocaleDateString(
    language === "tr" ? "tr-TR" : "en-US",
    { month: "long", year: "numeric" }
  )

  const todayKey = keyForDate(today)

  return (
    <Card padding={16}>
      {/* Nav row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>{monthLabel}</div>
        <div style={{ flex: 1 }} />
        {/* UI-sweep: Button primitive now forwards aria-label, so we use it
            instead of the inlined native <button> from the previous patch. */}
        <Button
          size="icon"
          variant="ghost"
          aria-label="Previous"
          title={language === "tr" ? "Önceki" : "Previous"}
          onClick={prevMonth}
          icon={<ChevronLeft size={14} />}
        />
        <Button
          size="icon"
          variant="ghost"
          aria-label="Next"
          title={language === "tr" ? "Sonraki" : "Next"}
          onClick={nextMonth}
          icon={<ChevronRight size={14} />}
        />
        <Button size="sm" variant="secondary" onClick={goToday}>
          {language === "tr" ? "Bugün" : "Today"}
        </Button>
      </div>

      {/* Day-of-week header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          background: "var(--border)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          marginBottom: 1,
        }}
      >
        {weekdays.map((w) => (
          <div
            key={w}
            style={{
              background: "var(--surface-2)",
              padding: "8px 6px",
              fontSize: 11,
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--fg-muted)",
              textAlign: "center",
              letterSpacing: 0.4,
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 6×7 grid */}
      <div
        data-calendar-grid
        onWheel={handleWheel}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          background: "var(--border)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
        }}
      >
        {grid.map(({ date, inMonth }) => {
          const k = keyForDate(date)
          const cellTasks = tasksByDay.get(k) ?? []
          const isToday = k === todayKey
          const visible = cellTasks.slice(0, 3)
          const overflowCount = cellTasks.length - visible.length
          return (
            <div
              key={k}
              data-day-key={k}
              style={{
                background: "var(--surface)",
                minHeight: cellHeight,
                padding: 4,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                opacity: inMonth ? 1 : 0.45,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  background: isToday ? "var(--primary)" : "transparent",
                  color: isToday ? "var(--primary-fg)" : "var(--fg)",
                }}
              >
                {date.getDate()}
              </div>
              {visible.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    router.push(`/projects/${project.id}/tasks/${t.id}`)
                  }
                  style={{
                    fontSize: 10.5,
                    padding: "2px 4px",
                    borderRadius: 3,
                    background: `color-mix(in oklch, var(--priority-${priorityToken(
                      t.priority
                    )}) 18%, transparent)`,
                    color: "var(--fg)",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.key} · {t.title}
                </button>
              ))}
              {overflowCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPopoverDay(k)}
                  style={{
                    fontSize: 10.5,
                    padding: "2px 4px",
                    borderRadius: 3,
                    background: "transparent",
                    color: "var(--fg-muted)",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  +{overflowCount} {language === "tr" ? "diğer" : "more"}
                </button>
              )}

              {/* Day popover (D-31) */}
              {popoverDay === k && (
                <div
                  data-day-popover
                  style={{
                    position: "absolute",
                    top: 28,
                    left: 4,
                    right: 4,
                    zIndex: 50,
                    background: "var(--surface)",
                    boxShadow: "var(--shadow-lg), var(--inset-card)",
                    borderRadius: "var(--radius-sm)",
                    padding: 10,
                    maxHeight: 280,
                    overflowY: "auto",
                    minWidth: 220,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
                      {date.toLocaleDateString(
                        language === "tr" ? "tr-TR" : "en-US",
                        { weekday: "long", day: "numeric", month: "long" }
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPopoverDay(null)}
                      aria-label={language === "tr" ? "Kapat" : "Close"}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--fg-muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {cellTasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        data-day-popover-task={t.id}
                        onClick={() => {
                          router.push(
                            `/projects/${project.id}/tasks/${t.id}`
                          )
                          setPopoverDay(null)
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 6px",
                          borderRadius: 3,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 12.5,
                          color: "var(--fg)",
                        }}
                      >
                        <span
                          style={{
                            width: 4,
                            height: 16,
                            borderRadius: 2,
                            background: `var(--priority-${priorityToken(
                              t.priority
                            )})`,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10.5,
                            color: "var(--fg-muted)",
                          }}
                        >
                          {t.key}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
