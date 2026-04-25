"use client"

// PriorityChip: 4-bar ascending icon + localized label.
// Mirrors prototype MTPriority (New_Frontend/src/pages/my-tasks-parts.jsx
// lines 130-149). Bars per level: critical=4, high=3, medium=2, low=1.
// Inactive bars use --border-strong so the count is always legible.
// Token bridge: "medium" → --priority-med (prototype CSS exposes "med", not
// "medium"). Public API keeps "medium" so callers and translation keys do not
// have to know about it.

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

const BARS_BY_LEVEL: Record<PriorityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export function PriorityChip({
  level,
  lang,
  withLabel = true,
  className,
  style,
}: PriorityChipProps) {
  // Defense in depth — services/task-service.ts normalizes priority at the
  // API boundary, but a stray UPPERCASE or unknown value should still render
  // a meaningful chip rather than 4 grey bars (which is what an undefined
  // BARS_BY_LEVEL lookup produces).
  const norm: PriorityLevel = (() => {
    const lc = String(level ?? "").toLowerCase() as PriorityLevel
    if (lc === "low" || lc === "medium" || lc === "high" || lc === "critical") {
      return lc
    }
    return "medium"
  })()
  const label = t(`priority.${norm}`, lang)
  const tokenLevel = norm === "medium" ? "med" : norm
  const color = `var(--priority-${tokenLevel})`
  const filled = BARS_BY_LEVEL[norm]
  return (
    <span
      title={label}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "var(--fg-muted)",
        fontWeight: 500,
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "flex-end",
          gap: 1.5,
          height: 11,
        }}
      >
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            style={{
              width: 2.5,
              height: n * 2.5 + 1.5,
              background: n <= filled ? color : "var(--border-strong)",
              borderRadius: 0.5,
            }}
          />
        ))}
      </span>
      {withLabel && <span style={{ fontSize: 11.5 }}>{label}</span>}
    </span>
  )
}
