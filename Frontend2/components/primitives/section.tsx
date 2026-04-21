"use client"

// Section: heading with optional subtitle and action slot
// Ported from New_Frontend/src/primitives.jsx (lines 184-195) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"

export interface SectionProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Section({
  title,
  subtitle,
  action,
  children,
  className,
  style,
}: SectionProps) {
  return (
    <div className={className} style={style}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--fg)",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-muted)",
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
