// Phase 13 Plan 13-05 Task 2 — RTL coverage for /users/[id] route page.
//
// Tests 1-7 from the plan's <behavior> block:
//   1. ProfileHeader receives the resolved user from useUserSummary + getUser
//   2. 3 StatCards render with TR labels (Atanan Görevler / Tamamlanan / Projeler)
//   3. Default tab=tasks (no ?tab= in URL → ProfileTasksTab visible)
//   4. ?tab=projects activates Projects tab on mount
//   5. Clicking a tab updates URL via router.replace
//   6. 404 path renders "Kullanıcı bulunamadı." when user lookup fails
//   7. Loading state renders "Yükleniyor…"

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

const replaceSpy = vi.fn()
const pushSpy = vi.fn()
const useParamsMock = vi.fn(() => ({ id: "7" }))
const useSearchParamsMock = vi.fn(() => new URLSearchParams())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy, replace: replaceSpy, back: vi.fn() }),
  useParams: () => useParamsMock(),
  useSearchParams: () => useSearchParamsMock(),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

const useAuthMock = vi.fn(() => ({ user: { id: "99", role: { name: "Member" } } }))
vi.mock("@/context/auth-context", () => ({
  useAuth: () => useAuthMock(),
}))

const useUserSummaryMock = vi.fn()
vi.mock("@/hooks/use-user-summary", () => ({
  useUserSummary: (id: number | null | undefined) => useUserSummaryMock(id),
}))

const useQueryMock = vi.fn()
vi.mock("@tanstack/react-query", () => ({
  useQuery: (opts: any) => useQueryMock(opts),
}))

// Stub ProfileHeader / ProfileTasksTab / ProfileProjectsTab — keep tests
// scoped to the route's own contract (StatCards + tabs + URL sync). Each
// stub exposes the props that the route passes so the assertions can
// verify wiring directly.
vi.mock("@/components/profile/profile-header", () => ({
  ProfileHeader: ({ user, stats }: any) => (
    <div data-testid="profile-header" data-user-id={user?.id}>
      <span>{user?.full_name}</span>
      <span data-testid="header-stats-projects">{stats?.projectsTotal}</span>
    </div>
  ),
}))
vi.mock("@/components/profile/profile-tasks-tab", () => ({
  ProfileTasksTab: ({ userId }: any) => (
    <div data-testid="profile-tasks-tab" data-user-id={userId}>
      tasks-tab
    </div>
  ),
}))
vi.mock("@/components/profile/profile-projects-tab", () => ({
  ProfileProjectsTab: ({ userId }: any) => (
    <div data-testid="profile-projects-tab" data-user-id={userId}>
      projects-tab
    </div>
  ),
}))

// StatCard stub — exposes label so Test 2 can count the 3 instances by label.
vi.mock("@/components/dashboard/stat-card", () => ({
  StatCard: ({ label, value, delta, tone }: any) => (
    <div
      data-testid="stat-card"
      data-label={label}
      data-tone={tone}
      data-delta={delta}
    >
      {value}
    </div>
  ),
}))

import UserProfilePage from "./page"

const mockSummary = {
  stats: { activeTasks: 12, completedLast30d: 8, projectCount: 5 },
  projects: [
    { id: 1, key: "MOBIL", name: "Mobile App", status: "ACTIVE" },
    { id: 2, key: "WEB", name: "Website", status: "ACTIVE" },
  ],
  recentActivity: [],
}

const mockUser = {
  id: 7,
  full_name: "Yusuf Bayrakcı",
  email: "[email protected]",
  role: "Member",
  avatar_url: null,
}

beforeEach(() => {
  replaceSpy.mockReset()
  pushSpy.mockReset()
  useParamsMock.mockReturnValue({ id: "7" })
  useSearchParamsMock.mockReturnValue(new URLSearchParams())
  useUserSummaryMock.mockReset()
  useQueryMock.mockReset()
  useAuthMock.mockReturnValue({ user: { id: "99", role: { name: "Member" } } })
  // Default user-fetch query returns the user
  useQueryMock.mockReturnValue({
    data: mockUser,
    isLoading: false,
    error: null,
  })
})

describe("UserProfilePage route", () => {
  it("renders ProfileHeader with the resolved user", () => {
    useUserSummaryMock.mockReturnValue({
      data: mockSummary,
      isLoading: false,
      error: null,
    })
    render(<UserProfilePage />)
    expect(screen.getByTestId("profile-header")).toBeInTheDocument()
    expect(screen.getByText("Yusuf Bayrakcı")).toBeInTheDocument()
  })

  it("renders 3 StatCards with the expected TR labels", () => {
    useUserSummaryMock.mockReturnValue({
      data: mockSummary,
      isLoading: false,
      error: null,
    })
    render(<UserProfilePage />)
    const cards = screen.getAllByTestId("stat-card")
    expect(cards).toHaveLength(3)
    const labels = cards.map((c) => c.getAttribute("data-label"))
    expect(labels).toContain("Atanan Görevler")
    expect(labels).toContain("Tamamlanan")
    expect(labels).toContain("Projeler")
  })

  it("default active tab is tasks (no ?tab= in URL)", () => {
    useUserSummaryMock.mockReturnValue({
      data: mockSummary,
      isLoading: false,
      error: null,
    })
    render(<UserProfilePage />)
    expect(screen.getByTestId("profile-tasks-tab")).toBeInTheDocument()
    expect(screen.queryByTestId("profile-projects-tab")).not.toBeInTheDocument()
  })

  it("?tab=projects activates the Projects tab on mount", () => {
    useUserSummaryMock.mockReturnValue({
      data: mockSummary,
      isLoading: false,
      error: null,
    })
    useSearchParamsMock.mockReturnValue(new URLSearchParams("tab=projects"))
    render(<UserProfilePage />)
    expect(screen.getByTestId("profile-projects-tab")).toBeInTheDocument()
    expect(screen.queryByTestId("profile-tasks-tab")).not.toBeInTheDocument()
  })

  it("clicking the Projeler tab calls router.replace with ?tab=projects", () => {
    useUserSummaryMock.mockReturnValue({
      data: mockSummary,
      isLoading: false,
      error: null,
    })
    render(<UserProfilePage />)
    // Tabs primitive renders <button> per tab; "Projeler" is the TR label.
    fireEvent.click(screen.getByRole("button", { name: /projeler/i }))
    expect(replaceSpy).toHaveBeenCalledWith("/users/7?tab=projects")
  })

  it("renders 404 copy when user lookup yields no data", () => {
    useUserSummaryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })
    render(<UserProfilePage />)
    expect(screen.getByText("Kullanıcı bulunamadı.")).toBeInTheDocument()
  })

  it("renders the loading state when summary OR user query is loading", () => {
    useUserSummaryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })
    render(<UserProfilePage />)
    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument()
  })
})
