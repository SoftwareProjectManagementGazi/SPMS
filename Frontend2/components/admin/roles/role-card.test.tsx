// Phase 14 Plan 14-17 (Cluster E) → Phase 15 Plan 15-10 (RBAC active)
// — RoleCard + AdminRolesPage RTL tests.
//
// Plan 15-10 — Layer 7 of D-2.7 atomic 7-layer placeholder uplift FLIPS
// these assertions:
//   - Phase 14: Guest renders with disabled + v3Badge props.
//   - Phase 15: Guest renders as ACTIVE read-only card with isSystemRole
//     prop driving the Sistem badge; NO opacity 0.6, NO disabled cursor,
//     NO v3.0 string.
//
// Plan 14-17 invariants PRESERVED unchanged:
//   - Null-safe count rendering (em-dash for undefined / NaN, not "undefined"
//     / "NaN" strings).
//   - useAdminUsers({limit: 1000}) count source ceiling.
//   - N-3 truncation AlertBanner when total > 1000.
//
// Cases:
//   1   — RoleCard userCount=12 renders "12"; never "=" / "undefined" / "NaN".
//   1b  — RoleCard userCount=NaN renders em-dash, NOT "NaN".
//   5a  — RoleCard renders Görüntüle link with /admin/users?role=<id> for
//         all cards (Phase 15 — no longer disabled-suppressed for Guest).
//   7   (NEW) — RoleCard with isSystemRole renders Sistem badge.
//   7b  (NEW) — RoleCard without isSystemRole does NOT render Sistem badge.
//   7c  (NEW) — RoleCard with isSystemRole HIDES Düzenle/Sil action buttons
//         even when onEdit/onDelete props are provided.
//   7d  (NEW) — RoleCard without isSystemRole RENDERS Düzenle/Sil when
//         onEdit/onDelete are provided.
//   7e  (NEW) — RoleCard does NOT contain the literal "v3.0" anywhere
//         (atomic uplift gate against accidental Phase 14 reactivation).
//   2   — AdminRolesPage with mocked counts renders 3/5/12; no truncation
//         banner when total ≤ 1000.
//   3   — AdminRolesPage with isLoading=true renders em-dash placeholders.
//   4   — AdminRolesPage with total=1500 renders truncation AlertBanner.
//   6   — AdminRolesPage's useAdminUsers receives {limit: 1000}.
//   8   (NEW) — AdminRolesPage Roller AlertBanner copy is FLIPPED active
//         message, NOT v3.0 placeholder.
//   9   (NEW) — AdminRolesPage renders NewRoleModalTrigger (NOT
//         NewRolePlaceholderCard).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ShieldCheck } from "lucide-react"

// ---- next/navigation mock ----
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/roles",
  useSearchParams: () => new URLSearchParams(),
}))

// ---- next/link mock — plain anchor so href is testable ----
vi.mock("next/link", () => ({
  default: ({ href, children, style, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} style={style} {...rest}>
      {children}
    </a>
  ),
}))

// ---- useApp mock ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// ---- Toast mock ----
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

// ---- useAdminUsers mock — overridable per test ----
type AdminUsersQ = {
  data?: unknown
  isLoading?: boolean
  error?: unknown
}
const adminUsersStateRef: { current: AdminUsersQ } = {
  current: { data: [], isLoading: false, error: null },
}
const useAdminUsersSpy = vi.fn((_filter?: unknown) => adminUsersStateRef.current)
vi.mock("@/hooks/use-admin-users", () => ({
  useAdminUsers: (filter?: unknown) => useAdminUsersSpy(filter),
}))

// ---- Plan 15-11 — useRoles mock ----
// AdminRolesPage now consumes useRoles to render custom roles. Default to
// an empty list so the existing 4 system role cards still render unchanged
// (no custom roles in the count test fixtures).
type RolesQ = {
  data?: { items: unknown[]; total: number }
  isLoading?: boolean
  error?: unknown
}
const rolesStateRef: { current: RolesQ } = {
  current: { data: { items: [], total: 0 }, isLoading: false, error: null },
}
vi.mock("@/hooks/use-roles", () => ({
  useRoles: () => rolesStateRef.current,
}))

