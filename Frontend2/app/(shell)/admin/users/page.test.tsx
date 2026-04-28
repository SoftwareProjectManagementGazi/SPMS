// Phase 14 Plan 14-17 Task 2 — AdminUsersPage ?role= URL param parser tests.
//
// Closes UAT Test 19 (Cluster E gap closure) — the second half of the gap:
// even if RoleCard's "Görüntüle" link is wired to /admin/users?role=admin,
// the destination page must actually CONSUME the URL param and seed the
// SegmentedControl + filter — otherwise the cross-tab navigation lands on
// an unfiltered table and the data-consistency contract (D-W1) breaks.
//
// Four mandatory cases per <behavior>:
//
//   1. ?role=pm in URL → SegmentedControl initial value is "Project Manager";
//      useAdminUsers receives `{role: "Project Manager"}` filter.
//
//   2. No ?role= param + localStorage value `{role: "Admin"}` already set →
//      filter seeds from localStorage (existing Plan 14-03 behavior preserved
//      — NO regression).
//
//   3. ?role=Admin URL param + a DIFFERENT localStorage value `{role: "Member"}`
//      → URL param WINS (overrides localStorage) AND writes through so the
//      next visit without ?role= shows Admin.
//
//   4. No ?role= and no localStorage → SegmentedControl shows "Tümü" / "all"
//      (DEFAULT_FILTER fallback).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

// ---- next/navigation mock — overridable per-test searchParams ----
let currentSearchParams = new URLSearchParams()
const pushMock = vi.fn()
const replaceMock = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    back: vi.fn(),
  }),
  usePathname: () => "/admin/users",
}))

// ---- next/link mock ----
vi.mock("next/link", () => ({
  default: ({ href, children, style, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} style={style} {...rest}>
      {children}
    </a>
  ),
}))

// ---- context mocks ----
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

// ---- toast mock ----
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

// ---- useAdminUsers — capture filter argument so we can assert on it ----
const useAdminUsersSpy = vi.fn(() => ({
  data: { items: [], total: 0 },
  isLoading: false,
  error: null,
}))
vi.mock("@/hooks/use-admin-users", () => ({
  useAdminUsers: (...args: unknown[]) => useAdminUsersSpy(...args),
}))

// ---- Other admin hooks used by row actions / modals ----
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
vi.mock("@/hooks/use-invite-user", () => ({
  useInviteUser: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/hooks/use-bulk-invite", () => ({
  useBulkInvite: () => ({ mutate: vi.fn(), isPending: false }),
}))

// ---- Stub MoreMenu so trigger renders simply ----
vi.mock("@/components/admin/shared/more-menu", () => ({
  MoreMenu: ({ ariaLabel, trigger }: any) =>
    trigger ?? <button aria-label={ariaLabel}>menu</button>,
}))

// ---- Stub ConfirmDialog ----
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

// ---- Stub Modal so AddUserModal / BulkInviteModal mount cheaply ----
vi.mock("@/components/primitives/modal", async () => {
  const actual = await vi.importActual<any>("@/components/primitives/modal")
  return actual
})

// SUT — imported AFTER all mocks
import AdminUsersPage from "./page"

const STORAGE_KEY = "spms.admin.users.filter"

function setUrlSearchParams(qs: string) {
  currentSearchParams = new URLSearchParams(qs)
}

function seedLocalStorage(value: unknown) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

function clearLocalStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}

describe("AdminUsersPage ?role= URL param parser (Plan 14-17 Task 2)", () => {
  beforeEach(() => {
    setUrlSearchParams("")
    clearLocalStorage()
    pushMock.mockClear()
    replaceMock.mockClear()
    useAdminUsersSpy.mockClear()
  })

  it("Case 1 — ?role=pm in URL → useAdminUsers receives {role: 'Project Manager'}", async () => {
    // The cross-tab role identifier scheme is the role-card's `id` field
    // ("admin" | "pm" | "member" | "guest"). The page must MAP these short
    // identifiers to the canonical role enum strings ("Admin" / "Project
    // Manager" / "Member") that useAdminUsers + the SegmentedControl expect.
    setUrlSearchParams("role=pm")

    render(<AdminUsersPage />)

    // First call should reflect the URL-driven filter. May happen on initial
    // render or via the useEffect write-through; assert on the LAST call to
    // tolerate either ordering.
    await waitFor(() => {
      const calls = useAdminUsersSpy.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      const lastFilter = calls[calls.length - 1][0] as { role?: string }
      expect(lastFilter.role).toBe("Project Manager")
    })
  })

  it("Case 1b — ?role=admin → useAdminUsers receives {role: 'Admin'}", async () => {
    setUrlSearchParams("role=admin")
    render(<AdminUsersPage />)
    await waitFor(() => {
      const calls = useAdminUsersSpy.mock.calls
      const lastFilter = calls[calls.length - 1][0] as { role?: string }
      expect(lastFilter.role).toBe("Admin")
    })
  })

  it("Case 1c — ?role=member → useAdminUsers receives {role: 'Member'}", async () => {
    setUrlSearchParams("role=member")
    render(<AdminUsersPage />)
    await waitFor(() => {
      const calls = useAdminUsersSpy.mock.calls
      const lastFilter = calls[calls.length - 1][0] as { role?: string }
      expect(lastFilter.role).toBe("Member")
    })
  })

  it("Case 2 — no ?role= but localStorage has {role: 'Admin'} → filter seeds from localStorage (Plan 14-03 regression guard)", async () => {
    // Plan 14-03 contract: filter persists across tab switches via
    // localStorage. Plan 14-17 must NOT regress this when the user arrives
    // without a URL param.
    seedLocalStorage({ q: "", role: "Admin", status: undefined })
    setUrlSearchParams("") // explicit no role param

    render(<AdminUsersPage />)

    await waitFor(() => {
      const calls = useAdminUsersSpy.mock.calls
      const lastFilter = calls[calls.length - 1][0] as { role?: string }
      expect(lastFilter.role).toBe("Admin")
    })
  })

  it("Case 3 — ?role=admin + localStorage has 'Member' → URL wins AND writes through", async () => {
    seedLocalStorage({ q: "", role: "Member", status: undefined })
    setUrlSearchParams("role=admin")

    render(<AdminUsersPage />)

    await waitFor(() => {
      const calls = useAdminUsersSpy.mock.calls
      const lastFilter = calls[calls.length - 1][0] as { role?: string }
      // URL must override the stale localStorage value.
      expect(lastFilter.role).toBe("Admin")
    })

    // And the page must write through so the NEXT visit (without ?role=)
    // sees Admin too — D-W1 cross-tab data consistency contract.
    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.role).toBe("Admin")
    })
  })

  it("Case 4 — no URL + no localStorage → SegmentedControl shows default 'all' (no filter)", async () => {
    clearLocalStorage()
    setUrlSearchParams("")

    render(<AdminUsersPage />)

    await waitFor(() => {
      const calls = useAdminUsersSpy.mock.calls
      const lastFilter = calls[calls.length - 1][0] as { role?: string | undefined }
      // No explicit role filter — DEFAULT_FILTER has role: undefined.
      expect(lastFilter.role).toBeUndefined()
    })
  })
})
