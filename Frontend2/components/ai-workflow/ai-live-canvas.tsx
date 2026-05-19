"use client"

/**
 * AI Live Canvas — reuses the existing WorkflowCanvas (React Flow) primitive
 * in read-only mode and progressively converts streamed AI events into
 * RF nodes and edges. Nodes auto-layout into a horizontal grid since the AI
 * adapter doesn't emit positions.
 *
 * Animations come from globals.css (ai-generated-node scale-in, ai-edge-animating
 * stroke dash flow). Each newly mounted node carries the .ai-generated-node
 * class via wrapper div so the entrance animation fires once.
 *
 * Plan ref: .planning/ai-workflow-generator-plan.md §5.2 ai-live-canvas.tsx
 */

import * as React from "react"
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react"

import type {
  SuggestedEdgePayload,
  SuggestedNodePayload,
} from "@/lib/ai/types"
import { WorkflowCanvas } from "@/components/workflow-editor/workflow-canvas"

export interface AILiveCanvasProps {
  nodes: SuggestedNodePayload[]
  edges: SuggestedEdgePayload[]
  /** When true, edge stroke animates (Wave 3 streaming visual cue). */
  isGenerating: boolean
}

export function AILiveCanvas({ nodes, edges, isGenerating }: AILiveCanvasProps) {
  // Convert SuggestedNodePayload → RFNode. Positions come from the adapter
  // (methodology-aware layout) — we never compute them client-side so nodes
  // never "shuffle" as the stream progresses. Combined with disableAutoFit
  // on WorkflowCanvas, this makes the drawing cadence look natural.
  const rfNodes: RFNode[] = React.useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: "phase",
        position: { x: n.x, y: n.y },
        // The `.ai-generated-node` class hangs off the RF node wrapper;
        // React Flow forwards className via the `className` prop on the node spec.
        className: "ai-generated-node",
        data: {
          name: n.label,
          description: n.description,
          color: n.color,
          state: "default",
          cycleCount: 0,
          editMode: false,
        },
        draggable: false,
        selectable: false,
      })),
    [nodes],
  )

  // Convert SuggestedEdgePayload → RFEdge. PhaseEdge custom renderer uses
  // edge_type to pick stroke pattern (solid/dashed/dotted), so we forward it
  // via data alongside React Flow's standard source/target.
  const rfEdges: RFEdge[] = React.useMemo(
    () =>
      edges.map((e, idx) => ({
        id: `ai-edge-${idx}`,
        source: e.source_id,
        target: e.target_id,
        type: "phase",
        // While the stream is in progress, freshly-arrived edges animate via
        // CSS class; once the stream completes (`isGenerating=false`) we keep
        // the visual steady so the rationale card can claim user focus.
        className: isGenerating ? "ai-edge-animating" : undefined,
        data: {
          edgeType: e.edge_type,
          label: e.label,
          bidirectional: e.bidirectional,
          isAllGate: e.is_all_gate,
        },
        label: e.label ?? undefined,
      })),
    [edges, isGenerating],
  )

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        position: "relative",
      }}
    >
      <WorkflowCanvas
        nodes={rfNodes}
        edges={rfEdges}
        readOnly
        showMiniMap={false}
        disableAutoFit
      />
      {isGenerating && (
        <div
          style={{
            position: "absolute",
            left: 16,
            bottom: 16,
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--ai-accent-soft)",
            color: "var(--ai-accent)",
            fontSize: 12,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "var(--shadow-sm)",
            pointerEvents: "none",
          }}
        >
          <span
            className="ai-sparkle-idle"
            style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: "var(--ai-accent)" }}
            aria-hidden
          />
          AI çiziyor…
        </div>
      )}
    </div>
  )
}
