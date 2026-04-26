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
//   - Methodology gate (D-A4) — non-Kanban projects show an info AlertBanner.
//     Lead/Cycle is all-methodology, but CFD is Kanban-only.
//   - Per-card range picker (D-A5) — overrides the global range FOR THAT
//     CARD ONLY; never writes back to the global state.
//
// The `applicable` prop is `boolean | null`:
//   - `null` while methodology is unknown (no project picked yet) → show
//     the chart shell with empty data; the picker placeholder communicates
//     the missing project.
//   - `false` → render the methodology gate AlertBanner.
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
import { useCFD } from "@/hooks/use-cfd"
import { ChartCard } from "./chart-card"
import { CFDSkeleton } from "./cfd-skeleton"

type CFDRange = 7 | 30 | 90

export interface CFDChartProps {
  projectId: number | null
  globalRange: CFDRange
  /** D-A4 methodology gate: false → AlertBanner; true → chart; null → idle. */
  applicable: boolean | null
}

interface RechartsTooltipPayload {
  name?: string
  value?: number | string
  fill?: string
}

interface RechartsTooltipProps {
  active?: boolean
  payload?: RechartsTooltipPayload[]
  label?: string | number
}

function CustomTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "8px 10px",
        boxShadow: "var(--shadow-lg)",
        fontSize: 11.5,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div
          key={String(p.name)}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.fill,
              display: "inline-block",
            }}
          />
          <span>{p.name}:</span>
          <span className="mono">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function CFDChart({ projectId, globalRange, applicable }: CFDChartProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const [override, setOverride] = React.useState<CFDRange | null>(null)
  const range: CFDRange = override ?? globalRange

  // Always call useCFD (Rules of Hooks) — the methodology gate hides the
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
      empty={!query.data?.days?.length}
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
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--border-strong)" }}
            />
            <Area
              dataKey="todo"
              stackId="1"
              name={T("Yapılacak", "To Do")}
              fill="color-mix(in oklch, var(--status-todo) 40%, transparent)"
              stroke="var(--status-todo)"
            />
            <Area
              dataKey="progress"
              stackId="1"
              name={T("Devam Ediyor", "In Progress")}
              fill="color-mix(in oklch, var(--status-progress) 40%, transparent)"
              stroke="var(--status-progress)"
            />
            <Area
              dataKey="review"
              stackId="1"
              name={T("İncelemede", "Review")}
              fill="color-mix(in oklch, var(--status-review) 40%, transparent)"
              stroke="var(--status-review)"
            />
            <Area
              dataKey="done"
              stackId="1"
              name={T("Tamamlandı", "Done")}
              fill="color-mix(in oklch, var(--status-done) 40%, transparent)"
              stroke="var(--status-done)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
