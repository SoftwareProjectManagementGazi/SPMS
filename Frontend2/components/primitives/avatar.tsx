"use client"

// Avatar: profile photo when available, otherwise initials on colored bg
// using --av-* tokens. Ported from New_Frontend/src/primitives.jsx (lines 6-20).
// Per D-01: no shadcn/ui. Per D-02: prototype token names used directly.
//
// Phase 13 Plan 13-01 Task 2 (D-D4): added optional `href` prop. When supplied
// the avatar renders inside a Next.js <Link> with `e.stopPropagation()` on the
// onClick so consumer row-click handlers (e.g. MTTaskRow → /tasks/[id]) keep
// working for clicks NOT on the avatar.
//
// Profile-photo support: `avatarUrl` carries either a fully qualified URL
// (e.g. http://localhost:8000/static/uploads/avatars/xxx.jpg), a relative
// `uploads/…` path (resolved internally against NEXT_PUBLIC_BACKEND_URL via
// resolveAvatarUrl), null/undefined, or the sentinel `/placeholder.svg`
// (auth-service returns this when the user has not uploaded a photo). Empty
// / placeholder values render initials as before. Failed network loads also
// fall back to initials via `onError`.

import * as React from "react"
import Link from "next/link"
import { resolveAvatarUrl } from "@/services/auth-service"

export interface AvatarUser {
  initials: string
  avColor?: number
  /** Profile photo URL — raw `uploads/…` or fully qualified. Falsy / placeholder
   *  → render initials. Plumb whatever the backend ships; the primitive resolves. */
  avatarUrl?: string | null
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

/** True when the supplied URL is a real photo (not null, empty, or the
 *  auth-service placeholder sentinel). */
function hasPhoto(rawUrl?: string | null): boolean {
  if (!rawUrl) return false
  if (rawUrl === "/placeholder.svg") return false
  return true
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
  // Failed-image flag — flipped by the <img onError> so a 404/broken URL
  // gracefully falls back to the initials tile within the same render tree.
  const [imgFailed, setImgFailed] = React.useState(false)

  // Reset the failure flag when the URL changes (e.g. user uploads a new
  // photo). Without this, a one-time 404 would permanently hide future
  // photos for the same Avatar instance.
  React.useEffect(() => {
    setImgFailed(false)
  }, [user?.avatarUrl])

  if (!user) return null

  const showPhoto = hasPhoto(user.avatarUrl) && !imgFailed
  const resolvedUrl = showPhoto ? resolveAvatarUrl(user.avatarUrl) : null
  // resolveAvatarUrl can still return '/placeholder.svg' (when input is null),
  // but we already gated on hasPhoto so resolvedUrl is a real URL when set.

  const baseTile: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    boxShadow: ring
      ? "0 0 0 2px var(--surface), 0 0 0 4px var(--primary)"
      : "inset 0 0 0 1px oklch(0 0 0 / 0.08)",
    ...style,
  }

  const visual = showPhoto ? (
    <div className={className} style={baseTile}>
      <img
        src={resolvedUrl!}
        alt={user.initials}
        onError={() => setImgFailed(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  ) : (
    <div
      className={className}
      style={{
        ...baseTile,
        background: `var(--av-${user.avColor || 1})`,
        color: "var(--primary-fg)",
        fontSize: size * 0.4,
        fontWeight: 600,
        letterSpacing: -0.3,
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
