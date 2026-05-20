"use client"

// Reports migration v2 Wave 3 — PhaseProgressChart.
//
// Strategy D differentiator (REPORTS-MIGRATION-PLAN.md §1 "Deliberate
// prototype extensions"). Replaces the missing chart for projects whose
// methodology has neither sprints (Burndown / Iteration are gated off)
// nor Kanban categories (CFD is gated off) — e.g. Waterfall and most
// custom workflows. Without this surface, those projects see only the
// Summary StatCards + Lead/Cycle row on /reports, which is too sparse
// for the user's "her metodolojiye her rapor" requirement.
//
// Visual idiom: horizontal step strip where each phase node is a cell
// with the phase name on top, a ProgressBar showing done/total in the
// middle, and the raw "done / total" count below. Chevron arrows between
// cells suggest direction of flow without introducing a new SVG idiom
// outside the prototype's vocabulary (Card + ProgressBar primitives only).
//
// Capability gating: caps.phase_progress = phase_workflow.nodes.length > 0.
// When false → inline AlertBanner (slot reserved, full-width); when true
// but data is empty → empty state CTA.

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Card, ProgressBar, AlertBanner, DataState } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { usePhaseProgress } from "@/hooks/use-phase-progress"
import type { PhaseProgressEntry } from "@/services/report-service"

export interface PhaseProgressChartProps {
  projectId: number | null
  applicable: boolean | null
}

function PhaseCell({ phase }: { phase: PhaseProgressEntry }) {
  const pct = phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0
  return (
    <div
      role="group"
      aria-label={`${phase.name}: ${phase.done} of ${phase.total} done`}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--fg)",
          letterSpacing: 0.2,
          textTransform: "uppercase",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {phase.name}
      </div>
      <ProgressBar value={pct} max={100} color="var(--status-progress)" />
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--fg-muted)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          {phase.done} / {phase.total}
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  )
}

export function PhaseProgressChart({
  projectId,
  applicable,
}: PhaseProgressChartProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const query = usePhaseProgress(projectId, applicable === true)

  const phases = query.data?.phases ?? []
  const empty = !phases.length

  return (
    <Card padding={16}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
          {T("Faz İlerlemesi", "Phase Progress")}
        </h3>
      </div>
      {applicable === false ? (
        <AlertBanner tone="info">
          {T(
            "Faz İlerlemesi için workflow editöründe en az bir faz tanımlayın.",
            "Phase Progress requires at least one phase node defined in the workflow editor.",
          )}
        </AlertBanner>
      ) : (
        <DataState
          // Reports v2 audit FE-2: applicable === null (caps in flight)
          // forces the loading skeleton; without this the disabled hook
          // would surface an empty-state copy before we know if the card
          // should render. Same pattern as TeamLoadCard.
          loading={applicable === null || query.isLoading}
          loadingFallback={
            <div
              aria-busy="true"
              aria-label="Yükleniyor"
              style={{ display: "flex", gap: 18, padding: "8px 0" }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ flex: 1, height: 54, borderRadius: 4 }}
                />
              ))}
            </div>
          }
          error={query.error}
          empty={empty}
          emptyFallback={
            <div
              style={{
                color: "var(--fg-subtle)",
                fontSize: 12,
                padding: "24px 0",
                textAlign: "center",
              }}
            >
              {T(
                "Henüz herhangi bir faza atanmış görev yok.",
                "No tasks assigned to any phase yet.",
              )}
            </div>
          }
        >
          <div
            role="img"
            aria-label={T(
              `${phases.length} faz, ilerleme şeridi`,
              `${phases.length} phases, progress strip`,
            )}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "stretch",
              flexWrap: "nowrap",
              overflowX: "auto",
            }}
          >
            {phases.map((phase, i) => (
              <React.Fragment key={phase.id}>
                <PhaseCell phase={phase} />
                {i < phases.length - 1 ? (
                  <div
                    aria-hidden="true"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "var(--fg-subtle)",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronRight size={14} />
                  </div>
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </DataState>
      )}
    </Card>
  )
}
