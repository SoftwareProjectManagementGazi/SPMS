// Phase 15 Plan 15-11 Task 1.3 — RoleColorSwatch RTL tests.
//
// 6 round chips, each backed by an oklch CSS token (D-2.8):
//   --priority-critical, --status-progress, --fg-muted, --info, --warning,
//   --status-todo
// Controlled value/onChange. aria-checked reflects selection.

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { RoleColorSwatch } from "./role-color-swatch"

describe("RoleColorSwatch (Plan 15-11 — D-2.8)", () => {
  it("Case 1 — renders 6 radio buttons (one per oklch token)", () => {
    render(<RoleColorSwatch value="--fg-muted" onChange={vi.fn()} />)
    const buttons = screen.getAllByRole("radio")
    expect(buttons.length).toBe(6)
  })

  it("Case 2 — click on a swatch fires onChange with the token name", () => {
    const onChange = vi.fn()
    render(<RoleColorSwatch value="--fg-muted" onChange={onChange} />)
    const danger = screen.getByRole("radio", { name: /priority-critical/i })
    fireEvent.click(danger)
    expect(onChange).toHaveBeenCalledWith("--priority-critical")
  })

  it("Case 3 — aria-checked reflects the selected token", () => {
    render(<RoleColorSwatch value="--info" onChange={vi.fn()} />)
    const info = screen.getByRole("radio", { name: /^info$/i })
    expect(info.getAttribute("aria-checked")).toBe("true")
    const muted = screen.getByRole("radio", { name: /fg-muted/i })
    expect(muted.getAttribute("aria-checked")).toBe("false")
  })

  it("Case 4 — radiogroup has accessible label", () => {
    render(<RoleColorSwatch value={null} onChange={vi.fn()} />)
    const group = screen.getByRole("radiogroup")
    expect(group.getAttribute("aria-label")).toMatch(/Renk|Color/)
  })
})
