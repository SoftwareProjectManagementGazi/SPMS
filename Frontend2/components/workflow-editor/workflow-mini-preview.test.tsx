// WorkflowMiniPreview — statik SVG minyatür testleri.

import * as React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { WorkflowMiniPreview } from "./workflow-mini-preview"

const WF = {
  nodes: [
    { id: "nd_aaaaaaaaaa", name: "Başla", x: 60, y: 60, color: "status-todo" },
    { id: "nd_bbbbbbbbbb", name: "Bitir", x: 400, y: 200, color: "status-done" },
    { id: "nd_cccccccccc", name: "Hex", x: 700, y: 60, color: "#FF0000" },
  ],
  edges: [
    { source: "nd_aaaaaaaaaa", target: "nd_bbbbbbbbbb", type: "flow" },
    { source: "nd_bbbbbbbbbb", target: "nd_aaaaaaaaaa", type: "feedback" },
    { source: "nd_zzzzzzzzzz", target: "nd_aaaaaaaaaa", type: "flow" }, // ölü ref — sessizce atlanır
  ],
  groups: [
    { id: "gr_one", color: "#3B82F6", children: ["nd_aaaaaaaaaa", "nd_bbbbbbbbbb"] },
  ],
}

describe("WorkflowMiniPreview", () => {
  it("node başına rect, geçerli kenar başına path çizer; ölü kenar referansını atlar", () => {
    const { container } = render(<WorkflowMiniPreview workflow={WF} />)
    expect(screen.getByTestId("workflow-mini-preview")).toBeTruthy()
    expect(screen.getAllByTestId("mini-node")).toHaveLength(3)
    expect(container.querySelectorAll("path")).toHaveLength(2)
    // Grup bloğu da bir rect (node rect'lerinden ayrı).
    expect(container.querySelectorAll("rect")).toHaveLength(4)
  })

  it("renk token'ı CSS değişkenine, hex doğrudan dolguya gider", () => {
    const { container } = render(<WorkflowMiniPreview workflow={WF} />)
    const fills = Array.from(
      container.querySelectorAll('[data-testid="mini-node"]'),
    ).map((r) => r.getAttribute("fill"))
    expect(fills).toContain("var(--status-todo)")
    expect(fills).toContain("var(--status-done)")
    expect(fills).toContain("#FF0000")
  })

  it("feedback kenarı kesikli çizilir", () => {
    const { container } = render(<WorkflowMiniPreview workflow={WF} />)
    const dashed = Array.from(container.querySelectorAll("path")).filter((p) =>
      p.getAttribute("stroke-dasharray"),
    )
    expect(dashed).toHaveLength(1)
  })

  it("node yoksa hiçbir şey render etmez", () => {
    render(<WorkflowMiniPreview workflow={{ nodes: [], edges: [] }} />)
    expect(screen.queryByTestId("workflow-mini-preview")).toBeNull()
  })

  it("viewBox tüm node'ları kapsar", () => {
    const { container } = render(<WorkflowMiniPreview workflow={WF} />)
    const vb = container.querySelector("svg")?.getAttribute("viewBox") ?? ""
    const [x, y, w, h] = vb.split(" ").map(Number)
    expect(x).toBeLessThanOrEqual(60)
    expect(y).toBeLessThanOrEqual(60)
    expect(x + w).toBeGreaterThanOrEqual(700 + 150) // en sağ node + genişlik
    expect(y + h).toBeGreaterThanOrEqual(200 + 44) // en alt node + yükseklik
  })
})
