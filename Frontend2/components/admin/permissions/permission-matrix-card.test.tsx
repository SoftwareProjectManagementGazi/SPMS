// Phase 14 Plan 14-04 Task 2 — PermissionMatrixCard RTL tests.
//
// Verifies the 3 mandatory cases per <behavior> + <acceptance_criteria>:
//   1. Renders 14 PermissionRow instances (count via data-permission-row-key).
//   2. ALL 14×4 = 56 toggles are disabled (HTML disabled attr + aria-disabled).
//   3. Card header contains v3.0 Badge AND Kopyala button is disabled.
//
// Multi-defense assertion (T-14-04-01) — verifies the matrix toggles cannot
// be accidentally re-enabled by a single defense layer being removed.

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// ---- useApp mock ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// SUT — imported AFTER mocks so the mocks take effect.
import { PermissionMatrixCard } from "./permission-matrix-card"

describe("PermissionMatrixCard (Plan 14-04 Task 2)", () => {
  it("Case 1 — renders all 14 permission rows", () => {
    const { container } = render(<PermissionMatrixCard />)
    // Count rows by data attribute (set on PermissionRow's outer div).
    const rows = container.querySelectorAll("[data-permission-row-key]")
    expect(rows.length).toBe(14)
  })

  it("Case 2 — every toggle is disabled (56 total = 14 perms × 4 roles)", () => {
    render(<PermissionMatrixCard />)
    // Each toggle is <input type="checkbox" role="switch" disabled>.
    const switches = screen.getAllByRole("switch")
    // 14 × 4 = 56 disabled toggles.
    expect(switches.length).toBe(56)
    switches.forEach((sw) => {
      // HTML disabled attribute is honored by toBeDisabled().
      expect(sw).toBeDisabled()
      // aria-disabled redundancy for assistive tech.
      expect(sw).toHaveAttribute("aria-disabled", "true")
      // aria-label contains the role name AND "disabled" affordance.
      const ariaLabel = sw.getAttribute("aria-label") ?? ""
      expect(ariaLabel).toMatch(/— (Admin|Project Manager|Member|Guest) — disabled$/)
    })
  })

  it("Case 3 — card header has v3.0 Badge AND Kopyala button is disabled", () => {
    render(<PermissionMatrixCard />)
    // v3.0 Badge in header — text appears multiple times across the page
    // (badge label key value), but at minimum the card header has it.
    const v3Texts = screen.getAllByText("v3.0")
    expect(v3Texts.length).toBeGreaterThanOrEqual(1)
    // Kopyala button — disabled per D-A3 defense layer 2.
    const kopyalaButton = screen.getByRole("button", { name: /Kopyala/i })
    expect(kopyalaButton).toBeDisabled()
    // Tooltip via title attr ensures admins hovering see the v3.0 message.
    expect(kopyalaButton.getAttribute("title")).toMatch(/v3\.0/)
  })
})
