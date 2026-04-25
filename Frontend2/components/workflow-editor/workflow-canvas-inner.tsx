"use client"

// WorkflowCanvasInner — the actual @xyflow/react mount point.
//
// Plan 12-01 shipped READ-ONLY mode operational. Plan 12-08 wires editable
// mode: DnD, edge create from handle, group create/morph (5 entry points),
// inline edit, context menu, undo/redo. The component now accepts the full
// editable-callback surface and forwards every callback through to React
// Flow. The parent (editor-page) owns the workflow state + applies changes
// via onWorkflowChange.
//
// Pitfall 1: NODE_TYPES + EDGE_TYPES are MODULE-SCOPED constants. They must
// NOT be re-created inside the function body — React Flow tears down the
// graph between renders if the type-map identity changes.
//
// Live-morph hook: `onNodeDrag` recomputes hulls for any group whose
// children include the dragged node and emits the result via
// `onWorkflowChange`. Done synchronously every frame (no debounce — see
// CONTEXT D-23) because the budget is <16 ms and Plan 12-01 hull bench
// already passes for 50-node fixtures.

import * as React from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { PhaseNode } from "./phase-node"
import { PhaseEdge } from "./phase-edge"
import { GroupCloudNode } from "./group-cloud-node"
import { computeHull, type Point } from "@/lib/lifecycle/cloud-hull"

// Pitfall 1: define the type maps OUTSIDE the function body so their identity
// is stable across renders.
const NODE_TYPES: NodeTypes = {
  phase: PhaseNode,
  group: GroupCloudNode,
}

const EDGE_TYPES: EdgeTypes = {
  phase: PhaseEdge,
}

const DEFAULT_EDGE_OPTIONS = { type: "phase" }

const PRO_OPTIONS = { hideAttribution: true }

/** Imperative handle exposed to consumers for zoom / fit controls. */
export interface CanvasControlsHandle {
  zoomIn: () => void
  zoomOut: () => void
  fitView: () => void
}

export interface WorkflowCanvasInnerProps {
  nodes: RFNode[]
  edges: RFEdge[]
  readOnly?: boolean
  showMiniMap?: boolean
  /** Optional ref to access zoomIn / zoomOut / fitView from outside. */
  controlsRef?: React.RefObject<CanvasControlsHandle | null>
  /** Called when a node is clicked. */
  onNodeClick?: (event: React.MouseEvent, node: RFNode) => void
  /** Called when an edge is clicked. */
  onEdgeClick?: (event: React.MouseEvent, edge: RFEdge) => void
  // ---------------- Plan 12-08 editable callbacks ------------------------
  onNodesChange?: (changes: NodeChange[]) => void
  onEdgesChange?: (changes: EdgeChange[]) => void
  /** Edge created via drag-from-handle-to-handle. */
  onConnect?: (params: Connection) => void
  /** Phase 12 Plan 12-10 (Bug 2 UAT fix) — capture pre-drag snapshot once
   *  for history coalescing. The editor pushes the snapshot in onNodeDragStop
   *  so a single drag becomes a single undo entry. */
  onNodeDragStart?: (event: React.MouseEvent, node: RFNode) => void
  /** Per-frame drag callback — used to live-morph group cloud hulls. */
  onNodeDrag?: (event: React.MouseEvent, node: RFNode) => void
  /** End-of-drag callback — used to detect drop-association changes
   *  AND push the single coalesced history entry (Bug 2 UAT fix). */
  onNodeDragStop?: (event: React.MouseEvent, node: RFNode) => void
  /** Edge label inline-edit trigger. */
  onEdgeDoubleClick?: (event: React.MouseEvent, edge: RFEdge) => void
  /** Right-click on empty canvas — opens ContextMenu. */
  onPaneContextMenu?: (event: React.MouseEvent) => void
  /** Right-click on a node — opens ContextMenu. */
  onNodeContextMenu?: (event: React.MouseEvent, node: RFNode) => void
  /** Right-click on an edge — opens ContextMenu. */
  onEdgeContextMenu?: (event: React.MouseEvent, edge: RFEdge) => void
  /** Selection-change pass-through. */
  onSelectionChange?: (params: {
    nodes: RFNode[]
    edges: RFEdge[]
  }) => void
}

function CanvasControlsBridge({
  controlsRef,
}: {
  controlsRef?: React.RefObject<CanvasControlsHandle | null>
}) {
  const rf = useReactFlow()
  React.useEffect(() => {
    if (!controlsRef) return
    controlsRef.current = {
      zoomIn: () => rf.zoomIn({ duration: 180 }),
      zoomOut: () => rf.zoomOut({ duration: 180 }),
      fitView: () => rf.fitView({ duration: 180, padding: 0.15 }),
    }
    return () => {
      if (controlsRef.current) controlsRef.current = null
    }
  }, [rf, controlsRef])
  return null
}

export function WorkflowCanvasInner(props: WorkflowCanvasInnerProps) {
  return (
    <ReactFlowProvider>
      <CanvasControlsBridge controlsRef={props.controlsRef} />
      <CanvasBody {...props} />
    </ReactFlowProvider>
  )
}

