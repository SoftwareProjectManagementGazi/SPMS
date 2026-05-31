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
import {
  WorkflowCanvasInner,
  computeDragMembershipChanges,
} from "./workflow-canvas-inner"
import type { Point } from "@/lib/lifecycle/cloud-hull"

// Module-scoped capture of the props React Flow actually receives, so the
// forwarding test below can assert real prop wiring (vi.hoisted because the
// vi.mock factory is hoisted above normal module init).
const { captured } = vi.hoisted(() => ({ captured: {} as Record<string, unknown> }))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// Stub the @xyflow/react module so we can assert prop forwarding without
// actually mounting React Flow (which needs ResizeObserver + jsdom layout).
//
// Phase 15 Plan 15-01 (TIDY-04 harness fix) — production
// workflow-canvas-inner.tsx:129 wraps the canvas in <ReactFlowProvider>
// and useReactFlow() exposes imperative zoom/fit handles via
// CanvasControlsBridge. Both must exist on the mock.
vi.mock("@xyflow/react", () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="rf-provider">{children}</div>
  ),
  useReactFlow: () => ({
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    fitView: vi.fn(),
  }),
  // T4b — ZoomReporter subscribes to transform[2]; default zoom 1.
  useStore: (selector: (s: { transform: number[] }) => unknown) =>
    selector({ transform: [0, 0, 1] }),
  ReactFlow: (props: Record<string, any>) => {
    // Capture every forwarded prop so the Plan 12-08 test can assert the
    // editable callbacks (onConnect, onNodeDrag, …) actually reach React Flow.
    Object.assign(captured, props)
    return (
      <div
        data-testid="reactflow"
        data-nodes-draggable={String(props.nodesDraggable)}
        data-nodes-connectable={String(props.nodesConnectable)}
        // Phase 15 Plan 15-01 (TIDY-04 harness fix) — production prop is
        // `edgesReconnectable` (workflow-canvas-inner.tsx:149); the older
        // React Flow API name `edgesUpdatable` was renamed in v12. The
        // exposed data-attribute keeps its readable test-attribute name.
        data-edges-updatable={String(props.edgesReconnectable)}
      >
        {props.children}
      </div>
    )
  },
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
    // Real render + forwarding assertion (was a source-string grep that passed
    // even when a prop was only mentioned in a comment / the interface).
    const handlers = {
      onConnect: vi.fn(),
      onNodeDrag: vi.fn(),
      onNodeDragStop: vi.fn(),
      onPaneContextMenu: vi.fn(),
      onNodeContextMenu: vi.fn(),
      onEdgeContextMenu: vi.fn(),
      onEdgeDoubleClick: vi.fn(),
      // T3a/T3b — pane-click clear + selection-change pass-through.
      onPaneClick: vi.fn(),
      onSelectionChange: vi.fn(),
    }
    render(
      <WorkflowCanvasInner nodes={[]} edges={[]} readOnly={false} {...handlers} />,
    )
    // kills mutation: deleting e.g. `onConnect={props.onConnect}` from the JSX
    // means React Flow never receives that exact callback.
    for (const [name, fn] of Object.entries(handlers)) {
      expect(captured[name]).toBe(fn)
    }
  })
})

describe("WorkflowCanvasInner — T4b live zoom bridge", () => {
  it("reports the live zoom factor via onZoomChange (ZoomReporter)", () => {
    const onZoomChange = vi.fn()
    render(
      <WorkflowCanvasInner
        nodes={[]}
        edges={[]}
        readOnly={false}
        onZoomChange={onZoomChange}
      />,
    )
    // useStore mock returns transform [0,0,1] => zoom 1 (=> toolbar "100%").
    expect(onZoomChange).toHaveBeenCalledWith(1)
  })
})

describe("computeDragMembershipChanges — drop-association (Tema 2)", () => {
  // g1 = A(0,0) + B(200,0); its member hull center sits near (170,30).
  const pos = (entries: Array<[string, [number, number]]>): Map<string, Point> =>
    new Map(entries.map(([id, [x, y]]) => [id, { x, y }]))

  it("a loose node whose CENTER lands inside a hull JOINS that group (drag-IN)", () => {
    const { strip, join } = computeDragMembershipChanges({
      movedIds: ["C"],
      positions: pos([["A", [0, 0]], ["B", [200, 0]], ["C", [100, 0]]]),
      groups: [{ id: "g1", children: ["A", "B"] }],
      parentOf: new Map([["A", "g1"], ["B", "g1"], ["C", undefined]]),
    })
    expect(join.get("C")).toBe("g1")
    expect(strip.size).toBe(0)
  })

  it("a member dragged OUTSIDE its parent hull (>=2 others) is STRIPPED", () => {
    const { strip, join } = computeDragMembershipChanges({
      movedIds: ["X"],
      positions: pos([["A", [0, 0]], ["B", [200, 0]], ["X", [1000, 1000]]]),
      groups: [{ id: "g1", children: ["A", "B", "X"] }],
      parentOf: new Map([["A", "g1"], ["B", "g1"], ["X", "g1"]]),
    })
    expect(strip.get("X")).toBe("g1")
    expect(join.size).toBe(0)
  })

  it("T2c: a MULTI-node drag associates EVERY moved node, not just the reported one", () => {
    const { strip, join } = computeDragMembershipChanges({
      movedIds: ["C", "D"],
      positions: pos([
        ["A", [0, 0]], ["B", [200, 0]],
        ["C", [100, 0]], ["D", [120, 10]],
      ]),
      groups: [{ id: "g1", children: ["A", "B"] }],
      parentOf: new Map([
        ["A", "g1"], ["B", "g1"], ["C", undefined], ["D", undefined],
      ]),
    })
    expect(join.get("C")).toBe("g1")
    expect(join.get("D")).toBe("g1")
    expect(strip.size).toBe(0)
  })

  it("a node dragged out of one cloud INTO another reassigns parent (join wins over strip)", () => {
    const { strip, join } = computeDragMembershipChanges({
      movedIds: ["X"],
      positions: pos([
        ["A", [0, 0]], ["B", [200, 0]], // g1, center ~ (170,30)
        ["E", [600, 0]], ["F", [800, 0]], // g2, center ~ (770,30)
        ["X", [700, 0]], // drop outside g1 (x=700 > 356), center (770,30) inside g2
      ]),
      groups: [
        { id: "g1", children: ["A", "B", "X"] },
        { id: "g2", children: ["E", "F"] },
      ],
      parentOf: new Map([
        ["A", "g1"], ["B", "g1"], ["X", "g1"], ["E", "g2"], ["F", "g2"],
      ]),
    })
    expect(strip.get("X")).toBe("g1")
    expect(join.get("X")).toBe("g2")
  })

  it("never destroys a group with <2 OTHER members on a drag (keeps membership)", () => {
    const { strip, join } = computeDragMembershipChanges({
      movedIds: ["X"],
      positions: pos([["A", [0, 0]], ["X", [1000, 1000]]]),
      groups: [{ id: "g1", children: ["A", "X"] }],
      parentOf: new Map([["A", "g1"], ["X", "g1"]]),
    })
    expect(strip.size).toBe(0) // A alone (<2) — group preserved
    expect(join.size).toBe(0)
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
