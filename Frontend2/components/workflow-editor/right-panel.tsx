"use client"

// RightPanel — 320px right side container that hosts the editor's section
// stack as a TABBED layout (Wave 2 follow-up bug fix 2026-05-18).
//
// Previously the panel rendered all sections in a long vertical stack
// (FlowRules → Selection → Capabilities → Validation → Shortcuts), which
// pushed the canvas content off-screen on shorter viewports. The tabbed
// layout keeps the panel at 320px width but bounds the height so the
// canvas remains visible regardless of selection complexity.
//
// Tabs (left→right): Seçim · Akış · Yetenek · Doğr. · Kısayol
// Default tab: "selection" — the most common editing surface.
// Tab header is sticky; the active panel scrolls independently.

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
import { useApp } from "@/context/app-context"

export interface RightPanelProps {
  workflow: WorkflowConfig
  selected: EditorSelection | null
  onWorkflowChange: (next: WorkflowConfig) => void
  /** Editor mode — surfaces lifecycle vs status field affordances. */
  editorMode?: "lifecycle" | "status"
  capabilities?: WorkflowCapabilities
  onCapabilitiesChange?: (patch: WorkflowCapabilities) => void
  canEdit?: boolean
  onColumnEngineFieldsChange?: (
    columnId: number,
    patch: ColumnEngineFieldsPatch,
  ) => void
}

type TabId = "selection" | "flow" | "capabilities" | "validation" | "shortcuts"

const TAB_BODY_STYLE: React.CSSProperties = {
  padding: "14px 16px",
  overflowY: "auto",
  flex: 1,
  // flex items default to min-height: auto, which lets tall content
  // (NodeEditor with all engine fields expanded) push past the parent
  // aside's bounds and grow the body-grid row — defeating the height
  // cap. minHeight:0 allows the flex item to shrink below content size
  // so overflowY:auto actually engages (2026-05-18 UX fix follow-up).
  minHeight: 0,
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
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const [activeTab, setActiveTab] = React.useState<TabId>("selection")

  // When the user selects a node/edge/group, jump to the selection tab so
  // the edit affordance is immediately visible. Without this, a click on
  // the canvas while on a different tab would silently update state with
  // no visual feedback.
  const lastSelectedRef = React.useRef<EditorSelection | null>(null)
  React.useEffect(() => {
    const prev = lastSelectedRef.current
    const next = selected
    const changed =
      (prev?.type !== next?.type) || (prev?.id !== next?.id)
    if (changed && next !== null) {
      setActiveTab("selection")
    }
    lastSelectedRef.current = next
  }, [selected])

  const handleModeChange = React.useCallback(
    (nextMode: WorkflowConfig["mode"]) => {
      onWorkflowChange({ ...workflow, mode: nextMode })
    },
    [workflow, onWorkflowChange],
  )

  const safeCapabilities: WorkflowCapabilities = capabilities ?? {}
  const safeOnCapabilitiesChange = React.useCallback(
    (patch: WorkflowCapabilities) => {
      if (onCapabilitiesChange) onCapabilitiesChange(patch)
    },
    [onCapabilitiesChange],
  )

  const tabs: Array<{ id: TabId; label: string; testId: string }> = [
    { id: "selection", label: T("Seçim", "Selection"), testId: "tab-selection" },
    { id: "flow", label: T("Akış", "Flow"), testId: "tab-flow" },
    { id: "capabilities", label: T("Yetenek", "Caps"), testId: "tab-capabilities" },
    { id: "validation", label: T("Doğrulama", "Validate"), testId: "tab-validation" },
    { id: "shortcuts", label: T("Kısayol", "Keys"), testId: "tab-shortcuts" },
  ]

  return (
    <aside
      style={{
        width: 320,
        flexShrink: 0,
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        // height:100% + minHeight:0 ensure the panel is bounded by the
        // parent grid row (which is pinned to the flex container height
        // via gridTemplateRows: minmax(0, 1fr)). Without minHeight:0 a
        // tall NodeEditor would expand the grid row and push the canvas
        // off-screen (2026-05-18 UX fix).
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <div
        role="tablist"
        aria-label={T("Editör panelleri", "Editor panels")}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          // flexShrink:0 keeps the tab header at its natural height when
          // the aside is height-bounded — the tab body absorbs all the
          // shrinkage via minHeight:0 + overflowY:auto.
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              aria-controls={`right-panel-${tab.id}`}
              data-testid={tab.testId}
              onClick={() => setActiveTab(tab.id)}
              style={{
                appearance: "none",
                background: "transparent",
                border: 0,
                borderBottom: active
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                padding: "10px 4px",
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--fg)" : "var(--fg-muted)",
                cursor: "pointer",
                transition: "color 120ms, border-color 120ms",
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`right-panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        style={TAB_BODY_STYLE}
      >
        {activeTab === "selection" && (
          <SelectionPanel
            workflow={workflow}
            selected={selected}
            onWorkflowChange={onWorkflowChange}
            editorMode={editorMode}
            onColumnEngineFieldsChange={onColumnEngineFieldsChange}
          />
        )}
        {activeTab === "flow" && (
          <FlowRules mode={workflow.mode} onChange={handleModeChange} />
        )}
        {activeTab === "capabilities" && (
          <CapabilitiesPanel
            capabilities={safeCapabilities}
            onCapabilitiesChange={safeOnCapabilitiesChange}
            editorMode={editorMode}
            canEdit={canEdit}
          />
        )}
        {activeTab === "validation" && <ValidationPanel workflow={workflow} />}
        {activeTab === "shortcuts" && <ShortcutsPanel />}
      </div>
    </aside>
  )
}
