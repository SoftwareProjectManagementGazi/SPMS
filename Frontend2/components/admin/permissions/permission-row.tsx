"use client"

// Phase 14 Plan 14-04 (placeholder) → Phase 15 Plan 15-10 (RBAC active)
// — PermissionRow component.
//
// Layer 1 of D-2.7 atomic 7-layer placeholder uplift: the toggle is now
// INTERACTIVE (D-1.12 auto-save per cell mutation). The previous
// `disabled` + `aria-disabled="true"` + tooltip + missing onChange defenses
// are all removed for the general case. Only Admin (D-1.5 super-role visual
// readonly) and Guest (D-2.4 read-only system role) columns retain
// `disabled` so their toggles can't be flipped — the backend
// UpdatePermissionMatrixUseCase rejects Admin writes with 422
// SYSTEM_ROLE_PROTECTED as a defense-in-depth fallback.
//
// Per-row scope badge (D-3.4 + PATTERNS §16): PermissionScopeBadge inline
// next to the perm label so admins know whether the perm gates a
// system-level (admin.users.*) or project-level (task.*) action. Drives
// the 2-tier check transparency the UAT highlighted.
//
// Auto-save (D-1.12 + Pattern 3 optimistic): onChange invokes
// useUpdatePermissionCell.mutate(...) which uses TanStack Query v5's
// onMutate (cancel + snapshot + setQueryData) → onSuccess (Toast) →
// onError (revert + Toast) → onSettled (invalidate) lifecycle. The cell
// flips immediately on click and only reverts if the backend rejects.
//
// Why <input type="checkbox" role="switch"> instead of the existing Toggle
// primitive: identical to Phase 14 14-04's reasoning (the Toggle primitive
// has no `disabled` / `aria-label` / `onChange` callsite contract, and
// extending it would break the existing Phase 8 single-callsite contract).
// We keep the same wrapper here and add `onChange` for the active case.

import * as React from "react"

import { useApp } from "@/context/app-context"
import { useUpdatePermissionCell } from "@/hooks/use-update-permission-cell"
import type {
  MatrixCell,
  Permission,
  Role,
} from "@/services/admin-rbac-service"

import { PermissionScopeBadge } from "./permission-scope-badge"

export interface PermissionRowProps {
  /**
   * Permission row from /admin/permissions/matrix. Includes `scope`
   * ("system" | "project") which drives the inline PermissionScopeBadge.
   */
  permission: Permission
  /**
   * Role columns from /admin/permissions/matrix. Order is preserved as
   * returned by the backend (Plan 15-06 sorts: Admin first, then PM,
   * Member, Guest, then custom roles alphabetically).
   */
  roles: Role[]
  /**
   * Global matrix cells. The component filters to the (role.id,
   * permission.id) intersection per cell to determine `granted`.
   */
  cells: MatrixCell[]
}

interface ToggleSwitchProps {
  on: boolean
  disabled: boolean
  ariaLabel: string
  title?: string
  onChange: (next: boolean) => void
}

/**
 * Visual switch wrapper. Renders the same 30×16 px sm-size geometry as
 * Phase 14 14-04 disabled toggle so the matrix grid spacing is unchanged
 * (verbatim per UI-SPEC §Spacing line 73). Only the disabled-styling
 * (opacity 0.6 + cursor:not-allowed) is conditional now.
 */
function PermissionToggleSwitch({
  on,
  disabled,
  ariaLabel,
  title,
  onChange,
}: ToggleSwitchProps) {
  const w = 30
  const h = 16
  const d = 12
  const offset = (h - d) / 2
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        width: w,
        height: h,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      title={title}
    >
      <input
        type="checkbox"
        role="switch"
        checked={on}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          margin: 0,
          opacity: 0,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: h,
          background: on ? "var(--primary)" : "var(--surface-2)",
          boxShadow: on
            ? "var(--inset-primary-top), var(--inset-primary-bottom)"
            : "inset 0 0 0 1px var(--border-strong)",
          opacity: disabled ? 0.6 : 1,
          transition: "background 0.12s",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          width: d,
          height: d,
          borderRadius: "50%",
          background: "oklch(1 0 0)",
          position: "absolute",
          top: offset,
          left: on ? w - d - offset : offset,
          boxShadow: "0 1px 2px oklch(0 0 0 / 0.15)",
          pointerEvents: "none",
        }}
      />
    </span>
  )
}

export function PermissionRow({ permission, roles, cells }: PermissionRowProps) {
  const { language } = useApp()
  const updateCell = useUpdatePermissionCell()

  const label =
    (language === "tr" ? permission.label_tr : permission.label_en) ||
    permission.key

  // Derive granted state per role from the global cells array. O(roles ×
  // cells) per render is fine for the typical ~26 perms × ~6 roles ≈ 156
  // cells matrix size — TanStack Query v5 memoizes the data slot anyway.
  const isGranted = (roleId: number, permId: number): boolean =>
    cells.some(
      (c) => c.role_id === roleId && c.permission_id === permId && c.granted,
    )

  return (
    <div
      data-permission-row-key={permission.key}
      style={{
        display: "grid",
        gridTemplateColumns: "2fr repeat(4, 100px)",
        padding: "10px 16px",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        fontSize: 12.5,
      }}
    >
      <div
        style={{
          color: "var(--fg)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{label}</span>
        <PermissionScopeBadge scope={permission.scope} />
      </div>
      {roles.map((role) => {
        const roleNameLower = role.name.toLowerCase()
        // D-1.5 super-role visual readonly: Admin's row is always granted
        // visually, but the toggle is disabled (backend rejects Admin
        // writes with 422 SYSTEM_ROLE_PROTECTED as defense-in-depth).
        const isAdminColumn = roleNameLower === "admin"
        // D-2.4 Guest is a read-only system role — UI prevents toggle
        // (backend also enforces is_system_role protection).
        const isGuestColumn = roleNameLower === "guest"
        const granted = isGranted(role.id, permission.id)
        // Admin column is always shown as granted (D-1.5 super-role), even
        // if the cells array does not include the cell explicitly (the
        // backend may omit Admin cells under a "wildcard" model).
        const visualOn = isAdminColumn ? true : granted
        // Disabled when: Admin (D-1.5), Guest (D-2.4), or mid-mutation
        // (prevent re-clicks while the optimistic update is in-flight).
        const disabled =
          isAdminColumn || isGuestColumn || updateCell.isPending
        return (
          <div
            key={role.id}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <PermissionToggleSwitch
              on={visualOn}
              disabled={disabled}
              ariaLabel={`${permission.key} for ${role.name}`}
              onChange={(next) => {
                // Defense in depth — even if `disabled` is stripped, we
                // bail before firing the mutation for system-role columns.
                if (isAdminColumn || isGuestColumn) return
                updateCell.mutate({
                  roleId: role.id,
                  permKey: permission.key,
                  granted: next,
                })
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
