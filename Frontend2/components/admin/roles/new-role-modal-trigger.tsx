"use client"

// Phase 15 Plan 15-10 — NewRoleModalTrigger (renamed from
// new-role-placeholder-card.tsx; layer 6 of D-2.7 atomic 7-layer uplift).
//
// "Yeni rol oluştur" 5th card in the Roller grid. Visual styling is
// IDENTICAL to the Phase 14 14-04 placeholder (dashed border + minHeight 130
// + Plus icon + center text) — only the click behavior changes:
//
//   - Phase 14 14-04 (placeholder): role="presentation" / cursor:not-allowed /
//     NO onClick / textual deferred-version subtitle.
//   - Phase 15 Plan 15-10 (active): <button type="button"> with onClick fired
//     to open RoleCreateModal (Plan 15-11 wires this). Subtitle copy FLIPPED
//     to "Özel bir rol tanımla". cursor:pointer.
//
// Why a button (not a div with onClick): keyboard accessibility — Tab focus
// + Enter/Space to activate is native to <button>. The dashed-border styling
// is preserved, but the role/keyboard contract is now correct (the previous
// role="presentation" was acceptable because the card was non-interactive;
// once it becomes interactive, semantic <button> is the right element).
//
// minHeight: 130 px is the verbatim prototype value (UI-SPEC §Spacing
// line 72) — keeps the trigger visually equivalent to a populated RoleCard
// at default density.

import * as React from "react"
import { Plus } from "lucide-react"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

export interface NewRoleModalTriggerProps {
  /**
   * Called when the trigger is clicked. Plan 15-11 wires this to open
   * <RoleCreateModal />. For Plan 15-10 the consumer (admin/roles/page.tsx)
   * sets a useState flag — the modal will mount in Plan 15-11.
   */
  onClick: () => void
}

export function NewRoleModalTrigger({ onClick }: NewRoleModalTriggerProps) {
  const { language } = useApp()
  const ariaLabel = adminRbacT("admin.roles.new_role_tooltip", language)

  return (
    <button
      type="button"
      onClick={onClick}
      title={ariaLabel}
      aria-label={ariaLabel}
      data-testid="new-role-modal-trigger"
      style={{
        // Visual styling preserved from new-role-placeholder-card.tsx
        // (Phase 14 14-04). Only cursor flips not-allowed → pointer; the
        // dashed border + minHeight + alignment are verbatim.
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
        cursor: "pointer",
        color: "var(--fg-muted)",
        // <button> default focus ring kept; explicit transition for hover
        // affordance.
        transition: "background 0.12s ease, border-color 0.12s ease",
        // <button> default UA styling overrides (font + width).
        font: "inherit",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface)"
        e.currentTarget.style.borderColor = "var(--primary)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--surface-2)"
        e.currentTarget.style.borderColor = "var(--border-strong)"
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
    </button>
  )
}
