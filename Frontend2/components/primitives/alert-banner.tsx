"use client"

// AlertBanner: 4 tones (warning/danger/success/info) with color-mix backgrounds
// Ported from New_Frontend/src/primitives.jsx (lines 275-287) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
// Per CONVERSION RULE 7-8: color-mix(in oklch, ...) expressions stay as inline style={}
// -- not lowered to Tailwind arbitrary values.
//
// Tone -> CSS variable mapping (matches prototype exactly):
//   danger  -> --priority-critical
//   success -> --status-done
//   info    -> --status-progress
//   warning -> --status-review (default)

import * as React from "react"

export type AlertTone = "warning" | "danger" | "success" | "info"

export interface AlertBannerProps {
  tone?: AlertTone
  icon?: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const TONE_VARS: Record<AlertTone, string> = {
  danger: "--priority-critical",
  success: "--status-done",
  info: "--status-progress",
  warning: "--status-review",
}

export function AlertBanner({
  tone = "warning",
  icon,
  children,
  action,
  className,
  style,
}: AlertBannerProps) {
  const colorVar = TONE_VARS[tone] || TONE_VARS.warning
  return (
    <div
      className={className}
      style={{
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12.5,
        borderRadius: "var(--radius-sm)",
        background: `color-mix(in oklch, var(${colorVar}) 10%, var(--surface))`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklch, var(${colorVar}) 25%, transparent)`,
        color: `var(${colorVar})`,
        ...style,
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  )
}
