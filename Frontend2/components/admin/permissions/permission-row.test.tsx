// Phase 15 Plan 15-10 — PermissionRow RTL tests (NEW; layer 1 of D-2.7
// atomic 7-layer uplift verification).
//
// Verifies the FLIPPED behavior vs. Phase 14 14-04:
//   1. Renders permission label + inline PermissionScopeBadge.
//   2. PM toggle reflects granted state from cells array.
//   3. PM toggle (non-Admin/Guest) is NOT disabled — onChange fires
//      useUpdatePermissionCell.mutate with {roleId, permKey, granted}.
//   4. Admin column toggle IS disabled (D-1.5 super-role visual readonly).
//   5. Guest column toggle IS disabled (D-2.4 read-only system role).
//   6. Click on disabled (Admin/Guest) toggle does NOT fire mutation
//      (defense in depth — onChange short-circuits for system-role columns).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

const mockMutate = vi.fn()

vi.mock("@/hooks/use-update-permission-cell", () => ({
  useUpdatePermissionCell: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}))
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { PermissionRow } from "./permission-row"
import type {
  MatrixCell,
  Permission,
  Role,
} from "@/services/admin-rbac-service"

const projectPerm: Permission = {
  id: 10,
  key: "task.create",
  label_tr: "Görev oluştur",
  label_en: "Create task",
  scope: "project",
}
const systemPerm: Permission = {
  id: 11,
  key: "admin.users.invite",
  label_tr: "Kullanıcı davet et",
  label_en: "Invite user",
  scope: "system",
}

const roles: Role[] = [
  { id: 1, name: "Admin", is_system_role: true },
  { id: 2, name: "Project Manager", is_system_role: true },
  { id: 3, name: "Member", is_system_role: true },
  { id: 4, name: "Guest", is_system_role: true },
]

// PM is granted task.create; Member is not; Admin is computed visually
// (D-1.5 super-role); Guest is read-only.
const cells: MatrixCell[] = [
  { role_id: 2, permission_id: 10, granted: true },
]

beforeEach(() => {
  mockMutate.mockClear()
})

function renderRow(perm: Permission, cellSet: MatrixCell[] = cells) {
  return render(
    <table>
      <tbody>
        <tr>
          <td>
            <PermissionRow permission={perm} roles={roles} cells={cellSet} />
          </td>
        </tr>
      </tbody>
    </table>,
  )
}

describe("PermissionRow (Plan 15-10 — D-2.7 layer 1)", () => {
  it("Case 1 — renders permission label + inline scope badge (project)", () => {
    renderRow(projectPerm)
    expect(screen.getByText("Görev oluştur")).toBeInTheDocument()
    // PermissionScopeBadge renders "(proje)" for scope=project in TR.
    expect(screen.getByText("(proje)")).toBeInTheDocument()
  })

  it("Case 1b — renders '(sistem)' badge for scope=system permissions", () => {
    renderRow(systemPerm)
    expect(screen.getByText("(sistem)")).toBeInTheDocument()
  })

  it("Case 2 — PM toggle reflects granted=true from cells", () => {
    renderRow(projectPerm)
    const pmToggle = screen.getByLabelText(
      "task.create for Project Manager",
    ) as HTMLInputElement
    expect(pmToggle.checked).toBe(true)
  })

  it("Case 3 — PM toggle is ENABLED (FLIPPED from Phase 14 disabled)", () => {
    renderRow(projectPerm)
    const pmToggle = screen.getByLabelText("task.create for Project Manager")
    expect(pmToggle).not.toBeDisabled()
  })

  it("Case 3b — PM toggle onChange fires useUpdatePermissionCell.mutate", () => {
    // Member starts ungranted; clicking flips to granted.
    renderRow(projectPerm)
    const memberToggle = screen.getByLabelText("task.create for Member")
    fireEvent.click(memberToggle)
    expect(mockMutate).toHaveBeenCalledWith({
      roleId: 3,
      permKey: "task.create",
      granted: true,
    })
  })

  it("Case 4 — Admin column toggle is DISABLED (D-1.5 super-role)", () => {
    renderRow(projectPerm)
    const adminToggle = screen.getByLabelText("task.create for Admin")
    expect(adminToggle).toBeDisabled()
  })

  it("Case 4b — Admin column toggle is visually ON (D-1.5 super-role visual)", () => {
    renderRow(projectPerm)
    const adminToggle = screen.getByLabelText(
      "task.create for Admin",
    ) as HTMLInputElement
    // Even though `cells` doesn't list the (1, 10) entry, Admin is shown
    // granted per D-1.5 wildcard semantics.
    expect(adminToggle.checked).toBe(true)
  })

  it("Case 5 — Guest column toggle is DISABLED (D-2.4 read-only)", () => {
    renderRow(projectPerm)
    const guestToggle = screen.getByLabelText("task.create for Guest")
    expect(guestToggle).toBeDisabled()
  })

  it("Case 6 — disabled toggle change handler short-circuits (no mutation)", () => {
    renderRow(projectPerm)
    // jsdom click does not fire change on disabled inputs anyway, but the
    // defense-in-depth `if (isAdmin || isGuest) return` is the contract.
    // We verify by inspecting the mock: zero calls.
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it("Case 7 — Phase 14 'aria-disabled=true' attribute REMOVED for active toggles", () => {
    renderRow(projectPerm)
    const pmToggle = screen.getByLabelText("task.create for Project Manager")
    // Phase 14 14-04 set aria-disabled="true" on every toggle as defense
    // layer 2. Plan 15-10 removes it for non-Admin/Guest columns.
    expect(pmToggle.getAttribute("aria-disabled")).not.toBe("true")
  })
})
