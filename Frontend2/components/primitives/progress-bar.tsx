"use client"

// ProgressBar: percent-width inner bar with configurable color, background, and height
// Ported from New_Frontend/src/primitives.jsx (lines 236-240) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"

export interface ProgressBarProps {
  value?: number
  max?: number
  height?: number
  color?: string
  bg?: string
  className?: string
  style?: React.CSSProperties
}

export function ProgressBar({
  value = 0,
  max = 100,
  height = 4,
  color = "var(--primary)",
  bg = "var(--surface-2)",
  className,
  style,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div
      className={className}
      style={{
        height,
        background: bg,
        borderRadius: height,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: "100%",
          background: color,
          borderRadius: height,
          transition: "width 0.2s",
        }}
      />
    </div>
  )
}
