"use client"

// Phase 13 Plan 13-07 Task 2 — LeadCycleChart (Lead Time + Cycle Time).
//
// Recharts BarChart histogram across the 5 lead/cycle buckets (Plan 13-01
// LEAD_CYCLE_BUCKETS = ["0-1d", "1-3d", "3-5d", "5-10d", "10d+"]). One
// instance per kind ("lead" | "cycle"); the Reports page mounts both
// side-by-side in a 1fr/1fr grid (D-A4 — Lead/Cycle is all-methodology).
//
// Color tokens per UI-SPEC §E.3:
//   - Lead Time:  color-mix(in oklch, var(--primary) 70%, transparent)
//   - Cycle Time: color-mix(in oklch, var(--status-progress) 70%, transparent)
//
// The footer P50/P85/P95 row reuses the prototype's mono caption format
// (line 462 of misc.jsx) — single line, separator dot, locale-aware unit
// suffix ("g" / "d").
//
// Same critical contracts as CFDChart:
//   - "use client" mandatory (RESEARCH §Pitfall 3 — Recharts SSR).
//   - Custom Tooltip (RESEARCH §Pitfall 4 — Recharts default fights theme).
//   - ResponsiveContainer parent has explicit `height: 120`
//     (RESEARCH §Pitfall 12 — % heights collapse without absolute parent).

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useApp } from "@/context/app-context"
import { useLeadCycle } from "@/hooks/use-lead-cycle"
import { ChartCard } from "./chart-card"
import { LeadCycleSkeleton } from "./lead-cycle-skeleton"
import { ChartTooltip } from "./chart-tooltip"

export type LeadCycleKind = "lead" | "cycle"
type LeadCycleRange = 7 | 30 | 90

export interface LeadCycleChartProps {
  projectId: number | null
  kind: LeadCycleKind
  globalRange: LeadCycleRange
  /** Capability gate from useChartCapabilities. Reports v2 audit FE-3:
   *  added for cross-component consistency with the other 5 chart cards.
   *  Backend currently sets `lead_cycle=true` for every project (the rule
   *  registry's always-true clause), but accepting the prop closes the
   *  "what if it goes false later" contract gap AND lets the card sit in
   *  the loading skeleton during capability resolution (instead of
   *  flashing the empty state). */
  applicable?: boolean | null
}

export function LeadCycleChart({
  projectId,
  kind,
  globalRange,
  applicable = true,
}: LeadCycleChartProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  // When applicable is explicitly false (future rule change) we disable
  // the fetch entirely and render the empty/CTA branch. null = caps in
  // flight → keep the request gated so we don't pull data for a card we
  // might not render.
  const query = useLeadCycle(applicable === true ? projectId : null, globalRange)

  const data = kind === "lead" ? query.data?.lead : query.data?.cycle
  const buckets = data?.buckets ?? []

  const barColor =
    kind === "lead"
      ? "color-mix(in oklch, var(--primary) 70%, transparent)"
      : "color-mix(in oklch, var(--status-progress) 70%, transparent)"

  const title = kind === "lead" ? "Lead Time" : "Cycle Time"
  const seriesName = kind === "lead" ? T("Lead Time", "Lead Time") : T("Cycle Time", "Cycle Time")

  // Defensive: data fields could be null when BE returns no completed
  // tasks in the range. toFixed() throws on null/NaN so guard each one.
  const fmt = (v: number | null | undefined) =>
    v == null || !Number.isFinite(v) ? "—" : v.toFixed(1)
  const footer = data ? (
    <span className="mono" style={{ color: "var(--fg-muted)" }}>
      P50: {fmt(data.p50)} · P85: {fmt(data.p85)} · P95:{" "}
      {fmt(data.p95)} {T("g", "d")}
    </span>
  ) : null

  return (
    <ChartCard
      title={title}
      query={query}
      loadingFallback={<LeadCycleSkeleton />}
      applicableLoading={applicable === null}
      empty={!buckets.length}
      emptyFallback={
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: "var(--fg-subtle)",
            fontSize: 13,
          }}
        >
          {T(
            "Bu dönem için tamamlanmış görev verisi yok.",
            "No completed-task data in this period.",
          )}
        </div>
      }
      footerMetrics={footer}
    >
      <div
        className="chart-card-leadcycle-svg"
        role="img"
        aria-label={
          data
            ? T(
                `${title}, P50 ${data.p50.toFixed(1)} gün, P85 ${data.p85.toFixed(1)} gün, P95 ${data.p95.toFixed(1)} gün`,
                `${title}, P50 ${data.p50.toFixed(1)}d, P85 ${data.p85.toFixed(1)}d, P95 ${data.p95.toFixed(1)}d`,
              )
            : `${title}`
        }
        style={{ width: "100%", height: 120 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets}>
            <XAxis
              dataKey="range"
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
              cursor={{
                fill: "color-mix(in oklch, var(--primary) 8%, transparent)",
              }}
            />
            <Bar
              dataKey="count"
              name={seriesName}
              fill={barColor}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
