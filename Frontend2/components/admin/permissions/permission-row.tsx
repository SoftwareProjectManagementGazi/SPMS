"use client"

// Phase 14 Plan 14-04 Task 2 — PermissionRow component (UI-SPEC §Surface E
// + CONTEXT D-A3 multi-defense disabled toggles).
//
// Renders one permission row in the 14×4 matrix grid:
//   - Left column (2fr): permission label
//   - Right 4 columns (100px each): disabled toggle for Admin / PM / Member /
//     Guest, with checked-state derived from permissions-static.ts
//     getPermission() (Plan 14-01 ships the static map).
//
// CRITICAL — every toggle has FOUR defenses against accidental v3.0
// reactivation per threat model T-14-04-01:
//
//   1. `disabled`         — native HTML disabled attr on <input>
//   2. `aria-disabled`    — assistive tech contract
//   3. `title=` tooltip   — "RBAC altyapısı v3.0 sürümünde gelecek"
//   4. NO onChange handler — even if 1-3 are removed, no functional path
//
// Why <input type="checkbox" role="switch"> instead of the existing Toggle
// primitive: the Toggle primitive (components/primitives/toggle.tsx) uses
// `on:boolean` prop and has NO `disabled` / `aria-disabled` / `aria-label`
// support. Extending the shared primitive would break the existing 1-call-
// site contract (Phase 8); building a wrapper here keeps the primitive
// untouched and gives RTL `expect(cb).toBeDisabled()` the standard HTML
// disabled-attribute contract it expects.
//
// gridTemplateColumns "2fr repeat(4, 100px)" is verbatim per UI-SPEC
// §Spacing line 73 — matches the prototype's matrix exactly.

import * as React from "react"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"
import {
  getPermission,
  type AdminRole,
  type PermissionRow as PermRow,
} from "@/lib/admin/permissions-static"

const ROLES: AdminRole[] = ["Admin", "Project Manager", "Member", "Guest"]

interface PermissionRowProps {
  perm: PermRow
}

/**
 * Disabled toggle visual wrapper. Mirrors the primitive Toggle's "sm" size
 * (30×16 px with 12 px knob) but renders a <input type="checkbox"
 * role="switch"> so HTML `disabled` semantics work in RTL `toBeDisabled()`
 * assertions. Cursor:not-allowed + opacity 0.6 communicates the disabled
 * affordance visually.
 */
interface DisabledToggleProps {
  on: boolean
  ariaLabel: string
  title: string
}

function DisabledPermissionToggle({
  on,
  ariaLabel,
  title,
}: DisabledToggleProps) {
  // Verbatim sm dimensions from primitives/toggle.tsx DIMS.sm:
  //   width: 30, height: 16, knob diameter: 12 — only the disabled-state
  //   styling is added here.
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
        cursor: "not-allowed",
      }}
      title={title}
    >
      <input
        type="checkbox"
        role="switch"
        checked={on}
        disabled
        aria-disabled="true"
        aria-label={ariaLabel}
        readOnly
        // No onChange — even if `disabled` is later removed, there is no
        // handler to invoke. Functional defense per T-14-04-01.
        style={{
          // Hide the native checkbox glyph but keep it interactive for
          // assistive tech. opacity:0 + absolute fill keeps the ARIA
          // semantics live; pointerEvents:none guarantees clicks are no-ops
          // even if the disabled attr is stripped externally.
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          margin: 0,
          opacity: 0,
          cursor: "not-allowed",
          pointerEvents: "none",
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
          opacity: 0.6, // disabled visual cue (defense layer 5)
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

export function PermissionRow({ perm }: PermissionRowProps) {
  const { language } = useApp()
  const tooltip = adminRbacT("admin.permissions.toggle_tooltip", language)
  const label = language === "tr" ? perm.label_tr : perm.label_en

  return (
    <div
      data-permission-row-key={perm.key}
      style={{
        display: "grid",
        gridTemplateColumns: "2fr repeat(4, 100px)",
        padding: "10px 16px",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        fontSize: 12.5,
      }}
    >
      <div style={{ color: "var(--fg)" }}>{label}</div>
      {ROLES.map((role) => {
        const state = getPermission(perm.key, role)
        const isOn = state === "granted"
        return (
          <div
            key={role}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <DisabledPermissionToggle
              on={isOn}
              ariaLabel={`${label} — ${role} — disabled`}
              title={tooltip}
            />
          </div>
        )
      })}
    </div>
  )
}
