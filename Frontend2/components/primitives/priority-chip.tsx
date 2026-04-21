"use client"

// PriorityChip: rotated diamond indicator + localized label
// Ported from New_Frontend/src/primitives.jsx (lines 198-207) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
// NOTE: prototype CSS exposes --priority-med (not --priority-medium), so "medium"
// maps to "med" at the token level while the public API keeps the "medium" string.

import * as React from "react"
import { t, type LangCode } from "@/lib/i18n"

export type PriorityLevel = "critical" | "high" | "medium" | "low"

export interface PriorityChipProps {
  level: PriorityLevel
  lang: LangCode
  withLabel?: boolean
  className?: string
  style?: React.CSSProperties
}

export function PriorityChip({
  level,
  lang,
  withLabel = true,
  className,
  style,
}: PriorityChipProps) {
  const label = t(`priority.${level}`, lang)
  const tokenLevel = level === "medium" ? "med" : level
  const color = `var(--priority-${tokenLevel})`
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        color: "var(--fg-muted)",
        fontWeight: 500,
        ...style,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: color,
          transform: "rotate(45deg)",
        }}
      />
      {withLabel && label}
    </span>
  )
}
