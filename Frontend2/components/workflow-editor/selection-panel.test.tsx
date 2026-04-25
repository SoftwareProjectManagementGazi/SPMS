// Unit tests for components/workflow-editor/selection-panel.tsx
// (Phase 12 Plan 12-07).
//
// 3 cases per 12-07-PLAN.md task 2 <behavior> Tests 3-5:
//   3. selected = null renders 'Bir düğüm veya bağlantı seçin.' empty state
//   4. selected.type='node' renders Field rows for name + description +
//      color (ColorSwatch) + WIP + isInitial + isFinal toggles
//   5. selected.type='edge' renders SegmentedControl for type
//      (Akış / Doğrulama / Geri Bildirim) + Etiket Input + Bidirectional
//      toggle + All-gate toggle

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { SelectionPanel } from "./selection-panel"
import type { WorkflowConfig } from "@/services/lifecycle-service"

const baseWorkflow: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    {
      id: "n1",
      name: "Başlatma",
      x: 60,
      y: 120,
      isInitial: true,
      description: "Proje başlatılır.",
      color: "status-progress",
      wipLimit: 4,
    },
    { id: "n2", name: "Yürütme", x: 280, y: 120 },
  ],
  edges: [
    {
      id: "e1",
      source: "n1",
      target: "n2",
      type: "flow",
      label: "İlerle",
      bidirectional: false,
      isAllGate: false,
    },
  ],
  groups: [],
}

describe("SelectionPanel", () => {
  it("Test 3: empty state — selected=null renders 'Bir düğüm veya bağlantı seçin.'", () => {
    render(
      <SelectionPanel
        workflow={baseWorkflow}
        selected={null}
        onWorkflowChange={() => {}}
      />,
    )
    expect(screen.getByText(/Bir düğüm veya bağlantı seçin\./)).toBeTruthy()
    expect(screen.getByText("Seçim")).toBeTruthy()
  })

  it("Test 4: node selection renders Ad / Açıklama / Renk / WIP + isInitial + isFinal + arşivli toggles", () => {
    render(
      <SelectionPanel
        workflow={baseWorkflow}
        selected={{ type: "node", id: "n1" }}
        onWorkflowChange={() => {}}
      />,
    )
    expect(screen.getByText("Ad")).toBeTruthy()
    expect(screen.getByText("Açıklama")).toBeTruthy()
    expect(screen.getByText("Renk")).toBeTruthy()
    expect(screen.getByText("WIP")).toBeTruthy()
    expect(screen.getByText("Başlangıç düğümü")).toBeTruthy()
    expect(screen.getByText("Bitiş düğümü")).toBeTruthy()
    expect(screen.getByText(/Arşivli/)).toBeTruthy()
    // ColorSwatch renders 8 swatches as buttons with aria-label === token name
    expect(screen.getByLabelText("status-todo")).toBeTruthy()
    expect(screen.getByLabelText("primary")).toBeTruthy()
  })

  it("Test 5: edge selection renders type SegmentedControl + Etiket Input + Çift yönlü + Hepsi toggles", () => {
    render(
      <SelectionPanel
        workflow={baseWorkflow}
        selected={{ type: "edge", id: "e1" }}
        onWorkflowChange={() => {}}
      />,
    )
    // Header is "n1.name → n2.name"
    expect(screen.getByText(/Başlatma → Yürütme/)).toBeTruthy()
    // Edge type label
    expect(screen.getByText("Bağlantı Tipi")).toBeTruthy()
    // SegmentedControl 3 options
    expect(screen.getByText("Akış")).toBeTruthy()
    expect(screen.getByText("Doğrulama")).toBeTruthy()
    expect(screen.getByText("Geri Bildirim")).toBeTruthy()
    // Etiket field
    expect(screen.getByText("Etiket")).toBeTruthy()
    // Toggle labels
    expect(screen.getByText("Çift yönlü")).toBeTruthy()
    expect(screen.getByText(/Hepsi/)).toBeTruthy()
  })
})
