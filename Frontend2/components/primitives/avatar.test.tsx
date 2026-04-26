// Phase 13 Plan 13-03 Task 1 — Avatar primitive RTL coverage for the
// optional `href` prop landed by Plan 13-01 (D-D4 cross-site click-to-profile).
//
// Verifies:
//   - null user → returns null (no DOM)
//   - no href → renders a styled <div> wrapper, NOT a Link
//   - href present → renders a <Link> wrapper resolving the href attribute
//   - Link click stopPropagation: outer parent onClick spy is NOT called
//     when the Avatar Link is clicked (Phase 13 backwards-compat guarantee
//     for parent row-click handlers like MTTaskRow's navigate-to-task)
//   - initials text still renders inside the visual when href is set
//
// Pattern matches data-state.test.tsx (Plan 13-01 Task 2): no Provider tree
// needed because Avatar is layout-neutral and reads no contexts. next/link is
// a global jsdom default — no mock required.

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Avatar } from "./avatar"

describe("Avatar", () => {
  it("renders null when user prop is null", () => {
    const { container } = render(<Avatar user={null} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders a div (not link) when href is absent", () => {
    render(<Avatar user={{ initials: "YB", avColor: 1 }} />)
    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.getByText("YB")).toBeInTheDocument()
  })

  it("renders Link wrapper when href is present and href attribute resolves", () => {
    render(<Avatar user={{ initials: "YB" }} href="/users/7" />)
    const link = screen.getByRole("link")
    expect(link.getAttribute("href")).toBe("/users/7")
    expect(screen.getByText("YB")).toBeInTheDocument()
  })

  it("stopPropagation: Avatar Link click does not bubble to parent onClick", () => {
    const parentClick = vi.fn()
    render(
      <div onClick={parentClick} data-testid="parent">
        <Avatar user={{ initials: "YB" }} href="/users/7" />
      </div>,
    )
    const link = screen.getByRole("link")
    fireEvent.click(link)
    expect(parentClick).not.toHaveBeenCalled()
  })

  it("renders initials text inside the Link visual", () => {
    render(<Avatar user={{ initials: "AB", avColor: 3 }} href="/users/9" />)
    expect(screen.getByText("AB")).toBeInTheDocument()
  })
})
