// Phase 14 Plan 14-01 Task 1 — NavTabs primitive tests.
//
// Verifies:
// - Active detection across all 8 admin paths
// - Pitfall 4: /admin Overview tab is NOT active when pathname is /admin/users
// - Active tab gets fontWeight 600 + 2px primary border
// - Inactive tab gets fontWeight 500 + transparent border
//
// usePathname is mocked so each test can drive the active path independently
// without a full Next.js router; Link is mocked to a plain anchor so jsdom can
// render Link children without the Next router internals.

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { NavTabs, type NavTabItem } from "./nav-tabs"

// ---- next/navigation mock ----
const usePathnameMock = vi.fn<[], string>(() => "/admin")
vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}))

// ---- next/link mock — plain anchor, preserves href + children + style ----
vi.mock("next/link", () => ({
  default: ({ href, children, style, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} style={style} {...rest}>
      {children}
    </a>
  ),
}))

const TABS: NavTabItem[] = [
  { id: "overview", href: "/admin", label: "Genel" },
  { id: "users", href: "/admin/users", label: "Kullanıcılar" },
  { id: "roles", href: "/admin/roles", label: "Roller" },
  { id: "permissions", href: "/admin/permissions", label: "İzinler" },
  { id: "projects", href: "/admin/projects", label: "Projeler" },
  { id: "workflows", href: "/admin/workflows", label: "Şablonlar" },
  { id: "audit", href: "/admin/audit", label: "Audit" },
  { id: "stats", href: "/admin/stats", label: "İstatistik" },
]

function getTabAnchor(label: string): HTMLAnchorElement {
  const el = screen.getByText(label).closest("a")
  if (!el) throw new Error(`No anchor found for tab "${label}"`)
  return el as HTMLAnchorElement
}

function isActiveStyle(a: HTMLAnchorElement): boolean {
  // Active = fontWeight 600 (string "600" set by inline style)
  return a.style.fontWeight === "600"
}

describe("NavTabs", () => {
  beforeEach(() => {
    usePathnameMock.mockReset()
  })

  it("activates the Overview tab when pathname is /admin", () => {
    usePathnameMock.mockReturnValue("/admin")
    render(<NavTabs tabs={TABS} />)
    expect(isActiveStyle(getTabAnchor("Genel"))).toBe(true)
    // No other tab is active
    for (const label of ["Kullanıcılar", "Roller", "Audit"]) {
      expect(isActiveStyle(getTabAnchor(label))).toBe(false)
    }
  })

  it("Pitfall 4: Overview tab is NOT active when pathname is /admin/users", () => {
    usePathnameMock.mockReturnValue("/admin/users")
    render(<NavTabs tabs={TABS} />)
    // Users active
    expect(isActiveStyle(getTabAnchor("Kullanıcılar"))).toBe(true)
    // Overview NOT active — would be false positive without the !tabs.some(...) guard
    expect(isActiveStyle(getTabAnchor("Genel"))).toBe(false)
  })

  it("activates each sub-route tab for its own pathname", () => {
    const cases: Array<{ path: string; activeLabel: string }> = [
      { path: "/admin/users", activeLabel: "Kullanıcılar" },
      { path: "/admin/roles", activeLabel: "Roller" },
      { path: "/admin/permissions", activeLabel: "İzinler" },
      { path: "/admin/projects", activeLabel: "Projeler" },
      { path: "/admin/workflows", activeLabel: "Şablonlar" },
      { path: "/admin/audit", activeLabel: "Audit" },
      { path: "/admin/stats", activeLabel: "İstatistik" },
    ]
    for (const c of cases) {
      usePathnameMock.mockReturnValue(c.path)
      const { unmount } = render(<NavTabs tabs={TABS} />)
      expect(
        isActiveStyle(getTabAnchor(c.activeLabel)),
        `expected ${c.activeLabel} active for ${c.path}`,
      ).toBe(true)
      // Overview must NOT be active for any sub-route path
      expect(
        isActiveStyle(getTabAnchor("Genel")),
        `Overview must NOT be active for ${c.path} (Pitfall 4)`,
      ).toBe(false)
      unmount()
    }
  })

  it("active tab has 2px primary border, inactive has transparent border", () => {
    usePathnameMock.mockReturnValue("/admin/audit")
    render(<NavTabs tabs={TABS} />)
    const audit = getTabAnchor("Audit")
    const overview = getTabAnchor("Genel")
    expect(audit.style.borderBottom).toContain("var(--primary)")
    expect(overview.style.borderBottom).toContain("transparent")
  })

  it("renders an optional badge per tab", () => {
    usePathnameMock.mockReturnValue("/admin")
    const tabsWithBadge: NavTabItem[] = [
      { id: "overview", href: "/admin", label: "Genel", badge: 5 },
      { id: "users", href: "/admin/users", label: "Kullanıcılar" },
    ]
    render(<NavTabs tabs={tabsWithBadge} />)
    expect(screen.getByText("5")).toBeInTheDocument()
  })
})
