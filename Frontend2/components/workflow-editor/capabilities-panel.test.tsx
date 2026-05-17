// Unit tests for components/workflow-editor/capabilities-panel.tsx
// (Wave 2 Plan W2-C4).
//
// Covers the contract surfaced by the plan §"Test Stratejisi":
//   1. lifecycle mode renders all 4 toggles (incl. restrict_expired_sprints)
//   2. status mode renders 3 toggles and excludes restrict_expired_sprints
//   3. clicking a toggle dispatches a single-field patch (onCapabilitiesChange)
//   4. canEdit=false disables every toggle (aria-disabled / native disabled)
//   5. initial_node_id read-only display: shows id when set, fallback when null
//
// Test setup mirrors flow-rules.test.tsx — we stub the app-context language
// hook via vi.mock so jsdom does not need to climb the AppProvider tree.

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "en" }),
}))

import { CapabilitiesPanel } from "./capabilities-panel"

describe("CapabilitiesPanel", () => {
  it("Test 1: lifecycle mode renders all 4 toggles (incl. restrict_expired_sprints)", () => {
    render(
      <CapabilitiesPanel
        capabilities={{}}
        onCapabilitiesChange={() => {}}
        editorMode="lifecycle"
      />,
    )
    expect(screen.getByText("Sequential dependencies")).toBeTruthy()
    expect(screen.getByText("Restrict expired sprints")).toBeTruthy()
    expect(screen.getByText("Enforce WIP limits")).toBeTruthy()
    expect(screen.getByText("Recurring tasks")).toBeTruthy()
    // Section header
    expect(screen.getByText("Engine Settings")).toBeTruthy()
  })

  it("Test 2: status mode renders 3 toggles and omits restrict_expired_sprints", () => {
    render(
      <CapabilitiesPanel
        capabilities={{}}
        onCapabilitiesChange={() => {}}
        editorMode="status"
      />,
    )
    expect(screen.queryByText("Restrict expired sprints")).toBeNull()
    expect(screen.getByText("Enforce WIP limits")).toBeTruthy()
    expect(screen.getByText("Recurring tasks")).toBeTruthy()
    expect(screen.getByText("Edge validation")).toBeTruthy()
    // 3 toggles in status mode
    const toggles = screen.getAllByRole("switch")
    expect(toggles.length).toBe(3)
  })

  it("Test 3: clicking the WIP toggle dispatches a single-field patch", () => {
    const onChange = vi.fn()
    render(
      <CapabilitiesPanel
        capabilities={{ enforce_wip_limits: false }}
        onCapabilitiesChange={onChange}
        editorMode="status"
      />,
    )
    const wipToggle = screen.getByRole("switch", { name: "Enforce WIP limits" })
    fireEvent.click(wipToggle)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ enforce_wip_limits: true })
  })

  it("Test 3b: clicking a toggle that was true flips it to false (single-field patch)", () => {
    const onChange = vi.fn()
    render(
      <CapabilitiesPanel
        capabilities={{
          enforce_wip_limits: true,
          has_recurring: true,
          enforce_sequential_dependencies: true,
        }}
        onCapabilitiesChange={onChange}
        editorMode="status"
      />,
    )
    const recurring = screen.getByRole("switch", { name: "Recurring tasks" })
    fireEvent.click(recurring)
    // Must NOT clobber enforce_wip_limits / enforce_sequential_dependencies —
    // the panel only emits the field that changed.
    expect(onChange).toHaveBeenCalledWith({ has_recurring: false })
  })

  it("Test 4: canEdit=false disables every toggle and suppresses onChange", () => {
    const onChange = vi.fn()
    render(
      <CapabilitiesPanel
        capabilities={{ enforce_wip_limits: true }}
        onCapabilitiesChange={onChange}
        editorMode="lifecycle"
        canEdit={false}
      />,
    )
    const toggles = screen.getAllByRole("switch")
    toggles.forEach((t) => {
      expect((t as HTMLButtonElement).disabled).toBe(true)
    })
    // Clicking a disabled toggle must not dispatch.
    fireEvent.click(toggles[0])
    expect(onChange).not.toHaveBeenCalled()
  })

  it("Test 5a: initial_node_id read-only display shows the id when set", () => {
    render(
      <CapabilitiesPanel
        capabilities={{ initial_node_id: "nd_phase_design" }}
        onCapabilitiesChange={() => {}}
        editorMode="lifecycle"
      />,
    )
    const display = screen.getByTestId("initial-node-id-display")
    expect(within(display).getByText("nd_phase_design")).toBeTruthy()
  })

  it("Test 5b: initial_node_id falls back to an instructional hint when null", () => {
    render(
      <CapabilitiesPanel
        capabilities={{ initial_node_id: null }}
        onCapabilitiesChange={() => {}}
        editorMode="status"
      />,
    )
    const display = screen.getByTestId("initial-node-id-display")
    expect(display.textContent).toContain("Not set")
  })
})
