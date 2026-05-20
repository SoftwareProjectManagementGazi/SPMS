"use client"

// Reports migration v2 Wave 3 — BurndownChart.
//
// Recharts LineChart with two series:
//   - `remaining`: actual remaining-task count per day, solid
//     var(--primary) line with dot markers (matches prototype circle dots
//     at New_Frontend/src/pages/misc.jsx:389-391).
//   - `ideal`:     linearly interpolated from total[0] at day 0 down to 0
//                  at the last day, rendered as a dashed var(--fg-subtle)
//                  line (matches prototype's diagonal dashed line at
//                  misc.jsx:387).
//
// Capability gating: this component does NOT contain a methodology check.
// The page composer reads caps.burndown from useChartCapabilities and
// passes it via the `applicable` prop, mirroring the CFD / Iteration
// gate-prop convention so the chart card's render contract stays
// consistent across all 4 charts on the page.
//
// Critical Recharts contracts (RESEARCH §Pitfall 3/4/12):
//   - "use client" mandatory — Recharts touches DOM/SVG.
//   - ResponsiveContainer parent has explicit `height: 200` (% heights
//     collapse without an absolute parent).
//   - Custom Tooltip via the CFD pattern — Recharts default white box
//     fights dark mode + token theming.
//   - isAnimationActive disabled per Wave 4 perf-default policy (8 charts
//     simultaneously animating on filter change → layout thrash).

import * as React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useApp } from "@/context/app-context"
import { useBurndown } from "@/hooks/use-burndown"
import type { BurndownData, BurndownPoint } from "@/services/report-service"
import { ChartCard } from "./chart-card"
import { BurndownSkeleton } from "./burndown-skeleton"
import { ChartTooltip } from "./chart-tooltip"

export interface BurndownChartProps {
  projectId: number | null
  /** Capability gate from useChartCapabilities:
   *  false → AlertBanner (CTA: create a sprint to enable the report).
   *  true  → chart.
   *  null  → idle/loading (caps query in flight). */
  applicable: boolean | null
}

interface ChartRow extends BurndownPoint {
  ideal: number
}

/** Compute ideal-burndown line from the actual series.
 *  Ideal starts at total[0] and drops linearly to 0 by the last day. If
 *  total is missing we fall back to remaining[0]; if the series has < 2
 *  points we degenerate to a flat ideal (no interpolation possible). */
function withIdealLine(data: BurndownData | undefined): ChartRow[] {
  if (!data?.series?.length) return []
  const series = data.series
  const start = series[0].total || series[0].remaining
  const n = series.length
  if (n < 2) {
    return series.map((p) => ({ ...p, ideal: start }))
  }
  return series.map((p, i) => ({
    ...p,
    ideal: Math.max(0, start * (1 - i / (n - 1))),
  }))
}

export function BurndownChart({ projectId, applicable }: BurndownChartProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  // Always call useBurndown before any conditional return (Rules of Hooks).
  // When `applicable !== true` we still call the hook but with enabled=false
  // so no request fires; the hook's own gate is `projectId != null`.
  const query = useBurndown(projectId, undefined, applicable === true)

  const chartData = React.useMemo(() => withIdealLine(query.data), [query.data])
  const todayRemaining = chartData.length ? chartData[chartData.length - 1].remaining : null
  const totalAtStart = chartData.length ? chartData[0].total || chartData[0].remaining : null

  const legend = (
    <div style={{ display: "flex", gap: 12, color: "var(--fg-muted)" }}>
      <span>
        <span
          style={{
            display: "inline-block",
            width: 14,
            height: 2,
            background: "var(--primary)",
            verticalAlign: "middle",
            marginRight: 6,
          }}
        />
        {T("Gerçekleşen", "Actual")}
      </span>
      <span>
        <span
          style={{
            display: "inline-block",
            width: 14,
            height: 0,
            borderTop: "2px dashed var(--fg-subtle)",
            verticalAlign: "middle",
            marginRight: 6,
          }}
        />
        {T("İdeal", "Ideal")}
      </span>
    </div>
  )

  const footer =
    todayRemaining != null && totalAtStart != null ? (
      <div style={{ display: "flex", gap: 14, color: "var(--fg-muted)" }}>
        <span>
          {T("Bugün kalan", "Remaining today")}:{" "}
          <span className="mono">
            {todayRemaining} / {totalAtStart}
          </span>
        </span>
      </div>
    ) : null

  const title = query.data?.sprintName
    ? `${T("Burndown", "Burndown")} — ${query.data.sprintName}`
    : T("Burndown", "Burndown")

  return (
    <ChartCard
      title={title}
      legend={legend}
      footerMetrics={footer}
      methodologyMessage={
        applicable === false
          ? T(
              "Burndown raporu için projenize bir sprint eklenmelidir.",
              "Burndown report requires the project to have at least one sprint.",
            )
          : undefined
      }
      query={query}
      loadingFallback={<BurndownSkeleton />}
      applicableLoading={applicable === null}
      empty={!chartData.length}
      emptyFallback={
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
          {T(
            "Aktif sprintte veri bulunamadı.",
            "No data for the active sprint yet.",
          )}
        </div>
      }
    >
      <div
        role="img"
        aria-label={
          query.data
            ? T(
                `Burndown grafiği, ${query.data.sprintName || "sprint"}, bugün kalan ${todayRemaining}`,
                `Burndown chart, ${query.data.sprintName || "sprint"}, ${todayRemaining} remaining today`,
              )
            : T("Burndown grafiği, veri yükleniyor", "Burndown chart, loading")
        }
        style={{ width: "100%", height: 200 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{
                fill: "var(--fg-subtle)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            />
            <YAxis
              allowDecimals={false}
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
            <Line
              type="monotone"
              dataKey="ideal"
              name={T("İdeal", "Ideal")}
              stroke="var(--fg-subtle)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="remaining"
              name={T("Gerçekleşen", "Actual")}
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
