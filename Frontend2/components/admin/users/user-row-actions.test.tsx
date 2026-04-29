// Phase 15 Plan 15-11 Task 2 — UserRowActions self-edit prevention RTL tests.
//
// D-2.9 — When the row's user is the logged-in admin, the "Rolü değiştir"
// menuitem must be disabled to prevent self-role-change lockout. Backend
// ChangeUserRoleUseCase ALSO raises PermissionError on self-edit (Phase 15
// Plan 15-05 D-2.9), so this UI guard is defense in depth.
//
// 4 cases:
//   1. Self (currentUser.id === row user.id) → "Rolü değiştir" disabled.
//   2. Not self (different ids) → "Rolü değiştir" enabled.
//   3. Self + click on the disabled item → no submenu / no mutation.
//   4. Not self + click → submenu opens (Admin / PM / Member items render).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// ---- Mocks ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

const mockCurrentUserRef: { current: { id: string | number } | null } = {
  current: { id: 42 },
}
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: mockCurrentUserRef.current,
    token: "x",
    isLoading: false,
    permissions: [],
    hasPermission: () => false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

const resetMutateMock = vi.fn()
vi.mock("@/hooks/use-reset-password", () => ({
  useResetPassword: () => ({ mutate: resetMutateMock, isPending: false }),
}))

const changeRoleMutateMock = vi.fn()
vi.mock("@/hooks/use-change-role", () => ({
  useChangeRole: () => ({ mutate: changeRoleMutateMock, isPending: false }),
}))

const deactivateMutateMock = vi.fn()
vi.mock("@/hooks/use-deactivate-user", () => ({
  useDeactivateUser: () => ({ mutate: deactivateMutateMock, isPending: false }),
}))

const bulkActionMutateMock = vi.fn()
vi.mock("@/hooks/use-bulk-action", () => ({
  useBulkAction: () => ({ mutate: bulkActionMutateMock, isPending: false }),
}))

import { UserRowActions } from "./user-row-actions"

describe("UserRowActions self-edit prevention (Plan 15-11 — D-2.9)", () => {
  beforeEach(() => {
    resetMutateMock.mockReset()
    changeRoleMutateMock.mockReset()
    deactivateMutateMock.mockReset()
    bulkActionMutateMock.mockReset()
    mockCurrentUserRef.current = { id: 42 }
  })

  function openMoreMenu() {
    const trigger = screen.getByRole("button", { name: /Rolü değiştir|Change role|İşlemler/ })
    fireEvent.click(trigger)
  }

  it("Case 1 — currentUser.id === user.id → 'Rolü değiştir' menuitem disabled", () => {
    mockCurrentUserRef.current = { id: 42 }
    render(<UserRowActions user={{ id: 42, full_name: "Self User" }} />)
    openMoreMenu()
    // Find the Rolü değiştir menuitem — it's a <button role="menuitem">.
    const items = screen.getAllByRole("menuitem")
    const changeRole = items.find((el) => /Rolü değiştir/.test(el.textContent ?? ""))
    expect(changeRole).toBeTruthy()
    expect(changeRole).toBeDisabled()
  })

  it("Case 2 — currentUser.id !== user.id → 'Rolü değiştir' menuitem enabled", () => {
    mockCurrentUserRef.current = { id: 42 }
    render(<UserRowActions user={{ id: 999, full_name: "Other User" }} />)
    openMoreMenu()
    const items = screen.getAllByRole("menuitem")
    const changeRole = items.find((el) => /Rolü değiştir/.test(el.textContent ?? ""))
    expect(changeRole).toBeTruthy()
    expect(changeRole).not.toBeDisabled()
  })

  it("Case 3 — clicking disabled 'Rolü değiştir' for self does NOT open submenu", () => {
    mockCurrentUserRef.current = { id: 42 }
    render(<UserRowActions user={{ id: 42, full_name: "Self User" }} />)
    openMoreMenu()
    const items = screen.getAllByRole("menuitem")
    const changeRole = items.find((el) => /Rolü değiştir/.test(el.textContent ?? ""))!
    // The MoreMenu primitive short-circuits disabled items in handleItemClick.
    fireEvent.click(changeRole)
    // The role submenu would expose Admin / Project Manager / Member as
    // additional menuitems if it had opened. Because the click was a no-op,
    // no extra menuitem with that label is rendered.
    expect(screen.queryByRole("menuitem", { name: /^Admin$/ })).toBeNull()
    expect(screen.queryByRole("menuitem", { name: /^Project Manager$/ })).toBeNull()
    // changeRoleMutate must not be called either.
    expect(changeRoleMutateMock).not.toHaveBeenCalled()
  })

  it("Case 4 — clicking enabled 'Rolü değiştir' for another user opens the submenu", () => {
    mockCurrentUserRef.current = { id: 42 }
    render(<UserRowActions user={{ id: 999, full_name: "Other User" }} />)
    openMoreMenu()
    const items = screen.getAllByRole("menuitem")
    const changeRole = items.find((el) => /Rolü değiştir/.test(el.textContent ?? ""))!
    fireEvent.click(changeRole)
    // Submenu opens with the 3 role choices.
    expect(screen.getByRole("menuitem", { name: /^Admin$/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /^Project Manager$/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /^Member$/ })).toBeInTheDocument()
  })
})
