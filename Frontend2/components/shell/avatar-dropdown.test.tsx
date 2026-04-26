// Unit tests for components/shell/avatar-dropdown.tsx (Phase 13 Plan 13-02).
//
// Per Plan 13-02 Task 1 <behavior> Tests 1-12 covering:
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
//
// Mock pattern verbatim from Frontend2/components/lifecycle/evaluation-report-card.test.tsx
// (Phase 12 D-04 RTL+vi.mock pattern). next/navigation is mocked so useRouter().push
// + usePathname() are deterministic.

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
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: mockUser,
    token: "x",
    isLoading: false,
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
  it("shows the Yönetim Paneli admin item when role.name = Admin", async () => {
    mockUser = {
      id: "7",
      name: "Admin User",
      email: "admin@example.com",
      role: { name: "Admin" },
    }
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
  it("shows admin item when role is a lowercase string 'admin' (case-insensitive)", async () => {
    mockUser = {
      id: "7",
      name: "String Role User",
      email: "admin@example.com",
      role: "admin",
    }
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

  // Test 9 — Çıkış Yap calls logout + router.push("/auth/login")
  it("calls useAuth().logout() and router.push('/auth/login') on Çıkış Yap click", async () => {
    const user = userEvent.setup()
    render(<AvatarDropdown />)
    await user.click(screen.getByRole("button", { name: /hesap menüsü|account menu/i }))
    const logoutBtn = screen.getByRole("menuitem", { name: /Çıkış Yap|Sign Out/i })
    await user.click(logoutBtn)
    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith("/auth/login")
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
})
