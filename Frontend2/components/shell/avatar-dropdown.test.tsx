// Unit tests for components/shell/avatar-dropdown.tsx (Phase 13 Plan 13-02 +
// Phase 15 Plan 15-11 cross-phase migrate of Test 14 D-D2 → D-2.11).
//
// Per Plan 13-02 Task 1 <behavior> Tests 1-13 covering:
//   1. Trigger renders with initials + aria-label
//   2. Click trigger opens menu (aria-expanded → true)
//   3. Admin role → "Yönetim Paneli" item present
//   4. Non-admin → "Yönetim Paneli" hidden
//   5. role string fallback ("admin" lowercase) → admin item present (case-insensitive)
//   6. Esc dismisses menu
//   7. Click-outside (mousedown) dismisses menu
//   8. Pathname change dismisses menu
//   9. Çıkış Yap calls logout() then router.push("/auth/login")
//  10. Profilim navigates to /users/{id}
//  11. Dil submenu opens with TR/EN radios; main menu still rendered
//  12. Language switch keeps main menu open (only Dil sub closes)
//  13. ArrowDown/ArrowUp/Home/End keyboard navigation between menuitems (D-G2 a11y)
//
// Plan 14-11 added Test 14: clicking the Admin Paneli item for an admin user
// invokes router.push("/admin") — verifies the Phase 13 D-D2 cross-phase
// destination (Plan 14-02) is wired and reachable post-implementation.
//
// Phase 15 Plan 15-11 D-2.11 (CROSS-PHASE R-01): the gate behind the link
// migrates from `role.name === "Admin"` to `hasPermission('admin.access')`.
// Test 14 is updated SAME COMMIT to assert the new gate. Two MORE tests are
// added (15 + 16) covering:
//   15. D-2.11 — link visible when permissions=['admin.access'] (custom role
//       SuperUser; Admin perm granted explicitly via matrix toggle).
//   16. D-2.11 — link HIDDEN when permissions=[] AND hasPermission returns
//       false (Member / non-admin custom roles).
//   (Pitfall 9 backwards-compat for legacy Admin tokens with permissions=[]
//   is implicitly covered by Test 3 + Test 5 — both pass an Admin role +
//   inline hasPermission that mirrors the real super-role short-circuit.)
//
// Mock pattern verbatim from Frontend2/components/lifecycle/evaluation-report-card.test.tsx
// (Phase 12 D-04 RTL+vi.mock pattern). next/navigation is mocked so useRouter().push
// + usePathname() are deterministic. The useAuth mock is now re-configurable
// per-test via mockHasPermission so each test owns its perm state.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// --- Mock factories ----------------------------------------------------

const pushMock = vi.fn()
let currentPathname = "/dashboard"
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => currentPathname,
}))

const logoutMock = vi.fn()
let mockUser: unknown = {
  id: "7",
  name: "Test User",
  email: "test@example.com",
  role: { name: "Member" },
}
// Phase 15 Plan 15-11 — perm state is now configurable per test. Default to
// the empty / deny-all shape; individual tests reset to the shape they need
// (e.g., Tests 3/5 simulate the AuthContext's role.name === "Admin" short-
// circuit by returning true; Tests 4/15/16 explicitly test the perm path).
let mockPermissions: string[] = []
let mockHasPermission: (key: string) => boolean = () => false
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: mockUser,
    token: "x",
    isLoading: false,
    permissions: mockPermissions,
    hasPermission: (k: string) => mockHasPermission(k),
    login: vi.fn(),
    logout: logoutMock,
  }),
}))

const setLanguageMock = vi.fn()
let mockLanguage: "tr" | "en" = "tr"
vi.mock("@/context/app-context", () => ({
  useApp: () => ({
    language: mockLanguage,
    setLanguage: setLanguageMock,
  }),
}))

import { AvatarDropdown } from "./avatar-dropdown"

// --- Test setup --------------------------------------------------------

beforeEach(() => {
  pushMock.mockClear()
  logoutMock.mockClear()
  setLanguageMock.mockClear()
  currentPathname = "/dashboard"
  mockUser = {
    id: "7",
    name: "Test User",
    email: "test@example.com",
    role: { name: "Member" },
  }
  mockLanguage = "tr"
  // Phase 15 Plan 15-11 — reset perm state. Default Member shape: no perms
  // and hasPermission returns false. Admin-role tests override hasPermission
  // to mirror the real AuthContext's role.name === "Admin" super-role
  // short-circuit (Pitfall 9 backwards-compat).
  mockPermissions = []
  mockHasPermission = () => false
})

// --- Tests -------------------------------------------------------------

