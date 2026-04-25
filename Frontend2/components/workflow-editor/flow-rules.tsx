"use client"

// FlowRules (Phase 12 Plan 12-07) — right-panel section that exposes the
// 4-mode workflow picker via SegmentedControl. Wraps the SegmentedControl
// in an uppercase section title row per UI-SPEC §1158.
//
// Mode change calls onChange(next) which the parent forwards into the
// workflow + sets dirty=true. Plan 12-09 wires the actual save flow that
// persists the new mode.
//
// Mode descriptions per UI-SPEC §583-595 (TR + EN copy tables).

import * as React from "react"
import { SegmentedControl } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { WorkflowMode } from "@/services/lifecycle-service"

export interface FlowRulesProps {
  mode: WorkflowMode
  onChange: (next: WorkflowMode) => void
}

const MODE_OPTIONS_TR: Array<{ id: WorkflowMode; label: string }> = [
  { id: "flexible", label: "Esnek" },
  { id: "sequential-locked", label: "Sıralı · Kilitli" },
  { id: "sequential-flexible", label: "Sıralı · Esnek Geri Dönüş" },
  { id: "continuous", label: "Sürekli Akış" },
]

const MODE_OPTIONS_EN: Array<{ id: WorkflowMode; label: string }> = [
  { id: "flexible", label: "Flexible" },
  { id: "sequential-locked", label: "Sequential · Locked" },
  { id: "sequential-flexible", label: "Sequential · Flex Return" },
  { id: "continuous", label: "Continuous" },
]

const MODE_DESC_TR: Record<WorkflowMode, string> = {
  flexible: "Her düğüm arası geçiş tanımlanabilir.",
  "sequential-locked":
    "Waterfall: bir faz bitmeden öbürüne geçilemez, geri dönüş yok.",
  "sequential-flexible":
    "Sıralı ilerle, tanımlı geri dönüşlere izin ver. V-Model ve modifiye edilmiş Waterfall için.",
  continuous: "Kanban: tek aktif faz.",
}

const MODE_DESC_EN: Record<WorkflowMode, string> = {
  flexible: "Define any transitions.",
  "sequential-locked": "Waterfall: no skipping, no backward.",
  "sequential-flexible":
    "Sequential flow, defined returns allowed. For V-Model and modified Waterfall.",
  continuous: "Kanban: single active phase.",
}

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--fg-subtle)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 10,
}

export function FlowRules({ mode, onChange }: FlowRulesProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const options = language === "tr" ? MODE_OPTIONS_TR : MODE_OPTIONS_EN
  const desc = language === "tr" ? MODE_DESC_TR[mode] : MODE_DESC_EN[mode]

  return (
    <div>
      <div style={TITLE_STYLE}>{T("Akış Kuralları", "Flow Rules")}</div>
      <SegmentedControl
        options={options}
        value={mode}
        onChange={(id) => onChange(id as WorkflowMode)}
        size="xs"
        style={{ flexWrap: "wrap" }}
      />
      <div
        style={{
          fontSize: 11.5,
          color: "var(--fg-muted)",
          marginTop: 8,
          lineHeight: 1.4,
        }}
      >
        {desc}
      </div>
    </div>
  )
}
