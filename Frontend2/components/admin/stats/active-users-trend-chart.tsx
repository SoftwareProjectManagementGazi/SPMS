"use client"

// Phase 14 Plan 14-08 Task 1 — ActiveUsersTrendChart (D-X1, D-W1).
//
// 30-day active-users line chart over the audit_log distinct-actor count per
// day. Reads from `useAdminStats()` (Plan 14-01) at the page boundary; this
// component receives the trend points as a prop so it stays purely visual.
//
// Recharts AreaChart with linearGradient fill — mirrors UI-SPEC §Color line
// 163-164 (`stroke: var(--primary)`, `fill: color-mix(in oklch, var(--primary)
// 12%, transparent)`). Equivalent to the prototype's hand-drawn SVG path
// (admin.jsx lines 441-447) but driven by real data.
//
// Critical contracts (Phase 13 RESEARCH § Recharts pitfalls — re-applied
// verbatim because Phase 13 chart components proved them out):
//   - "use client" directive mandatory (Pitfall 3 — Recharts SSR fights
//     Next.js prerender; the wrapper page in app/(shell)/admin/stats/page.tsx
//     also wraps THIS component in a next/dynamic({ ssr: false }) for D-C6).
//   - Custom Tooltip — recharts default fights theme tokens.
//   - ResponsiveContainer parent has explicit height (% heights collapse
//     without an absolute parent; Pitfall 12).
//
// D-X2 scaling cliff documented: backend computes the 30-day distinct-actor
// trend on-the-fly via SQL window functions over audit_log. At ~10k events/
// day the GROUP BY date_trunc query starts to slow; v2.1 candidate is a
// daily snapshot table.
//
// Delta Badge: computed from first vs. last point. Positive → tone="success",
// negative → tone="danger" (UI-SPEC §Color line 182).

import * as React from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { Badge, Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminStatsT } from "@/lib/i18n/admin-stats-keys"

export interface ActiveUsersTrendPoint {
  date: string
  count: number
}

export interface ActiveUsersTrendChartProps {
  trend: ActiveUsersTrendPoint[]
}

// ---------------------------------------------------------------------------
// Custom Tooltip — Pitfall 4 (Recharts default fights theme tokens).
// ---------------------------------------------------------------------------

interface TooltipPayload {
  name?: string
  value?: number | string
  payload?: ActiveUsersTrendPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
  suffix: string
}

function CustomTooltip({
  active,
  payload,
  label,
  suffix,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value
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
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ color: "var(--fg-muted)" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--fg)",
          }}
        >
          {value}
        </span>{" "}
        {suffix}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ActiveUsersTrendChart({ trend }: ActiveUsersTrendChartProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  // Delta is computed from the first non-zero point and the last point so a
  // run of leading-zero days doesn't divide-by-zero. If the entire window is
  // zeros, deltaPct = 0 (no special tone applied).
  const first = trend.find((p) => p.count > 0)?.count ?? 0
  const last = trend.length > 0 ? trend[trend.length - 1].count : 0
  const deltaPct =
    first > 0 ? Math.round(((last - first) / first) * 100) : 0
  const deltaTone: "success" | "danger" | "neutral" =
    deltaPct > 0 ? "success" : deltaPct < 0 ? "danger" : "neutral"
  const deltaSign = deltaPct > 0 ? "+" : ""

  const tooltipSuffix = adminStatsT(
    "admin.stats.tooltip_active_users_suffix",
    lang,
  )

  return (
    <Card padding={16}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              margin: 0,
              letterSpacing: -0.2,
            }}
          >
            {adminStatsT("admin.stats.active_users_title", lang)}
          </h3>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--fg-muted)",
              marginTop: 2,
            }}
          >
            {adminStatsT("admin.stats.active_users_subtitle", lang)}
          </div>
        </div>
        {trend.length > 0 && (
          <Badge tone={deltaTone} size="sm" dot>
            {deltaSign}
            {deltaPct}%
          </Badge>
        )}
      </div>

      {trend.length === 0 ? (
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            textAlign: "center",
            padding: 40,
          }}
        >
          {adminStatsT("admin.stats.empty_trend", lang)}
        </div>
      ) : (
        <div
          role="img"
          aria-label={`${adminStatsT(
            "admin.stats.active_users_title",
            lang,
          )} — ${trend.length} ${tooltipSuffix}`}
          style={{ width: "100%", height: 180 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="activeUsersTrendGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--primary)"
                    stopOpacity={0.12}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip suffix={tooltipSuffix} />}
                cursor={{
                  stroke: "var(--border)",
                  strokeDasharray: "3 3",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#activeUsersTrendGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
