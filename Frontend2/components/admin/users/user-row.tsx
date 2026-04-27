"use client"

// Phase 14 Plan 14-03 — Single user row in the Users table.
//
// Verbatim grid template from prototype admin.jsx line 176:
//   28px 40px 2fr 2fr 130px 1fr 100px 90px 28px
//   ↑    ↑    ↑   ↑   ↑     ↑   ↑     ↑    ↑
//   chk  av   name email role  proj  seen status MoreH
//
// Role badge tone (UI-SPEC §Color):
//   - Admin           → tone="danger"
//   - Project Manager → tone="warning"  (mapped from prototype "info" amber)
//   - Member          → tone="neutral"
//
// Status badge tone:
//   - Aktif (is_active=true)    → tone="success"
//   - Pasif (is_active=false)   → tone="neutral"
//
// Last-seen — for v2.0 we render the prototype-style mock (Şimdi / N dk / N sa
// / N gün) using formatRelativeTime when last_active timestamp is supplied;
// otherwise we fall back to "Şimdi"/"Now" for the first row to match prototype
// fixture style.

import * as React from "react"

import {
  Avatar,
  Badge,
  type AvatarUser,
  type BadgeTone,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminUsersT } from "@/lib/i18n/admin-users-keys"
import { formatRelativeTime } from "@/lib/activity-date-format"
import { getInitials } from "@/lib/initials"

import { UserRowActions } from "./user-row-actions"

export interface UserRowUser {
  id: number
  full_name?: string
  email?: string
  is_active?: boolean
  role?: { name?: string } | string | null
  last_active?: string | null
  projects_count?: number
  avatar_color?: number
}

export interface UserRowProps {
  user: UserRowUser
  selected: boolean
  isLast: boolean
  onToggleSelect: (userId: number) => void
}

export const ROW_GRID_TEMPLATE =
  "28px 40px 2fr 2fr 130px 1fr 100px 90px 28px"

function readRoleName(u: UserRowUser): string | null {
  if (!u.role) return null
  if (typeof u.role === "string") return u.role
  if (typeof u.role === "object" && typeof u.role.name === "string") {
    return u.role.name
  }
  return null
}

function roleBadgeTone(name: string | null): BadgeTone {
  const v = (name ?? "").toLowerCase()
  if (v === "admin") return "danger"
  if (v === "project manager" || v === "project_manager" || v === "pm")
    return "warning"
  return "neutral"
}

export function UserRow({
  user,
  selected,
  isLast,
  onToggleSelect,
}: UserRowProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  const fullName = user.full_name || user.email || `#${user.id}`
  const email = user.email || ""
  const roleName = readRoleName(user)
  const isActive = user.is_active !== false

  const avUser: AvatarUser = {
    initials: getInitials(fullName) || (email[0]?.toUpperCase() ?? "?"),
    avColor: user.avatar_color ?? (user.id % 8) + 1,
  }

  // Last seen — prefer the timestamp; fall back to a "now" label for missing.
  const lastSeen = user.last_active
    ? formatRelativeTime(user.last_active, lang)
    : adminUsersT("admin.users.last_seen_now", lang)

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: ROW_GRID_TEMPLATE,
        padding: "10px 16px",
        alignItems: "center",
        gap: 8,
        borderBottom: isLast ? "0" : "1px solid var(--border)",
        fontSize: 12.5,
        background: selected ? "var(--surface-2)" : "transparent",
        transition: "background 0.12s",
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(user.id)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select ${fullName}`}
      />
      <Avatar user={avUser} size={28} />
      <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {fullName}
      </div>
      <div
        style={{
          color: "var(--fg-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {email}
      </div>
      <div>
        {roleName && (
          <Badge size="xs" tone={roleBadgeTone(roleName)}>
            {roleName}
          </Badge>
        )}
      </div>
      <div style={{ fontSize: 11, color: "var(--fg-muted)" }} className="mono">
        {/* Projects count — D-Y1 v2.0: numeric count is sufficient. AvatarStack
            of project leads is a v2.1 candidate (would require list_user_projects
            endpoint; not in CONTEXT scope). */}
        {user.projects_count != null ? String(user.projects_count) : "—"}
      </div>
      <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{lastSeen}</div>
      <div>
        <Badge size="xs" tone={isActive ? "success" : "neutral"} dot>
          {isActive
            ? adminUsersT("admin.users.status_active", lang)
            : adminUsersT("admin.users.status_inactive", lang)}
        </Badge>
      </div>
      <div style={{ position: "relative" }}>
        <UserRowActions user={user} />
      </div>
    </div>
  )
}
