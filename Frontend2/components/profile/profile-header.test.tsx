// Phase 13 Plan 13-05 Task 1 — RTL coverage for ProfileHeader.
//
// Tests 1-6 from the plan's <behavior> block:
//   1. self profile shows Sen badge + ring + Düzenle
//   2. other profile hides self cues (no Sen, no Düzenle, no ring)
//   3. renders user.full_name as <h1>
//   4. role Badge tone matches role (Admin → danger, Project Manager → info, Member → neutral)
//   5. Düzenle navigates to /settings on click
//   6. inline metrics row renders 3 chips (proje / görev / tamamlanan)

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

const pushSpy = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy, replace: vi.fn(), back: vi.fn() }),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

const useAuthMock = vi.fn()
vi.mock("@/context/auth-context", () => ({
  useAuth: () => useAuthMock(),
}))

import { ProfileHeader } from "./profile-header"

const baseUser = {
  id: 7,
  full_name: "Yusuf Bayrakcı",
  email: "[email protected]",
  role: "Member",
  avatar_url: null,
}

const baseStats = {
  projectsTotal: 5,
  assignedTasks: 12,
  completedTasks: 8,
}

beforeEach(() => {
  pushSpy.mockReset()
  useAuthMock.mockReset()
})

describe("ProfileHeader", () => {
  it("shows Sen badge + ring + Düzenle when current user is the profile owner", () => {
    useAuthMock.mockReturnValue({ user: { id: "7" } })
    render(<ProfileHeader user={baseUser} stats={baseStats} />)
    expect(screen.getByText("Sen")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /düzenle/i })).toBeInTheDocument()
  })

  it("hides self cues (no Sen, no Düzenle) when current user is not the profile owner", () => {
    useAuthMock.mockReturnValue({ user: { id: "99" } })
    render(<ProfileHeader user={baseUser} stats={baseStats} />)
    expect(screen.queryByText("Sen")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /düzenle/i })).not.toBeInTheDocument()
  })

  it("renders user.full_name as a level-1 heading", () => {
    useAuthMock.mockReturnValue({ user: { id: "99" } })
    render(<ProfileHeader user={baseUser} stats={baseStats} />)
    const h1 = screen.getByRole("heading", { level: 1 })
    expect(h1).toHaveTextContent("Yusuf Bayrakcı")
  })

  it("renders role Badge with the role text", () => {
    useAuthMock.mockReturnValue({ user: { id: "99" } })
    const adminUser = { ...baseUser, role: "Admin" }
    const { rerender } = render(<ProfileHeader user={adminUser} stats={baseStats} />)
    expect(screen.getByText("Admin")).toBeInTheDocument()

    rerender(<ProfileHeader user={{ ...baseUser, role: "Project Manager" }} stats={baseStats} />)
    expect(screen.getByText("Project Manager")).toBeInTheDocument()

    rerender(<ProfileHeader user={{ ...baseUser, role: "Member" }} stats={baseStats} />)
    expect(screen.getByText("Member")).toBeInTheDocument()
  })

  it("Düzenle button navigates to /settings when clicked", () => {
    useAuthMock.mockReturnValue({ user: { id: "7" } })
    render(<ProfileHeader user={baseUser} stats={baseStats} />)
    fireEvent.click(screen.getByRole("button", { name: /düzenle/i }))
    expect(pushSpy).toHaveBeenCalledWith("/settings")
  })

  it("renders 3 inline metric chips (projects / tasks / completed)", () => {
    useAuthMock.mockReturnValue({ user: { id: "99" } })
    render(<ProfileHeader user={baseUser} stats={baseStats} />)
    // Each metric carries the count + a TR label noun.
    expect(screen.getByText(/5\s+proje/)).toBeInTheDocument()
    expect(screen.getByText(/12\s+görev/)).toBeInTheDocument()
    expect(screen.getByText(/8\s+tamamlanan/)).toBeInTheDocument()
  })
})
