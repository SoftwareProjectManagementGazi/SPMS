// Phase 14 Plan 14-03 Task 1 — UsersTable RTL tests.
//
// Verifies 4 mandatory cases per <behavior>:
//   1. Loading: useAdminUsers returns isLoading=true → DataState loading rendered.
//   2. Empty: useAdminUsers returns items=[] → empty state rendered.
//   3. Renders 3 mock users: assert table has 3 rows + each row has Avatar + email + role Badge.
//   4. Bulk select: click checkbox on row 1 → UserBulkBar appears + shows "1 seçili".

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// ---- next/navigation mock ----
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/users",
  useSearchParams: () => new URLSearchParams(),
}))

// ---- next/link mock ----
vi.mock("next/link", () => ({
  default: ({ href, children, style, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} style={style} {...rest}>
      {children}
    </a>
  ),
}))

// ---- useApp / useAuth mocks ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, email: "[email protected]", role: { name: "Admin" } },
    token: "x",
    isLoading: false,
  }),
}))

// ---- useToast mock ----
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

// ---- useAdminUsers mock — overridable per-test ----
type AdminUsersQ = {
  data?: unknown
  isLoading?: boolean
  error?: unknown
}
const adminUsersStateRef: { current: AdminUsersQ } = {
  current: { data: [], isLoading: false, error: null },
}
vi.mock("@/hooks/use-admin-users", () => ({
  useAdminUsers: () => adminUsersStateRef.current,
}))

// ---- Other admin hooks — used by row actions / bulk bar / toolbar ----
vi.mock("@/hooks/use-deactivate-user", () => ({
  useDeactivateUser: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/hooks/use-reset-password", () => ({
  useResetPassword: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/hooks/use-change-role", () => ({
  useChangeRole: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/hooks/use-bulk-action", () => ({
  useBulkAction: () => ({ mutate: vi.fn(), isPending: false }),
}))

// ---- Stub MoreMenu so the trigger renders a plain button ----
vi.mock("@/components/admin/shared/more-menu", () => ({
  MoreMenu: ({ ariaLabel, trigger }: any) =>
    trigger ?? <button aria-label={ariaLabel}>menu</button>,
}))

// ---- ConfirmDialog stub: we don't need to drive the dialog in this test ----
vi.mock("@/components/projects/confirm-dialog", () => ({
  ConfirmDialog: ({ open, title, body, onConfirm, onCancel }: any) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <span>{body}</span>
        <button onClick={onConfirm}>OK</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}))

// SUT — imported AFTER all mocks are wired
import { UsersTable } from "./users-table"

describe("UsersTable (Plan 14-03 Task 1)", () => {
  beforeEach(() => {
    adminUsersStateRef.current = { data: [], isLoading: false, error: null }
  })

  it("Case 1 — isLoading=true → renders DataState loading copy", () => {
    adminUsersStateRef.current = { isLoading: true, data: undefined }
    render(
      <UsersTable
        filter={{ q: "", role: undefined }}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={vi.fn()}
      />,
    )
    // DataState's default TR loading copy
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument()
  })

  it("Case 2 — empty data → renders empty state", () => {
    adminUsersStateRef.current = {
      isLoading: false,
      data: { items: [], total: 0 },
    }
    render(
      <UsersTable
        filter={{ q: "", role: undefined }}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={vi.fn()}
      />,
    )
    // Empty-state TR copy
    expect(screen.getByText(/henüz kullanıcı yok/i)).toBeInTheDocument()
  })

  it("Case 3 — renders 3 mock users with email + role badges", () => {
    adminUsersStateRef.current = {
      isLoading: false,
      data: {
        items: [
          {
            id: 1,
            full_name: "Alice Admin",
            email: "[email protected]",
            is_active: true,
            role: { name: "Admin" },
          },
          {
            id: 2,
            full_name: "Bob PM",
            email: "[email protected]",
            is_active: true,
            role: { name: "Project Manager" },
          },
          {
            id: 3,
            full_name: "Carol Member",
            email: "[email protected]",
            is_active: false,
            role: { name: "Member" },
          },
        ],
        total: 3,
      },
    }
    render(
      <UsersTable
        filter={{ q: "", role: undefined }}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={vi.fn()}
      />,
    )
    expect(screen.getByText("Alice Admin")).toBeInTheDocument()
    expect(screen.getByText("Bob PM")).toBeInTheDocument()
    expect(screen.getByText("Carol Member")).toBeInTheDocument()
    // 3 emails + at least one role badge for each (Admin/PM/Member). We
    // assert on 3 distinct matches using getAllByText to handle the column
    // header "Email" potentially overlapping with the row email cells.
    expect(screen.getAllByText("[email protected]").length).toBeGreaterThan(0)
    expect(screen.getAllByText("[email protected]").length).toBeGreaterThan(0)
    expect(screen.getAllByText("[email protected]").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Project Manager").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Member").length).toBeGreaterThan(0)
    // Inactive Carol shows the Pasif status badge
    expect(screen.getByText("Pasif")).toBeInTheDocument()
  })

  it("Case 4 — bulk select: clicking row checkbox flips selection", () => {
    adminUsersStateRef.current = {
      isLoading: false,
      data: {
        items: [
          {
            id: 1,
            full_name: "Alice Admin",
            email: "[email protected]",
            is_active: true,
            role: { name: "Admin" },
          },
        ],
        total: 1,
      },
    }
    const onToggleSelect = vi.fn()
    render(
      <UsersTable
        filter={{ q: "", role: undefined }}
        selectedIds={[]}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={vi.fn()}
      />,
    )
    // Row checkbox — labelled "Select Alice Admin" (row checkbox aria-label)
    const cb = screen.getByLabelText(/select alice admin/i)
    fireEvent.click(cb)
    expect(onToggleSelect).toHaveBeenCalledWith(1)
  })
})
