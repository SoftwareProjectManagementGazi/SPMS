// Phase 15 Plan 15-11 Task 1.2 — RoleIconPicker RTL tests.
//
// 4×2 grid of 8 lucide-react icons (D-2.8): User / Briefcase / ShieldCheck /
// Star / Eye / Settings / Globe / Award. Controlled value/onChange.
// aria-checked reflects selection so screen readers announce the state.

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { RoleIconPicker } from "./role-icon-picker"

describe("RoleIconPicker (Plan 15-11 — D-2.8)", () => {
  it("Case 1 — renders 8 radio buttons (4×2 grid)", () => {
    render(<RoleIconPicker value="user" onChange={vi.fn()} />)
    const buttons = screen.getAllByRole("radio")
    expect(buttons.length).toBe(8)
  })

  it("Case 2 — click on a button fires onChange with the icon key", () => {
    const onChange = vi.fn()
    render(<RoleIconPicker value="user" onChange={onChange} />)
    const briefcase = screen.getByRole("radio", { name: /briefcase/i })
    fireEvent.click(briefcase)
    expect(onChange).toHaveBeenCalledWith("briefcase")
  })

  it("Case 3 — aria-checked reflects the selected value", () => {
    render(<RoleIconPicker value="shield-check" onChange={vi.fn()} />)
    const shield = screen.getByRole("radio", { name: /shield/i })
    expect(shield.getAttribute("aria-checked")).toBe("true")
    // Other buttons must NOT be checked.
    const user = screen.getByRole("radio", { name: /^user$/i })
    expect(user.getAttribute("aria-checked")).toBe("false")
  })

  it("Case 4 — radiogroup has accessible label", () => {
    render(<RoleIconPicker value={null} onChange={vi.fn()} />)
    const group = screen.getByRole("radiogroup")
    expect(group).toBeInTheDocument()
    // aria-label attribute set so screen readers announce the group purpose.
    // Note: Turkish capital İ (U+0130) does NOT lowercase to ASCII "i" via the
    // /i regex flag, so we match the literal Turkish word OR English fallback.
    expect(group.getAttribute("aria-label")).toMatch(/İkon|Icon/)
  })
})
