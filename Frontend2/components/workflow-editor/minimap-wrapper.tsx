"use client"

// MinimapWrapper (Phase 12 Plan 12-07) — placeholder container for the
// canvas-overlay minimap, positioned bottom-right. Plan 12-07 ships the
// container shell only; the actual `<MiniMap/>` from React Flow is rendered
// inside `WorkflowCanvasInner` (already shipped in Plan 12-01) when
// `showMiniMap !== false`.
//
// This wrapper exists for symmetry with the file list in 12-07-PLAN.md and
// reserves the layout slot. Plan 12-08 may move the MiniMap mount here for
// custom theming via React Flow's `style` prop on the inner-canvas component.
//
// Per UI-SPEC NEW-primitive line 50 + RESEARCH §313-329 — custom CSS variable
// theming is applied at the `<MiniMap>` mount inside workflow-canvas-inner.

import * as React from "react"

export interface MinimapWrapperProps {
  /** Children may be supplied by Plan 12-08 if MiniMap mount migrates here. */
  children?: React.ReactNode
}

export function MinimapWrapper({ children }: MinimapWrapperProps) {
  return (
    <div
      data-component="minimap-wrapper"
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: 4,
        pointerEvents: "auto",
        // Visual placeholder. The MiniMap is rendered by WorkflowCanvasInner
        // when showMiniMap is enabled. This wrapper is a layout slot for
        // future custom theming.
        width: 0,
        height: 0,
      }}
    >
      {children}
    </div>
  )
}
