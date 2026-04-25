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
import { SelectionPanel, type EditorSelection } from "./selection-panel"
import { ValidationPanel } from "./validation-panel"
import { ShortcutsPanel } from "./shortcuts-panel"

export interface RightPanelProps {
  workflow: WorkflowConfig
  selected: EditorSelection | null
  onWorkflowChange: (next: WorkflowConfig) => void
  /** Editor mode — surfaces lifecycle vs status field affordances. */
  editorMode?: "lifecycle" | "status"
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
}: RightPanelProps) {
  const handleModeChange = React.useCallback(
    (nextMode: WorkflowConfig["mode"]) => {
      onWorkflowChange({ ...workflow, mode: nextMode })
    },
    [workflow, onWorkflowChange],
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
