// Unit tests for hooks/use-transition-authority.ts (Phase 12 Plan 12-01).
//
// 6 cases per 12-01-PLAN.md task 2 <behavior> block. Mocks `useAuth` and
// `useLedTeams` via vi.mock so the hook is exercised in isolation; no real
// QueryClient or auth context required.

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { useTransitionAuthority } from "./use-transition-authority"
import * as authContext from "@/context/auth-context"
import * as ledTeamsHook from "./use-led-teams"

vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn(),
}))
vi.mock("./use-led-teams", () => ({
  useLedTeams: vi.fn(),
}))

const mockedAuth = vi.mocked(authContext)
const mockedLedTeams = vi.mocked(ledTeamsHook)

function HarnessForProject({ project }: { project: { id: number; managerId?: number | null } | null }) {
  const allowed = useTransitionAuthority(project)
  return <span data-testid="result">{allowed ? "yes" : "no"}</span>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useTransitionAuthority", () => {
  it("Admin role returns true regardless of project", () => {
    mockedAuth.useAuth.mockReturnValue({
      user: { id: "999", name: "Admin", email: "a@b.co", role: { name: "Admin" } },
      token: "x",
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockedLedTeams.useLedTeams.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof ledTeamsHook.useLedTeams>)
    render(<HarnessForProject project={{ id: 1, managerId: 7 }} />)
    expect(screen.getByTestId("result").textContent).toBe("yes")
  })

  it("project.managerId === user.id returns true", () => {
    mockedAuth.useAuth.mockReturnValue({
      user: { id: "7", name: "Mert", email: "m@b.co", role: { name: "Member" } },
      token: "x",
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockedLedTeams.useLedTeams.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof ledTeamsHook.useLedTeams>)
    render(<HarnessForProject project={{ id: 1, managerId: 7 }} />)
    expect(screen.getByTestId("result").textContent).toBe("yes")
  })

  it("led-teams contains project_ids matching project.id returns true", () => {
    mockedAuth.useAuth.mockReturnValue({
      user: { id: "5", name: "Zeynep", email: "z@b.co", role: { name: "Member" } },
      token: "x",
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockedLedTeams.useLedTeams.mockReturnValue({
      data: [{ id: 1, name: "BE Team", project_ids: [1, 2] }],
      isLoading: false,
      error: null,
    } as ReturnType<typeof ledTeamsHook.useLedTeams>)
    render(<HarnessForProject project={{ id: 1, managerId: 99 }} />)
    expect(screen.getByTestId("result").textContent).toBe("yes")
  })

  it("none of the three roles returns false", () => {
    mockedAuth.useAuth.mockReturnValue({
      user: { id: "5", name: "Member", email: "m@b.co", role: { name: "Member" } },
      token: "x",
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockedLedTeams.useLedTeams.mockReturnValue({
      data: [{ id: 1, name: "Other", project_ids: [99] }],
      isLoading: false,
      error: null,
    } as ReturnType<typeof ledTeamsHook.useLedTeams>)
    render(<HarnessForProject project={{ id: 1, managerId: 99 }} />)
    expect(screen.getByTestId("result").textContent).toBe("no")
  })

  it("user is null returns false", () => {
    mockedAuth.useAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockedLedTeams.useLedTeams.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof ledTeamsHook.useLedTeams>)
    render(<HarnessForProject project={{ id: 1, managerId: 99 }} />)
    expect(screen.getByTestId("result").textContent).toBe("no")
  })

  it("ledTeams undefined (still loading) returns false (Pitfall 17)", () => {
    mockedAuth.useAuth.mockReturnValue({
      user: { id: "5", name: "Member", email: "m@b.co", role: { name: "Member" } },
      token: "x",
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockedLedTeams.useLedTeams.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof ledTeamsHook.useLedTeams>)
    render(<HarnessForProject project={{ id: 1, managerId: 99 }} />)
    expect(screen.getByTestId("result").textContent).toBe("no")
  })

  it("project is null returns false", () => {
    mockedAuth.useAuth.mockReturnValue({
      user: { id: "5", name: "Member", email: "m@b.co", role: { name: "Member" } },
      token: "x",
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockedLedTeams.useLedTeams.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof ledTeamsHook.useLedTeams>)
    render(<HarnessForProject project={null} />)
    expect(screen.getByTestId("result").textContent).toBe("no")
  })
})
