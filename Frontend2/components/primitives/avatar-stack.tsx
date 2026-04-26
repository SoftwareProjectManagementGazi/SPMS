"use client"

// AvatarStack: overlapping avatars with -6px negative margin and +N overflow
// Ported from New_Frontend/src/primitives.jsx (lines 22-43) -- exact styling preserved.
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
//
// Phase 13 Plan 13-03 Task 1 (D-D4): AvatarStackUser carries an optional
// `href` so each inner Avatar can opt in to the Plan 13-01 Link wrapper
// (per-user click-to-profile). The `+N` overflow chip below is intentionally
// a styled <div> — NOT an Avatar instance — so it stays non-clickable per
// 13-RESEARCH §Pattern 3 (overflow chip MUST NOT navigate).

import * as React from "react"
import { Avatar, type AvatarUser } from "./avatar"

export interface AvatarStackUser extends AvatarUser {
  id: string | number
  /** Phase 13 D-D4 — when set, the per-user Avatar becomes a Next.js Link. */
  href?: string
}

export interface AvatarStackProps {
  users: AvatarStackUser[]
  max?: number
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function AvatarStack({
  users,
  max = 4,
  size = 22,
  className,
  style,
}: AvatarStackProps) {
  const shown = users.slice(0, max)
  const extra = users.length - max
  return (
    <div
      className={className}
      style={{ display: "inline-flex", ...style }}
    >
      {shown.map((u, i) => (
        <div
          key={u.id}
          style={{
            marginLeft: i === 0 ? 0 : -6,
            position: "relative",
            zIndex: 10 - i,
          }}
        >
          <Avatar
            user={u}
            size={size}
            href={u.href}
            style={{ boxShadow: "0 0 0 2px var(--surface)" }}
          />
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            marginLeft: -6,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "var(--surface-2)",
            color: "var(--fg-muted)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.38,
            fontWeight: 600,
            boxShadow:
              "0 0 0 2px var(--surface), inset 0 0 0 1px var(--border)",
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}
