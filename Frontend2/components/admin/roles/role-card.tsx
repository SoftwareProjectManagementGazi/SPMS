"use client"

// Phase 14 Plan 14-04 (placeholder) → Phase 15 Plan 15-10 (RBAC active)
// — RoleCard component.
//
// Layer 7 of D-2.7 atomic 7-layer placeholder uplift: the Guest card is
// no longer disabled with the deferred-version Badge. The new contract:
//   - `disabled` prop REMOVED from this component (was the cursor:not-allowed
//     + opacity 0.6 visual layer 7; Phase 14 14-04 used it solely for Guest).
//   - `v3Badge` prop REMOVED — the Sistem badge takes its place for
//     is_system_role=true.
//   - `isSystemRole` prop ADDED — drives the Sistem badge in the card
//     header AND hides Düzenle/Sil action buttons.
//   - `onEdit` / `onDelete` props ADDED for Plan 15-11 custom-role CRUD;
//     they remain optional and disabled-from-rendering for system roles.
//
// Plan 14-17 (Cluster E gap closure) — null-safe count rendering AND
// "Görüntüle" cross-link are preserved verbatim. The Görüntüle link now
// renders for all cards including the previous Guest disabled case (the
// disabled-suppress conditional is gone; the empty-count case is still
// useless UX, but the truthful behavior is "Guest with 0 users → still
// link, just lands on an empty filter").

import * as React from "react"
import Link from "next/link"
import { Card, Badge, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

export interface RoleCardProps {
  /**
   * Role identifier — used as the data attribute hook + the Görüntüle link
   * query param. For system roles this is the lowercase short name
   * ("admin" / "pm" / "member" / "guest"); for custom roles (Plan 15-11)
   * the numeric role ID is acceptable.
   */
  id: string
  icon: React.ReactNode
  iconBgColor: string
  iconColor: string
  name: string
  description: string
  /**
   * Per-role user count. Plan 14-17 — accepted as `number | undefined` so
   * the caller can pass `undefined` while the upstream useAdminUsers query
   * is still loading; the component renders an em-dash fallback in that
   * case. NaN is also tolerated.
   */
  userCount: number | undefined
  /**
   * Phase 15 Plan 15-10 — Sistem badge + hides Düzenle/Sil action buttons.
   * The card LOOKS active (no opacity 0.6, no cursor:not-allowed); only the
   * mutation affordances are hidden.
   */
  isSystemRole?: boolean
  /** Plan 15-11 — fires when the user clicks Düzenle on a custom role. */
  onEdit?: () => void
  /** Plan 15-11 — fires when the user clicks Sil on a custom role. */
  onDelete?: () => void
}

export function RoleCard({
  id,
  icon,
  iconBgColor,
  iconColor,
  name,
  description,
  userCount,
  isSystemRole,
  onEdit,
  onDelete,
}: RoleCardProps) {
  const { language } = useApp()

  // Plan 14-17 — null-safe count rendering. Number.isFinite filters out
  // undefined / NaN / Infinity in one expression. The em-dash ("—") is the
  // contractual loading/error placeholder per UI-SPEC §Empty States.
  const safeCount = Number.isFinite(userCount) ? (userCount as number) : "—"

  return (
    <Card data-role-card-id={id} padding={18}>
      {/* Plan 15-10 layer 7 — Sistem badge replaces the deferred warning
          Badge. tone="neutral" + size="xs" matches the per-row scope badge
          style (visual consistency across the RBAC surface). */}
      {isSystemRole && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <Badge tone="neutral" size="xs">
            {adminRbacT("admin.roles.system_badge_label", language)}
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

          {/* Description (12.5/--fg-muted/lineHeight 1.5) */}
          <div
            style={{
              fontSize: 12.5,
              color: "var(--fg-muted)",
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>

          {/* User count footer (Plan 14-17 — null-safe `safeCount`). */}
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
              affordance. Plan 15-10 — wired for ALL cards now (including
              Guest); the empty-filter UX for Guest with 0 users is
              acceptable since the role is now active. */}
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

          {/* Plan 15-11 — Düzenle / Sil buttons for CUSTOM roles only.
              System roles (is_system_role=true) hide these buttons; the
              backend additionally rejects PATCH/DELETE on system roles
              with 422 SYSTEM_ROLE_PROTECTED (defense in depth). */}
          {!isSystemRole && (onEdit || onDelete) && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 8,
              }}
            >
              {onEdit && (
                <Button size="xs" variant="ghost" onClick={onEdit}>
                  {language === "tr" ? "Düzenle" : "Edit"}
                </Button>
              )}
              {onDelete && (
                <Button size="xs" variant="ghost" onClick={onDelete}>
                  {language === "tr" ? "Sil" : "Delete"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
