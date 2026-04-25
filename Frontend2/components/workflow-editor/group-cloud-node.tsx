"use client"

// GroupCloudNode — group cloud renderer (CONTEXT D-22, EDIT-02; UI-SPEC §12
// lines 1245-1287).
//
// Plan 12-01 shipped the read-only baseline. Plan 12-08 extends with:
//   1. `data.hullPath` prop — pre-computed d-string from the editor's
//      onNodeDrag live morph. When supplied, takes precedence over the
//      memoized computeHull() output (so a parent can drive smooth
//      morphing on every drag frame without forcing the cloud node to
//      recompute the hull from `childPositions`).
//   2. `data.dragOver` prop — drop-target visual feedback when a loose
//      node is being dragged into the group's hull (entry-point #3 in
//      CONTEXT D-20).
//   3. CSS `transition: d 100ms ease` on the path (UI-SPEC line 1469).

import * as React from "react"
import { type NodeProps } from "@xyflow/react"
import { computeHull, type Point } from "@/lib/lifecycle/cloud-hull"

export interface GroupCloudNodeData {
  /** Node positions inside the group (parent-relative). Required to compute the cloud. */
  childPositions: Point[]
  /** Plan 12-08 — pre-computed hull d-string overrides the memoized
   *  computeHull() output. Used by the editor for live morph during drag. */
  hullPath?: string
  name?: string
  /** Color token suffix, e.g. 'status-progress'. */
  color?: string
  width?: number
  height?: number
  selected?: boolean
  /** Plan 12-08 — true while a draggable node is hovering over the cloud
   *  hull; renders the dashed primary-tone outline drop-target indicator. */
  dragOver?: boolean
}

function GroupCloudNodeImpl({ data }: NodeProps) {
  const d = (data ?? {}) as GroupCloudNodeData
  const childPositions = d.childPositions ?? []
  const tokenColor = d.color ?? "primary"
  const fill = `color-mix(in oklch, var(--${tokenColor}) 8%, transparent)`
  const baseStroke = `color-mix(in oklch, var(--${tokenColor}) 35%, transparent)`
  const dragOverStroke = "var(--primary)"

  // Plan 12-08: hullPath prop wins; otherwise fall back to the pure helper.
  const computedPath = React.useMemo(
    () => computeHull(childPositions, 16),
    [childPositions],
  )
  const dPath = d.hullPath ?? computedPath

  // Width/height are caller-supplied (React Flow needs concrete bounds for hit
  // testing); the SVG fills them.
  const width = d.width ?? 600
  const height = d.height ?? 200

  const stroke = d.dragOver ? dragOverStroke : baseStroke
  const strokeWidth = d.dragOver ? 2 : d.selected ? 2 : 1.2
  const strokeDasharray = d.dragOver ? "6 4" : "none"

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <path
          d={dPath}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={{
            // UI-sweep: dropped `d` from transition list — CSS does not animate
            // SVG path `d` attribute in any browser (experimental SVG attribute
            // animation API only). The hull morph is intentionally instant
            // (recompute is <16ms / frame per Plan 01 bench). Stroke + dasharray
            // still tween for hover/select state changes.
            transition: "stroke 120ms ease, stroke-dasharray 120ms ease",
          }}
        />
      </svg>

      {d.name ? (
        <span
          style={{
            position: "absolute",
            top: -10,
            left: 8,
            background: "var(--surface)",
            padding: "1px 8px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 500,
            color: "var(--fg-muted)",
            boxShadow: "inset 0 0 0 1px var(--border)",
            pointerEvents: "auto",
          }}
        >
          {d.name}
        </span>
      ) : null}
    </div>
  )
}

export const GroupCloudNode = React.memo(GroupCloudNodeImpl)
