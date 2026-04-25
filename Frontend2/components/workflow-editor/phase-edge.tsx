"use client"

// PhaseEdge — custom React Flow edge renderer (CONTEXT D-08, EDIT-01,
// UI-SPEC §11 lines 1208-1244).
//
// strokeDasharray patterns (preserved when edge is selected):
//   flow         -> 'none'    + var(--fg-subtle)
//   verification -> '6 3'     + var(--status-progress)
//   feedback     -> '8 4 2 4' + var(--status-review)
//
// Variants:
//   selected         -> stroke=var(--primary), strokeWidth=2.5, dasharray preserved
//   bidirectional    -> arrow markers on BOTH ends; "↔" glyph adjacent to label
//   isAllGate        -> AllGatePill rendered next to target endpoint;
//                       source-side arrow stub omitted (CONTEXT D-17)

import * as React from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react"
import { AllGatePill } from "./all-gate-pill"

export type PhaseEdgeType = "flow" | "verification" | "feedback"

export interface PhaseEdgeData {
  type?: PhaseEdgeType
  label?: string
  bidirectional?: boolean
  isAllGate?: boolean
}

interface VisualSpec {
  stroke: string
  strokeDasharray: string
}

const VISUALS: Record<PhaseEdgeType, VisualSpec> = {
  flow: { stroke: "var(--fg-subtle)", strokeDasharray: "none" },
  verification: { stroke: "var(--status-progress)", strokeDasharray: "6 3" },
  feedback: { stroke: "var(--status-review)", strokeDasharray: "8 4 2 4" },
}

function PhaseEdgeImpl({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const d = (data ?? {}) as PhaseEdgeData
  const type: PhaseEdgeType = d.type ?? "flow"
  const visual = VISUALS[type]

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const stroke = selected ? "var(--primary)" : visual.stroke
  const strokeWidth = selected ? 2.5 : 1.5

  // For all-gate edges, suppress the source-side marker (no source arrow); the
  // AllGatePill takes its place visually next to the target.
  const markerEnd = "url(#arr)"
  const markerStart = d.bidirectional && !d.isAllGate ? "url(#arr)" : undefined

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke,
          strokeWidth,
          strokeDasharray: visual.strokeDasharray,
          fill: "none",
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            display: "flex",
            alignItems: "center",
            gap: 4,
            pointerEvents: "all",
          }}
        >
          {d.bidirectional ? (
            <span
              aria-label="bidirectional"
              style={{
                fontSize: 12,
                color: stroke,
                lineHeight: 1,
              }}
            >
              ↔
            </span>
          ) : null}
          {d.label ? (
            <span
              style={{
                background: "var(--surface)",
                padding: "1px 6px",
                borderRadius: 999,
                fontSize: 10.5,
                color: "var(--fg-muted)",
                boxShadow: "inset 0 0 0 1px var(--border)",
                whiteSpace: "nowrap",
              }}
            >
              {d.label}
            </span>
          ) : null}
          {d.isAllGate ? (
            <AllGatePill
              style={{
                marginLeft: 4,
              }}
            />
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const PhaseEdge = React.memo(PhaseEdgeImpl)
