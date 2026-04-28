// Phase 14 Plan 14-18 (Cluster F, UAT Test 32) — VelocityCardsGrid project-
// name link tests.
//
// The original Plan 14-08 implementation rendered the project name as plain
// text inside <VelocityMiniBar/>. Test 32 caught the missing affordance:
// users couldn't drill from a velocity card into the project detail page.
//
// Plan 14-18 fix: project name wraps in next/link <Link href="/projects/{id}">
// with a hover affordance (cursor:pointer + underline / color shift). The
// link covers the full mini-bar surface so the entire card is clickable.
//
// Tests:
//   1. Each velocity card renders an <a href="/projects/{id}"/> wrapping the
//      project name.
//   2. The clickable wrapper carries the velocity-card-project-link class
//      so globals.css :hover rule applies.

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// --- next/link mock — render as plain <a> for href assertion ----------
vi.mock("next/link", () => ({
  default: ({ href, children, className, style, ...rest }: any) => (
    <a
      href={typeof href === "string" ? href : "#"}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </a>
  ),
}))

// --- useApp mock ------------------------------------------------------
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { VelocityCardsGrid } from "./velocity-cards-grid"
import type { VelocityMiniBarData } from "./velocity-mini-bar"

const FIXTURES: VelocityMiniBarData[] = [
  {
    projectId: 11,
    key: "ALPHA",
    name: "Alpha Project",
    progress: 0.62,
    velocityHistory: [3, 5, 4, 6, 7, 5, 8],
  },
  {
    projectId: 22,
    key: "BETA",
    name: "Beta Kanban",
    progress: 0.31,
    velocityHistory: [2, 3, 2, 4, 3, 5, 4],
  },
]

describe("VelocityCardsGrid title — Plan 14-18 UAT Test 31 terminology", () => {
  it("Test 0 — section title uses methodology-neutral terminology (NOT 'Velocity')", () => {
    render(<VelocityCardsGrid velocities={FIXTURES} />)
    // After Plan 14-18 the section title resolves to a methodology-neutral
    // term ("Tamamlama hızı" TR / "Throughput" EN). The bug was that
    // 'Velocity' is a Scrum-specific term — Kanban/Waterfall users found
    // it confusing.
    // Title MUST NOT contain "Velocity" (the previous bug copy).
    expect(screen.queryByText(/^Velocity$/i)).toBeNull()
    // Title MUST be a methodology-neutral term — accept either of the two
    // canonical replacements. The exact value comes from the i18n key
    // admin.stats.velocity_title (TR "Tamamlama hızı") so we match the
    // forward edge of that phrase.
    expect(
      screen.queryByText(/Tamamlama hızı|Throughput/i),
    ).not.toBeNull()
  })
})

describe("VelocityCardsGrid project-name link (Plan 14-18 UAT Test 32)", () => {
  it("Test 1 — renders an <a href=\"/projects/{id}\"> wrapping each project name", () => {
    render(<VelocityCardsGrid velocities={FIXTURES} />)

    // The project name "Alpha Project" should be inside an <a> with the right href.
    const alphaLink = screen.getByRole("link", { name: /ALPHA|Alpha/i })
    expect(alphaLink).toBeTruthy()
    expect(alphaLink.getAttribute("href")).toBe("/projects/11")

    const betaLink = screen.getByRole("link", { name: /BETA|Beta/i })
    expect(betaLink).toBeTruthy()
    expect(betaLink.getAttribute("href")).toBe("/projects/22")
  })

  it("Test 2 — link carries the hover-affordance className", () => {
    render(<VelocityCardsGrid velocities={FIXTURES} />)
    const alphaLink = screen.getByRole("link", { name: /ALPHA|Alpha/i })
    // The class lets globals.css apply :hover { color, underline } per
    // UI-SPEC §A.4 hover affordance contract.
    expect(alphaLink.className).toContain("velocity-card-project-link")
  })
})