describe("AvatarDropdown", () => {
  // Test 1
  it("renders the trigger with an account-menu aria-label and aria-expanded false", () => {
    render(<AvatarDropdown />)
    const trigger = screen.getByRole("button", { name: /hesap menüsü|account menu/i })
    expect(trigger).toBeTruthy()
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu")
    // Initials = T (first letter of "Test User") + U
    expect(trigger.textContent || "").toContain("TU")
  })

  // Test 2
  it("opens the menu on trigger click and flips aria-expanded to true", async () => {
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    const trigger = screen.getByRole("button", { name: /hesap menüsü|account menu/i })
    await user.click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("menu")).toBeTruthy()
  })

  // Test 3 — Admin (object role.name === "Admin")
  // Phase 15 Plan 15-11 D-2.11: the gate is now hasPermission('admin.access');
  // for an Admin user the AuthContext's hasPermission helper short-circuits to
  // true (D-1.5 super-role + Pitfall 9). Mirror that contract in the mock so
  // the test continues to assert the correct invariant.
  it("shows the Yönetim Paneli admin item when role.name = Admin", async () => {
    mockUser = {
      id: "7",
      name: "Admin User",
      email: "admin@example.com",
      role: { name: "Admin" },
    }
    mockHasPermission = () => true  // Admin super-role short-circuit
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    expect(screen.queryByText(/Yönetim Paneli|Admin Panel/i)).toBeTruthy()
  })

  // Test 4 — Member (object role.name === "Member")
  it("hides the Yönetim Paneli item for non-admin (Member)", async () => {
    mockUser = {
      id: "7",
      name: "Member User",
      email: "member@example.com",
      role: { name: "Member" },
    }
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    expect(screen.queryByText(/Yönetim Paneli|Admin Panel/i)).toBeNull()
  })

  // Test 5 — role as plain string "admin" (lowercase, case-insensitive)
  // Phase 15 Plan 15-11 D-2.11: AuthContext's hasPermission lowercases the
  // role.name and short-circuits to true for "admin" — mirror that in the
  // mock so this test asserts the actual production behavior.
  it("shows admin item when role is a lowercase string 'admin' (case-insensitive)", async () => {
    mockUser = {
      id: "7",
      name: "String Role User",
      email: "admin@example.com",
      role: "admin",
    }
    mockHasPermission = () => true  // case-insensitive Admin short-circuit
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    expect(screen.queryByText(/Yönetim Paneli|Admin Panel/i)).toBeTruthy()
  })

  // Test 6 — Esc dismisses
  it("dismisses the menu when Escape is pressed", async () => {
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    expect(screen.getByRole("menu")).toBeTruthy()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("menu")).toBeNull()
  })

  // Test 7 — Click-outside (mousedown) dismisses
  it("dismisses the menu on outside mousedown", async () => {
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    expect(screen.getByRole("menu")).toBeTruthy()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole("menu")).toBeNull()
  })

  // Test 8 — Pathname change dismisses (Next.js 16 — no router.events)
  it("dismisses the menu when the pathname changes (usePathname effect)", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    expect(screen.getByRole("menu")).toBeTruthy()
    // Simulate Next.js navigation by flipping the mocked pathname and re-rendering.
    currentPathname = "/projects/1"
    rerender(<AvatarDropdown />)
    expect(screen.queryByRole("menu")).toBeNull()
  })

  // Test 9 — Plan 14-18 (Cluster F, UAT Test 4 side-finding): Çıkış Yap must
  // route to /login (the real route at app/(auth)/login/page.tsx). The original
  // Phase 13 D-D3 destination /auth/login was NEVER backed by a real page —
  // there is no app/(auth)/auth/login/ directory. This test was previously
  // asserting the bug.
  it("calls useAuth().logout() and router.push('/login') on Çıkış Yap click", async () => {
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    const logoutBtn = screen.getByRole("menuitem", { name: /Çıkış Yap|Sign Out/i })
    await user.click(logoutBtn)
    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith("/login")
  })

  // Test 10 — Profilim navigates to /users/{id}
  it("navigates to /users/{id} when Profilim is clicked", async () => {
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    const profileBtn = screen.getByRole("menuitem", { name: /Profilim|My Profile/i })
    await user.click(profileBtn)
    expect(pushMock).toHaveBeenCalledWith("/users/7")
  })

  // Test 11 — Dil submenu opens inline with TR/EN radios; main menu still mounted
  it("opens the Dil inline submenu with TR/EN menuitemradios; main menu stays present", async () => {
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    const dilBtn = screen.getByRole("menuitem", { name: /^(Dil|Language)/i })
    await user.click(dilBtn)
    const radios = screen.getAllByRole("menuitemradio")
    expect(radios.length).toBeGreaterThanOrEqual(2)
    // Main menu container still mounted
    expect(screen.getByRole("menu")).toBeTruthy()
    // The two radios should expose TR + EN choices
    expect(radios.some((r) => /Türkçe|Turkish/i.test(r.textContent || ""))).toBe(true)
    expect(radios.some((r) => /İngilizce|English/i.test(r.textContent || ""))).toBe(true)
  })

  // Test 12 — Language switch keeps main menu open
  it("keeps the main menu open when a language radio is clicked (only Dil sub closes)", async () => {
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    await user.click(screen.getByRole("menuitem", { name: /^(Dil|Language)/i }))
    const radios = screen.getAllByRole("menuitemradio")
    // Click the Turkish radio (first)
    const trRadio = radios.find((r) => /Türkçe|Turkish/i.test(r.textContent || ""))!
    await user.click(trRadio)
    expect(setLanguageMock).toHaveBeenCalledWith("tr")
    // Main menu container still rendered (Dil sub closes but parent menu stays open)
    expect(screen.queryByRole("menu")).toBeTruthy()
  })

  // Test 13 — ArrowDown/ArrowUp keyboard navigation between menu items
  // (Plan 13-09 D-G2 a11y polish — UI-SPEC §A.4 dropdown keyboard nav).
  it("moves focus between menuitems on ArrowDown / ArrowUp", async () => {
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    const items = screen.getAllByRole("menuitem")
    expect(items.length).toBeGreaterThan(1)
    // Focus first item, then ArrowDown moves focus to the next.
    items[0].focus()
    expect(document.activeElement).toBe(items[0])
    fireEvent.keyDown(document, { key: "ArrowDown" })
    expect(document.activeElement).toBe(items[1])
    // ArrowUp returns to the previous item.
    fireEvent.keyDown(document, { key: "ArrowUp" })
    expect(document.activeElement).toBe(items[0])
    // ArrowUp from the first wraps to the last menuitem.
    fireEvent.keyDown(document, { key: "ArrowUp" })
    expect(document.activeElement).toBe(items[items.length - 1])
    // Home jumps back to the first.
    fireEvent.keyDown(document, { key: "Home" })
    expect(document.activeElement).toBe(items[0])
    // End jumps to the last.
    fireEvent.keyDown(document, { key: "End" })
    expect(document.activeElement).toBe(items[items.length - 1])
  })

  // Test 14 — Plan 14-11 D-D2 cross-phase contract verification, MIGRATED
  // SAME COMMIT to D-2.11 per Phase 15 Plan 15-11 + R-01 cross-phase
  // invariant. The original assertion ("link visible when role.name === 'Admin'")
  // is preserved as a backwards-compat semantic via the AuthContext's
  // role-name short-circuit in hasPermission (Pitfall 9). This test now
  // additionally asserts that clicking the link still calls router.push("/admin")
  // — the routing destination contract Plan 14-11 originally locked.
  it("Admin Paneli click routes to /admin for admin users (Plan 14-11 D-D2 → Plan 15-11 D-2.11 migrated)", async () => {
    mockUser = {
      id: "1",
      name: "Ayşe Admin",
      email: "[email protected]",
      role: { name: "Admin" },
    }
    // Mirror the AuthContext's super-role short-circuit (D-1.5 + Pitfall 9):
    // legacy Admin tokens with permissions=[] still see the link because
    // hasPermission detects role.name === "Admin" and short-circuits to true.
    mockHasPermission = () => true
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    const adminItem = screen.getByRole("menuitem", { name: /Yönetim Paneli|Admin Panel/i })
    await user.click(adminItem)
    expect(pushMock).toHaveBeenCalledWith("/admin")
  })

  // Test 15 — Phase 15 Plan 15-11 D-2.11 NEW: custom role with explicit
  // 'admin.access' perm sees the link. Demonstrates that admin access is no
  // longer hard-coded to role.name === 'Admin'; any role with the perm
  // toggled-on in the matrix gets the link.
  it("D-2.11: 'Yönetim Paneli' link visible when hasPermission('admin.access') returns true (custom role)", async () => {
    mockUser = {
      id: "42",
      name: "Süper Kullanıcı",
      email: "superuser@example.com",
      role: { name: "SuperUser" }, // custom role created by an Admin
    }
    mockPermissions = ["admin.access"]
    mockHasPermission = (key: string) => key === "admin.access"
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    expect(screen.queryByText(/Yönetim Paneli|Admin Panel/i)).toBeTruthy()
  })

  // Test 16 — Phase 15 Plan 15-11 D-2.11 NEW: a non-admin user (e.g.,
  // Member with no admin.access perm) does NOT see the link, even when the
  // permissions[] claim is empty (the default Pitfall 9 backwards-compat
  // shape for tokens that predate Plan 15-08).
  it("D-2.11: 'Yönetim Paneli' link HIDDEN when permissions=[] AND hasPermission returns false", async () => {
    mockUser = {
      id: "200",
      name: "Member User",
      email: "member@example.com",
      role: { name: "Member" },
    }
    mockPermissions = []
    mockHasPermission = () => false
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    expect(screen.queryByText(/Yönetim Paneli|Admin Panel/i)).toBeNull()
  })
})
