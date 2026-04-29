// Phase 15 Plan 15-10 — NewRoleModalTrigger RTL tests (renamed from
// new-role-placeholder-card.test.tsx — Phase 14 14-04 had no test file for
// the placeholder). Layer 6 of D-2.7 atomic 7-layer uplift.
//
// Verifies:
//   1. Renders "Yeni rol oluştur" / "Create new role" label (TR/EN parity).
//   2. Subtitle reflects ACTIVE state ("Özel bir rol tanımla") — NOT the
//      Phase 14 14-04 placeholder copy ("v3.0'da gelecek"). Negative
//      assertion gate against accidental v3.0 reactivation.
//   3. Click fires onClick handler (real interactive trigger, not
//      role="presentation" no-op).
//   4. data-testid="new-role-modal-trigger" exposes the trigger to E2E
//      (Plan 15-12 admin-rbac-matrix spec navigates to RoleCreateModal via
//      this hook).

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { NewRoleModalTrigger } from "./new-role-modal-trigger"

describe("NewRoleModalTrigger (Plan 15-10 — D-2.7 layer 6)", () => {
  it("Case 1 — renders 'Yeni rol oluştur' title", () => {
    render(<NewRoleModalTrigger onClick={vi.fn()} />)
    expect(screen.getByText("Yeni rol oluştur")).toBeInTheDocument()
  })

  it("Case 2 — subtitle FLIPPED from Phase 14 placeholder ('v3.0' string absent)", () => {
    render(<NewRoleModalTrigger onClick={vi.fn()} />)
    // Active subtitle present.
    expect(screen.getByText("Özel bir rol tanımla")).toBeInTheDocument()
    // Phase 14 14-04 placeholder copy MUST NOT survive.
    const root = screen.getByTestId("new-role-modal-trigger")
    expect(root.textContent ?? "").not.toMatch(/v3\.0/i)
    expect(root.textContent ?? "").not.toMatch(/gelecek/i)
  })

  it("Case 3 — click fires onClick (interactive button, not presentation div)", () => {
    const handler = vi.fn()
    render(<NewRoleModalTrigger onClick={handler} />)
    fireEvent.click(screen.getByTestId("new-role-modal-trigger"))
    expect(handler).toHaveBeenCalledOnce()
  })

  it("Case 4 — uses semantic <button> element (keyboard accessible)", () => {
    render(<NewRoleModalTrigger onClick={vi.fn()} />)
    const trigger = screen.getByTestId("new-role-modal-trigger")
    // <button> not <div role="presentation"> — keyboard activation works.
    expect(trigger.tagName).toBe("BUTTON")
    // type="button" prevents form submission if mounted inside <form>.
    expect(trigger.getAttribute("type")).toBe("button")
  })
})
