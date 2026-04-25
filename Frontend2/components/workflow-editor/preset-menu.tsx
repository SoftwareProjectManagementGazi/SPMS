"use client"

// PresetMenu — "Şablon Yükle" dropdown for the workflow editor toolbar
// (Phase 12 Plan 12-10 Task 2; satisfies EDIT-07).
//
// Shows the 9 presets from Frontend2/lib/lifecycle/presets.ts. When the
// canvas is dirty (unsaved changes), selecting a preset opens a
// ConfirmDialog with the TR copy "Mevcut değişiklikler kaybolacak…" — on
// confirm, calls the parent's onApply(presetId). When clean (dirty=false),
// the click bypasses the dialog and applies directly.
//
// Visual structure: trigger Button "Şablon Yükle" + optional current-preset
// Badge mono → click toggles a popover dropdown listing each preset entry.
// Click-outside dismiss is handled via a window mousedown listener.
//
// The component is presentation-only; the editor wires the apply handler
// via props (PresetMenu → applyPreset → resolvePreset(id) → setWorkflow).

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Badge, Button } from "@/components/primitives"
import { ConfirmDialog } from "@/components/projects/confirm-dialog"
import { useApp } from "@/context/app-context"

import {
  PRESETS_BY_ID,
  PRESET_LABELS_TR,
  PRESET_LABELS_EN,
  type PresetId,
} from "@/lib/lifecycle/presets"

export interface PresetMenuProps {
  /** When the current workflow shape matches a preset, render its label as a Badge. */
  currentPresetId: PresetId | null
  /** When true, selecting a preset routes through ConfirmDialog before calling onApply. */
  dirty: boolean
  /** Apply handler — receives the chosen preset id. */
  onApply: (id: PresetId) => void
}

export function PresetMenu({ currentPresetId, dirty, onApply }: PresetMenuProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const labelFor = React.useCallback(
    (id: PresetId) =>
      language === "tr" ? PRESET_LABELS_TR[id] : PRESET_LABELS_EN[id],
    [language],
  )

  const [open, setOpen] = React.useState(false)
  const [pendingPreset, setPendingPreset] = React.useState<PresetId | null>(
    null,
  )
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  // Click-outside dismiss for the dropdown.
  React.useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      const root = containerRef.current
      if (!root) return
      if (!root.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener("mousedown", onDocMouseDown)
    return () => window.removeEventListener("mousedown", onDocMouseDown)
  }, [open])

  // Selection handler — gates on dirty.
  const handleSelect = React.useCallback(
    (id: PresetId) => {
      if (dirty) {
        setPendingPreset(id)
      } else {
        onApply(id)
        setOpen(false)
      }
    },
    [dirty, onApply],
  )

  const handleConfirm = React.useCallback(() => {
    if (pendingPreset) {
      onApply(pendingPreset)
    }
    setPendingPreset(null)
    setOpen(false)
  }, [pendingPreset, onApply])

  const handleCancel = React.useCallback(() => {
    setPendingPreset(null)
  }, [])

  // Build the preset id list once. Iterates Object.keys but the literal-typed
  // PRESET_LABELS_TR keys are PresetId — cast at the boundary.
  const PRESET_IDS = React.useMemo(
    () => Object.keys(PRESETS_BY_ID) as PresetId[],
    [],
  )

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        icon={<ChevronDown size={14} />}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {T("Şablon Yükle", "Load Template")}
      </Button>
      {currentPresetId ? (
        <Badge tone="mono" size="xs">
          {labelFor(currentPresetId)}
        </Badge>
      ) : null}

      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 100,
            minWidth: 180,
            background: "var(--surface)",
            borderRadius: "var(--radius-sm)",
            // UI-sweep: --shadow-md is always defined in globals.css; rgba fallback
            // dropped (it would mismatch the oklch color space anyway).
            boxShadow: "var(--shadow-md), inset 0 0 0 1px var(--border)",
            padding: 4,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {PRESET_IDS.map((id) => (
            <button
              key={id}
              role="menuitem"
              onClick={() => handleSelect(id)}
              className="hover-row"
              style={{
                width: "100%",
                textAlign: "left",
                // UI-sweep: standardized at "6px 10px" per UI-SPEC §158 ContextMenu spec.
                padding: "6px 10px",
                background: "transparent",
                border: 0,
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                color: "var(--fg)",
                cursor: "pointer",
              }}
            >
              {labelFor(id)}
            </button>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingPreset !== null}
        title={T("Şablon Yüklenecek", "Load Template")}
        body={T(
          "Mevcut değişiklikler kaybolacak. Devam etmek istiyor musunuz?",
          "Current changes will be discarded. Continue?",
        )}
        confirmLabel={T("Devam Et", "Continue")}
        cancelLabel={T("Vazgeç", "Cancel")}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

/**
 * detectCurrentPresetId — best-effort match between the working workflow
 * and one of the 9 presets. Returns the matching PresetId or null when the
 * workflow has been customized beyond a baseline preset shape.
 *
 * Strategy: compare node count, edge count, and mode. This is a coarse
 * heuristic — exact-match with custom node positions is unrealistic since
 * users freely move nodes around. Two presets cannot collide on (mode,
 * nodes.length, edges.length) given the 9 shipped templates today, so the
 * heuristic is unambiguous.
 */
export function detectCurrentPresetId(workflow: {
  mode: string
  nodes: { id: string }[]
  edges: { id: string }[]
}): PresetId | null {
  for (const id of Object.keys(PRESETS_BY_ID) as PresetId[]) {
    const p = PRESETS_BY_ID[id]
    if (
      p.mode === workflow.mode &&
      p.nodes.length === workflow.nodes.length &&
      p.edges.length === workflow.edges.length
    ) {
      return id
    }
  }
  return null
}
