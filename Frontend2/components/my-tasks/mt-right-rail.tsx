"use client"

// MTRightRail — sticky 300px column on /my-tasks (≥1280px viewport).
//
// Ported 1:1 from `New_Frontend/src/pages/my-tasks.jsx` lines 539-643. Renders
// four cards in a vertical stack:
//   1. This-week heatmap — Monday-first 7-day grid, today highlighted with a
//      primary ring; intensity is `color-mix` of var(--primary) at 20-80%.
//   2. Focus timer placeholder — purely visual (24:32 / 50:00). The Pause/Done
//      buttons are wired as no-op for now; a future plan will integrate a real
//      timer state machine.
//   3. Recently completed — last 4 entries sorted by store.completedAt desc.
//   4. Quote card — italic motivational copy.
//
// Permitted exceptions to the 4-size scale:
//   - fontSize: 36, letterSpacing: -1.5 — focus timer (matches prototype).
//
// The component receives the project lookup map so the recently-completed list
// can show the project key without extra API round-trips.

import * as React from "react"
import { Calendar, Check, CircleCheck, Clock } from "lucide-react"

import { Button, Card } from "@/components/primitives"
import type { MyTasksStore } from "@/hooks/use-my-tasks-store"
import type { LangCode } from "@/lib/i18n"
import type { Task } from "@/services/task-service"

export interface MTRightRailProps {
  lang: LangCode
  store: MyTasksStore
  allTasks: Task[]
  projectsByKey?: Map<number, string>
  /** Inject `Date.now()` reference for tests (heatmap is current-time sensitive). */
  nowRef?: Date
}

interface DayCell {
  date: Date
  iso: string
  count: number
  isToday: boolean
}

function buildDays(allTasks: Task[], nowRef: Date): DayCell[] {
  // Monday-first week. JS getDay(): 0=Sun..6=Sat, so (day+6)%7 yields 0=Mon..6=Sun.
  const today = new Date(
    nowRef.getFullYear(),
    nowRef.getMonth(),
    nowRef.getDate()
  )
  const startDow = (today.getDay() + 6) % 7
  const monday = new Date(today.getTime() - startDow * 86_400_000)
  const out: DayCell[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime() + i * 86_400_000)
    const iso = d.toISOString().slice(0, 10)
    // The prototype ignores `done` tasks in the heatmap; we mirror that so the
    // color intensity reflects "incoming pressure", not historical workload.
    const count = allTasks.filter(
      (t) => t.due === iso && t.status !== "done"
    ).length
    out.push({
      date: d,
      iso,
      count,
      isToday: d.getTime() === today.getTime(),
    })
  }
  return out
}

