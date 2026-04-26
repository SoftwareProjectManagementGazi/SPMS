"use client"

// Avatar: initials on colored bg using --av-* tokens
// Ported from New_Frontend/src/primitives.jsx (lines 6-20) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
//
// Phase 13 Plan 13-01 Task 2 (D-D4): added optional `href` prop. When supplied
// the avatar renders inside a Next.js <Link> with `e.stopPropagation()` on the
// onClick so consumer row-click handlers (e.g. MTTaskRow → /tasks/[id]) keep
// working for clicks NOT on the avatar. Backwards compatible — existing
// 19 consumer call sites remain valid (RESEARCH §Pattern 3 enumeration).

import * as React from "react"
import Link from "next/link"

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
  /** Phase 13 D-D4 — when set, the avatar becomes a Next.js Link. */
  href?: string
  /** Optional click handler. When `href` is set, `e.stopPropagation()` is
   *  called BEFORE the user handler so parent row clicks don't fire too. */
  onClick?: (e: React.MouseEvent) => void
}

export function Avatar({
  user,
  size = 28,
  ring = false,
  className,
  style,
  href,
  onClick,
}: AvatarProps) {
  if (!user) return null

  const visual = (
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

  if (!href) {
    if (!onClick) return visual
    // No href but onClick supplied — emit a clickable wrapper that preserves
    // visual styling. Rare path; existing consumers don't pass onClick.
    return (
      <div
        onClick={onClick}
        style={{ display: "inline-block", lineHeight: 0, cursor: "pointer" }}
      >
        {visual}
      </div>
    )
  }

  return (
    <Link
      href={href}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      style={{
        display: "inline-block",
        borderRadius: "50%",
        lineHeight: 0,
      }}
    >
      {visual}
    </Link>
  )
}
