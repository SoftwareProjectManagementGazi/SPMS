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
// Avatar photo coverage (Phase 19 — primitive image-aware):
//   - avatarUrl present + valid → renders <img>, hides initials text
//   - avatarUrl '/placeholder.svg' sentinel → initials, no <img>
//   - avatarUrl undefined → initials, no <img>
//   - <img onError> → flips back to initials in the same tree
//   - relative uploads/… URL gets the backend prefix from resolveAvatarUrl
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

  it("renders <img> when avatarUrl is a real URL", () => {
    render(
      <Avatar
        user={{
          initials: "YB",
          avatarUrl: "http://localhost:8000/static/uploads/avatars/x.jpg",
        }}
      />,
    )
    const img = screen.getByRole("img")
    expect(img).toBeInTheDocument()
    expect(img.getAttribute("src")).toBe(
      "http://localhost:8000/static/uploads/avatars/x.jpg",
    )
    // Initials text is no longer in the DOM when the photo renders.
    expect(screen.queryByText("YB")).toBeNull()
  })

  it("falls back to initials when avatarUrl is the placeholder sentinel", () => {
    render(
      <Avatar user={{ initials: "YB", avatarUrl: "/placeholder.svg" }} />,
    )
    expect(screen.queryByRole("img")).toBeNull()
    expect(screen.getByText("YB")).toBeInTheDocument()
  })

  it("falls back to initials when avatarUrl is null/undefined", () => {
    render(<Avatar user={{ initials: "YB", avatarUrl: null }} />)
    expect(screen.queryByRole("img")).toBeNull()
    expect(screen.getByText("YB")).toBeInTheDocument()
  })

  it("resolves relative uploads/ URL via the backend prefix", () => {
    render(
      <Avatar
        user={{ initials: "YB", avatarUrl: "uploads/avatars/abc.png" }}
      />,
    )
    const img = screen.getByRole("img")
    // resolveAvatarUrl prepends NEXT_PUBLIC_BACKEND_URL (defaults to
    // http://localhost:8000) + /static/ when the input starts with uploads/.
    expect(img.getAttribute("src")).toMatch(
      /\/static\/uploads\/avatars\/abc\.png$/,
    )
  })

  it("falls back to initials when the <img> onError fires", () => {
    render(
      <Avatar
        user={{ initials: "YB", avatarUrl: "http://example/missing.jpg" }}
      />,
    )
    const img = screen.getByRole("img")
    fireEvent.error(img)
    // After onError flips the state, the img is unmounted and initials show.
    expect(screen.queryByRole("img")).toBeNull()
    expect(screen.getByText("YB")).toBeInTheDocument()
  })
})