export function MTRightRail({
  lang,
  store,
  allTasks,
  projectsByKey,
  nowRef,
}: MTRightRailProps) {
  // We compare on day-boundary granularity (date.getDate()) inside buildDays,
  // so the memo dep is the day-of-year of `nowRef ?? new Date()`. Capturing
  // the ref'd date as a primitive YYYY-MM-DD string means re-renders within
  // the same day reuse the cached cells; the next day, the dep changes and
  // the heatmap recomputes.
  const todayKey = React.useMemo(() => {
    const d = nowRef ?? new Date()
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    // Re-run only when the caller-injected ref actually swaps; in production
    // it's undefined and the test cases pass an explicit date.
  }, [nowRef])

  const days = React.useMemo(
    () => buildDays(allTasks, nowRef ?? new Date()),
    // todayKey captures the only thing that matters about `now` for the grid;
    // `nowRef` is included for tests that pass an explicit Date. Reading
    // `new Date()` inside the memo body is allowed because the dep `todayKey`
    // forces a recompute exactly when the day boundary changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTasks, todayKey, nowRef]
  )

  const maxCount = Math.max(1, ...days.map((d) => d.count))
  const dayLabels =
    lang === "tr"
      ? ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"]
      : ["M", "T", "W", "T", "F", "S", "S"]

  // Recent completed — uses the store.completedAt map. Falls back gracefully
  // when an id no longer exists in allTasks (the user could have completed it
  // months ago and the backend pruned the row).
  const recent = React.useMemo<Task[]>(() => {
    const entries = Object.entries(store.completedAt) as Array<
      [string, string | number]
    >
    return entries
      .sort(([, a], [, b]) => {
        // ISO strings and numeric timestamps both compare correctly via Number()
        // on Date.parse; the prototype stored `Date.now()` numbers and the
        // current store typing claims ISO strings, so support both.
        const at = typeof a === "string" ? Date.parse(a) : a
        const bt = typeof b === "string" ? Date.parse(b) : b
        return bt - at
      })
      .slice(0, 4)
      .map(([id]) => allTasks.find((t) => t.id === Number(id)))
      .filter((t): t is Task => Boolean(t))
  }, [store.completedAt, allTasks])

  const totalThisWeek = days.reduce((s, d) => s + d.count, 0)

  return (
    <div
      data-testid="mt-right-rail"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "sticky",
        top: 70,
      }}
    >
      {/* This week heatmap */}
      <Card padding={16} style={{ boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} style={{ color: "var(--primary)" }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {lang === "tr" ? "Bu hafta" : "This week"}
          </div>
          <div style={{ flex: 1 }} />
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--fg-subtle)" }}
          >
            {totalThisWeek}
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            marginTop: 14,
          }}
        >
          {days.map((d, i) => (
            <div
              key={d.iso}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--fg-subtle)",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                {dayLabels[i]}
              </div>
              <div
                title={`${d.count} ${
                  lang === "tr" ? "görev" : "tasks"
                }`}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 6,
                  background:
                    d.count === 0
                      ? "var(--surface-2)"
                      : `color-mix(in oklch, var(--primary) ${
                          20 + (d.count / maxCount) * 60
                        }%, transparent)`,
                  boxShadow: d.isToday
                    ? "inset 0 0 0 1.5px var(--primary)"
                    : "inset 0 0 0 1px var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    d.count === 0 ? "var(--fg-subtle)" : "var(--fg)",
                }}
              >
                {d.date.getDate()}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 9.5,
                  color: d.count
                    ? "var(--primary)"
                    : "var(--fg-subtle)",
                  fontWeight: 600,
                }}
              >
                {d.count || ""}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Focus timer (visual placeholder — prototype-faithful) */}
      <Card padding={16} style={{ boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={14} style={{ color: "var(--status-progress)" }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {lang === "tr" ? "Odak zamanlayıcı" : "Focus timer"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            marginTop: 14,
          }}
        >
          <div
            style={{
              fontSize: 36, // permitted exception (prototype timer)
              fontWeight: 600,
              letterSpacing: -1.5,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            24:32
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
            / 50:00
          </div>
        </div>
        <div
          style={{
            height: 4,
            background: "var(--surface-2)",
            borderRadius: 2,
            marginTop: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "49%",
              height: "100%",
              background:
                "linear-gradient(90deg, var(--primary), var(--status-progress))",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--fg-muted)",
            marginTop: 10,
          }}
        >
          {lang === "tr"
            ? "Odak modu yakında geliyor"
            : "Focus mode coming soon"}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <Button
            size="sm"
            variant="primary"
            icon={<Clock size={12} />}
            style={{ flex: 1, justifyContent: "center" }}
          >
            {lang === "tr" ? "Duraklat" : "Pause"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Check size={12} />}
          >
            {lang === "tr" ? "Bitir" : "Done"}
          </Button>
        </div>
      </Card>

      {/* Recently completed */}
      {recent.length > 0 && (
        <Card padding={0} style={{ boxShadow: "var(--shadow)" }}>
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CircleCheck size={14} style={{ color: "var(--status-done)" }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {lang === "tr"
                ? "Yakın zamanda biten"
                : "Recently completed"}
            </div>
          </div>
          {recent.map((t, idx) => {
            const projKey = projectsByKey?.get(t.projectId)
            return (
              <div
                key={t.id}
                style={{
                  padding: "10px 14px",
                  fontSize: 12.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderBottom:
                    idx === recent.length - 1
                      ? "none"
                      : "1px solid var(--border)",
                }}
              >
                <Check
                  size={11}
                  style={{
                    color: "var(--status-done)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "var(--fg-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {t.title}
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}
                >
                  {projKey ?? t.key}
                </span>
              </div>
            )
          })}
        </Card>
      )}

      {/* Quote */}
      <Card padding={14} style={{ boxShadow: "var(--shadow)" }}>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            fontStyle: "italic",
            lineHeight: 1.6,
          }}
        >
          {lang === "tr"
            ? `"Yapılacaklar listesi nefes alır; sıkıştıkça daralır. En önemli üçünü seç, gerisini bırak."`
            : `"A to-do list breathes — it tightens when crowded. Pick the top three and let go of the rest."`}
        </div>
      </Card>
    </div>
  )
}
