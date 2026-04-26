"use client"

// Phase 13 Plan 13-08 Task 1 — IterationChart (Iteration Comparison).
//
// Recharts BarChart grouped 3-series per sprint (Planlanan / Tamamlanan /
// Taşınan) using our oklch design tokens via inline `fill` (RESEARCH §Pitfall 4
// — Recharts default styling overrides theme colors otherwise). Last N
// sprints; N is per-card local state (3 / 4 / 6, default 4 per D-A6).
//
// Critical contracts:
//   - "use client" mandatory — Recharts touches DOM/SVG; SSR fails without it
//     (RESEARCH §Pitfall 3).
//   - Custom Tooltip (RESEARCH §Pitfall 4) — Recharts default white box fights
//     dark mode + token theming.
//   - ResponsiveContainer parent has explicit `height: 180`
//     (RESEARCH §Pitfall 12 — % heights collapse without an absolute parent).
//   - Methodology gate (D-A4) — non-cycle methodologies HIDE THE CARD ENTIRELY
//     (return null). This is different from CFD's gate (which renders an info
//     AlertBanner). For iteration, the card is removed from the layout flow
//     because it represents work that simply does not exist for non-cycle
//     methodologies. Cycle methodologies = Scrum / Iterative / Incremental /
//     Evolutionary / RAD per chartApplicabilityFor().
//   - Per-card N override (D-A6) — local React.useState; never writes back to
//     a global filter.
//
// The `applicable` prop is `boolean | null`:
//   - `null` while methodology is unknown (no project picked yet) → render the
//     card with empty data so it's visible while the page hydrates.
//   - `false` → return null (the card disappears from the layout).
//   - `true` → render the chart.

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { SegmentedControl } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useIteration } from "@/hooks/use-iteration"
import { ChartCard } from "./chart-card"
import { IterationSkeleton } from "./iteration-skeleton"

type IterationCount = 3 | 4 | 6

export interface IterationChartProps {
  projectId: number | null
  /** D-A4 methodology gate: false → return null entirely. */
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

const PLANNED_FILL = "color-mix(in oklch, var(--status-progress) 60%, transparent)"
const COMPLETED_FILL = "color-mix(in oklch, var(--status-done) 70%, transparent)"
const CARRIED_FILL = "color-mix(in oklch, var(--status-review) 60%, transparent)"

export function IterationChart({ projectId, applicable }: IterationChartProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const [count, setCount] = React.useState<IterationCount>(4)

  // Always call useIteration before any conditional return (Rules of Hooks).
  // When applicable is false we still call the hook with projectId=null so
  // the request is skipped (the hook is `enabled: !!projectId`).
  const query = useIteration(applicable === true ? projectId : null, count)

  // D-A4 — non-cycle methodologies hide the card entirely. Return null AFTER
  // the hook call so the hook order stays stable across renders.
  if (applicable === false) return null

  const rangePicker = (
    <SegmentedControl
      size="sm"
      options={[
        { id: "3", label: "3" },
        { id: "4", label: "4" },
        { id: "6", label: "6" },
      ]}
      value={String(count)}
      onChange={(v) => setCount(Number(v) as IterationCount)}
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
            background: PLANNED_FILL,
            marginRight: 6,
          }}
        />
        {T("Planlanan", "Planned")}
      </span>
      <span>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: COMPLETED_FILL,
            marginRight: 6,
          }}
        />
        {T("Tamamlanan", "Completed")}
      </span>
      <span>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: CARRIED_FILL,
            marginRight: 6,
          }}
        />
        {T("Taşınan", "Carried")}
      </span>
    </div>
  )

  return (
    <ChartCard
      title={T("İterasyon Karşılaştırma", "Iteration Comparison")}
      rangePicker={rangePicker}
      legend={legend}
      query={query}
      loadingFallback={<IterationSkeleton />}
      empty={!query.data?.sprints?.length}
      emptyFallback={
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: "var(--fg-subtle)",
            fontSize: 13,
          }}
        >
          {T("Henüz tamamlanmış iterasyon yok.", "No completed iterations yet.")}
        </div>
      }
    >
      <div
        className="chart-card-iteration-svg"
        style={{ width: "100%", height: 180 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={query.data?.sprints ?? []}>
            <XAxis
              dataKey="name"
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
              cursor={{
                fill: "color-mix(in oklch, var(--primary) 8%, transparent)",
              }}
            />
            <Bar
              dataKey="planned"
              name={T("Planlanan", "Planned")}
              fill={PLANNED_FILL}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="completed"
              name={T("Tamamlanan", "Completed")}
              fill={COMPLETED_FILL}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="carried"
              name={T("Taşınan", "Carried")}
              fill={CARRIED_FILL}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
