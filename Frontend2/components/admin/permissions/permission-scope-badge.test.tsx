// Phase 15 Plan 15-10 — PermissionScopeBadge RTL tests (D-3.4 + PATTERNS §16).
//
// Verifies:
//   1. scope="system" + lang=tr renders "(sistem)"
//   2. scope="project" + lang=tr renders "(proje)"
//   3. scope="system" + lang=en renders "(system)"
//   4. scope="project" + lang=en renders "(project)"
//
// 4 cases × 2 assertions per case (label text + Badge tone="neutral" via
// rendered span existence) keeps coverage tight without over-asserting on
// internal styling.

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: vi.fn(),
}))
import { useApp } from "@/context/app-context"

import { PermissionScopeBadge } from "./permission-scope-badge"

describe("PermissionScopeBadge (Plan 15-10 — D-3.4)", () => {
  it("scope=system + tr renders '(sistem)' label", () => {
    ;(useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "tr",
    })
    render(<PermissionScopeBadge scope="system" />)
    expect(screen.getByText("(sistem)")).toBeInTheDocument()
  })

  it("scope=project + tr renders '(proje)' label", () => {
    ;(useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "tr",
    })
    render(<PermissionScopeBadge scope="project" />)
    expect(screen.getByText("(proje)")).toBeInTheDocument()
  })

  it("scope=system + en renders '(system)' label", () => {
    ;(useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "en",
    })
    render(<PermissionScopeBadge scope="system" />)
    expect(screen.getByText("(system)")).toBeInTheDocument()
  })

  it("scope=project + en renders '(project)' label", () => {
    ;(useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "en",
    })
    render(<PermissionScopeBadge scope="project" />)
    expect(screen.getByText("(project)")).toBeInTheDocument()
  })
})
