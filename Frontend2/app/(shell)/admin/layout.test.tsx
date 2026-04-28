// Phase 14 Plan 14-02 Task 1 — AdminLayout RTL tests.
//
// Verifies the 4 mandatory cases per <behavior>:
//   1. isLoading=true → DataState loading rendered, no NavTabs.
//   2. user=null → router.replace called with /auth/login?next=/admin (Pitfall
//      3-mitigated — happens AFTER isLoading flips to false).
//   3. user.role.name="member" → router.replace("/dashboard") AND showToast
//      called with variant:"error" + message containing "yetki" (TR copy).
//   4. user.role.name="Admin" → renders 'Yönetim Konsolu' heading AND NavTabs
//      with all 8 hrefs.
//
// Plan 14-11 added 2 cases (5+6) for header-button wiring (D-B6):
//   5. Rapor al click → downloadCsv("/api/v1/admin/summary.pdf",
//      "admin-summary.pdf") — admin overview PDF download via Plan 14-01
//      endpoint (server-side rate-limit @limiter.limit("1/30seconds")).
//   6. Denetim günlüğü click → router.push("/admin/audit") — pure client-side
//      next-router push, no API call.
//
// Pitfall 3 reminder: the layout MUST check isLoading FIRST before evaluating
// user.role — otherwise a legitimate admin gets bounced during the auth
// context's initial render. Test 1 locks that order.

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// ---- next/navigation mock ----
const replaceMock = vi.fn()
const pushMock = vi.fn()
const usePathnameMock = vi.fn<[], string>(() => "/admin")
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock, back: vi.fn() }),
  usePathname: () => usePathnameMock(),
}))

// ---- download-authenticated mock — Plan 14-13 (B-2 fix) swapped the Rapor al
// button from downloadCsv() to downloadAuthenticated() so the request carries
// Authorization: Bearer <token> and avoids the UAT 401 gap. The mock target
// MUST be the new module — otherwise the test silently fails to assert
// anything meaningful (the click goes through the real helper which then
// throws because there's no fetch in jsdom).
const downloadAuthenticatedMock = vi.fn(async () => undefined)
vi.mock("@/lib/admin/download-authenticated", () => ({
  downloadAuthenticated: (...args: unknown[]) =>
    downloadAuthenticatedMock(...args),
}))

// ---- next/link mock — plain anchor (mirrors nav-tabs.test.tsx pattern) ----
vi.mock("next/link", () => ({
  default: ({ href, children, style, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} style={style} {...rest}>
      {children}
    </a>
  ),
}))

// ---- useAuth mock ----
type AuthState = {
  user:
    | null
    | {
        id: number
        email: string
        name?: string
        role: { id: number; name: string } | null
      }
  isLoading: boolean
}
const authStateRef: { current: AuthState } = {
  current: { user: null, isLoading: true },
}
vi.mock("@/context/auth-context", () => ({
  useAuth: () => authStateRef.current,
}))

// ---- useApp mock — language only (the layout reads `language`) ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// ---- useToast mock ----
const showToastMock = vi.fn()
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}))

// SUT — imported AFTER all mocks are wired so the layout's module-evaluation
// hooks reach the mocked next/navigation, not the real one.
import AdminLayout from "./layout"

