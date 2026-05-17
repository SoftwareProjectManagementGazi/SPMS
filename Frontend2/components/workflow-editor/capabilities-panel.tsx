"use client"

// CapabilitiesPanel (Wave 2 W2-C4) — right-panel section that surfaces the
// workflow engine capability toggles for the active editor mode.
//
// Lifecycle mode -> phase_workflow.capabilities (4 toggles):
//   - enforce_sequential_dependencies (Waterfall semantics — phase order)
//   - restrict_expired_sprints (Scrum sprint validation; Phase-only)
//   - enforce_wip_limits (per-phase node WIP)
//   - has_recurring (recurring task auto-next on phase-terminal)
//
// Status mode -> task_workflow.capabilities (3 toggles; no expired-sprint
// concept on the task board):
//   - enforce_wip_limits (per-column WIP enforcement at move time)
//   - has_recurring (recurring task auto-next on column-terminal)
//   - enforce_sequential_dependencies (edge validation on column move)
//
// This commit ONLY adds the UI surface. Toggle changes propagate via
// `onCapabilitiesChange(patch)` to the editor's working-copy state; W2-C5
// will serialize the active mode's capabilities into the PATCH body.
//
// initial_node_id is rendered as read-only info: it is derived from whichever
// node carries `is_initial=true`, so we don't expose a direct toggle here.

import * as React from "react"
import { Toggle } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { EditorMode } from "./editor-page"

export interface WorkflowCapabilities {
  enforce_wip_limits?: boolean
  enforce_sequential_dependencies?: boolean
  restrict_expired_sprints?: boolean
  has_recurring?: boolean
  initial_node_id?: string | null
}

export interface CapabilitiesPanelProps {
  /** Current capabilities for the active mode (lifecycle ->
   *  phase_workflow.capabilities; status -> task_workflow.capabilities). */
  capabilities: WorkflowCapabilities
  /** Patch callback — caller merges into working-copy state. We dispatch
   *  a *single-field patch* (e.g. `{ enforce_wip_limits: true }`) per
   *  toggle so the parent reducer can shallow-merge without clobbering
   *  unrelated flags during concurrent edits. */
  onCapabilitiesChange: (patch: WorkflowCapabilities) => void
  /** Which workflow we are editing — drives the toggle list. */
  editorMode: EditorMode
  /** When false, all toggles render disabled (read-only). Driven by
   *  the transition-authority hook upstream so unauthorized viewers
   *  see the values but can't mutate them. */
  canEdit?: boolean
}

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--fg-subtle)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 10,
}

const TOGGLE_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 4,
}

const ROW_LABEL: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--fg)",
  lineHeight: 1.3,
  flex: 1,
}

const ROW_HINT: React.CSSProperties = {
  fontSize: 11,
  color: "var(--fg-muted)",
  marginTop: 2,
  lineHeight: 1.4,
}

const FOOTER_STYLE: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 10,
  borderTop: "1px solid var(--border)",
}

const FOOTER_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--fg-subtle)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 4,
}

const FOOTER_VALUE: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--fg-muted)",
  lineHeight: 1.4,
}

interface ToggleSpec {
  key: keyof WorkflowCapabilities
  labelTr: string
  labelEn: string
  hintTr: string
  hintEn: string
}

const LIFECYCLE_TOGGLES: ToggleSpec[] = [
  {
    key: "enforce_sequential_dependencies",
    labelTr: "Sıralı bağımlılık",
    labelEn: "Sequential dependencies",
    hintTr: "Waterfall: önceki faz tamamlanmadan sonrakine geçilemez.",
    hintEn: "Waterfall: phase B can't start until A is done.",
  },
  {
    key: "restrict_expired_sprints",
    labelTr: "Süresi geçmiş sprint'i kısıtla",
    labelEn: "Restrict expired sprints",
    hintTr: "Scrum: bitiş tarihi geçmiş sprint'lere yeni görev eklenmesin.",
    hintEn: "Scrum: prevent new tasks on past-end sprints.",
  },
  {
    key: "enforce_wip_limits",
    labelTr: "WIP limitlerini uygula",
    labelEn: "Enforce WIP limits",
    hintTr: "Faz başına WIP cap'leri uygulansın.",
    hintEn: "Apply WIP caps per phase.",
  },
  {
    key: "has_recurring",
    labelTr: "Tekrarlayan görevler",
    labelEn: "Recurring tasks",
    hintTr: "Faz bitince tekrarlayan görevin yeni instance'ı oluşsun.",
    hintEn: "Spawn next recurrence when phase completes.",
  },
]

const STATUS_TOGGLES: ToggleSpec[] = [
  {
    key: "enforce_wip_limits",
    labelTr: "WIP limitlerini uygula",
    labelEn: "Enforce WIP limits",
    hintTr: "Kolon WIP cap dolu ise görev taşıma engellensin.",
    hintEn: "Block moves to columns at WIP cap.",
  },
  {
    key: "has_recurring",
    labelTr: "Tekrarlayan görevler",
    labelEn: "Recurring tasks",
    hintTr: "Görev terminal kolona girince yeni instance oluşsun.",
    hintEn: "Spawn next recurrence on terminal column entry.",
  },
  {
    key: "enforce_sequential_dependencies",
    labelTr: "Edge doğrulaması",
    labelEn: "Edge validation",
    hintTr: "Sadece tanımlı bağlantılar üzerinden kolon değişimi.",
    hintEn: "Only allow column moves along defined edges.",
  },
]

export function CapabilitiesPanel({
  capabilities,
  onCapabilitiesChange,
  editorMode,
  canEdit = true,
}: CapabilitiesPanelProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const toggles = editorMode === "status" ? STATUS_TOGGLES : LIFECYCLE_TOGGLES

  return (
    <div data-testid="capabilities-panel">
      <div style={TITLE_STYLE}>
        {T("Motor Ayarları", "Engine Settings")}
      </div>
      {toggles.map((spec) => {
        const value = Boolean(capabilities[spec.key])
        const label = T(spec.labelTr, spec.labelEn)
        return (
          <div key={String(spec.key)} style={{ marginBottom: 12 }}>
            <div style={TOGGLE_ROW}>
              <span style={ROW_LABEL}>{label}</span>
              <Toggle
                on={value}
                onChange={(next) =>
                  onCapabilitiesChange({ [spec.key]: next })
                }
                size="sm"
                disabled={!canEdit}
                aria-label={label}
              />
            </div>
            <div style={ROW_HINT}>{T(spec.hintTr, spec.hintEn)}</div>
          </div>
        )
      })}

      {/* W2-C4 — read-only initial_node_id footer.
          Derived field: the active mode's workflow exposes whichever node
          is marked is_initial. Direct editing happens through the node-field
          editor (W2-C6); surfacing it here gives the user a single place to
          confirm which start node the engine will treat as canonical. */}
      <div style={FOOTER_STYLE}>
        <div style={FOOTER_LABEL}>
          {T("Başlangıç Düğümü", "Initial node")}
        </div>
        <div style={FOOTER_VALUE} data-testid="initial-node-id-display">
          {capabilities.initial_node_id
            ? capabilities.initial_node_id
            : T(
                "Henüz seçilmedi — bir düğümü is_initial olarak işaretle.",
                "Not set — mark a node as is_initial.",
              )}
        </div>
      </div>
    </div>
  )
}
