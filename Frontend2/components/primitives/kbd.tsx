"use client"

// Kbd: keyboard shortcut hint with mono class and inset border shadow
// Ported from New_Frontend/src/primitives.jsx (lines 145-154) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"
import { cn } from "@/lib/utils"

export interface KbdProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Kbd({ children, className, style }: KbdProps) {
  return (
    <span
      className={cn("mono", className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        padding: "0 5px",
        minWidth: 18,
        justifyContent: "center",
        borderRadius: 4,
        fontSize: 10.5,
        background: "var(--surface-2)",
        color: "var(--fg-muted)",
        boxShadow: "inset 0 0 0 1px var(--border), 0 1px 0 var(--border)",
        ...style,
      }}
    >
      {children}
    </span>
  )
}
