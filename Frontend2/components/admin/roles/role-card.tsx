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

import * as React from "react"
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
  userCount: number
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
              D line 379 — explicit removal is the prototype improvement). */}
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
              {userCount}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
