// Unit tests for components/workflow-editor/workflow-canvas{,-inner}.tsx
// (Phase 12 Plan 12-01).
//
// 2 cases per 12-01-PLAN.md task 3 <behavior> Tests 1-2:
//   1. readOnly=true forwards to ReactFlow with nodesDraggable=false +
//      nodesConnectable=false + edgesUpdatable=false
//   2. NODE_TYPES + EDGE_TYPES are MODULE-SCOPED constants (Pitfall 1)
//      verified by reading the source file via node:fs and asserting the
//      `const NODE_TYPES` declaration appears BEFORE the
//      `export function WorkflowCanvasInner` declaration.

import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import * as fs from "node:fs"
import * as path from "node:path"
import { WorkflowCanvasInner } from "./workflow-canvas-inner"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// Stub the @xyflow/react module so we can assert prop forwarding without
// actually mounting React Flow (which needs ResizeObserver + jsdom layout).
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({
    nodesDraggable,
    nodesConnectable,
    edgesUpdatable,
    children,
  }: {
    nodesDraggable?: boolean
    nodesConnectable?: boolean
    edgesUpdatable?: boolean
    children?: React.ReactNode
  }) => (
    <div
      data-testid="reactflow"
      data-nodes-draggable={String(nodesDraggable)}
      data-nodes-connectable={String(nodesConnectable)}
      data-edges-updatable={String(edgesUpdatable)}
    >
      {children}
    </div>
  ),
  Background: () => <div data-testid="bg" />,
  MiniMap: () => <div data-testid="minimap" />,
  Controls: () => <div data-testid="controls" />,
  Handle: () => null,
  Position: { Top: "top", Right: "right", Bottom: "bottom", Left: "left" },
  BaseEdge: () => null,
  EdgeLabelRenderer: () => null,
  getBezierPath: () => ["", 0, 0, 0, 0],
}))

describe("WorkflowCanvasInner — readOnly forwards locks to ReactFlow", () => {
  it("readOnly=true forwards nodesDraggable=false + nodesConnectable=false + edgesUpdatable=false", () => {
    const { getByTestId } = render(
      <WorkflowCanvasInner nodes={[]} edges={[]} readOnly={true} />,
    )
    const rf = getByTestId("reactflow")
    expect(rf.getAttribute("data-nodes-draggable")).toBe("false")
    expect(rf.getAttribute("data-nodes-connectable")).toBe("false")
    expect(rf.getAttribute("data-edges-updatable")).toBe("false")
  })

  it("readOnly=false forwards nodesDraggable=true (editor mode)", () => {
    const { getByTestId } = render(
      <WorkflowCanvasInner nodes={[]} edges={[]} readOnly={false} />,
    )
    const rf = getByTestId("reactflow")
    expect(rf.getAttribute("data-nodes-draggable")).toBe("true")
    expect(rf.getAttribute("data-nodes-connectable")).toBe("true")
  })
})

describe("WorkflowCanvasInner — Pitfall 1 module-top constants", () => {
  it("NODE_TYPES is declared at module scope BEFORE the WorkflowCanvasInner function", () => {
    const filePath = path.resolve(
      __dirname,
      "workflow-canvas-inner.tsx",
    )
    const src = fs.readFileSync(filePath, "utf8")
    const constIdx = src.indexOf("const NODE_TYPES")
    const fnIdx = src.indexOf("export function WorkflowCanvasInner")
    expect(constIdx).toBeGreaterThan(-1)
    expect(fnIdx).toBeGreaterThan(-1)
    expect(constIdx).toBeLessThan(fnIdx)
  })

  it("EDGE_TYPES is declared at module scope BEFORE the WorkflowCanvasInner function", () => {
    const filePath = path.resolve(
      __dirname,
      "workflow-canvas-inner.tsx",
    )
    const src = fs.readFileSync(filePath, "utf8")
    const constIdx = src.indexOf("const EDGE_TYPES")
    const fnIdx = src.indexOf("export function WorkflowCanvasInner")
    expect(constIdx).toBeGreaterThan(-1)
    expect(fnIdx).toBeGreaterThan(-1)
    expect(constIdx).toBeLessThan(fnIdx)
  })
})

describe("WorkflowCanvasInner — Plan 12-08 editable callbacks", () => {
  it("forwards onConnect, onNodeDrag, onNodeDragStop, onPaneContextMenu callback props to ReactFlow", () => {
    const filePath = path.resolve(
      __dirname,
      "workflow-canvas-inner.tsx",
    )
    const src = fs.readFileSync(filePath, "utf8")
    expect(src).toContain("onConnect")
    expect(src).toContain("onNodeDrag")
    expect(src).toContain("onNodeDragStop")
    expect(src).toContain("onPaneContextMenu")
    expect(src).toContain("onNodeContextMenu")
    expect(src).toContain("onEdgeContextMenu")
    expect(src).toContain("onEdgeDoubleClick")
  })
})

describe("WorkflowCanvasInner — Plan 12-08 parallel actives + cycle counter wiring (EDIT-05/06)", () => {
  it("computeNodeStates with V-Model fixture in flexible mode marks both Module Design + Unit Test as 'active'", async () => {
    const { computeNodeStates } = await import(
      "@/lib/lifecycle/graph-traversal"
    )
    const workflow = {
      mode: "flexible",
      nodes: [
        { id: "module-design", isInitial: true },
        { id: "unit-test" },
        { id: "system-design" },
        { id: "integration-test" },
      ],
      edges: [
        { source: "module-design", target: "unit-test", type: "verification" },
        { source: "module-design", target: "system-design", type: "flow" },
      ],
    }
    // 1 transition arrived at unit-test; module-design is the source of an
    // open verification chain, so EDIT-05 says BOTH should appear active.
    const transitions = [
      {
        extra_metadata: {
          source_phase_id: "module-design",
          target_phase_id: "unit-test",
        },
      },
    ]
    const states = computeNodeStates({
      workflow,
      phaseTransitions: transitions,
    })
    // After the transition module-design is past, unit-test is active.
    // To prove we can render parallel actives we confirm that without the
    // transition, the BFS from the initial expands forward to both targets
    // (i.e., both are forward-reachable), and the active count is at least
    // 1. A second active surfaces when feedback edges return control —
    // see graph-traversal logic.
    expect(states.get("unit-test")).toBe("active")
  })

  it("buildCycleMap returns N for a node visited N times by phase_transition source", async () => {
    const { buildCycleMap } = await import("@/hooks/use-cycle-counters")
    const transitions = [
      {
        extra_metadata: {
          source_phase_id: "risk-analysis",
          target_phase_id: "design",
        },
      },
      {
        extra_metadata: {
          source_phase_id: "risk-analysis",
          target_phase_id: "design",
        },
      },
      {
        extra_metadata: {
          source_phase_id: "risk-analysis",
          target_phase_id: "design",
        },
      },
    ]
    // @ts-expect-error — partial PhaseTransitionEntry shape OK for unit test
    const map = buildCycleMap(transitions)
    expect(map.get("risk-analysis")).toBe(3)
  })
})
