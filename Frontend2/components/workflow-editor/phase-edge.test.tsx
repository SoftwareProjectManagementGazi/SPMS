// Unit tests for components/workflow-editor/phase-edge.tsx (Phase 12 Plan 12-01).
//
// 5 cases per 12-01-PLAN.md task 3 <behavior> Tests 8-12.
// React Flow's BaseEdge / EdgeLabelRenderer are stubbed so this is a unit
// test of our renderer logic, not a ReactFlow integration test.

import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { PhaseEdge } from "./phase-edge"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

vi.mock("@xyflow/react", () => ({
  BaseEdge: ({
    style,
    markerStart,
    markerEnd,
  }: {
    style?: React.CSSProperties
    markerStart?: string
    markerEnd?: string
  }) => (
    <svg data-testid="base-edge" data-marker-start={markerStart || ""} data-marker-end={markerEnd || ""}>
      <path
        data-testid="edge-path"
        data-stroke={String(style?.stroke ?? "")}
        data-dasharray={String(style?.strokeDasharray ?? "")}
        data-stroke-width={String(style?.strokeWidth ?? "")}
      />
    </svg>
  ),
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  getBezierPath: () => ["M 0 0 L 100 100", 50, 50, 0, 0],
  Position: { Top: "top", Right: "right", Bottom: "bottom", Left: "left" },
}))

interface RenderProps {
  type?: "flow" | "verification" | "feedback"
  bidirectional?: boolean
  isAllGate?: boolean
  label?: string
  selected?: boolean
}

function renderEdge(p: RenderProps = {}) {
  // @ts-expect-error — full EdgeProps shape replaced with minimal stubs
  return render(
    <PhaseEdge
      id="e1"
      source="A"
      target="B"
      sourceX={0}
      sourceY={0}
      targetX={100}
      targetY={100}
      sourcePosition="right"
      targetPosition="left"
      selected={p.selected ?? false}
      data={{
        type: p.type ?? "flow",
        bidirectional: p.bidirectional ?? false,
        isAllGate: p.isAllGate ?? false,
        label: p.label,
      }}
    />,
  )
}

describe("PhaseEdge — strokeDasharray + stroke per type", () => {
  it("type=flow renders strokeDasharray=none + var(--fg-subtle)", () => {
    const { getByTestId } = renderEdge({ type: "flow" })
    const path = getByTestId("edge-path")
    expect(path.getAttribute("data-dasharray")).toBe("none")
    expect(path.getAttribute("data-stroke")).toContain("--fg-subtle")
  })

  it("type=verification renders strokeDasharray=6 3 + var(--status-progress)", () => {
    const { getByTestId } = renderEdge({ type: "verification" })
    const path = getByTestId("edge-path")
    expect(path.getAttribute("data-dasharray")).toBe("6 3")
    expect(path.getAttribute("data-stroke")).toContain("--status-progress")
  })

  it("type=feedback renders strokeDasharray=8 4 2 4 + var(--status-review)", () => {
    const { getByTestId } = renderEdge({ type: "feedback" })
    const path = getByTestId("edge-path")
    expect(path.getAttribute("data-dasharray")).toBe("8 4 2 4")
    expect(path.getAttribute("data-stroke")).toContain("--status-review")
  })
})

describe("PhaseEdge — bidirectional + all-gate variants", () => {
  it("bidirectional=true exposes arrow markers on both ends OR ↔ glyph", () => {
    const { getByTestId, container } = renderEdge({ bidirectional: true })
    const baseEdge = getByTestId("base-edge")
    const markerStart = baseEdge.getAttribute("data-marker-start") || ""
    const hasGlyph = container.textContent?.includes("↔")
    expect(markerStart.length > 0 || hasGlyph).toBe(true)
  })

  it("isAllGate=true renders the AllGatePill adjacent to the edge label", () => {
    const { container } = renderEdge({ isAllGate: true })
    // AllGatePill renders text 'Hepsi' (TR) — match either tr or en
    expect(container.textContent).toMatch(/Hepsi|All/)
  })
})
