"use client"

// Toggle: sliding knob with CSS transition and primary background when on
// Ported from New_Frontend/src/primitives.jsx (lines 290-304) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
// On state uses --inset-primary-top/--inset-primary-bottom for raised look.
// Knob transitions left 0.12s.

import * as React from "react"

export type ToggleSize = "sm" | "md"

export interface ToggleProps {
  on: boolean
  onChange?: (value: boolean) => void
  size?: ToggleSize
  className?: string
  style?: React.CSSProperties
}

interface ToggleDims {
  w: number
  h: number
  d: number
}

const DIMS: Record<ToggleSize, ToggleDims> = {
  sm: { w: 30, h: 16, d: 12 },
  md: { w: 36, h: 20, d: 16 },
}

export function Toggle({
  on,
  onChange,
  size = "md",
  className,
  style,
}: ToggleProps) {
  const { w, h, d } = DIMS[size]
  const offset = (h - d) / 2
  return (
    <div
      className={className}
      onClick={() => onChange && onChange(!on)}
      style={{
        width: w,
        height: h,
        borderRadius: h,
        cursor: "pointer",
        position: "relative",
        background: on ? "var(--primary)" : "var(--surface-2)",
        boxShadow: on
          ? "var(--inset-primary-top), var(--inset-primary-bottom)"
          : "inset 0 0 0 1px var(--border-strong)",
        transition: "background 0.12s",
        ...style,
      }}
    >
      <div
        style={{
          width: d,
          height: d,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: offset,
          left: on ? w - d - offset : offset,
          transition: "left 0.12s",
          boxShadow: "0 1px 3px oklch(0 0 0 / 0.15)",
        }}
      />
    </div>
  )
}
