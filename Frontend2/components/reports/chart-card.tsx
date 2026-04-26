"use client"

// Phase 13 Plan 13-07 Task 1 — ChartCard shell.
//
// Shared shell for the new charts (CFD / Lead-Cycle / Iteration). Wraps
// every chart card with:
//   - title row + optional rangePicker on the right
//   - methodologyMessage AlertBanner (D-A4 — non-applicable methodologies)
//   - DataState 3-state primitive (D-F2) for loading / error / empty
//   - optional legend chips + footer mono metrics row
//
// Render contract: methodologyMessage takes precedence over the data slots,
// matching the gate-then-render UX from CONTEXT D-A4. When the message is
// set the chart is replaced by an info-tone AlertBanner; the legend / footer
// strip below still renders so layout doesn't jump on toggle.

import * as React from "react"
import { Card, AlertBanner, DataState } from "@/components/primitives"

export interface ChartCardProps {
  /** Card title rendered as h3. */
  title: string
  /** Right-aligned per-card range picker (SegmentedControl). */
  rangePicker?: React.ReactNode
  /** Bottom-left legend chips row. */
  legend?: React.ReactNode
  /** Bottom-right mono metrics row. */
  footerMetrics?: React.ReactNode
  /** When set, replaces the chart slot with an info AlertBanner (D-A4). */
  methodologyMessage?: string
  /** TanStack Query result shape — only the 3 fields DataState reads. */
  query: {
    isLoading: boolean
    error?: unknown
    data?: unknown
  }
  /** Skeleton or other loading placeholder for the DataState loading slot. */
  loadingFallback: React.ReactNode
  /** Optional override for the empty state. */
  emptyFallback?: React.ReactNode
  /** Toggle for the empty state (DataState convention). */
  empty?: boolean
  /** The chart SVG body. */
  children: React.ReactNode
}

export function ChartCard({
  title,
  rangePicker,
  legend,
  footerMetrics,
  methodologyMessage,
  query,
  loadingFallback,
  emptyFallback,
  empty,
  children,
}: ChartCardProps) {
  return (
    <Card padding={16}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{title}</h3>
        <div style={{ flex: 1 }} />
        {rangePicker}
      </div>
      {methodologyMessage ? (
        <AlertBanner tone="info">{methodologyMessage}</AlertBanner>
      ) : (
        <DataState
          loading={query.isLoading}
          loadingFallback={loadingFallback}
          error={query.error}
          empty={empty}
          emptyFallback={emptyFallback}
        >
          {children}
        </DataState>
      )}
      {(legend || footerMetrics) && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 10,
            fontSize: 11.5,
            alignItems: "center",
          }}
        >
          {legend}
          <div style={{ flex: 1 }} />
          {footerMetrics}
        </div>
      )}
    </Card>
  )
}
