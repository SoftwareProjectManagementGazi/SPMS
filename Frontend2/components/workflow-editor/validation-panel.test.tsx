// Unit tests for components/workflow-editor/validation-panel.tsx
// (Phase 12 Plan 12-07).
//
// 3 cases:
//   1. Section title 'Doğrulama' renders
//   2. Workflow with valid initial+final nodes shows all-rules-pass labels
//      after debounce timer flushes
//   3. Workflow with NO initial node shows the 'Başlangıç düğümü tanımlanmamış'
//      fail label after debounce flushes
//
// Notes:
//   - Validator runs with 300ms debounce — tests use vi.useFakeTimers + advance.
//   - Empty workflow shows multiple errors; we assert the specific failed-rule
//     label rather than counting AlertBanner instances (kept resilient to
//     ordering changes in the AlertBanner summary line).

import * as React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act, render, screen } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { ValidationPanel } from "./validation-panel"
import type { WorkflowConfig } from "@/services/lifecycle-service"

const validWorkflow: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "n1", name: "Başlatma", x: 0, y: 0, isInitial: true },
    { id: "n2", name: "Bitiş", x: 200, y: 0, isFinal: true },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", type: "flow" }],
  groups: [],
}

const noInitialWorkflow: WorkflowConfig = {
  mode: "flexible",
  nodes: [
    { id: "n1", name: "A", x: 0, y: 0 },
    { id: "n2", name: "Bitiş", x: 200, y: 0, isFinal: true },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", type: "flow" }],
  groups: [],
}

describe("ValidationPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("Test 1: section title 'Doğrulama' renders", () => {
    render(<ValidationPanel workflow={validWorkflow} />)
    expect(screen.getByText("Doğrulama")).toBeTruthy()
  })

  it("Test 2: valid workflow shows all-pass labels after 300ms debounce flushes", () => {
    render(<ValidationPanel workflow={validWorkflow} />)
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(screen.getByText("Başlangıç düğümü mevcut")).toBeTruthy()
    expect(screen.getByText("Bitiş düğümü mevcut")).toBeTruthy()
    expect(screen.getByText("Tüm bağlantılar geçerli")).toBeTruthy()
    expect(screen.getByText("Düğüm kimlikleri benzersiz")).toBeTruthy()
    expect(screen.getByText("Akış döngüsü yok")).toBeTruthy()
  })

  it("Test 3: workflow without initial node shows 'Başlangıç düğümü tanımlanmamış' fail row", () => {
    render(<ValidationPanel workflow={noInitialWorkflow} />)
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(screen.getByText("Başlangıç düğümü tanımlanmamış")).toBeTruthy()
  })
})
