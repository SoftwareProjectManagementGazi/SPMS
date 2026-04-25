"use client"

// HistorySubTab (Phase 12 Plan 12-04) — second of the two sub-tabs that ship
// in Plan 12-04. Lists past phases as HistoryCard rows.
//
// Anatomy: 12-UI-SPEC.md §3 "History Sub-tab" copy table (lines 396-411).
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 269-339.
// Decisions consumed: D-55 + D-56 lazy-fetch reuse pattern (delegated to
// the per-card HistoryCard component).
//
// Closed-phase derivation:
//   - A phase is "closed" if any phase_transition activity entry has the
//     phase as `extra_metadata.source_phase_id` — i.e. the user has
//     transitioned out of it at least once.
//   - For each closed phase, the most recent transition's `created_at` is
//     used as `closedAt`; the gap from the workflow's first occurrence is
//     the duration. If timing data is unavailable, fall back to 0 days.
//   - Counts (total/done/moved/successPct) are sourced from the optional
//     `phaseDoneCounts` prop (Plan 12-06 will replace this with PhaseReport
//     summaries). When absent, defaults are 0 — Plan 12-04 ships the
//     LIFE-04 lazy-fetch infrastructure regardless of the count source.

import * as React from "react"

import { Section } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type {
  PhaseTransitionEntry,
  WorkflowConfig,
  WorkflowNode,
} from "@/services/lifecycle-service"
import { HistoryCard, type PhaseSummary } from "./history-card"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface HistorySubTabProject {
  id: number
  key?: string
}

export interface HistorySubTabProps {
  project: HistorySubTabProject
  workflow: WorkflowConfig
  /** Phase-transition activity entries (from `useCycleCounters` or the
   *  `lifecycleService.getPhaseTransitions` call). */
  activity: PhaseTransitionEntry[]
  /** Optional per-phase counts overlay. Plan 12-06's PhaseReport service
   *  will replace this with a richer summary; Plan 12-04 only needs the
   *  shape that lets the LIFE-04 acceptance test assert "Görev Detayları (3)"
   *  cards. */
  phaseDoneCounts?: Record<string, number>
  phaseTotalCounts?: Record<string, number>
  phaseMovedCounts?: Record<string, number>
  phaseNotes?: Record<string, string>
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

interface ClosedPhaseInfo {
  node: WorkflowNode
  summary: PhaseSummary
}

function deriveClosedPhases(
  workflow: WorkflowConfig,
  activity: PhaseTransitionEntry[],
  doneCounts?: Record<string, number>,
  totalCounts?: Record<string, number>,
  movedCounts?: Record<string, number>,
  notes?: Record<string, string>,
): ClosedPhaseInfo[] {
  // Build a map: phaseId → { firstSeenAt, lastClosedAt, transitions[] }
  const phaseTimeline = new Map<
    string,
    { first: string; last: string; count: number }
  >()
  for (const entry of activity) {
    const src = entry.extra_metadata.source_phase_id
    if (!src) continue
    const existing = phaseTimeline.get(src)
    if (!existing) {
      phaseTimeline.set(src, {
        first: entry.created_at,
        last: entry.created_at,
        count: 1,
      })
    } else {
      if (entry.created_at < existing.first) existing.first = entry.created_at
      if (entry.created_at > existing.last) existing.last = entry.created_at
      existing.count += 1
    }
  }

  return workflow.nodes
    .filter((n) => phaseTimeline.has(n.id))
    .map((n) => {
      const t = phaseTimeline.get(n.id)!
      const closedAt = t.last
      const firstDate = new Date(t.first)
      const lastDate = new Date(t.last)
      const durationDays = Math.max(
        0,
        Math.round(
          (lastDate.getTime() - firstDate.getTime()) / 86400000,
        ),
      )
      const total = totalCounts?.[n.id] ?? 0
      const done = doneCounts?.[n.id] ?? 0
      const moved = movedCounts?.[n.id] ?? 0
      const successPct = total > 0 ? Math.round((done / total) * 100) : 0
      return {
        node: n,
        summary: {
          closedAt,
          durationDays,
          total,
          done,
          moved,
          successPct,
          note: notes?.[n.id],
        } as PhaseSummary,
      }
    })
    .sort((a, b) => b.summary.closedAt.localeCompare(a.summary.closedAt))
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function HistorySubTab({
  project,
  workflow,
  activity,
  phaseDoneCounts,
  phaseTotalCounts,
  phaseMovedCounts,
  phaseNotes,
}: HistorySubTabProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const closedPhases = React.useMemo(
    () =>
      deriveClosedPhases(
        workflow,
        activity,
        phaseDoneCounts,
        phaseTotalCounts,
        phaseMovedCounts,
        phaseNotes,
      ),
    [
      workflow,
      activity,
      phaseDoneCounts,
      phaseTotalCounts,
      phaseMovedCounts,
      phaseNotes,
    ],
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Section
        title={T("Kapatılmış Fazlar", "Closed Phases")}
        subtitle={`${closedPhases.length} ${T(
          "faz tamamlandı",
          "phases completed",
        )}`}
      />

      {closedPhases.length === 0 ? (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            color: "var(--fg-subtle)",
            fontSize: 12.5,
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius)",
          }}
        >
          {T("Henüz kapatılmış faz yok.", "No closed phases yet.")}
        </div>
      ) : (
        closedPhases.map((p) => (
          <HistoryCard
            key={p.node.id}
            project={project}
            phase={p.node}
            summary={p.summary}
          />
        ))
      )}
    </div>
  )
}