// ---- Plan 15-11 — modal hooks (mutate spy + isPending=false) ----
vi.mock("@/hooks/use-create-role", () => ({
  useCreateRole: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/hooks/use-update-role", () => ({
  useUpdateRole: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("@/hooks/use-delete-role", () => ({
  useDeleteRole: () => ({ mutate: vi.fn(), isPending: false }),
}))

// SUT — imported AFTER all mocks
import { RoleCard } from "./role-card"
import AdminRolesPage from "@/app/(shell)/admin/roles/page"

describe("RoleCard (Plan 14-17 + Plan 15-10 — count + Sistem badge)", () => {
  beforeEach(() => {
    adminUsersStateRef.current = { data: [], isLoading: false, error: null }
    useAdminUsersSpy.mockClear()
  })

  it("Case 1 — userCount=12 renders 12; never '=' / 'undefined' / 'NaN'", () => {
    render(
      <RoleCard
        id="admin"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Admin"
        description="Sistem geneli — tüm projelerde tam yetkili."
        userCount={12}
      />,
    )
    expect(screen.getByText("12")).toBeInTheDocument()
    const card = screen.getByText("12").closest("[data-role-card-id]")
    expect(card).not.toBeNull()
    expect(card!.textContent).not.toMatch(/=/)
    expect(card!.textContent).not.toMatch(/undefined/i)
    expect(card!.textContent).not.toMatch(/NaN/)
  })

  it("Case 1b — userCount=NaN renders em-dash placeholder, NOT 'NaN'", () => {
    render(
      <RoleCard
        id="admin"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Admin"
        description="..."
        userCount={NaN}
      />,
    )
    const card = screen.getByText(/Admin/).closest("[data-role-card-id]")
    expect(card).not.toBeNull()
    expect(card!.textContent).not.toMatch(/NaN/)
    expect(card!.textContent).toMatch(/—/)
  })

  it("Case 5a — non-system card renders Görüntüle link to /admin/users?role=<id>", () => {
    render(
      <RoleCard
        id="admin"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Admin"
        description="..."
        userCount={3}
      />,
    )
    const link = screen.getByRole("link", { name: /Görüntüle/i })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute("href")).toBe("/admin/users?role=admin")
  })

  it("Case 5b — Plan 15-10: Guest card ALSO renders Görüntüle link (no longer suppressed)", () => {
    render(
      <RoleCard
        id="guest"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Guest"
        description="Salt-okuma."
        userCount={0}
        isSystemRole
      />,
    )
    // Phase 14 14-04 suppressed the link on disabled cards. Plan 15-10
    // makes Guest active read-only and re-enables the link.
    const link = screen.getByRole("link", { name: /Görüntüle/i })
    expect(link.getAttribute("href")).toBe("/admin/users?role=guest")
  })

  it("Case 7 (NEW) — isSystemRole renders Sistem badge", () => {
    render(
      <RoleCard
        id="guest"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Guest"
        description="..."
        userCount={0}
        isSystemRole
      />,
    )
    expect(screen.getByText("Sistem")).toBeInTheDocument()
  })

  it("Case 7b (NEW) — non-system role does NOT render Sistem badge", () => {
    render(
      <RoleCard
        id="designer"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Designer"
        description="Custom role"
        userCount={5}
      />,
    )
    expect(screen.queryByText("Sistem")).toBeNull()
  })

  it("Case 7c (NEW) — isSystemRole HIDES Düzenle/Sil even when handlers provided", () => {
    render(
      <RoleCard
        id="admin"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Admin"
        description="..."
        userCount={3}
        isSystemRole
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.queryByRole("button", { name: /Düzenle/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /Sil/i })).toBeNull()
  })

  it("Case 7d (NEW) — non-system role RENDERS Düzenle/Sil when handlers provided", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <RoleCard
        id="designer"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Designer"
        description="..."
        userCount={5}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )
    const editBtn = screen.getByRole("button", { name: /Düzenle/i })
    const deleteBtn = screen.getByRole("button", { name: /Sil/i })
    expect(editBtn).toBeInTheDocument()
    expect(deleteBtn).toBeInTheDocument()
    fireEvent.click(editBtn)
    expect(onEdit).toHaveBeenCalledOnce()
    fireEvent.click(deleteBtn)
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it("Case 7e (NEW) — RoleCard does NOT contain 'v3.0' string anywhere", () => {
    render(
      <RoleCard
        id="guest"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Guest"
        description="Salt-okuma."
        userCount={0}
        isSystemRole
      />,
    )
    const card = screen.getByText("Guest").closest("[data-role-card-id]")
    expect(card).not.toBeNull()
    expect(card!.textContent ?? "").not.toMatch(/v3\.0/i)
  })
})

describe("AdminRolesPage (Plan 14-17 + Plan 15-10 — count + AlertBanner + trigger)", () => {
  beforeEach(() => {
    adminUsersStateRef.current = { data: [], isLoading: false, error: null }
    useAdminUsersSpy.mockClear()
  })

  it("Case 2 — known users → cards show 3/5/12 counts; no truncation banner", () => {
    const items = [
      ...Array.from({ length: 3 }, (_, i) => ({
        id: 100 + i,
        is_active: true,
        role: { name: "Admin" },
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        id: 200 + i,
        is_active: true,
        role: { name: "Project Manager" },
      })),
      ...Array.from({ length: 12 }, (_, i) => ({
        id: 300 + i,
        is_active: true,
        role: { name: "Member" },
      })),
    ]
    adminUsersStateRef.current = {
      data: { items, total: 20 },
      isLoading: false,
      error: null,
    }

    render(<AdminRolesPage />)

    const adminCard = document.querySelector('[data-role-card-id="admin"]')
    const pmCard = document.querySelector('[data-role-card-id="pm"]')
    const memberCard = document.querySelector('[data-role-card-id="member"]')
    expect(adminCard).not.toBeNull()
    expect(pmCard).not.toBeNull()
    expect(memberCard).not.toBeNull()
    expect(adminCard!.textContent).toMatch(/3/)
    expect(pmCard!.textContent).toMatch(/5/)
    expect(memberCard!.textContent).toMatch(/12/)

    expect(
      screen.queryByText(/ilk 1000 kullanıcı|first 1000 user/i),
    ).toBeNull()
  })

  it("Case 3 — isLoading=true → em-dash placeholders, never 'undefined'/'NaN'", () => {
    adminUsersStateRef.current = {
      data: undefined,
      isLoading: true,
      error: null,
    }

    render(<AdminRolesPage />)

    const allCards = document.querySelectorAll("[data-role-card-id]")
    for (const card of allCards) {
      expect(card.textContent).not.toMatch(/undefined/i)
      expect(card.textContent).not.toMatch(/NaN/)
    }
    const fullText = Array.from(allCards)
      .map((c) => c.textContent ?? "")
      .join(" ")
    expect(fullText).toMatch(/—/)
  })

  it("Case 4 — total > 1000 → AlertBanner with count_truncation_warning copy (N-3 HARD)", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: 1000 + i,
      is_active: true,
      role: { name: i % 2 === 0 ? "Admin" : "Member" },
    }))
    adminUsersStateRef.current = {
      data: { items, total: 1500 },
      isLoading: false,
      error: null,
    }

    render(<AdminRolesPage />)

    expect(
      screen.getByText(/ilk 1000 kullanıcı|first 1000 user/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/1500/)).toBeInTheDocument()
  })

  it("Case 6 — useAdminUsers called with {limit: 1000}", () => {
    adminUsersStateRef.current = {
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    }
    render(<AdminRolesPage />)

    expect(useAdminUsersSpy).toHaveBeenCalled()
    const args = useAdminUsersSpy.mock.calls[0]
    expect(args).toBeDefined()
    expect(args?.[0]).toMatchObject({ limit: 1000 })
  })

  it("Case 8 (NEW) — Roller AlertBanner copy is FLIPPED active message (no 'v3.0')", () => {
    adminUsersStateRef.current = {
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    }
    render(<AdminRolesPage />)

    // Phase 14 14-04 banner contained "v3.0 sürümünde"; Plan 15-10 banner
    // contains "RBAC altyapısı aktif".
    expect(screen.getByText(/RBAC altyapısı aktif/i)).toBeInTheDocument()
    // Negative — the v3.0 placeholder copy must not survive.
    expect(screen.queryByText(/v3\.0 sürümünde/i)).toBeNull()
  })

  it("Case 9 (NEW) — renders NewRoleModalTrigger (replaces NewRolePlaceholderCard)", () => {
    adminUsersStateRef.current = {
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    }
    render(<AdminRolesPage />)

    // The trigger is a clickable button (role="button"); placeholder was a
    // role="presentation" div.
    expect(screen.getByTestId("new-role-modal-trigger")).toBeInTheDocument()
    expect(
      screen.getByTestId("new-role-modal-trigger").tagName,
    ).toBe("BUTTON")
    // Phase 14 14-04 testid is gone.
    expect(screen.queryByTestId("new-role-placeholder-card")).toBeNull()
  })

  it("Case 10 (NEW) — Roles page does NOT contain 'v3.0' anywhere", () => {
    adminUsersStateRef.current = {
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    }
    const { container } = render(<AdminRolesPage />)
    expect(container.textContent ?? "").not.toMatch(/v3\.0/i)
  })
})
