// Phase 15 Plan 15-09 — <RequirePermission/> guard tests.
//
// 4 cases per <behavior>:
//   1. hasPermission(perm) === true → renders children
//   2. hasPermission(perm) === false → renders nothing (default fallback null)
//   3. hasPermission(perm) === false + fallback prop → renders fallback
//   4. isLoading === true → renders nothing (anti-flicker)

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/context/auth-context", () => ({ useAuth: vi.fn() }))

import { useAuth } from "@/context/auth-context"
import { RequirePermission } from "./require-permission"

const mockedUseAuth = vi.mocked(useAuth)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("<RequirePermission/>", () => {
  it("renders children when hasPermission returns true", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      permissions: ["task.create"],
      hasPermission: (k: string) => k === "task.create",
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      refreshUser: vi.fn(),
    })
    render(<RequirePermission perm="task.create">visible</RequirePermission>)
    expect(screen.getByText("visible")).toBeInTheDocument()
  })

  it("renders nothing (default fallback null) when hasPermission returns false", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      permissions: [],
      hasPermission: () => false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      refreshUser: vi.fn(),
    })
    const { container } = render(
      <RequirePermission perm="admin.access">hidden</RequirePermission>,
    )
    expect(container.textContent).toBe("")
  })

  it("renders fallback when provided + missing perm", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      permissions: [],
      hasPermission: () => false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      refreshUser: vi.fn(),
    })
    render(
      <RequirePermission perm="x" fallback={<span>FB</span>}>
        hidden
      </RequirePermission>,
    )
    expect(screen.getByText("FB")).toBeInTheDocument()
  })

  it("renders nothing while isLoading=true (anti-flicker on hydration)", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: true,
      permissions: [],
      hasPermission: () => true,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      refreshUser: vi.fn(),
    })
    const { container } = render(
      <RequirePermission perm="task.create">visible</RequirePermission>,
    )
    expect(container.textContent).toBe("")
  })
})
