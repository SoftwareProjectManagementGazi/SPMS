"use client"

// Phase 14 Plan 14-08 Task 1 — MethodologyBars (D-X3).
//
// Pure-CSS horizontal bar list — NO recharts geometry. UI-SPEC §Spacing line
// 38 calls this out explicitly: simple proportions don't need a charting
// library, and avoiding recharts here keeps the /admin/stats route bundle
// smaller (D-C6 lazy-load budget benefits).
//
// Color tokens per UI-SPEC §Color line 180-181:
//   - scrum      → var(--status-progress)
//   - kanban     → neutral (var(--fg-muted))
//   - waterfall  → var(--status-review)
//   - iterative  → var(--status-done)
//   - other      → var(--fg-subtle) (catch-all for incremental / evolutionary
//                                    / RAD / V-Model / Spiral / unknown)
//
// Backend's methodology_distribution comes back as Record<string, number> with
// case-sensitive keys (ProjectMethodology enum values are lowercase per
// app/domain/entities/project.py). We classify defensively so a stray
// "SCRUM" or "Scrum" still gets the right color, and unknown methodologies
// land in the "other" bucket without breaking the render.

import * as React from "react"
import { Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminStatsT } from "@/lib/i18n/admin-stats-keys"

export interface MethodologyBarsProps {
  /** Backend payload — methodology key → project count. Case-insensitive. */
  distribution: Record<string, number>
}

type CanonicalMethodology =
  | "scrum"
  | "kanban"
  | "waterfall"
  | "iterative"
  | "other"

const COLORS: Record<CanonicalMethodology, string> = {
  scrum: "var(--status-progress)",
  kanban: "var(--fg-muted)",
  waterfall: "var(--status-review)",
  iterative: "var(--status-done)",
  other: "var(--fg-subtle)",
}

// Bucket order = display order (UI-SPEC §Surface I lines 499-503).
const ORDERED_BUCKETS: CanonicalMethodology[] = [
  "scrum",
  "kanban",
  "waterfall",
  "iterative",
  "other",
]

const LABEL_KEYS: Record<
  CanonicalMethodology,
  Parameters<typeof adminStatsT>[0]
> = {
  scrum: "admin.stats.methodology_row_scrum",
  kanban: "admin.stats.methodology_row_kanban",
  waterfall: "admin.stats.methodology_row_waterfall",
  iterative: "admin.stats.methodology_row_iterative",
  other: "admin.stats.methodology_row_other",
}

function classify(raw: string): CanonicalMethodology {
  const m = raw.toLowerCase()
  if (m.includes("scrum")) return "scrum"
  if (m.includes("kanban")) return "kanban"
  if (m.includes("waterfall")) return "waterfall"
  if (m.includes("iterative")) return "iterative"
  return "other"
}

export function MethodologyBars({ distribution }: MethodologyBarsProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  // Aggregate raw distribution into the 5 canonical buckets so unknown
  // backend values fall into "other" instead of missing from the chart.
  const buckets: Record<CanonicalMethodology, number> = {
    scrum: 0,
    kanban: 0,
    waterfall: 0,
    iterative: 0,
    other: 0,
  }
  for (const [key, value] of Object.entries(distribution)) {
    buckets[classify(key)] += Number(value) || 0
  }

  const total = Object.values(buckets).reduce((a, b) => a + b, 0)
  // Avoid division by zero — render flat 0% bars when there's no data instead
  // of crashing the AreaChart rail.
  const safeTotal = total === 0 ? 1 : total

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
        {adminStatsT("admin.stats.methodology_title", lang)}
      </h3>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {ORDERED_BUCKETS.map((bucket) => {
          // Skip rendering "other" / "iterative" rows when zero — keeps the
          // card visually clean for the typical 3-methodology team.
          if (
            (bucket === "other" || bucket === "iterative") &&
            buckets[bucket] === 0
          ) {
            return null
          }

          const count = buckets[bucket]
          const pct = (count / safeTotal) * 100
          const label = adminStatsT(LABEL_KEYS[bucket], lang)

          return (
            <div key={bucket}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                <span>{label}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--fg-muted)",
                  }}
                >
                  {lang === "tr"
                    ? `%${Math.round(pct)}`
                    : `${Math.round(pct)}%`}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "var(--surface-2)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: COLORS[bucket],
                    borderRadius: 3,
                    transition: "width 0.18s ease",
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
