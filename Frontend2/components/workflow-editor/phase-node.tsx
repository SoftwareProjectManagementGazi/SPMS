"use client"

// PhaseNode — custom React Flow node renderer with 4-way handles
// (CONTEXT D-08, D-12, D-15, D-30, D-47; UI-SPEC §10 lines 1167-1207).
//
// Geometry: 140x60 div with oklch tokens. State-driven box-shadow:
//   default     -> inset 1px var(--border-strong)
//   active      -> 0 0 0 2px var(--primary) outer ring
//   past        -> opacity 0.55 + inset 1px var(--border)
//   future      -> opacity 0.85 + inset 1px var(--border) (subtle)
//   unreachable -> opacity 0.4 + dashed inset border
//
// 8 Handle elements (top/right/bottom/left x source/target) per CONTEXT D-12.
// Use `visibility: hidden` (NOT display:none — Pitfall 4) so React Flow can
// still hit-test the handle on hover; the canvas reveals them via CSS.

import * as React from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { CycleCounterBadge } from "./cycle-counter-badge"

export type PhaseNodeState = "default" | "active" | "past" | "future" | "unreachable" | "dragging"

export interface PhaseNodeData {
  name: string
  description?: string
  /** Status / color token suffix — e.g. 'status-progress', 'priority-high'. */
  color?: string
  state?: PhaseNodeState
  isInitial?: boolean
  isFinal?: boolean
  isArchived?: boolean
  cycleCount?: number
  wipLimit?: number | null
  wipUsage?: number
  selected?: boolean
  /** Set to true in editor mode to expose the inline-edit input on dblclick. */
  editMode?: boolean
}

interface BoxStyle {
  boxShadow: string
  opacity: number
  borderStyle?: "solid" | "dashed"
}

const STATE_STYLES: Record<PhaseNodeState, BoxStyle> = {
  default: {
    boxShadow: "inset 0 0 0 1px var(--border-strong)",
    opacity: 1,
  },
  active: {
    boxShadow:
      "0 0 0 2px var(--primary), inset 0 0 0 1px color-mix(in oklch, var(--primary) 40%, transparent)",
    opacity: 1,
  },
  past: {
    boxShadow: "inset 0 0 0 1px var(--border)",
    opacity: 0.55,
  },
  future: {
    boxShadow: "inset 0 0 0 1px var(--border)",
    opacity: 0.85,
  },
  unreachable: {
    boxShadow: "inset 0 0 0 1px var(--border)",
    opacity: 0.4,
    borderStyle: "dashed",
  },
  dragging: {
    boxShadow:
      "0 8px 24px color-mix(in oklch, var(--primary) 25%, transparent), inset 0 0 0 1px var(--primary)",
    opacity: 1,
  },
}

const HANDLE_HIDDEN: React.CSSProperties = {
  visibility: "hidden",
  width: 8,
  height: 8,
}

function PhaseNodeImpl({ data, selected }: NodeProps) {
  const d = (data ?? {}) as PhaseNodeData
  const state: PhaseNodeState = d.state ?? "default"
  const stateStyle = STATE_STYLES[state] ?? STATE_STYLES.default
  const tokenColor = d.color ?? "status-todo"

  return (
    <div
      data-state={state}
      data-selected={selected ? "true" : "false"}
      style={{
        position: "relative",
        width: 140,
        height: 60,
        padding: "8px 10px",
        borderRadius: 10,
        background: "var(--surface)",
        color: "var(--fg)",
        boxShadow:
          stateStyle.boxShadow +
          (selected
            ? ", 0 0 0 2px color-mix(in oklch, var(--primary) 60%, transparent)"
            : ""),
        opacity: stateStyle.opacity,
        borderStyle: stateStyle.borderStyle ?? "solid",
        cursor: "default",
        userSelect: "none",
      }}
    >
      {/* 8 handles — top/right/bottom/left x source/target */}
      <Handle
        type="source"
        id="top-source"
        position={Position.Top}
        style={HANDLE_HIDDEN}
      />
      <Handle
        type="target"
        id="top-target"
        position={Position.Top}
        style={HANDLE_HIDDEN}
      />
      <Handle
        type="source"
        id="right-source"
        position={Position.Right}
        style={HANDLE_HIDDEN}
      />
      <Handle
        type="target"
        id="right-target"
        position={Position.Right}
        style={HANDLE_HIDDEN}
      />
      <Handle
        type="source"
        id="bottom-source"
        position={Position.Bottom}
        style={HANDLE_HIDDEN}
      />
      <Handle
        type="target"
        id="bottom-target"
        position={Position.Bottom}
        style={HANDLE_HIDDEN}
      />
      <Handle
        type="source"
        id="left-source"
        position={Position.Left}
        style={HANDLE_HIDDEN}
      />
      <Handle
        type="target"
        id="left-target"
        position={Position.Left}
        style={HANDLE_HIDDEN}
      />

      {/* Status dot */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 8,
          left: 10,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: `var(--${tokenColor})`,
        }}
      />

      {/* Name */}
      <div
        style={{
          marginLeft: 14,
          fontWeight: 600,
          fontSize: 13,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {d.name}
      </div>

      {/* Description */}
      {d.description ? (
        <div
          style={{
            marginLeft: 14,
            marginTop: 2,
            fontSize: 11,
            color: "var(--fg-subtle)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {d.description}
        </div>
      ) : null}

      {/* Initial / Final markers */}
      {d.isInitial ? (
        <span
          aria-label="initial"
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--primary)",
          }}
        />
      ) : null}
      {d.isFinal ? (
        <span
          aria-label="final"
          style={{
            position: "absolute",
            bottom: 6,
            right: 8,
            width: 8,
            height: 8,
            background: "var(--status-done)",
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }}
        />
      ) : null}

      {/* WIP indicator (Kanban / status flow) */}
      {d.wipLimit ? (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: 10,
            fontSize: 9.5,
            color: "var(--fg-subtle)",
          }}
        >
          {d.wipUsage ?? 0}/{d.wipLimit}
        </div>
      ) : null}

      {/* Cycle counter badge */}
      <CycleCounterBadge count={d.cycleCount ?? 0} />
    </div>
  )
}

export const PhaseNode = React.memo(PhaseNodeImpl)
