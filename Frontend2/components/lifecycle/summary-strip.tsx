"use client"

// SummaryStrip (Phase 12 Plan 12-02) — methodology-aware top strip rendered
// inside LifecycleTab above the read-only canvas. Shows the active-phase
// Badge with the 1-based index, a ProgressBar with the percent, the open
// tasks counter, an optional next-milestone chip (rendered when supplied by
// the parent), the workflow-mode chip, and two action buttons:
//
//   - "Sonraki Faza Geç" — primary, hidden when use-transition-authority
//      returns false OR when workflow.mode === 'continuous' (CONTEXT D-40 +
//      D-59). Calls the onOpenGate callback to expand the Phase Gate panel.
//   - "Düzenle"          — ghost, navigates to the Workflow Editor
//      route. Always rendered (read-only mode opens for non-PM users).
//
// Anatomy: 12-UI-SPEC.md §1 SummaryStrip (lines 771-796).
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 51-75.

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ExternalLink, Pencil, Target } from "lucide-react"

import { Badge, Button, ProgressBar } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTransitionAuthority } from "@/hooks/use-transition-authority"
import type {
  WorkflowConfig,
  WorkflowMode,
  WorkflowNode,
} from "@/services/lifecycle-service"
import { PresetMenu } from "@/components/workflow-editor/preset-menu"
import type { PresetId } from "@/lib/lifecycle/presets"

export interface SummaryStripProject {
  id: number
  managerId?: number | null
  manager_id?: number | null
}

export interface SummaryStripMilestone {
  name: string
  /** Days remaining until target date (negative = overdue). */
  daysRemaining: number
}

export interface SummaryStripProps {
  project: SummaryStripProject
  workflow: WorkflowConfig
  /** First node with state==='active' from BFS computeNodeStates. */
  activePhase: WorkflowNode | null
  /** Percentage 0..100 of done tasks in the active phase. */
  phaseProgress: number
  /** Open tasks count for the "{N} kalan" pill. */
  openTasksRemaining: number
  /** Next upcoming milestone — optional decorative chip. */
  nextMilestone?: SummaryStripMilestone | null
  /** Callback fired when user clicks "Sonraki Faza Geç". */
  onOpenGate: () => void
  /** Phase 12 Plan 12-10 (LIFE-01 UAT fix) — apply a preset when the
   *  workflow is empty. When omitted, the empty-state Şablon Yükle button
   *  routes to the editor with `?preset={id}` so the user can review there. */
  onApplyPreset?: (id: PresetId) => void
}

const MODE_LABEL_TR: Record<WorkflowMode, string> = {
  flexible: "Esnek",
  "sequential-locked": "Sıralı · kilitli",
  "sequential-flexible": "Sıralı · esnek",
  continuous: "Sürekli",
}

const MODE_LABEL_EN: Record<WorkflowMode, string> = {
  flexible: "Flexible",
  "sequential-locked": "Sequential · locked",
  "sequential-flexible": "Sequential · flex",
  continuous: "Continuous",
}

const MODE_TONE: Record<WorkflowMode, "warning" | "info" | "neutral"> = {
  flexible: "neutral",
  "sequential-locked": "warning",
  "sequential-flexible": "neutral",
  continuous: "info",
}

export function SummaryStrip({
  project,
  workflow,
  activePhase,
  phaseProgress,
  openTasksRemaining,
  nextMilestone,
  onOpenGate,
  onApplyPreset,
}: SummaryStripProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const router = useRouter()
  const transitionAllowed = useTransitionAuthority(project)

  const totalPhases = workflow.nodes.filter((n) => !n.isArchived).length || workflow.nodes.length
  const activeIndex = activePhase
    ? Math.max(0, workflow.nodes.findIndex((n) => n.id === activePhase.id))
    : 0
  const activeIndex1Based = activeIndex + 1

  const showGateButton = transitionAllowed && workflow.mode !== "continuous"
  const modeLabel =
    language === "tr" ? MODE_LABEL_TR[workflow.mode] : MODE_LABEL_EN[workflow.mode]
  const modeTone = MODE_TONE[workflow.mode]

  const handleEdit = React.useCallback(() => {
    router.push(`/workflow-editor?projectId=${project.id}`)
  }, [router, project.id])

  // Phase 12 Plan 12-10 (LIFE-01 UAT fix) — empty-state branch fires when the
  // strip is rendered without any workflow nodes. Renders inline:
  //   - context label "Bu projede henüz iş akışı tanımlı değil"
  //   - Şablon Yükle PresetMenu (applies in-place via onApplyPreset, or routes
  //     to the editor with `?preset={id}` when no apply handler is wired)
  //   - Workflow Editörünü Aç primary button (deep-link)
  // Skips the Badge / ProgressBar / mode chip / gate button — they have no
  // meaningful value when nodes is empty.
  if (workflow.nodes.length === 0) {
    return (
      <div
        data-testid="summary-strip-empty"
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 12.5,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 600, color: "var(--fg)" }}>
          {T(
            "Bu projede henüz iş akışı tanımlı değil",
            "No workflow defined for this project yet",
          )}
        </span>
        <div style={{ flex: 1 }} />
        <PresetMenu
          currentPresetId={null}
          dirty={false}
          onApply={(id: PresetId) => {
            if (onApplyPreset) {
              onApplyPreset(id)
            } else {
              router.push(
                `/workflow-editor?projectId=${project.id}&preset=${encodeURIComponent(id)}`,
              )
            }
          }}
        />
        <Button
          size="sm"
          variant="primary"
          icon={<ExternalLink size={12} />}
          onClick={handleEdit}
        >
          {T("Workflow Editörünü Aç", "Open Workflow Editor")}
        </Button>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontSize: 12.5,
        flexWrap: "wrap",
      }}
    >
      {activePhase && (
        <Badge tone="primary">
          {activeIndex1Based}/{totalPhases} — {activePhase.name}
        </Badge>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ProgressBar value={phaseProgress} max={100} style={{ width: 120 }} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-muted)",
          }}
        >
          %{Math.round(phaseProgress)}
        </span>
      </div>
      <span style={{ color: "var(--fg-muted)" }}>
        {openTasksRemaining} {T("kalan", "remaining")}
      </span>
      {nextMilestone && (
        <span
          style={{
            color: "var(--fg-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Target size={12} /> {nextMilestone.name} —{" "}
          {nextMilestone.daysRemaining}{" "}
          {T("gün", "d")}
        </span>
      )}
      <div style={{ flex: 1 }} />
      <Badge size="xs" tone={modeTone}>
        {modeLabel}
      </Badge>
      {showGateButton && (
        <Button
          size="sm"
          variant="primary"
          icon={<ArrowRight size={12} />}
          onClick={onOpenGate}
        >
          {T("Sonraki Faza Geç", "Move to next phase")}
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        icon={<Pencil size={12} />}
        onClick={handleEdit}
      >
        {T("Düzenle", "Edit")}
      </Button>
    </div>
  )
}
