"use client"

// Tabs: tab bar with active tab 2px solid var(--primary) bottom border
// Ported from New_Frontend/src/primitives.jsx (lines 157-181) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"
import { Badge } from "./badge"

export type TabsSize = "sm" | "md" | "lg"

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
}

export interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  size?: TabsSize
  className?: string
  style?: React.CSSProperties
}

const PAD_MAP: Record<TabsSize, string> = {
  sm: "6px 10px",
  md: "8px 14px",
  lg: "10px 16px",
}

const FONT_MAP: Record<TabsSize, number> = {
  sm: 12,
  md: 13,
  lg: 14,
}

export function Tabs({
  tabs,
  active,
  onChange,
  size = "md",
  className,
  style,
}: TabsProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: 2,
        borderBottom: "1px solid var(--border)",
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: PAD_MAP[size],
              fontSize: FONT_MAP[size],
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--fg)" : "var(--fg-muted)",
              borderBottom: isActive
                ? "2px solid var(--primary)"
                : "2px solid transparent",
              marginBottom: -1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.12s",
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && (
              <Badge size="xs" tone={isActive ? "primary" : "neutral"}>
                {tab.badge}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}
