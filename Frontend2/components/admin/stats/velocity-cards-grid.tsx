"use client"

// Phase 14 Plan 14-08 Task 2 — VelocityCardsGrid (D-X4).
//
// Full-width Card hosting a 6-column grid of VelocityMiniBar cards (one per
// project). Layout per UI-SPEC §Spacing line 83 + verbatim prototype admin.
// jsx line 464:
//
//   gridTemplateColumns: repeat(6, 1fr)
//   gap: 10
//
// Top-30 cap (D-X4): the backend already caps at top 30 by recent activity
// (Plan 14-01), but we add a defensive client-side `slice(0, 30)` as a
// second layer of defense. When the backend returns more than 30 (which
// shouldn't happen but might during dev), we render the first 30 and show a
// caption explaining the truncation.
//
// Empty state: when `velocities.length === 0` (a brand-new org with no
// active sprints), render the localized empty copy from admin-stats-keys.

import * as React from "react"

import { Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminStatsT } from "@/lib/i18n/admin-stats-keys"

import {
  VelocityMiniBar,
  type VelocityMiniBarData,
} from "./velocity-mini-bar"

export interface VelocityCardsGridProps {
  velocities: VelocityMiniBarData[]
}

const TOP_N_CAP = 30

export function VelocityCardsGrid({ velocities }: VelocityCardsGridProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  // D-X4 defensive client-side cap — backend already caps at 30 (Plan 14-01)
  // but the second layer of defense protects against accidental dev-time
  // payload bloat.
  const top30 = velocities.slice(0, TOP_N_CAP)
  const truncated = velocities.length > TOP_N_CAP

  return (
    <Card padding={16}>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 14,
          letterSpacing: -0.2,
        }}
      >
        {adminStatsT("admin.stats.velocity_title", lang)}
      </h3>

      {top30.length === 0 ? (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--fg-muted)",
            fontSize: 12,
          }}
        >
          {adminStatsT("admin.stats.empty_velocity", lang)}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 10,
            }}
          >
            {top30.map((v) => (
              <VelocityMiniBar key={v.projectId} v={v} />
            ))}
          </div>
          {truncated && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--fg-muted)",
                marginTop: 10,
                textAlign: "center",
              }}
            >
              {adminStatsT("admin.stats.velocity_top30_note", lang)}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
