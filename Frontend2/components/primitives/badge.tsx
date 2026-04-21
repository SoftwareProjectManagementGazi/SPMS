"use client"

// Badge: 7 tones (neutral/primary/success/warning/danger/info/mono) with color-mix bg
// Ported from New_Frontend/src/primitives.jsx (lines 46-70) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
// Per CONVERSION RULE 8: color-mix() expressions stay as inline style={} -- not Tailwind.

import * as React from "react"

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "mono"

export type BadgeSize = "xs" | "sm"

export interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  size?: BadgeSize
  dot?: boolean
  className?: string
  style?: React.CSSProperties
}

interface ToneStyle {
  bg: string
  fg: string
  bd: string
}

const TONES: Record<BadgeTone, ToneStyle> = {
  neutral: {
    bg: "var(--surface-2)",
    fg: "var(--fg-muted)",
    bd: "var(--border)",
  },
  primary: {
    bg: "color-mix(in oklch, var(--primary) 12%, transparent)",
    fg: "var(--primary)",
    bd: "color-mix(in oklch, var(--primary) 25%, transparent)",
  },
  success: {
    bg: "color-mix(in oklch, var(--status-done) 15%, transparent)",
    fg: "var(--status-done)",
    bd: "color-mix(in oklch, var(--status-done) 30%, transparent)",
  },
  warning: {
    bg: "color-mix(in oklch, var(--status-review) 18%, transparent)",
    fg: "color-mix(in oklch, var(--status-review) 85%, var(--fg))",
    bd: "color-mix(in oklch, var(--status-review) 35%, transparent)",
  },
  danger: {
    bg: "color-mix(in oklch, var(--priority-critical) 14%, transparent)",
    fg: "var(--priority-critical)",
    bd: "color-mix(in oklch, var(--priority-critical) 30%, transparent)",
  },
  info: {
    bg: "color-mix(in oklch, var(--status-progress) 13%, transparent)",
    fg: "var(--status-progress)",
    bd: "color-mix(in oklch, var(--status-progress) 25%, transparent)",
  },
  mono: {
    bg: "var(--accent)",
    fg: "var(--accent-fg)",
    bd: "transparent",
  },
}

const SIZES: Record<BadgeSize, React.CSSProperties> = {
  xs: { padding: "1px 6px", fontSize: 10.5, height: 18 },
  sm: { padding: "2px 8px", fontSize: 11.5, height: 20 },
}

export function Badge({
  children,
  tone = "neutral",
  size = "sm",
  dot,
  className,
  style,
}: BadgeProps) {
  const s = TONES[tone] || TONES.neutral
  const sz = SIZES[size]
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        ...sz,
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        boxShadow: `inset 0 0 0 1px ${s.bd}`,
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: s.fg,
          }}
        />
      )}
      {children}
    </span>
  )
}