describe("AdminLayout — admin route guard (Pitfalls 3 + 10)", () => {
  beforeEach(() => {
    replaceMock.mockReset()
    pushMock.mockReset()
    downloadAuthenticatedMock.mockReset()
    downloadAuthenticatedMock.mockResolvedValue(undefined)
    showToastMock.mockReset()
    usePathnameMock.mockReset()
    usePathnameMock.mockReturnValue("/admin")
  })

  it("Case 1 — isLoading=true → renders DataState loading, no NavTabs, no redirect", () => {
    authStateRef.current = { user: null, isLoading: true }
    render(
      <AdminLayout>
        <div data-testid="children">child content</div>
      </AdminLayout>,
    )
    // Loading copy from DataState defaults (TR: "Yükleniyor…")
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument()
    // No NavTabs visible (no tab labels)
    expect(screen.queryByText("Genel")).not.toBeInTheDocument()
    expect(screen.queryByText("Kullanıcılar")).not.toBeInTheDocument()
    // Children NOT rendered while loading
    expect(screen.queryByTestId("children")).not.toBeInTheDocument()
    // No router.replace fired during isLoading window (Pitfall 3 mitigation)
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it("Case 2 — unauthenticated user → router.replace('/login?from=/admin') (Plan 14-18 fix)", () => {
    // Plan 14-18 (Cluster F UAT Test 4 side-finding) — the original
    // /auth/login destination was 404 (the (auth) route group has /login at
    // its root, not /auth/login). The param renamed from `next` to `from`
    // to align with the M-5 contract honored by /login (login/page.tsx
    // searchParams.get("from") ?? searchParams.get("next") ?? "/dashboard").
    authStateRef.current = { user: null, isLoading: false }
    usePathnameMock.mockReturnValue("/admin")
    render(
      <AdminLayout>
        <div>child</div>
      </AdminLayout>,
    )
    expect(replaceMock).toHaveBeenCalledWith("/login?from=/admin")
  })

  it("Case 3 — non-admin role → router.replace('/dashboard') + danger toast with 'yetki'", () => {
    authStateRef.current = {
      user: {
        id: 9,
        email: "[email protected]",
        name: "Mehmet Member",
        role: { id: 3, name: "member" },
      },
      isLoading: false,
    }
    render(
      <AdminLayout>
        <div>child</div>
      </AdminLayout>,
    )
    expect(replaceMock).toHaveBeenCalledWith("/dashboard")
    expect(showToastMock).toHaveBeenCalled()
    const args = showToastMock.mock.calls[0][0]
    expect(args.variant).toBe("error")
    expect(String(args.message).toLowerCase()).toContain("yetki")
  })

  it("Case 4 — admin role → renders 'Yönetim Konsolu' heading AND all 8 NavTabs hrefs", () => {
    authStateRef.current = {
      user: {
        id: 1,
        email: "[email protected]",
        name: "Ayşe Admin",
        role: { id: 1, name: "Admin" },
      },
      isLoading: false,
    }
    render(
      <AdminLayout>
        <div data-testid="children">child content</div>
      </AdminLayout>,
    )
    // Heading visible
    expect(screen.getByText("Yönetim Konsolu")).toBeInTheDocument()
    // NavTabs strip — all 8 hrefs present
    const expectedHrefs = [
      "/admin",
      "/admin/users",
      "/admin/roles",
      "/admin/permissions",
      "/admin/projects",
      "/admin/workflows",
      "/admin/audit",
      "/admin/stats",
    ]
    for (const href of expectedHrefs) {
      const anchors = document.querySelectorAll(`a[href="${href}"]`)
      expect(
        anchors.length,
        `expected at least one anchor for href=${href}`,
      ).toBeGreaterThan(0)
    }
    // Children rendered for the admin
    expect(screen.getByTestId("children")).toBeInTheDocument()
    // No redirect fired for the admin
    expect(replaceMock).not.toHaveBeenCalled()
  })

  // ---- Plan 14-11 — header-button wiring (D-B6) ----

  it("Case 5 — Rapor al click → downloadAuthenticated('/api/v1/admin/summary.pdf', 'admin-summary-<YYYY-MM-DD>.pdf') (D-B6, Plan 14-13 Cluster A 401 fix)", () => {
    authStateRef.current = {
      user: {
        id: 1,
        email: "[email protected]",
        name: "Ayşe Admin",
        role: { id: 1, name: "Admin" },
      },
      isLoading: false,
    }
    render(
      <AdminLayout>
        <div>child</div>
      </AdminLayout>,
    )
    // The button label comes from admin-keys.ts — TR mock locale renders
    // "Rapor al". Match either locale defensively in case the mock changes.
    const raporButton = screen.getByRole("button", { name: /Rapor al|Export/i })
    fireEvent.click(raporButton)
    // Plan 14-13 contract: the authenticated helper is invoked with the
    // canonical PDF endpoint URL and a date-suffixed filename. The helper
    // itself attaches the Authorization header (verified in
    // download-authenticated.test.ts), so a green here proves the click
    // reaches the right consumer — not the deprecated downloadCsv anchor
    // path that triggered the UAT 401.
    expect(downloadAuthenticatedMock).toHaveBeenCalledTimes(1)
    expect(downloadAuthenticatedMock).toHaveBeenCalledWith(
      "/api/v1/admin/summary.pdf",
      expect.stringMatching(/^admin-summary-\d{4}-\d{2}-\d{2}\.pdf$/),
    )
    // Rapor al MUST NOT navigate — only the Audit log button does.
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("Case 6 — Denetim günlüğü click → router.push('/admin/audit') (D-B6)", () => {
    authStateRef.current = {
      user: {
        id: 1,
        email: "[email protected]",
        name: "Ayşe Admin",
        role: { id: 1, name: "Admin" },
      },
      isLoading: false,
    }
    render(
      <AdminLayout>
        <div>child</div>
      </AdminLayout>,
    )
    const auditButton = screen.getByRole("button", { name: /Denetim günlüğü|Audit log/i })
    fireEvent.click(auditButton)
    // Pure client-side push — NO PDF download triggered.
    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith("/admin/audit")
    expect(downloadAuthenticatedMock).not.toHaveBeenCalled()
  })
})
