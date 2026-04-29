// Phase 15 Plan 15-11 Task 2 — UserRowActions self-edit prevention RTL tests.
// Phase 15 hotfix — searchable role picker (replaces hardcoded
// [Admin / PM / Member] submenu); D-1.17 frontend contract migrate
// {role: name} → {roleId: int}.
//
// D-2.9 — When the row's user is the logged-in admin, the "Rolü değiştir"
// menuitem must be disabled to prevent self-role-change lockout. Backend
// ChangeUserRoleUseCase ALSO raises PermissionError on self-edit (Phase 15
// Plan 15-05 D-2.9), so this UI guard is defense in depth.
//
// 4 cases:
//   1. Self (currentUser.id === row user.id) → "Rolü değiştir" disabled.
//   2. Not self (different ids) → "Rolü değiştir" enabled.
//   3. Self + click on the disabled item → no role-picker / no mutation.
//   4. Not self + click → role-picker dialog opens with all roles + search.

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

// Phase 15 hotfix — useRoles drives the role-picker dialog. Mock returns the
// 4 system roles + 1 custom role so tests can exercise dynamic + searchable
// behaviour.
vi.mock("@/hooks/use-roles", () => ({
  useRoles: () => ({
    data: {
      items: [
        { id: 1, name: "Admin", is_system_role: true },
        { id: 2, name: "Project Manager", is_system_role: true },
        { id: 3, name: "Member", is_system_role: true },
        { id: 4, name: "Guest", is_system_role: true },
        { id: 242, name: "Kodlamacı", is_system_role: false },
      ],
      total: 5,
    },
    isLoading: false,
  }),
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

  it("Case 3 — clicking disabled 'Rolü değiştir' for self does NOT open the role-picker", () => {
    mockCurrentUserRef.current = { id: 42 }
    render(<UserRowActions user={{ id: 42, full_name: "Self User" }} />)
    openMoreMenu()
    const items = screen.getAllByRole("menuitem")
    const changeRole = items.find((el) => /Rolü değiştir/.test(el.textContent ?? ""))!
    fireEvent.click(changeRole)
    // The role-picker dialog should NOT be in the document.
    expect(screen.queryByRole("dialog", { name: /Rol seç/i })).toBeNull()
    expect(changeRoleMutateMock).not.toHaveBeenCalled()
  })

  it("Case 4 — clicking 'Rolü değiştir' for another user opens the searchable role-picker with custom roles included", () => {
    mockCurrentUserRef.current = { id: 42 }
    render(<UserRowActions user={{ id: 999, full_name: "Other User" }} />)
    openMoreMenu()
    const items = screen.getAllByRole("menuitem")
    const changeRole = items.find((el) => /Rolü değiştir/.test(el.textContent ?? ""))!
    fireEvent.click(changeRole)
    // Picker dialog opens with all roles (system + custom).
    const dialog = screen.getByRole("dialog", { name: /Rol seç/i })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /^Admin/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /^Project Manager/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /^Member/ })).toBeInTheDocument()
    // Custom Plan 15-11 role appears too — the bug this hotfix addresses.
    expect(screen.getByRole("option", { name: /^Kodlamacı/ })).toBeInTheDocument()
  })

  it("Case 5 — picking a role fires useChangeRole.mutate({userId, roleId}) per D-1.17 contract", () => {
    mockCurrentUserRef.current = { id: 42 }
    render(<UserRowActions user={{ id: 999, full_name: "Other User" }} />)
    openMoreMenu()
    const items = screen.getAllByRole("menuitem")
    const changeRole = items.find((el) => /Rolü değiştir/.test(el.textContent ?? ""))!
    fireEvent.click(changeRole)
    const member = screen.getByRole("option", { name: /^Member/ })
    fireEvent.click(member)
    expect(changeRoleMutateMock).toHaveBeenCalledTimes(1)
    expect(changeRoleMutateMock).toHaveBeenCalledWith({ userId: 999, roleId: 3 })
  })

  it("Case 6 — search filter narrows roles to substring match", () => {
    mockCurrentUserRef.current = { id: 42 }
    render(<UserRowActions user={{ id: 999, full_name: "Other User" }} />)
    openMoreMenu()
    const items = screen.getAllByRole("menuitem")
    const changeRole = items.find((el) => /Rolü değiştir/.test(el.textContent ?? ""))!
    fireEvent.click(changeRole)
    const search = screen.getByPlaceholderText(/Rol ara/i)
    fireEvent.change(search, { target: { value: "kodla" } })
    expect(screen.queryByRole("option", { name: /^Admin/ })).toBeNull()
    expect(screen.getByRole("option", { name: /^Kodlamacı/ })).toBeInTheDocument()
  })
})
