"use client"

// MiniMetric (Phase 12 Plan 12-04) — single 4-cell metric tile used inside
// Overview / Phase-Gate / History card grids.
//
// Anatomy: 12-UI-SPEC.md §2 MiniMetric (lines 798-818).
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 199-204.
//
// LIFE-03 contract — when `value === '---'`, the value text renders in
// `var(--font-mono)` and `var(--fg-subtle)` REGARDLESS of any `color`/`mono`
// prop the caller supplied. This guarantees the zero-task phase visual
// signature is identical across every consumer (Overview / History / Phase
// Gate header) per CONTEXT D-43.

import * as React from "react"

export interface MiniMetricProps {
  /** Metric label (e.g. "Toplam"). Renders below the value at 10.5px. */
  label: string
  /** Metric value. Numbers render at 18px / weight 600. The literal string
   *  `'---'` triggers the LIFE-03 zero-task variant (mono + grey). */
  value: string | number
  /** Optional value color. Ignored when `value === '---'`. */
  color?: string
  /** When true, renders the value in mono font. Implied when `value === '---'`. */
  mono?: boolean
}

export function MiniMetric({ label, value, color, mono }: MiniMetricProps) {
  const isZeroTask = value === "---"
  const valueColor = isZeroTask ? "var(--fg-subtle)" : color ?? "var(--fg)"
  const valueFontFamily =
    isZeroTask || mono ? "var(--font-mono)" : undefined

  return (
    <div
      style={{
        padding: 10,
        background: "var(--surface-2)",
        borderRadius: "var(--radius-sm)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: valueColor,
          fontFamily: valueFontFamily,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: "var(--fg-muted)",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  )
}
