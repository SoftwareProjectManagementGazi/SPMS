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

import * as React from "react"
import { X } from "lucide-react"

import { useApp } from "@/context/app-context"
import { adminAuditT } from "@/lib/i18n/admin-audit-keys"
import type { AdminAuditFilter } from "@/services/admin-audit-service"

interface AuditFilterChipsProps {
  filter: AdminAuditFilter
  /** Map of actor_id → display label so we can show "Aktör: {name}" rather
   *  than "Aktör: 42". When unknown the chip shows the raw id. */
  actorLabel?: string
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
  actorLabel,
  onClear,
}: AuditFilterChipsProps) {
  const { language } = useApp()

  const chips: ChipDef[] = []

  if (filter.actor_id !== undefined) {
    const actorText =
      actorLabel ??
      String(filter.actor_id)
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
