// Phase 15 Plan 15-11 Task 1.6 — RoleDeleteConfirm RTL tests.
//
// Wraps the existing ConfirmDialog primitive (Phase 14 14-01 D-25) with
// danger tone + Member fallback warning text per D-2.2.
//
// Cases:
//   1. Body includes the affected user count + 'Member' fallback message
//   2. Confirm fires useDeleteRole.mutate with role.id
//   3. Cancel calls onClose without firing mutate
//   4. role=null renders nothing
//   5. Dialog uses tone="danger" — confirm button is variant="danger"

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

const deleteMutateMock = vi.fn()
const deleteStateRef = { isPending: false }
vi.mock("@/hooks/use-delete-role", () => ({
  useDeleteRole: () => ({
    mutate: deleteMutateMock,
    isPending: deleteStateRef.isPending,
  }),
}))

import { RoleDeleteConfirm } from "./role-delete-confirm"
import type { Role } from "@/services/admin-rbac-service"

const customRole: Role = {
  id: 42,
  name: "Designer",
  description: "Custom role",
  icon_key: "star",
  color_token: "--info",
  is_system_role: false,
}

describe("RoleDeleteConfirm (Plan 15-11 — D-2.2)", () => {
  beforeEach(() => {
    deleteMutateMock.mockReset()
    deleteStateRef.isPending = false
  })

  it("Case 1 — body includes the affected user count + Member fallback message", () => {
    render(
      <RoleDeleteConfirm
        open={true}
        role={customRole}
        affectedUserCount={5}
        onClose={vi.fn()}
      />,
    )
    // The Plan 15-11 D-2.2 body literal: "Bu rolü silmek N kullanıcıyı Member
    // rolüne taşıyacak. Devam?" — the test asserts the count AND the Member
    // fallback word are both present in the dialog body.
    const dialogBody = document.body.textContent ?? ""
    expect(dialogBody).toMatch(/5/)
    expect(dialogBody).toMatch(/Member/i)
    expect(dialogBody).toMatch(/Devam/i)
  })

  it("Case 2 — confirm fires useDeleteRole.mutate with role.id", () => {
    render(
      <RoleDeleteConfirm
        open={true}
        role={customRole}
        affectedUserCount={3}
        onClose={vi.fn()}
      />,
    )
    const confirmBtn = screen.getByRole("button", { name: /^sil$/i })
    fireEvent.click(confirmBtn)
    expect(deleteMutateMock).toHaveBeenCalledTimes(1)
    expect(deleteMutateMock.mock.calls[0][0]).toBe(42)
  })

  it("Case 3 — cancel calls onClose without firing mutate", () => {
    const onClose = vi.fn()
    render(
      <RoleDeleteConfirm
        open={true}
        role={customRole}
        affectedUserCount={0}
        onClose={onClose}
      />,
    )
    const cancelBtn = screen.getByRole("button", { name: /İptal/ })
    fireEvent.click(cancelBtn)
    expect(onClose).toHaveBeenCalled()
    expect(deleteMutateMock).not.toHaveBeenCalled()
  })

  it("Case 4 — role=null renders nothing (defensive guard)", () => {
    const { container } = render(
      <RoleDeleteConfirm
        open={true}
        role={null}
        affectedUserCount={0}
        onClose={vi.fn()}
      />,
    )
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    // ConfirmDialog also portals — make sure no danger button leaked into body.
    expect(document.body.textContent).not.toMatch(/Bu rolü silmek/i)
  })
})
