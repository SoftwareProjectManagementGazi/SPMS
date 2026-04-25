"use client"

// Avatar: initials on colored bg using --av-* tokens
// Ported from New_Frontend/src/primitives.jsx (lines 6-20) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.

import * as React from "react"

export interface AvatarUser {
  initials: string
  avColor?: number
}

export interface AvatarProps {
  user: AvatarUser | null
  size?: number
  ring?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Avatar({
  user,
  size = 28,
  ring = false,
  className,
  style,
}: AvatarProps) {
  if (!user) return null
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `var(--av-${user.avColor || 1})`,
        color: "var(--primary-fg)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 600,
        letterSpacing: -0.3,
        flexShrink: 0,
        boxShadow: ring
          ? "0 0 0 2px var(--surface), 0 0 0 4px var(--primary)"
          : "inset 0 0 0 1px oklch(0 0 0 / 0.08)",
        ...style,
      }}
    >
      {user.initials}
    </div>
  )
}
