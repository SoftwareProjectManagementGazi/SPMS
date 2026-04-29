// Phase 15 Plan 15-11 Task 1.5 — RoleEditModal RTL tests.
//
// Edit modal is a sibling of RoleCreateModal — same form shape but pre-fills
// from the supplied role prop and renders system roles as read-only.
//
// Cases:
//   1. open=true with custom role pre-fills name/description/icon/color
//   2. System role renders AlertBanner "Sistem rolleri düzenlenemez" + inputs disabled
//   3. Save button disabled when system role (defense in depth on top of the
//      backend SYSTEM_ROLE_PROTECTED 422)
//   4. Valid submit on a custom role fires useUpdateRole.mutate with {id, req}
//   5. role=null renders nothing (defensive guard)

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

const updateMutateMock = vi.fn()
const updateStateRef = { isPending: false }
vi.mock("@/hooks/use-update-role", () => ({
  useUpdateRole: () => ({
    mutate: updateMutateMock,
    isPending: updateStateRef.isPending,
  }),
}))

import { RoleEditModal } from "./role-edit-modal"
import type { Role } from "@/services/admin-rbac-service"

const customRole: Role = {
  id: 42,
  name: "Designer",
  description: "Custom role for design folks",
  icon_key: "star",
  color_token: "--info",
  is_system_role: false,
}

const systemRole: Role = {
  id: 1,
  name: "Admin",
  description: "Sistem geneli — tüm projelerde tam yetkili.",
  icon_key: "shield-check",
  color_token: "--priority-critical",
  is_system_role: true,
}

describe("RoleEditModal (Plan 15-11 — D-2.3 / D-2.8)", () => {
  beforeEach(() => {
    updateMutateMock.mockReset()
    updateStateRef.isPending = false
  })

  it("Case 1 — pre-fills form from role prop", () => {
    render(<RoleEditModal open={true} role={customRole} onClose={vi.fn()} />)
    const nameInput = screen.getByLabelText(/İsim/) as HTMLInputElement
    const descInput = screen.getByLabelText(/Açıklama/) as HTMLInputElement
    expect(nameInput.value).toBe("Designer")
    expect(descInput.value).toBe("Custom role for design folks")
    // Selected icon + color reflect the role.
    const star = screen.getByRole("radio", { name: /star/i })
    expect(star.getAttribute("aria-checked")).toBe("true")
    const info = screen.getByRole("radio", { name: /^info$/i })
    expect(info.getAttribute("aria-checked")).toBe("true")
  })

  it("Case 2 — system role shows AlertBanner 'Sistem rolleri düzenlenemez'", () => {
    render(<RoleEditModal open={true} role={systemRole} onClose={vi.fn()} />)
    expect(
      screen.getByText(/Sistem rolleri düzenlenemez/i),
    ).toBeInTheDocument()
  })

  it("Case 3 — system role renders inputs disabled", () => {
    render(<RoleEditModal open={true} role={systemRole} onClose={vi.fn()} />)
    const nameInput = screen.getByLabelText(/İsim/) as HTMLInputElement
    const descInput = screen.getByLabelText(/Açıklama/) as HTMLInputElement
    expect(nameInput.disabled).toBe(true)
    expect(descInput.disabled).toBe(true)
  })

  it("Case 4 — Save button disabled for system roles (defense in depth)", () => {
    render(<RoleEditModal open={true} role={systemRole} onClose={vi.fn()} />)
    const saveBtn = screen.getByRole("button", { name: /kaydet/i })
    expect(saveBtn).toBeDisabled()
  })

  it("Case 5 — valid submit on custom role fires useUpdateRole.mutate with {id, req}", async () => {
    render(<RoleEditModal open={true} role={customRole} onClose={vi.fn()} />)
    const nameInput = screen.getByLabelText(/İsim/) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: "Senior Designer" } })

    const saveBtn = await waitFor(() => {
      const btn = screen.getByRole("button", { name: /kaydet/i })
      expect(btn).not.toBeDisabled()
      return btn
    })
    fireEvent.click(saveBtn)

    expect(updateMutateMock).toHaveBeenCalledTimes(1)
    const [payload, options] = updateMutateMock.mock.calls[0]
    expect(payload).toMatchObject({
      id: 42,
      req: {
        name: "Senior Designer",
        description: "Custom role for design folks",
        icon_key: "star",
        color_token: "--info",
      },
    })
    expect(options).toMatchObject({ onSuccess: expect.any(Function) })
  })

  it("Case 6 — role=null renders nothing", () => {
    const { container } = render(<RoleEditModal open={true} role={null} onClose={vi.fn()} />)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })
})
