"use client"
import * as React from "react"
import { Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"

interface MethodologyCardProps {
  projects: Project[]
}

// 7-slot palette: 6 distinct template colors + an "Other" rollup tone.
// The first four slots reuse design tokens so the bar stays in sync with
// the rest of the dashboard. Slots 4–5 are fixed hex codes (purple / pink)
// because no `--info`/`--warning` token exists in globals.css and we still
// want enough hue separation to keep 6-7 segments distinguishable. The
// last slot maps to fg-subtle so the "Diğer" / "Other" rollup reads as
// muted neutral against the colored segments.
const PALETTE: string[] = [
  "var(--primary)",
  "var(--status-progress)",
  "var(--status-review)",
  "var(--status-done)",
  "#8B5CF6",
  "#EC4899",
  "var(--fg-subtle)",
]

const MAX_SLICES = 6

interface Slice {
  label: string
  count: number
  color: string
}

function buildSlices(projects: Project[], otherLabel: string): Slice[] {
  // Group by template name. Projects without a template (process_template_id
  // NULL — should be empty after the backfill migration but defensive) collapse
  // into the otherLabel bucket so the bar still sums to 100%.
  const tally = new Map<string, number>()
  for (const p of projects) {
    const key = p.processTemplateName ?? otherLabel
    tally.set(key, (tally.get(key) ?? 0) + 1)
  }
  const sorted = Array.from(tally.entries()).sort((a, b) => b[1] - a[1])

  if (sorted.length <= MAX_SLICES) {
    return sorted.map(([label, count], i) => ({
      label,
      count,
      color: PALETTE[i] ?? PALETTE[PALETTE.length - 1],
    }))
  }

  const top = sorted.slice(0, MAX_SLICES).map(([label, count], i) => ({
    label,
    count,
    color: PALETTE[i],
  }))
  const tail = sorted.slice(MAX_SLICES)
  const tailCount = tail.reduce((s, [, c]) => s + c, 0)
  // Merge if the catch-all already exists (project with NULL template happened
  // to land at the end of the sorted list).
  const existingOther = top.find((s) => s.label === otherLabel)
  if (existingOther) {
    existingOther.count += tailCount
    return top
  }
  return [
    ...top,
    {
      label: otherLabel,
      count: tailCount,
      color: PALETTE[PALETTE.length - 1],
    },
  ]
}

export function MethodologyCard({ projects }: MethodologyCardProps) {
  const { language } = useApp()
  const isTr = language === "tr"

  const otherLabel = isTr ? "Diğer" : "Other"
  const slices = React.useMemo(
    () => buildSlices(projects, otherLabel),
    [projects, otherLabel],
  )
  const total = projects.length || 1

  return (
    <Card padding={16}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
        {isTr ? "Şablon dağılımı" : "Template mix"}
      </div>

      {/* Stacked bar — segments rendered in the same order as the legend so
          the color↔label mapping reads consistently top-to-bottom. */}
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          background: "var(--surface-2)",
        }}
      >
        {slices.map((s) => (
          <div
            key={s.label}
            style={{
              width: `${(s.count / total) * 100}%`,
              background: s.color,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 14,
        }}
      >
        {slices.map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              gap: 8,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: s.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                title={s.label}
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <span style={{ color: "var(--fg-muted)" }}>
                {s.count} {isTr ? "proje" : "projects"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--fg-subtle)",
                  fontSize: 11,
                }}
              >
                {projects.length > 0
                  ? Math.round((s.count / projects.length) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
