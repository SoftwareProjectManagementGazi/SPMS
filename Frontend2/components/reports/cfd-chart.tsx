"use client"

// Phase 13 Plan 13-07 Task 1 — CFDChart (Cumulative Flow Diagram).
//
// Recharts AreaChart with 4 stacked bands (todo/progress/review/done) using
// our oklch design tokens via inline `fill` / `stroke` (RESEARCH §Pitfall 4
// — Recharts default styling overrides theme colors otherwise).
//
// Critical contracts:
//   - "use client" mandatory — Recharts touches DOM/SVG; SSR fails without it
//     (RESEARCH §Pitfall 3).
//   - Custom Tooltip (RESEARCH §Pitfall 4) — Recharts default white box
//     fights dark mode + token theming.
//   - ResponsiveContainer parent has explicit `height: 200`
//     (RESEARCH §Pitfall 12 — % heights collapse without an absolute parent).
//   - Capability gate (Reports v2 Strategy D) — projects without the
//     {todo, in_progress, done} category triple show an info AlertBanner.
//     The gate is data-driven (BoardColumn.category presence), NOT
//     methodology-derived as in Phase 13.
//   - Per-card range picker (D-A5) — overrides the global range FOR THAT
//     CARD ONLY; never writes back to the global state.
//
// The `applicable` prop is `boolean | null`:
//   - `null` while capabilities are loading (no project picked yet or
//     /chart-capabilities still in flight) → show the chart shell with
//     empty data; the picker placeholder communicates the missing project.
//   - `false` → render the capability gate AlertBanner.
//   - `true` → render the chart.

import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { SegmentedControl } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { parseLocalDate } from "@/lib/date/parse-local-date"
import { useCFD } from "@/hooks/use-cfd"
import { ChartCard } from "./chart-card"
import { CFDSkeleton } from "./cfd-skeleton"
import { ChartTooltip } from "./chart-tooltip"

type CFDRange = 7 | 30 | 90

export interface CFDChartProps {
  projectId: number | null
  globalRange: CFDRange
  /** Capability gate from useChartCapabilities (Reports v2 Strategy D):
   *  false → AlertBanner; true → chart; null → idle/loading. */
  applicable: boolean | null
}

export function CFDChart({ projectId, globalRange, applicable }: CFDChartProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const [override, setOverride] = React.useState<CFDRange | null>(null)
  const range: CFDRange = override ?? globalRange

  // Always call useCFD (Rules of Hooks) — the capability gate hides the
  // chart but keeps the hook in the call tree.
  const query = useCFD(projectId, range)

  const rangePicker = (
    <SegmentedControl
      size="xs"
      options={[
        { id: "7", label: T("7 gün", "7d") },
        { id: "30", label: T("30 gün", "30d") },
        { id: "90", label: T("90 gün", "90d") },
      ]}
      value={String(range)}
      onChange={(v) => setOverride(Number(v) as CFDRange)}
    />
  )

  const legend = (
    <div style={{ display: "flex", gap: 12, color: "var(--fg-muted)" }}>
      <span>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: "var(--status-done)",
            marginRight: 6,
          }}
        />
        {T("Tamamlandı", "Done")}
      </span>
      <span>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: "var(--status-review)",
            marginRight: 6,
          }}
        />
        {T("İncelemede", "Review")}
      </span>
      <span>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: "var(--status-progress)",
            marginRight: 6,
          }}
        />
        {T("Devam Ediyor", "In Progress")}
      </span>
      <span>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: "var(--status-todo)",
            marginRight: 6,
          }}
        />
        {T("Yapılacak", "To Do")}
      </span>
    </div>
  )

  const footer = query.data ? (
    <div style={{ display: "flex", gap: 14, color: "var(--fg-muted)" }}>
      <span>
        {T("Ort. WIP", "Avg WIP")}:{" "}
        <span className="mono">{query.data.avgWip}</span>
      </span>
      <span>
        {T("Ort. Tamamlanma", "Avg Completion")}:{" "}
        <span className="mono">{query.data.avgCompletionPerDay}</span>{" "}
        {T("gün", "d")}
      </span>
    </div>
  ) : null

  return (
    <ChartCard
      title={T("Kümülatif Akış Diyagramı", "Cumulative Flow Diagram")}
      rangePicker={rangePicker}
      legend={legend}
      footerMetrics={footer}
      methodologyMessage={
        applicable === false
          ? T(
              "Kümülatif Akış Diyagramı yalnızca Kanban projeleri için geçerlidir.",
              "Cumulative Flow Diagram is only available for Kanban projects.",
            )
          : undefined
      }
      query={query}
      loadingFallback={<CFDSkeleton />}
      applicableLoading={applicable === null}
      empty={!query.data?.days?.length}
      emptyFallback={
        // M-R1 — fixed 200px (matches CFDSkeleton + the SVG container below) so
        // the card doesn't collapse to a one-line height when empty (layout
        // jump). Mirrors burndown-chart's sized empty state.
        <div
          style={{
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--fg-subtle)",
            fontSize: 12,
          }}
        >
          {T("Bu aralıkta akış verisi yok.", "No flow data in this range.")}
        </div>
      }
    >
      <div
        className="chart-card-cfd-svg"
        role="img"
        aria-label={
          query.data
            ? T(
                `Kümülatif akış diyagramı, ${range} gün, ortalama WIP ${query.data.avgWip}, günlük ${query.data.avgCompletionPerDay} tamamlanma`,
                `Cumulative flow diagram, ${range} days, avg WIP ${query.data.avgWip}, ${query.data.avgCompletionPerDay} per day completion`,
              )
            : T(
                `Kümülatif akış diyagramı, veri yükleniyor`,
                `Cumulative flow diagram, loading`,
              )
        }
        style={{ width: "100%", height: 200 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={query.data?.days ?? []}>
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => {
                const parsed = parseLocalDate(d)
                return parsed
                  ? parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  : d
              }}
              interval="preserveStartEnd"
              minTickGap={24}
              tick={{
                fill: "var(--fg-subtle)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            />
            <YAxis
              tick={{
                fill: "var(--fg-subtle)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--border-strong)" }}
            />
            <Area
              dataKey="todo"
              stackId="1"
              name={T("Yapılacak", "To Do")}
              fill="color-mix(in oklch, var(--status-todo) 40%, transparent)"
              stroke="var(--status-todo)"
              isAnimationActive={false}
            />
            <Area
              dataKey="progress"
              stackId="1"
              name={T("Devam Ediyor", "In Progress")}
              fill="color-mix(in oklch, var(--status-progress) 40%, transparent)"
              stroke="var(--status-progress)"
              isAnimationActive={false}
            />
            <Area
              dataKey="review"
              stackId="1"
              name={T("İncelemede", "Review")}
              fill="color-mix(in oklch, var(--status-review) 40%, transparent)"
              stroke="var(--status-review)"
              isAnimationActive={false}
            />
            <Area
              dataKey="done"
              stackId="1"
              name={T("Tamamlandı", "Done")}
              fill="color-mix(in oklch, var(--status-done) 40%, transparent)"
              stroke="var(--status-done)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
