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

export type LeadCycleKind = "lead" | "cycle"
type LeadCycleRange = 7 | 30 | 90

export interface LeadCycleChartProps {
  projectId: number | null
  kind: LeadCycleKind
  globalRange: LeadCycleRange
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

export function LeadCycleChart({
  projectId,
  kind,
  globalRange,
}: LeadCycleChartProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const query = useLeadCycle(projectId, globalRange)

  const data = kind === "lead" ? query.data?.lead : query.data?.cycle
  const buckets = data?.buckets ?? []

  const barColor =
    kind === "lead"
      ? "color-mix(in oklch, var(--primary) 70%, transparent)"
      : "color-mix(in oklch, var(--status-progress) 70%, transparent)"

  const title = kind === "lead" ? "Lead Time" : "Cycle Time"
  const seriesName = kind === "lead" ? T("Lead Time", "Lead Time") : T("Cycle Time", "Cycle Time")

  const footer = data ? (
    <span className="mono" style={{ color: "var(--fg-muted)" }}>
      P50: {data.p50.toFixed(1)} · P85: {data.p85.toFixed(1)} · P95:{" "}
      {data.p95.toFixed(1)} {T("g", "d")}
    </span>
  ) : null

  return (
    <ChartCard
      title={title}
      query={query}
      loadingFallback={<LeadCycleSkeleton />}
      empty={!buckets.length}
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
              content={<CustomTooltip />}
              cursor={{
                fill: "color-mix(in oklch, var(--primary) 8%, transparent)",
              }}
            />
            <Bar
              dataKey="count"
              name={seriesName}
              fill={barColor}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
