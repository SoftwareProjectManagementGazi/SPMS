"use client"

// StatusDot: colored circle using --status-* tokens, including --status-blocked (FOUND-04)
// Ported from New_Frontend/src/primitives.jsx (lines 210-213) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"

export type StatusValue = "todo" | "progress" | "review" | "done" | "blocked"

export interface StatusDotProps {
  status: StatusValue
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function StatusDot({
  status,
  size = 8,
  className,
  style,
}: StatusDotProps) {
  const color = `var(--status-${status})`
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        display: "inline-block",
        ...style,
      }}
    />
  )
}
