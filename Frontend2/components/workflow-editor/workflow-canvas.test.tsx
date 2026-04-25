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
