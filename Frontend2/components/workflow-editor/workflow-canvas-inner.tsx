"use client"

// WorkflowCanvasInner — the actual @xyflow/react mount point.
//
// Plan 12-01 ships READ-ONLY mode operational. Editor interactivity (DnD,
// edge create, group create, inline edit, context menu, undo/redo wiring) is
// wired in Plan 12-08; this file already exposes the props & locks for the
// editor mode but the LifecycleTab consumer in Plan 12-04 will pass
// `readOnly={true}`.
//
// Pitfall 1: NODE_TYPES + EDGE_TYPES are MODULE-SCOPED constants. They must
// NOT be re-created inside the function body — React Flow tears down the
// graph between renders if the type-map identity changes.
//
// CSS import is co-located with this module so the dynamic chunk pulls the
// stylesheet too.

import * as React from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  type NodeTypes,
  type EdgeTypes,
  type Node as RFNode,
  type Edge as RFEdge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { PhaseNode } from "./phase-node"
import { PhaseEdge } from "./phase-edge"
import { GroupCloudNode } from "./group-cloud-node"

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

export interface WorkflowCanvasInnerProps {
  nodes: RFNode[]
  edges: RFEdge[]
  readOnly?: boolean
  showMiniMap?: boolean
  /** Called when a node is clicked. */
  onNodeClick?: (event: React.MouseEvent, node: RFNode) => void
  /** Called when an edge is clicked. */
  onEdgeClick?: (event: React.MouseEvent, edge: RFEdge) => void
  onNodesChange?: (changes: unknown[]) => void
  onEdgesChange?: (changes: unknown[]) => void
}

export function WorkflowCanvasInner(props: WorkflowCanvasInnerProps) {
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
        edgesUpdatable={!readOnly}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        fitView
        onNodeClick={props.onNodeClick}
        onEdgeClick={props.onEdgeClick}
        onNodesChange={props.onNodesChange as never}
        onEdgesChange={props.onEdgesChange as never}
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
        {!readOnly ? <Controls position="bottom-right" /> : null}
        {props.showMiniMap !== false ? (
          <MiniMap
            pannable
            zoomable
            position="bottom-left"
            style={{
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
