"use client"

// Phase 14 Plan 14-07 — Active filter chip strip (UI-SPEC §Surface H line 478).
//
// When the AdminAuditFilter has any non-empty key, render a chip for each
// facet with an × clear-per-facet button. Clearing a chip calls the parent
// `onClear(facet)` which updates the URL search params (parent's
// updateFilter helper).
//
// Visual contract per UI-SPEC §Surface H:
//   - Pill background var(--surface-2)
//   - Padding 4 8
//   - Border-radius 4
//   - Font-size 12
//   - × button on the right (X icon, 12px)
//
// Plan 14-18 (Cluster F UAT Test 27 side-finding) — Aktör chip now resolves
// the actor_id to a user's full_name (or email when full_name is empty) via
// the new `usersById` prop. When the id isn't in the map (or the map prop
// is omitted) we fall back to a localized "Bilinmeyen kullanıcı (id N)"
// label rather than the raw numeric id alone — admins recognized the id-
// only chip as a UI bug. The audit page wires the map via the new
// useUsersLookup() hook (hooks/use-users-lookup.ts).

import * as React from "react"
import { X } from "lucide-react"

import { useApp } from "@/context/app-context"
import { adminAuditT } from "@/lib/i18n/admin-audit-keys"
import type { AdminAuditFilter } from "@/services/admin-audit-service"

/** Plan 14-18 — minimal user shape consumed by the chip. Matches the
 *  hooks/use-users-lookup.ts return value AND the existing /admin/users
 *  payload (full_name? + email? per UserListDTO + AdminUserListDTO). */
export interface AuditChipUser {
  id: number
  full_name?: string
  email?: string
}

interface AuditFilterChipsProps {
  filter: AdminAuditFilter
  /** Plan 14-18 — map of actor_id → user shape so the Aktör chip can
   *  resolve the id to a real name. Wired by /admin/audit/page.tsx via
   *  the new useUsersLookup() hook; when omitted we fall back to a
   *  localized "Bilinmeyen kullanıcı (id N)" label. NEVER renders the
   *  raw numeric id alone. */
  usersById?: Record<number, AuditChipUser>
  onClear: (facet: ChipFacet) => void
}

export type ChipFacet = "actor" | "action" | "date_range"

/** Format an ISO date (or date-only string) to a short locale label. */
function formatDate(iso: string | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString()
}

interface ChipDef {
  facet: ChipFacet
  text: string
}

export function AuditFilterChips({
  filter,
  usersById,
  onClear,
}: AuditFilterChipsProps) {
  const { language } = useApp()

  const chips: ChipDef[] = []

  if (filter.actor_id !== undefined) {
    // Plan 14-18 — resolve actor_id → display label.
    //   1. usersById has the id AND user has a non-empty full_name → show it.
    //   2. usersById has the id AND user has an email → fall back to email.
    //   3. id absent from the map (or map prop missing) → localized
    //      "Bilinmeyen kullanıcı (id N)" / "Unknown user (id N)" — NEVER
    //      the raw id alone.
    const user = usersById?.[filter.actor_id]
    let actorText: string
    if (user?.full_name && user.full_name.trim().length > 0) {
      actorText = user.full_name
    } else if (user?.email && user.email.trim().length > 0) {
      actorText = user.email
    } else {
      actorText = adminAuditT(
        "admin.audit.chip_actor_unknown",
        language,
      ).replace("{id}", String(filter.actor_id))
    }
    chips.push({
      facet: "actor",
      text: `${adminAuditT("admin.audit.chip_actor_label", language)}: ${actorText}`,
    })
  }

  if (filter.action_prefix) {
    chips.push({
      facet: "action",
      text: `${adminAuditT(
        "admin.audit.chip_action_label",
        language,
      )}: ${filter.action_prefix}*`,
    })
  }

  if (filter.date_from || filter.date_to) {
    const from = formatDate(filter.date_from)
    const to = formatDate(filter.date_to)
    const range = from && to ? `${from} → ${to}` : from || to
    chips.push({
      facet: "date_range",
      text: `${adminAuditT(
        "admin.audit.chip_date_range_label",
        language,
      )}: ${range}`,
    })
  }

  if (chips.length === 0) return null

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: "0 0 4px 0",
      }}
    >
      {chips.map((chip) => (
        <span
          key={chip.facet}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--surface-2)",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 12,
            color: "var(--fg)",
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        >
          <span>{chip.text}</span>
          <button
            type="button"
            aria-label={adminAuditT(
              "admin.audit.chip_clear_aria",
              language,
            )}
            onClick={() => onClear(chip.facet)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              padding: 0,
              border: 0,
              borderRadius: 4,
              background: "transparent",
              color: "var(--fg-muted)",
              cursor: "pointer",
            }}
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  )
}
