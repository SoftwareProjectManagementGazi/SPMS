// Unit tests for components/workflow-editor/phase-node.tsx
// (Phase 12 Plan 12-01 + extensions in Plan 12-08).
//
// Plan 12-01: 5 cases for state styling + 4-way handles (Tests 3-7).
// Plan 12-08: cycle counter visibility (EDIT-06) + inline name edit on
//             double-click (CONTEXT D-15).

import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
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

describe("PhaseNode — Plan 12-08 cycle counter visibility (EDIT-06)", () => {
  it("renders the cycle counter badge with text 'x3' when cycleCount=3", () => {
    const { container } = renderPhase({ name: "Risk Analizi", cycleCount: 3 })
    expect(container.textContent).toMatch(/×3|x3/)
  })

  it("does NOT render the cycle counter badge when cycleCount<2", () => {
    const { container } = renderPhase({ name: "Tasarım", cycleCount: 1 })
    // CycleCounterBadge returns null for count<2 -> no x{n} text in the DOM
    expect(container.textContent).not.toMatch(/×\d|x\d/)
  })
})

describe("PhaseNode — Plan 12-08 inline name edit (CONTEXT D-15)", () => {
  it("double-click on the node name swaps the span for an <input/> with auto-focus when editMode=true", () => {
    const { container } = renderPhase({
      name: "Başlatma",
      editMode: true,
    })
    const root = container.firstChild as HTMLElement
    // Locate the name display element + simulate dblclick on it
    const nameEl = root.querySelector("[data-field='name']") as HTMLElement
    expect(nameEl).toBeTruthy()
    fireEvent.doubleClick(nameEl)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.value).toBe("Başlatma")
  })

  it("Escape during inline edit cancels and restores the name span", () => {
    const { container } = renderPhase({
      name: "Yürütme",
      editMode: true,
    })
    const root = container.firstChild as HTMLElement
    const nameEl = root.querySelector("[data-field='name']") as HTMLElement
    fireEvent.doubleClick(nameEl)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input).toBeTruthy()
    fireEvent.keyDown(input, { key: "Escape" })
    // After cancel the input should be removed
    expect(container.querySelector("input")).toBeNull()
  })

  it("Enter during inline edit fires data.onNameChange with the new value", () => {
    const onNameChange = vi.fn()
    const { container } = renderPhase({
      name: "Eski Ad",
      editMode: true,
      onNameChange,
    })
    const root = container.firstChild as HTMLElement
    const nameEl = root.querySelector("[data-field='name']") as HTMLElement
    fireEvent.doubleClick(nameEl)
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "Yeni Ad" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onNameChange).toHaveBeenCalledWith("Yeni Ad")
  })
})
