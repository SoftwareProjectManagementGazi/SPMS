"use client"

// RightPanel (Phase 12 Plan 12-07) — 320px right side container that hosts
// the editor's section stack: FlowRules → Selection → Validation →
// Shortcuts. Each section is wrapped in a `<section>` with bottom border
// per UI-SPEC §1154-1159.
//
// Plan 12-07 ships the structural skeleton with all 4 sections rendering;
// SelectionPanel branches off `selected.type` (node/edge/group/null).
// FlowRules drives setDirty when the mode changes. Validation runs the
// 5-rule validator from Plan 12-01 with 300 ms debounce. Shortcuts is a
// static Kbd list per CONTEXT D-35.

import * as React from "react"
import type { WorkflowConfig } from "@/services/lifecycle-service"
import { FlowRules } from "./flow-rules"
import {
  SelectionPanel,
  type ColumnEngineFieldsPatch,
  type EditorSelection,
} from "./selection-panel"
import { ValidationPanel } from "./validation-panel"
import { ShortcutsPanel } from "./shortcuts-panel"
import {
  CapabilitiesPanel,
  type WorkflowCapabilities,
} from "./capabilities-panel"

export interface RightPanelProps {
  workflow: WorkflowConfig
  selected: EditorSelection | null
  onWorkflowChange: (next: WorkflowConfig) => void
  /** Editor mode — surfaces lifecycle vs status field affordances. */
  editorMode?: "lifecycle" | "status"
  /** Wave 2 W2-C4 — capabilities for the *active* mode. Defaults to {}
   *  when the parent has not yet hydrated state; CapabilitiesPanel falls
   *  back to false for each unset flag. */
  capabilities?: WorkflowCapabilities
  /** Wave 2 W2-C4 — single-field patch callback dispatched whenever a
   *  toggle flips. The editor save handler (W2-C5) will serialize the
   *  current capabilities snapshot into the PATCH body. */
  onCapabilitiesChange?: (patch: WorkflowCapabilities) => void
  /** Wave 2 W2-C4 — transition-authority gate. When false, every toggle
   *  and editable surface in the right panel renders disabled. */
  canEdit?: boolean
  /** Wave 2 W2-C6 — status-mode BoardColumn engine field PATCH side-effect.
   *  Drilled straight through to `SelectionPanel.NodeEditor`. Undefined for
   *  test mounts and lifecycle-only callers; `NodeEditor` no-ops gracefully
   *  when the callback is absent. */
  onColumnEngineFieldsChange?: (
    columnId: number,
    patch: ColumnEngineFieldsPatch,
  ) => void
}

const SECTION_STYLE: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid var(--border)",
}

export function RightPanel({
  workflow,
  selected,
  onWorkflowChange,
  editorMode = "lifecycle",
  capabilities,
  onCapabilitiesChange,
  canEdit = true,
  onColumnEngineFieldsChange,
}: RightPanelProps) {
  const handleModeChange = React.useCallback(
    (nextMode: WorkflowConfig["mode"]) => {
      onWorkflowChange({ ...workflow, mode: nextMode })
    },
    [workflow, onWorkflowChange],
  )

  // Wave 2 W2-C4 — fallback to no-op so the panel still renders for callers
  // (tests, older mount sites) that have not been migrated yet. W2-C5 will
  // make the editor-page route mandatory.
  const safeCapabilities: WorkflowCapabilities = capabilities ?? {}
  const safeOnCapabilitiesChange = React.useCallback(
    (patch: WorkflowCapabilities) => {
      if (onCapabilitiesChange) onCapabilitiesChange(patch)
    },
    [onCapabilitiesChange],
  )

  return (
    <aside
      style={{
        width: 320,
        flexShrink: 0,
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <section style={SECTION_STYLE}>
        <FlowRules mode={workflow.mode} onChange={handleModeChange} />
      </section>
      <section style={SECTION_STYLE}>
        <SelectionPanel
          workflow={workflow}
          selected={selected}
          onWorkflowChange={onWorkflowChange}
          editorMode={editorMode}
          onColumnEngineFieldsChange={onColumnEngineFieldsChange}
        />
      </section>
      {/* Wave 2 W2-C4 — capabilities section. Sits between SelectionPanel and
          ValidationPanel so the user sees engine-level toggles right after
          they finish editing a node/edge. */}
      <section style={SECTION_STYLE}>
        <CapabilitiesPanel
          capabilities={safeCapabilities}
          onCapabilitiesChange={safeOnCapabilitiesChange}
          editorMode={editorMode}
          canEdit={canEdit}
        />
      </section>
      <section style={SECTION_STYLE}>
        <ValidationPanel workflow={workflow} />
      </section>
      <section style={{ ...SECTION_STYLE, borderBottom: "none" }}>
        <ShortcutsPanel />
      </section>
    </aside>
  )
}
