// Phase 14 Plan 14-17 (Cluster E gap closure) — RoleCard + AdminRolesPage RTL
// coverage closing UAT Test 19 ("Roles tab cards display real per-role user
// counts and 'Görüntüle' navigates to /admin/users with the role filter
// pre-applied").
//
// Five mandatory cases per <behavior>:
//
//   1. RoleCard with userCount={12} renders "12" — and NEVER renders the
//      literal "=" symbol, "undefined", or "NaN" (defensive null-safety
//      negative assertions).
//
//   2. AdminRolesPage with mocked useAdminUsers returning a known set of
//      users (3 admins, 5 PMs, 12 members, total=20) renders the cards with
//      "3", "5", "12" respectively. AlertBanner is NOT rendered (total ≤ 1000).
//
//   3. AdminRolesPage with isLoading=true renders an em-dash placeholder
//      ("—") instead of "undefined" / "NaN" — Number.isFinite() guard kicks
//      in when userCount is undefined during the first paint.
//
//   4. AdminRolesPage with total=1500 (> 1000) renders the AlertBanner with
//      the count_truncation_warning copy — N-3 HARD requirement, not optional.
//
//   5. RoleCard renders a "Görüntüle" / "View" link with href
//      /admin/users?role=<id> for non-disabled cards. Disabled (Guest) card
//      does NOT render the affordance.
//
//   6. AdminRolesPage's useAdminUsers receives `{limit: 1000}` — confirms
//      the count source fix actually fetches the broader population (Approach
//      1).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
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

// ---- useAdminUsers mock — overridable per test ----
type AdminUsersQ = {
  data?: unknown
  isLoading?: boolean
  error?: unknown
}
const adminUsersStateRef: { current: AdminUsersQ } = {
  current: { data: [], isLoading: false, error: null },
}
// Spy reference so Test 6 can assert `{limit: 1000}` was passed.
const useAdminUsersSpy = vi.fn(() => adminUsersStateRef.current)
vi.mock("@/hooks/use-admin-users", () => ({
  useAdminUsers: (...args: unknown[]) => useAdminUsersSpy(...args),
}))

// SUT — imported AFTER all mocks
import { RoleCard } from "./role-card"
import AdminRolesPage from "@/app/(shell)/admin/roles/page"

describe("RoleCard (Plan 14-17 — count rendering null-safety)", () => {
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
    // Positive — the real count is rendered.
    expect(screen.getByText("12")).toBeInTheDocument()
    // Negative — neither the broken "=" symbol nor any of its
    // unsafe-stringification cousins appear.
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
    // Em-dash placeholder is the contractual fallback per Plan 14-17 Step 3.
    expect(card!.textContent).toMatch(/—/)
  })

  it("Case 5a — non-disabled card renders Görüntüle link to /admin/users?role=<id>", () => {
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
    // Görüntüle link with TR copy + correct query param.
    const link = screen.getByRole("link", { name: /Görüntüle/i })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute("href")).toBe("/admin/users?role=admin")
  })

  it("Case 5b — disabled card does NOT render Görüntüle link", () => {
    render(
      <RoleCard
        id="guest"
        icon={<ShieldCheck size={16} />}
        iconBgColor="transparent"
        iconColor="var(--fg)"
        name="Guest"
        description="..."
        userCount={0}
        disabled
        v3Badge
      />,
    )
    // No Görüntüle link should appear on disabled cards (no useless
    // navigation to an empty filter view).
    expect(screen.queryByRole("link", { name: /Görüntüle/i })).toBeNull()
  })
})

describe("AdminRolesPage (Plan 14-17 — count source + AlertBanner)", () => {
  beforeEach(() => {
    adminUsersStateRef.current = { data: [], isLoading: false, error: null }
    useAdminUsersSpy.mockClear()
  })

  it("Case 2 — known users → cards show 3/5/12 counts; no truncation banner", () => {
    // 3 admins + 5 PMs + 12 members + total=20 (≤ 1000 → no banner).
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

    // Find each card by data-role-card-id and assert its rendered count.
    const adminCard = document.querySelector('[data-role-card-id="admin"]')
    const pmCard = document.querySelector('[data-role-card-id="pm"]')
    const memberCard = document.querySelector('[data-role-card-id="member"]')
    expect(adminCard).not.toBeNull()
    expect(pmCard).not.toBeNull()
    expect(memberCard).not.toBeNull()
    expect(adminCard!.textContent).toMatch(/3/)
    expect(pmCard!.textContent).toMatch(/5/)
    expect(memberCard!.textContent).toMatch(/12/)

    // Truncation banner MUST NOT appear when total ≤ 1000.
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

    // No card text should contain unsafe stringification.
    const allCards = document.querySelectorAll("[data-role-card-id]")
    for (const card of allCards) {
      expect(card.textContent).not.toMatch(/undefined/i)
      expect(card.textContent).not.toMatch(/NaN/)
    }
    // Em-dash placeholder appears at least once across the cards.
    const fullText = Array.from(allCards)
      .map((c) => c.textContent ?? "")
      .join(" ")
    expect(fullText).toMatch(/—/)
  })

  it("Case 4 — total > 1000 → AlertBanner with count_truncation_warning copy (N-3 HARD)", () => {
    // 50 sample users but total=1500 — reproduces the truncation scenario.
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

    // Truncation banner MUST appear — TR or EN copy substring.
    expect(
      screen.getByText(/ilk 1000 kullanıcı|first 1000 user/i),
    ).toBeInTheDocument()
    // Total count surfaces in the banner body.
    expect(
      screen.getByText(/1500/),
    ).toBeInTheDocument()
  })

  it("Case 6 — useAdminUsers called with {limit: 1000} (count source fix)", () => {
    adminUsersStateRef.current = {
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    }
    render(<AdminRolesPage />)

    // The count fix bumps useAdminUsers from default-paginated to limit=1000
    // so per-role counts cover the entire user table (defensive ceiling per
    // Approach 1 in the plan).
    expect(useAdminUsersSpy).toHaveBeenCalled()
    const args = useAdminUsersSpy.mock.calls[0]
    // First arg should be a filter object containing limit: 1000.
    expect(args[0]).toMatchObject({ limit: 1000 })
  })
})
