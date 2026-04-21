"use client"

// Collapsible: bordered panel with animated chevron (0deg -> 90deg) and toggleable content
// Ported from New_Frontend/src/primitives.jsx (lines 259-272) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
// Uses ChevronRight from lucide-react (replaces prototype's Icons.ChevronRight).

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Badge } from "./badge"

export interface CollapsibleProps {
  title: string
  badge?: string | number
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Collapsible({
  title,
  badge,
  defaultOpen = false,
  children,
  className,
  style,
}: CollapsibleProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div
      className={className}
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          background: "transparent",
        }}
      >
        <ChevronRight
          size={13}
          style={{
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 0.15s",
            color: "var(--fg-subtle)",
          }}
        />
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
        {badge != null && (
          <Badge size="xs" tone="neutral">
            {badge}
          </Badge>
        )}
      </button>
      {open && (
        <div
          style={{
            padding: "0 14px 14px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
