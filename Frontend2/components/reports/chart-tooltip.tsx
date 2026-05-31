"use client"

// Reports migration v2 Wave 4 — shared chart tooltip.
//
// Replaces the three inline CustomTooltip copies that lived in CFDChart,
// LeadCycleChart, and BurndownChart. Same visual contract (surface bg +
// border token + shadow-lg + 8x8 swatch + mono value), one definition.
//
// Recharts series expose different keys for their color:
//   - Bar/Area → `fill`
//   - Line     → `stroke`
// The swatch reads whichever is present so the same component renders
// correctly across all three chart shapes.
//
// `formatValue` lets the caller add units (e.g. "3.2d", "12 görev") at
// the value position. Defaults to identity so callers that just want the
// raw number get it.

import * as React from "react"

export interface ChartTooltipPayload {
  name?: string
  value?: number | string
  fill?: string
  stroke?: string
  color?: string
  dataKey?: string
}

export interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayload[]
  label?: string | number
  /** Optional per-chart value formatter (units, locale, etc.). */
  formatValue?: (value: number | string | undefined) => string
}

function defaultFormat(v: number | string | undefined): string {
  if (v === undefined || v === null) return ""
  return String(v)
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatValue = defaultFormat,
}: ChartTooltipProps) {
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
      {payload.map((p, idx) => {
        // Prefer the solid stroke/series color over `fill`: area charts use a
        // semi-transparent fill, which made the legend swatch look washed out.
        const swatch = p.stroke || p.color || p.fill || "var(--fg-muted)"
        const key = String(p.dataKey ?? p.name ?? idx)
        return (
          <div
            key={key}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: swatch,
                display: "inline-block",
              }}
            />
            <span>{p.name}:</span>
            <span className="mono">{formatValue(p.value)}</span>
          </div>
        )
      })}
    </div>
  )
}
