"use client"

// Phase 14 Plan 14-04 Task 2 — PermissionMatrixCard component
// (UI-SPEC §Surface E + CONTEXT D-A3).
//
// Renders the 14 × 4 disabled toggle matrix in a Card with:
//   - Header: title + subtitle + v3.0 Badge tone="warning" + DISABLED
//     "Kopyala" button (tooltip "v3.0'da gelecek")
//   - Sticky column-header row showing role names (Admin / PM / Member /
//     Guest), 100 px each, group label below
//   - Group sections with uppercase labels (Projects / Tasks / Members &
//     Roles / Workflow) per UI-SPEC §Spacing line 75
//   - 14 PermissionRow instances grouped by perm.key prefix
//
// Data source: lib/admin/permissions-static.ts (Plan 14-01 — 14×4 tri-state
// matrix). NO new endpoint. Tri-state is "granted" | "denied" | "n/a".
//
// Multi-defense per threat model T-14-04-01:
//   - Card header v3.0 Badge (visual cue 1)
//   - Kopyala button disabled + tooltip (defense 2)
//   - Every PermissionRow toggle disabled + aria-disabled + tooltip + no
//     handler (defenses 3-6)
//   - Page-level AlertBanner on the parent page (defense 7)

import * as React from "react"
import { Copy } from "lucide-react"

import { Card, Badge, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"
import {
  PERMISSIONS,
  type PermissionRow as PermRow,
  type PermissionKey,
} from "@/lib/admin/permissions-static"

import { PermissionRow } from "./permission-row"

// Group permissions per UI-SPEC §Surface E lines 400-417. The PermissionKey
// strings encode the group natively; we partition them at render-time.
interface PermissionGroup {
  labelKey:
    | "admin.permissions.group_projects"
    | "admin.permissions.group_tasks"
    | "admin.permissions.group_members_roles"
    | "admin.permissions.group_workflow"
  keys: PermissionKey[]
}

const GROUPS: PermissionGroup[] = [
  {
    labelKey: "admin.permissions.group_projects",
    keys: ["create_project", "edit_project", "delete_project", "archive_project"],
  },
  {
    labelKey: "admin.permissions.group_tasks",
    keys: ["create_task", "change_assignee", "change_status", "delete_task"],
  },
  {
    labelKey: "admin.permissions.group_members_roles",
    keys: ["invite_user", "assign_role", "remove_member"],
  },
  {
    labelKey: "admin.permissions.group_workflow",
    keys: ["edit_workflow", "edit_lifecycle", "publish_template"],
  },
]

const COLUMN_HEADER_ROLES = [
  "Admin",
  "Project Manager",
  "Member",
  "Guest",
] as const

export function PermissionMatrixCard() {
  const { language } = useApp()
  const copyTooltip = adminRbacT("admin.permissions.copy_tooltip", language)

  // Build a key → row lookup so each group can pull its rows in declared
  // order (avoids relying on PERMISSIONS array index to match group order).
  const rowByKey = React.useMemo(() => {
    const map = new Map<PermissionKey, PermRow>()
    for (const row of PERMISSIONS) map.set(row.key, row)
    return map
  }, [])

  return (
    <Card padding={0}>
      {/* Header — title + subtitle + v3.0 Badge + disabled Kopyala button. */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
          {adminRbacT("admin.permissions.card_title", language)}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>
          {adminRbacT("admin.permissions.card_subtitle", language)}
        </div>
        {/* v3.0 Badge — defense layer 1 in card header (T-14-04-01). */}
        <Badge tone="warning" size="xs">
          {adminRbacT("admin.permissions.v3_badge_label", language)}
        </Badge>
        <div style={{ flex: 1 }} />
        {/* Kopyala — visually present per prototype line 283 but DISABLED
            per D-A3 (defense layer 2). */}
        <Button
          size="xs"
          variant="secondary"
          icon={<Copy size={12} aria-hidden="true" />}
          disabled
          title={copyTooltip}
          aria-label={`${adminRbacT(
            "admin.permissions.copy_button",
            language,
          )} — disabled`}
        >
          {adminRbacT("admin.permissions.copy_button", language)}
        </Button>
      </div>

      {/* Sticky column-header row (role names — Admin / PM / Member / Guest).
          gridTemplateColumns matches PermissionRow exactly. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr repeat(4, 100px)",
          padding: "10px 16px",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
          fontSize: 11.5,
          fontWeight: 600,
          color: "var(--fg-muted)",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <div>
          {adminRbacT("admin.permissions.column_permission", language)}
        </div>
        {COLUMN_HEADER_ROLES.map((role) => (
          <div key={role} style={{ textAlign: "center" }}>
            {role}
          </div>
        ))}
      </div>

      {/* Group sections — group label + permission rows. */}
      {GROUPS.map((group) => (
        <React.Fragment key={group.labelKey}>
          <div
            style={{
              padding: "10px 16px",
              background: "var(--bg-2)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-subtle)",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {adminRbacT(group.labelKey, language)}
          </div>
          {group.keys.map((permKey) => {
            const row = rowByKey.get(permKey)
            if (!row) return null
            return <PermissionRow key={permKey} perm={row} />
          })}
        </React.Fragment>
      ))}
    </Card>
  )
}
