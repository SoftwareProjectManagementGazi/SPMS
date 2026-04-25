// Unit tests for components/workflow-editor/phase-edge.tsx (Phase 12 Plan 12-01 + Plan 12-08).
//
// Plan 12-01: 5 cases for stroke per type + bidirectional + all-gate.
// Plan 12-08: inline label edit on double-click (CONTEXT D-14).

import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
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

describe("PhaseEdge — Plan 12-08 inline label edit (CONTEXT D-14)", () => {
  function renderWithEdit(p: {
    label?: string
    onLabelChange?: (next: string) => void
    editMode?: boolean
  }) {
    return render(
      // @ts-expect-error — full EdgeProps shape replaced with minimal stubs
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
        selected={false}
        data={{
          type: "flow",
          label: p.label ?? "Onayla",
          editMode: p.editMode ?? true,
          onLabelChange: p.onLabelChange,
        }}
      />,
    )
  }

  it("double-click on the label pill swaps in an <input/> with the current value", () => {
    const { container } = renderWithEdit({ label: "Onayla" })
    const pill = container.querySelector(
      "[data-field='edge-label']",
    ) as HTMLElement
    expect(pill).toBeTruthy()
    fireEvent.doubleClick(pill)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.value).toBe("Onayla")
  })

  it("Enter during inline edit calls data.onLabelChange with the new value", () => {
    const onLabelChange = vi.fn()
    const { container } = renderWithEdit({
      label: "Eski",
      onLabelChange,
    })
    const pill = container.querySelector(
      "[data-field='edge-label']",
    ) as HTMLElement
    fireEvent.doubleClick(pill)
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "Yeni Etiket" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onLabelChange).toHaveBeenCalledWith("Yeni Etiket")
  })

  it("Escape during inline edit cancels without calling onLabelChange", () => {
    const onLabelChange = vi.fn()
    const { container } = renderWithEdit({
      label: "Asıl",
      onLabelChange,
    })
    const pill = container.querySelector(
      "[data-field='edge-label']",
    ) as HTMLElement
    fireEvent.doubleClick(pill)
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.keyDown(input, { key: "Escape" })
    expect(onLabelChange).not.toHaveBeenCalled()
    expect(container.querySelector("input")).toBeNull()
  })
})
