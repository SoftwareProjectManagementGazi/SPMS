"use client"

// SegmentedControl: radio-like button group with active shadow and inset-top
// Ported from New_Frontend/src/primitives.jsx (lines 243-256) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
// Active option uses var(--shadow-sm), var(--inset-top) for the raised look.

import * as React from "react"

export type SegmentedSize = "xs" | "sm"

export interface SegmentedOption {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface SegmentedControlProps {
  options: SegmentedOption[]
  value: string
  onChange: (id: string) => void
  size?: SegmentedSize
  className?: string
  style?: React.CSSProperties
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = "sm",
  className,
  style,
}: SegmentedControlProps) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        background: "var(--surface-2)",
        padding: 2,
        borderRadius: 6,
        boxShadow: "inset 0 0 0 1px var(--border)",
        ...style,
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              padding: size === "xs" ? "3px 8px" : "4px 10px",
              fontSize: size === "xs" ? 11 : 11.5,
              fontWeight: 600,
              borderRadius: 4,
              background: isActive ? "var(--surface)" : "transparent",
              color: isActive ? "var(--fg)" : "var(--fg-muted)",
              boxShadow: isActive
                ? "var(--shadow-sm), var(--inset-top)"
                : "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "background 0.12s, color 0.12s, box-shadow 0.12s",
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
