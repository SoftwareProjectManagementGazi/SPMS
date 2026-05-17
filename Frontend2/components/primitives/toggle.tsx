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
  /** When true, the toggle becomes non-interactive (no onChange dispatch)
   *  and renders at reduced opacity. Added in Wave 2 W2-C4 for
   *  CapabilitiesPanel's read-only path (canEdit=false). */
  disabled?: boolean
  /** Forwarded onto the underlying <button> so callers can drive
   *  CapabilitiesPanel toggles by accessible name via htmlFor labels. */
  id?: string
  /** When provided, exposed as aria-label so testing-library queries
   *  by role with name selectors can target a specific toggle. */
  "aria-label"?: string
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
  disabled = false,
  id,
  "aria-label": ariaLabel,
}: ToggleProps) {
  const { w, h, d } = DIMS[size]
  const offset = (h - d) / 2
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-label={ariaLabel}
      aria-checked={on}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={className}
      onClick={() => {
        if (disabled) return
        onChange && onChange(!on)
      }}
      style={{
        width: w,
        height: h,
        borderRadius: h,
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        background: on ? "var(--primary)" : "var(--surface-2)",
        boxShadow: on
          ? "var(--inset-primary-top), var(--inset-primary-bottom)"
          : "inset 0 0 0 1px var(--border-strong)",
        transition: "background 0.12s",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <div
        style={{
          width: d,
          height: d,
          borderRadius: "50%",
          // Knob is intentionally fixed-white (oklch(1 0 0)) so it reads as a knob
          // on BOTH light and dark backgrounds; --primary-fg flips per mode and
          // would tint with the surface in dark, defeating the knob affordance.
          background: "oklch(1 0 0)",
          position: "absolute",
          top: offset,
          left: on ? w - d - offset : offset,
          transition: "left 0.12s",
          boxShadow: "0 1px 3px oklch(0 0 0 / 0.15)",
        }}
      />
    </button>
  )
}
