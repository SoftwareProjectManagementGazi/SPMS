// Unit tests for components/workflow-editor/flow-rules.tsx
// (Phase 12 Plan 12-07).
//
// 2 cases per 12-07-PLAN.md task 2 <behavior> Tests 1-2:
//   1. flow-rules renders 4 mode options (Esnek / Sıralı·Kilitli /
//      Sıralı·Esnek Geri Dönüş / Sürekli Akış)
//   2. clicking 'Sıralı · Esnek Geri Dönüş' calls onChange('sequential-flexible')
//      AND parent setDirty fires on the workflow change

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { FlowRules } from "./flow-rules"

describe("FlowRules", () => {
  it("Test 1: renders all 4 mode options (Esnek / Sıralı·Kilitli / Sıralı·Esnek / Sürekli Akış)", () => {
    render(<FlowRules mode="flexible" onChange={() => {}} />)
    expect(screen.getByText("Esnek")).toBeTruthy()
    expect(screen.getByText("Sıralı · Kilitli")).toBeTruthy()
    expect(screen.getByText("Sıralı · Esnek Geri Dönüş")).toBeTruthy()
    expect(screen.getByText("Sürekli Akış")).toBeTruthy()
  })

  it("Test 2: clicking 'Sıralı · Esnek Geri Dönüş' calls onChange('sequential-flexible')", () => {
    const handleChange = vi.fn()
    render(<FlowRules mode="flexible" onChange={handleChange} />)
    const opt = screen.getByText("Sıralı · Esnek Geri Dönüş")
    fireEvent.click(opt)
    expect(handleChange).toHaveBeenCalledWith("sequential-flexible")
  })

  it("Test 2b: section title 'Akış Kuralları' renders + active mode is reflected", () => {
    render(<FlowRules mode="sequential-locked" onChange={() => {}} />)
    expect(screen.getByText("Akış Kuralları")).toBeTruthy()
    // Description for the active mode
    expect(
      screen.getByText(
        "Waterfall: bir faz bitmeden öbürüne geçilemez, geri dönüş yok.",
      ),
    ).toBeTruthy()
  })
})
