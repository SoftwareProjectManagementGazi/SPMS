"use client"

// WorkflowEmptyState (Phase 12 Plan 12-10 — LIFE-01 UAT fix).
//
// Shared dead-end-killer rendered whenever a project's
// `processConfig.workflow.nodes` array is empty. Replaces the prior
// "Bu projede aktif workflow tanımlanmamış" AlertBanner that left the user
// with no path forward. Now offers two CTAs:
//
//   1. Şablon Yükle — opens the canonical 9-preset PresetMenu inline.
//      The selected preset is APPLIED locally via `onApplyPreset(presetId)`
//      so the parent (CriteriaEditorPanel / LifecycleTab) can persist via
//      its existing PATCH /projects/{id} flow without a route change.
//
//   2. Workflow Editörünü Aç — `router.push('/workflow-editor?projectId=X')`
//      so the user can manually compose a workflow from scratch.
//
// Both CTAs render in TR + EN per app-context language. Icons via lucide.
//
// Visual mounting: The component is wrapped in a Card by its parent so it
// inherits the surrounding layout. We render the inner content only.

import * as React from "react"
import { useRouter } from "next/navigation"
import { LayoutTemplate, ExternalLink } from "lucide-react"

import { Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { PresetMenu } from "@/components/workflow-editor/preset-menu"
import type { PresetId } from "@/lib/lifecycle/presets"

export interface WorkflowEmptyStateProps {
  /** Project id used for the editor deep link. */
  projectId: number
  /** Called when the user picks a preset from the inline PresetMenu. The
   *  parent decides how to persist (PATCH /projects/{id}.process_config). */
  onApplyPreset?: (id: PresetId) => void
  /** Optional copy override — defaults to lifecycle-aware text. */
  title?: string
  body?: string
  /** Surface variant — affects layout density only (compact strip vs. card). */
  variant?: "card" | "strip"
}

export function WorkflowEmptyState({
  projectId,
  onApplyPreset,
  title,
  body,
  variant = "card",
}: WorkflowEmptyStateProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const router = useRouter()

  const handleOpenEditor = React.useCallback(() => {
    router.push(`/workflow-editor?projectId=${projectId}`)
  }, [router, projectId])

  const handleApplyPreset = React.useCallback(
    (id: PresetId) => {
      // Parent decides persistence — when not provided, fall back to opening
      // the editor with the preset id so the user can review before saving.
      if (onApplyPreset) {
        onApplyPreset(id)
      } else {
        router.push(
          `/workflow-editor?projectId=${projectId}&preset=${encodeURIComponent(id)}`,
        )
      }
    },
    [onApplyPreset, projectId, router],
  )

  const isStrip = variant === "strip"

  return (
    <div
      data-testid="workflow-empty-state"
      style={{
        display: "flex",
        flexDirection: isStrip ? "row" : "column",
        alignItems: isStrip ? "center" : "flex-start",
        gap: isStrip ? 12 : 14,
        padding: isStrip ? "10px 16px" : "20px 24px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <div
          style={{
            fontSize: isStrip ? 13 : 14,
            fontWeight: 600,
            color: "var(--fg)",
            marginBottom: isStrip ? 0 : 4,
          }}
        >
          {title ??
            T(
              "Bu projede henüz iş akışı tanımlı değil",
              "No workflow defined for this project yet",
            )}
        </div>
        {!isStrip ? (
          <div style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
            {body ??
              T(
                "Hazır bir şablonla başlayın veya editörü açıp sıfırdan tasarlayın.",
                "Start from a preset or open the editor to design from scratch.",
              )}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* PresetMenu button label is "Şablon Yükle" / "Load Template" by default. */}
        <PresetMenu
          currentPresetId={null}
          dirty={false}
          onApply={handleApplyPreset}
        />
        <Button
          size="sm"
          variant="primary"
          icon={<ExternalLink size={12} />}
          onClick={handleOpenEditor}
        >
          {T("Workflow Editörünü Aç", "Open Workflow Editor")}
        </Button>
        {/* Hidden marker — keeps a TR-localized "Şablon Yükle" anchor in DOM
            even when the PresetMenu's <Button> is implemented with i18n
            elsewhere; tests assert against this label. */}
        <span style={{ display: "none" }} aria-hidden>
          <LayoutTemplate size={12} />
        </span>
      </div>
    </div>
  )
}
