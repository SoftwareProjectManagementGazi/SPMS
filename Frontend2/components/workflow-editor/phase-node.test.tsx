// Unit tests for components/workflow-editor/phase-node.tsx
// (Phase 12 Plan 12-01).
//
// 5 cases per 12-01-PLAN.md task 3 <behavior> Tests 3-7. Tests directly
// render PhaseNode with stub NodeProps (no full ReactFlow mount required).

import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { PhaseNode } from "./phase-node"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// React Flow's <Handle/> reads context internally; in unit tests we render it
// outside any ReactFlow provider. Stub it with a div that exposes the props
// we want to assert (id, position, type) so the test can count + verify them
// without needing a ReactFlow mount.
vi.mock("@xyflow/react", () => ({
  Handle: ({
    id,
    type,
    position,
  }: {
    id: string
    type: string
    position: string
  }) => (
    <div
      data-testid="handle"
      data-handle-id={id}
      data-handle-type={type}
      data-handle-position={position}
    />
  ),
  Position: { Top: "top", Right: "right", Bottom: "bottom", Left: "left" },
}))

function renderPhase(data: Record<string, unknown>, selected = false) {
  // PhaseNode is wrapped in React.memo with NodeProps. We pass the minimum
  // shape the renderer reads.
  return render(
    // @ts-expect-error — PhaseNode requires full NodeProps; we stub data + selected only
    <PhaseNode id="n1" data={data} selected={selected} type="phase" />,
  )
}

describe("PhaseNode — state-driven box-shadow", () => {
  it("default state renders the inset 1px var(--border-strong) shadow + opacity 1", () => {
    const { container } = renderPhase({ name: "X" })
    const root = container.firstChild as HTMLElement
    expect(root.getAttribute("data-state")).toBe("default")
    expect(root.style.boxShadow).toContain("var(--border-strong)")
    expect(parseFloat(root.style.opacity || "1")).toBe(1)
  })

  it("active state renders the 2px var(--primary) ring", () => {
    const { container } = renderPhase({ name: "X", state: "active" })
    const root = container.firstChild as HTMLElement
    expect(root.getAttribute("data-state")).toBe("active")
    expect(root.style.boxShadow).toContain("var(--primary)")
    expect(root.style.boxShadow).toContain("2px")
  })

  it("past state renders opacity 0.55 (read-only mode)", () => {
    const { container } = renderPhase({ name: "X", state: "past" })
    const root = container.firstChild as HTMLElement
    expect(root.getAttribute("data-state")).toBe("past")
    expect(parseFloat(root.style.opacity)).toBeCloseTo(0.55, 2)
  })

  it("unreachable state renders opacity 0.4", () => {
    const { container } = renderPhase({ name: "X", state: "unreachable" })
    const root = container.firstChild as HTMLElement
    expect(root.getAttribute("data-state")).toBe("unreachable")
    expect(parseFloat(root.style.opacity)).toBeCloseTo(0.4, 2)
  })
})

describe("PhaseNode — 4-way handle layout", () => {
  it("renders 8 Handle elements (4 positions x source/target)", () => {
    const { getAllByTestId } = renderPhase({ name: "X" })
    const handles = getAllByTestId("handle")
    expect(handles).toHaveLength(8)
    // Each combination present
    const ids = handles.map((h) => h.getAttribute("data-handle-id"))
    expect(ids).toContain("top-source")
    expect(ids).toContain("top-target")
    expect(ids).toContain("right-source")
    expect(ids).toContain("right-target")
    expect(ids).toContain("bottom-source")
    expect(ids).toContain("bottom-target")
    expect(ids).toContain("left-source")
    expect(ids).toContain("left-target")
  })
})
