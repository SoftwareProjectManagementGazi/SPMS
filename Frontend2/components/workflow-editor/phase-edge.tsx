"use client"

// PhaseEdge — custom React Flow edge renderer (CONTEXT D-08, EDIT-01,
// UI-SPEC §11 lines 1208-1244).
//
// Plan 12-01 ships the read-only renderer. Plan 12-08 adds inline label
// edit on double-click of the label pill (CONTEXT D-14).
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
  /** Plan 12-08 — enables inline label edit on dblclick. */
  editMode?: boolean
  /** Plan 12-08 — fired with the new label on Enter; not fired on Esc. */
  onLabelChange?: (next: string) => void
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

  // Plan 12-08 — inline label edit state.
  const [editing, setEditing] = React.useState(false)
  const [draftLabel, setDraftLabel] = React.useState<string>(d.label ?? "")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (!editing) setDraftLabel(d.label ?? "")
  }, [d.label, editing])

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const beginEdit = React.useCallback(() => {
    if (!d.editMode) return
    setDraftLabel(d.label ?? "")
    setEditing(true)
  }, [d.editMode, d.label])

  const commitEdit = React.useCallback(() => {
    const next = draftLabel.trim()
    if (next !== (d.label ?? "")) {
      d.onLabelChange?.(next)
    }
    setEditing(false)
  }, [draftLabel, d])

  const cancelEdit = React.useCallback(() => {
    setDraftLabel(d.label ?? "")
    setEditing(false)
  }, [d.label])

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
          {/* Plan 12-08: label pill is the inline-edit trigger when editMode is true. */}
          {editing ? (
            <input
              ref={inputRef}
              data-field="edge-label-input"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitEdit()
                } else if (e.key === "Escape") {
                  e.preventDefault()
                  cancelEdit()
                }
                e.stopPropagation()
              }}
              style={{
                background: "var(--surface)",
                color: "var(--fg)",
                padding: "1px 6px",
                borderRadius: 999,
                fontSize: 10.5,
                border: 0,
                outline: 0,
                boxShadow: "inset 0 0 0 1px var(--primary)",
                minWidth: 80,
              }}
            />
          ) : d.label || d.editMode ? (
            <span
              data-field="edge-label"
              onDoubleClick={beginEdit}
              style={{
                background: "var(--surface)",
                padding: "1px 6px",
                borderRadius: 999,
                fontSize: 10.5,
                color: "var(--fg-muted)",
                boxShadow: "inset 0 0 0 1px var(--border)",
                whiteSpace: "nowrap",
                cursor: d.editMode ? "text" : "default",
                minHeight: 14,
              }}
            >
              {d.label || (d.editMode ? " " : "")}
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