function CanvasBody(props: WorkflowCanvasInnerProps) {
  const readOnly = Boolean(props.readOnly)
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 600 }}>
      <ReactFlow
        nodes={props.nodes}
        edges={props.edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        proOptions={PRO_OPTIONS}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        edgesReconnectable={!readOnly}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        fitView
        onNodeClick={props.onNodeClick}
        onEdgeClick={props.onEdgeClick}
        onNodesChange={props.onNodesChange as never}
        onEdgesChange={props.onEdgesChange as never}
        onConnect={props.onConnect as never}
        onNodeDragStart={props.onNodeDragStart as never}
        onNodeDrag={props.onNodeDrag as never}
        onNodeDragStop={props.onNodeDragStop as never}
        onEdgeDoubleClick={props.onEdgeDoubleClick as never}
        onPaneContextMenu={props.onPaneContextMenu as never}
        onNodeContextMenu={props.onNodeContextMenu as never}
        onEdgeContextMenu={props.onEdgeContextMenu as never}
        onSelectionChange={props.onSelectionChange as never}
      >
        {/* Shared SVG markers used by PhaseEdge */}
        <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
          <defs>
            <marker
              id="arr"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--fg-subtle)" />
            </marker>
            <marker
              id="arrPrimary"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" />
            </marker>
          </defs>
        </svg>

        <Background
          variant={"dots" as never}
          gap={20}
          color="color-mix(in oklch, var(--border-strong) 50%, transparent)"
        />
        {!readOnly ? <Controls position="bottom-left" /> : null}
        {props.showMiniMap !== false ? (
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            style={{
              width: 180,
              height: 100,
              background: "var(--surface-2)",
              boxShadow: "inset 0 0 0 1px var(--border)",
              borderRadius: "var(--radius-sm)",
            }}
          />
        ) : null}
      </ReactFlow>
    </div>
  )
}

// ============================================================================
// Helpers — exported so editor-page wiring can consume them.
// ============================================================================

/**
 * Recompute the SVG hull path for every group based on its `children` array
 * and the current set of node positions. Used by editor-page's
 * `onNodeDrag` callback for live cloud morph (CONTEXT D-22 + D-23).
 *
 * `padding` defaults to 16 px to match the Plan 12-01 baseline.
 */
export function recomputeGroupHulls(
  groupChildrenMap: Map<string, string[]>,
  nodePositions: Map<string, Point>,
  padding: number = 16,
): Map<string, string> {
  const out = new Map<string, string>()
  for (const [groupId, childIds] of groupChildrenMap) {
    const positions: Point[] = []
    for (const childId of childIds) {
      const p = nodePositions.get(childId)
      if (p) positions.push(p)
    }
    if (positions.length >= 2) {
      out.set(groupId, computeHull(positions, padding))
    }
  }
  return out
}

/**
 * Point-in-polygon ray-cast test (~20 LOC). Used by drop-association policy
 * (CONTEXT 'Claude\'s Discretion last bullet') to decide whether a node
 * dropped at coordinates (x,y) is still inside its parent group's hull.
 *
 * Polygon vertices are extracted from the SVG d-string; supports the
 * 'M ... Q a b c d ... Z' shape produced by `computeHull`.
 */
export function pointInPolygon(
  point: Point,
  polygon: Point[],
): boolean {
  if (polygon.length < 3) return false
  let inside = false
  const { x, y } = point
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * isDroppedOutsideParent — drop-association policy helper (CONTEXT
 * 'Claude\'s Discretion last bullet'). Given a node's final drop point
 * and its current parent group's hull polygon, returns true when the
 * point falls OUTSIDE the polygon — meaning the node should have its
 * `parentId` cleared and the parent group's hull should reshrink.
 *
 * Caller (editor-page) reads node.parentId, runs this helper, and on
 * `true` emits an updated workflow where that node's `parentId` is
 * cleared and the affected group's children list is filtered.
 */
export interface DropAssociationInput {
  point: Point
  /** parentId of the dropped node (undefined when no parent). */
  parentId?: string
  parentHullPath?: string
}

export function isDroppedOutsideParent(input: DropAssociationInput): boolean {
  if (!input.parentId || !input.parentHullPath) return false
  const polygon = pathToPolygon(input.parentHullPath)
  if (polygon.length < 3) return false
  return !pointInPolygon(input.point, polygon)
}

/**
 * Parse an `M x y Q ... Z` SVG path into a list of polygon vertices for
 * point-in-polygon tests. Pulls every numeric pair after each command
 * letter and drops the bezier control points (every other Q-pair).
 */
export function pathToPolygon(d: string): Point[] {
  const out: Point[] = []
  if (!d) return out
  // Regex matches "letter" + (numbers separated by space/comma)
  const cmdRe = /([MLQZ])\s*([^MLQZ]*)/g
  let match: RegExpExecArray | null = null
  while ((match = cmdRe.exec(d))) {
    const cmd = match[1]
    const args = match[2].trim().split(/[\s,]+/).filter(Boolean).map(Number)
    if (cmd === "M" || cmd === "L") {
      for (let i = 0; i + 1 < args.length; i += 2) {
        out.push({ x: args[i], y: args[i + 1] })
      }
    } else if (cmd === "Q") {
      // Q ctrlX ctrlY endX endY — keep only the end point.
      for (let i = 0; i + 3 < args.length; i += 4) {
        out.push({ x: args[i + 2], y: args[i + 3] })
      }
    }
    // Z: no args, closes the path.
  }
  return out
}
