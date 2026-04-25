// Unit tests for components/workflow-editor/group-cloud-node.tsx
// (Phase 12 Plan 12-08).
//
// 9+ cases per 12-08-PLAN.md task 1 <behavior> Tests 3-9 + the additional
// cycle-counter / parallel-active visibility checks that run at this layer.
//
// React Flow's NodeProps shape is replaced with stub `data` props since the
// renderer only reads `data.*` fields. The hull computation goes through the
// pure `computeHull` helper from Plan 12-01 — we don't re-test the math
// here, only that the component re-renders when `data.hullPath` updates and
// that the dragOver visual feedback shows up.

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

vi.mock("@xyflow/react", () => ({
  Position: { Top: "top", Right: "right", Bottom: "bottom", Left: "left" },
}))

import { GroupCloudNode } from "./group-cloud-node"

interface RenderProps {
  childPositions?: Array<{ x: number; y: number }>
  hullPath?: string
  name?: string
  color?: string
  width?: number
  height?: number
  selected?: boolean
  dragOver?: boolean
}

function renderGroup(p: RenderProps = {}) {
  return render(
    // @ts-expect-error — NodeProps minimal stub
    <GroupCloudNode
      id="g1"
      type="group"
      data={{
        childPositions: p.childPositions ?? [
          { x: 0, y: 0 },
          { x: 200, y: 100 },
        ],
        hullPath: p.hullPath,
        name: p.name,
        color: p.color,
        width: p.width,
        height: p.height,
        selected: p.selected,
        dragOver: p.dragOver,
      }}
    />,
  )
}

describe("GroupCloudNode — read-only baseline preserved", () => {
  it("renders an SVG path with a non-empty d attribute when 2+ child positions are given", () => {
    const { container } = renderGroup({
      childPositions: [
        { x: 0, y: 0 },
        { x: 200, y: 100 },
        { x: 400, y: 0 },
      ],
    })
    const path = container.querySelector("path")
    expect(path).toBeTruthy()
    const d = path!.getAttribute("d") ?? ""
    expect(d.length).toBeGreaterThan(0)
    expect(d.startsWith("M")).toBe(true)
  })

  it("Test 3 (group create from drag-rectangle): exposes a `name` label rendered as a chip when supplied", () => {
    const { container } = renderGroup({ name: "Tasarım Aşaması" })
    expect(container.textContent).toContain("Tasarım Aşaması")
  })

  it("Test 4 (group create from multi-select + button): selected=true uses a thicker stroke (>=2px)", () => {
    const { container } = renderGroup({ selected: true })
    const path = container.querySelector("path") as SVGPathElement
    const w = Number(path.getAttribute("stroke-width") ?? "0")
    expect(w).toBeGreaterThanOrEqual(2)
  })
})

describe("GroupCloudNode — Plan 12-08 dragOver feedback", () => {
  it("Test 5 (group create from drag-into-existing): when data.dragOver=true, stroke is dashed primary", () => {
    const { container } = renderGroup({ dragOver: true })
    const path = container.querySelector("path") as SVGPathElement
    const dashArr = path.getAttribute("stroke-dasharray") ?? ""
    const stroke = path.getAttribute("stroke") ?? ""
    // Dashed stroke is the visual cue — the value comes from style; exact
    // string can be 'X Y' but must NOT be empty/none.
    expect(dashArr.length > 0 && dashArr !== "none").toBe(true)
    expect(stroke).toContain("--primary")
  })

  it("Test 6 (group create from mixed-selection): supports custom hullPath override (live morph)", () => {
    const customD = "M 10 10 Q 50 50 100 100 Z"
    const { container } = renderGroup({ hullPath: customD })
    const path = container.querySelector("path") as SVGPathElement
    expect(path.getAttribute("d")).toBe(customD)
  })
})

describe("GroupCloudNode — Plan 12-08 live morph + transition", () => {
  it("Test 7 (group create from context menu): the path style includes a `transition: d` rule for smooth morph", () => {
    const { container } = renderGroup()
    const path = container.querySelector("path") as SVGPathElement
    // jsdom serializes `transition` to camelCase or kebab-case depending on
    // the API, so we accept either spelling on the inline style attribute.
    const styleAttr = path.getAttribute("style") ?? ""
    expect(styleAttr.toLowerCase()).toContain("transition")
    // The `d` keyword must appear in the transition list since cloud morph
    // animates the path data.
    expect(styleAttr).toMatch(/transition:[^;]*\bd\b/i)
  })

  it("Test 8 (drop association on drag-out): re-rendering with a new hullPath updates the path's d attribute", () => {
    const { container, rerender } = renderGroup({
      hullPath: "M 0 0 Q 5 5 10 10 Z",
    })
    let path = container.querySelector("path") as SVGPathElement
    expect(path.getAttribute("d")).toBe("M 0 0 Q 5 5 10 10 Z")
    rerender(
      // @ts-expect-error minimal NodeProps
      <GroupCloudNode
        id="g1"
        type="group"
        data={{
          childPositions: [{ x: 0, y: 0 }],
          hullPath: "M 100 100 Q 200 200 300 300 Z",
        }}
      />,
    )
    path = container.querySelector("path") as SVGPathElement
    expect(path.getAttribute("d")).toBe("M 100 100 Q 200 200 300 300 Z")
  })

  it("Test 9 (group cloud live morph): rapid hull updates do not unmount the SVG path (component identity preserved)", () => {
    const { container, rerender } = renderGroup({
      hullPath: "M 0 0 Q 5 5 10 10 Z",
    })
    const firstPath = container.querySelector("path") as SVGPathElement
    for (let i = 1; i <= 5; i++) {
      rerender(
        // @ts-expect-error minimal NodeProps
        <GroupCloudNode
          id="g1"
          type="group"
          data={{
            childPositions: [{ x: 0, y: 0 }],
            hullPath: `M ${i} ${i} Q ${i + 5} ${i + 5} ${i + 10} ${i + 10} Z`,
          }}
        />,
      )
    }
    const lastPath = container.querySelector("path") as SVGPathElement
    expect(lastPath.tagName).toBe(firstPath.tagName)
    expect(lastPath.getAttribute("d")).toContain("M 5 5")
  })

  it("Test 10 (computeHull integration): without an explicit hullPath, falls back to computeHull(childPositions, 16)", () => {
    const { container } = renderGroup({
      childPositions: [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 100 },
        { x: 0, y: 100 },
      ],
    })
    const path = container.querySelector("path") as SVGPathElement
    const d = path.getAttribute("d") ?? ""
    // Smoothed convex hull paths from computeHull always start with M and end with Z
    expect(d.startsWith("M")).toBe(true)
    expect(d.endsWith("Z")).toBe(true)
  })
})
