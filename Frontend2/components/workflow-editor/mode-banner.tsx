"use client"

// ModeBanner (Phase 12 Plan 12-07) — top-left overlay above the canvas that
// shows the current workflow.mode as a localized Badge per UI-SPEC §1395 +
// §673-677.
//
// Plan 12-07 ships the read-only display. The mode is changed via the right-
// panel FlowRules SegmentedControl which calls onWorkflowChange — this
// banner only reflects what's set, it does not change it.

import * as React from "react"

import { Badge } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { WorkflowMode } from "@/services/lifecycle-service"

const MODE_LABEL_TR: Record<WorkflowMode, string> = {
  flexible: "Esnek",
  "sequential-locked": "Sıralı kilitli",
  "sequential-flexible": "Sıralı esnek",
  continuous: "Sürekli",
}

const MODE_LABEL_EN: Record<WorkflowMode, string> = {
  flexible: "Flexible",
  "sequential-locked": "Sequential locked",
  "sequential-flexible": "Sequential flex",
  continuous: "Continuous",
}

const MODE_TONE: Record<WorkflowMode, "warning" | "info" | "neutral" | "primary"> = {
  flexible: "neutral",
  "sequential-locked": "warning",
  "sequential-flexible": "primary",
  continuous: "info",
}

export interface ModeBannerProps {
  mode: WorkflowMode
}

export function ModeBanner({ mode }: ModeBannerProps) {
  const { language } = useApp()
  const label =
    language === "tr" ? MODE_LABEL_TR[mode] : MODE_LABEL_EN[mode]
  const tone = MODE_TONE[mode]
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 5,
      }}
    >
      <Badge size="sm" tone={tone}>
        {label}
      </Badge>
    </div>
  )
}
