"use client"

// Phase 14 Plan 14-04 Task 1 — NewRolePlaceholderCard (UI-SPEC §Surface D
// rows 387-389 + CONTEXT D-A4 disabled-placeholder semantics).
//
// "Yeni rol oluştur" 5th card in the Roller grid. Visually mimics the
// prototype's dashed-border card (admin.jsx line 232) but with deferral
// affordances:
//
//   1. border: 1px dashed var(--border-strong)  (visual cue)
//   2. cursor: not-allowed                       (interaction cue)
//   3. title=tooltip "Granüler RBAC v3.0…"       (hover hint)
//   4. NO onClick handler                        (functional defense)
//   5. Subtitle "v3.0'da gelecek"                (textual cue)
//
// Multiple defenses per threat model T-14-04-02 — a future v3.0 contributor
// would have to remove ALL FIVE before accidentally reactivating the
// "create new role" path.
//
// minHeight: 130 px is the verbatim prototype value (UI-SPEC §Spacing
// line 72) — keeps the placeholder visually equivalent to a populated
// RoleCard at default density.

import * as React from "react"
import { Plus } from "lucide-react"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

export function NewRolePlaceholderCard() {
  const { language } = useApp()

  return (
    <div
      role="presentation"
      title={adminRbacT("admin.roles.new_role_tooltip", language)}
      data-testid="new-role-placeholder-card"
      style={{
        border: "1px dashed var(--border-strong)",
        borderRadius: "var(--radius)",
        background: "var(--surface-2)",
        padding: 18,
        minHeight: 130,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: "not-allowed",
        color: "var(--fg-muted)",
      }}
    >
      <Plus size={20} aria-hidden="true" />
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--fg-muted)",
        }}
      >
        {adminRbacT("admin.roles.new_role_title", language)}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: "var(--fg-subtle)",
        }}
      >
        {adminRbacT("admin.roles.new_role_subtitle", language)}
      </div>
    </div>
  )
}
