"use client"

// GroupCloudNode — read-only baseline group cloud renderer (CONTEXT D-22,
// EDIT-02; UI-SPEC §12 lines 1245-1287).
//
// Plan 12-01 ships the read-only visual only. Full DnD / drop-association /
// "Grupla / Grubu Çöz" toggle wiring lands in Plan 12-08. The cloud's d-string
// is computed via the pure `computeHull` helper in lib/lifecycle/cloud-hull.

import * as React from "react"
import { type NodeProps } from "@xyflow/react"
import { computeHull, type Point } from "@/lib/lifecycle/cloud-hull"

export interface GroupCloudNodeData {
  /** Node positions inside the group (parent-relative). Required to compute the cloud. */
  childPositions: Point[]
  name?: string
  /** Color token suffix, e.g. 'status-progress'. */
  color?: string
  width?: number
  height?: number
  selected?: boolean
}

function GroupCloudNodeImpl({ data }: NodeProps) {
  const d = (data ?? {}) as GroupCloudNodeData
  const childPositions = d.childPositions ?? []
  const tokenColor = d.color ?? "primary"
  const fill = `color-mix(in oklch, var(--${tokenColor}) 8%, transparent)`
  const stroke = `color-mix(in oklch, var(--${tokenColor}) 35%, transparent)`

  const dPath = React.useMemo(() => computeHull(childPositions, 16), [childPositions])

  // Width/height are caller-supplied (React Flow needs concrete bounds for hit
  // testing); the SVG fills them.
  const width = d.width ?? 600
  const height = d.height ?? 200

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
          strokeWidth={d.selected ? 2 : 1.2}
          style={{ transition: "d 100ms ease, stroke 120ms ease" }}
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
