"use client"

// Phase 13 Plan 13-07 Task 1 — global DateRangeFilter (D-A5).
//
// SegmentedControl wrapper for the page-level range chip strip at the top of
// /reports. 3 options: Last 7d / Last 30d / Last 90d. (The decorative "Q2 2026"
// quarter chip was removed in M-R2 — it mapped to the same 90-day window as
// "Last 90 days", so it showed identical data with no visual signal.)
//
// Per-card range pickers are independent SegmentedControl instances inside
// each chart card and override the global value FOR THAT CARD ONLY (CONTEXT
// D-A5 — local state, never writes back to the global).

import * as React from "react"
import { SegmentedControl } from "@/components/primitives"
import { useApp } from "@/context/app-context"

export type DateRange = 7 | 30 | 90

export interface DateRangeFilterProps {
  value: DateRange
  onChange: (next: DateRange) => void
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)
  return (
    <SegmentedControl
      size="sm"
      options={[
        { id: "7", label: T("Son 7 gün", "Last 7 days") },
        { id: "30", label: T("Son 30 gün", "Last 30 days") },
        { id: "90", label: T("Son 90 gün", "Last 90 days") },
      ]}
      value={String(value)}
      onChange={(v) => onChange(Number(v) as 7 | 30 | 90)}
    />
  )
}
