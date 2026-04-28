"use client"

// Phase 14 Plan 14-04 Task 1 — RoleCard component (UI-SPEC §Surface D).
//
// Renders ONE of the 4 system role cards (Admin / Project Manager / Member /
// Guest). Card descriptions are REWRITTEN per CONTEXT D-A5 to reflect the
// v2.0 reality (Admin = system-wide; PM/Member = project-scoped via
// Team.leader_id). Replaces prototype's misleading "all roles are global"
// implication.
//
// EXPLICIT PER UI-SPEC §Surface D line 379: NO "Düzenle" button on system-role
// cards. The card is information-only; granular RBAC editing is deferred to
// v3.0 (D-A2..A4). Removing the button entirely is a deliberate prototype
// improvement — see CONTEXT D-A4.
//
// Disabled state (Guest card per D-A5):
//   1. cursor: not-allowed
//   2. opacity: 0.6
//   3. v3.0 Badge tone="warning" in card header
// Multiple defenses against accidental v3.0 reactivation per threat model
// T-14-04-02.
//
// Plan 14-17 (Cluster E gap closure) — TWO additional concerns wired here:
//
//   A. Null-safe count rendering. The bare `{userCount}` JSX expression
//      stringifies undefined → "" (silent invisibility) and NaN → "NaN"
//      (visible bug). Number.isFinite() gates the render so the em-dash
//      placeholder shows during loading or after a malformed upstream
//      response — NEVER "undefined" / "NaN" / "=".
//
//   B. Cross-tab navigation affordance ("Görüntüle" Link). On non-disabled
//      cards, a Link navigates to /admin/users?role=<id> with the role
//      filter pre-applied (D-A5 cross-tab data consistency). Disabled cards
//      (Guest) intentionally omit the affordance — no useless navigation
//      to an empty filter view in v2.0.

import * as React from "react"
import Link from "next/link"
import { Card, Badge } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

export interface RoleCardProps {
  id: "admin" | "pm" | "member" | "guest"
  icon: React.ReactNode
  iconBgColor: string // e.g., "color-mix(in oklch, var(--priority-critical) 18%, transparent)"
  iconColor: string // e.g., "var(--priority-critical)"
  name: string
  description: string
  /**
   * Per-role user count. Plan 14-17 — accepted as `number | undefined` so the
   * caller can pass `undefined` while the upstream useAdminUsers query is
   * still loading; the component renders an em-dash fallback in that case.
   * NaN is also tolerated and rendered as the em-dash.
   */
  userCount: number | undefined
  /**
   * Visually disable the card (cursor:not-allowed + opacity 0.6). Used for
   * the Guest card per D-A5 — placeholder for the future v3.0 read-only role.
   */
  disabled?: boolean
  /** Render the v3.0 Badge in the card header (tone="warning"). */
  v3Badge?: boolean
}

export function RoleCard({
  id,
  icon,
  iconBgColor,
  iconColor,
  name,
  description,
  userCount,
  disabled,
  v3Badge,
}: RoleCardProps) {
  const { language } = useApp()

  // Plan 14-17 — null-safe count rendering. Number.isFinite filters out
  // undefined / NaN / Infinity in one expression. The em-dash ("—") is the
  // contractual loading/error placeholder per UI-SPEC §Empty States.
  const safeCount = Number.isFinite(userCount) ? (userCount as number) : "—"

  return (
    <Card
      data-role-card-id={id}
      padding={18}
      style={{
        cursor: disabled ? "not-allowed" : "default",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {v3Badge && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <Badge tone="warning" size="xs">
            {adminRbacT("admin.roles.v3_badge_label", language)}
          </Badge>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Icon column — 34×34 px, radius 8 (verbatim prototype line 215). */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: iconBgColor,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {/* Title (15/600 verbatim prototype line 218) */}
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--fg)",
            }}
          >
            {name}
          </div>

          {/* Description (12.5/--fg-muted/lineHeight 1.5 — D-A5 reality copy) */}
          <div
            style={{
              fontSize: 12.5,
              color: "var(--fg-muted)",
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>

          {/* User count footer (NO "Düzenle" button per D-A5 + UI-SPEC §Surface
              D line 379 — explicit removal is the prototype improvement).
              Plan 14-17 — null-safe `safeCount` (em-dash on undefined / NaN). */}
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--fg-muted)",
              marginTop: 8,
            }}
          >
            {adminRbacT("admin.roles.users_count_label", language)}:{" "}
            <span className="mono" style={{ color: "var(--fg)" }}>
              {safeCount}
            </span>
          </div>

          {/* Plan 14-17 (Cluster E) — Görüntüle cross-tab navigation
              affordance. Wired only when the card is NOT disabled — Guest
              has no real users in v2.0 so the link would land on an empty
              filtered table (UX antipattern). Per D-A5 this is a
              navigation aid, NOT a CRUD trigger; D-A4 RBAC defer remains
              respected (no "Düzenle" / no permission editing). */}
          {!disabled && (
            <Link
              href={`/admin/users?role=${id}`}
              data-testid={`role-card-view-link-${id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--status-progress)",
                textDecoration: "none",
              }}
            >
              {adminRbacT("admin.roles.view_users_link_label", language)} →
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
