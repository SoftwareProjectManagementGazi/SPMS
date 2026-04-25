"use client"

// FlowRules — right-panel section that exposes the 4-mode workflow picker.
//
// Prototype parity: vertical button list (label + per-mode description) so
// each mode is self-explanatory and the row never wraps inside the 320px
// column. Replaces the previous wrap-prone SegmentedControl.

import * as React from "react"
import { useApp } from "@/context/app-context"
import type { WorkflowMode } from "@/services/lifecycle-service"

export interface FlowRulesProps {
  mode: WorkflowMode
  onChange: (next: WorkflowMode) => void
}

const MODE_ORDER: WorkflowMode[] = [
  "flexible",
  "sequential-locked",
  "sequential-flexible",
  "continuous",
]

const MODE_LABEL_TR: Record<WorkflowMode, string> = {
  flexible: "Esnek",
  "sequential-locked": "Sıralı · Kilitli",
  "sequential-flexible": "Sıralı · Esnek Geri Dönüş",
  continuous: "Sürekli Akış",
}

const MODE_LABEL_EN: Record<WorkflowMode, string> = {
  flexible: "Flexible",
  "sequential-locked": "Sequential · Locked",
  "sequential-flexible": "Sequential · Flex Return",
  continuous: "Continuous",
}

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
  const labels = language === "tr" ? MODE_LABEL_TR : MODE_LABEL_EN
  const descs = language === "tr" ? MODE_DESC_TR : MODE_DESC_EN

  return (
    <div>
      <div style={TITLE_STYLE}>{T("Akış Kuralları", "Flow Rules")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {MODE_ORDER.map((id) => {
          const active = id === mode
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-pressed={active}
              style={{
                textAlign: "left",
                padding: "8px 10px",
                background: active ? "var(--surface-2)" : "transparent",
                color: active ? "var(--fg)" : "var(--fg)",
                borderRadius: "var(--radius-sm)",
                border: 0,
                boxShadow: active
                  ? "inset 0 0 0 1px var(--primary)"
                  : "inset 0 0 0 1px var(--border)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                transition: "background 0.12s, box-shadow 0.12s",
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                {labels[id]}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  lineHeight: 1.4,
                }}
              >
                {descs[id]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
