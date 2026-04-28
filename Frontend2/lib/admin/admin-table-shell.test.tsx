// Phase 14 Plan 14-18 (Cluster F, UAT Test 34) — AdminTableShell tests.
//
// All 3 admin tables (Users / Audit / Projects) wrap their <Card/> in
// <AdminTableShell minWidth={N}/> so narrow viewports surface a horizontal
// scrollbar instead of cells silently overlapping. The shell sets:
//   - overflow-x: auto on the outer container
//   - max-width: 100% so the wrapper itself respects its parent
//   - inner content min-width = props.minWidth (default 1100px)
//
// Tests:
//   1. Renders children inside an outer container with overflow-x: auto.
//   2. The inner content wrapper has the configured min-width.
//   3. Default min-width = 1100 when prop omitted.

import * as React from "react"
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { AdminTableShell } from "./admin-table-shell"

describe("AdminTableShell (Plan 14-18 UAT Test 34)", () => {
  it("Test 1 — outer container has overflow-x: auto + max-width: 100%", () => {
    const { container } = render(
      <AdminTableShell>
        <div data-testid="content" />
      </AdminTableShell>,
    )
    const outer = container.firstChild as HTMLElement
    expect(outer.style.overflowX).toBe("auto")
    expect(outer.style.maxWidth).toBe("100%")
  })

  it("Test 2 — inner wrapper has configured min-width", () => {
    const { container } = render(
      <AdminTableShell minWidth={1240}>
        <div data-testid="content" />
      </AdminTableShell>,
    )
    const inner = container.firstChild?.firstChild as HTMLElement
    expect(inner.style.minWidth).toBe("1240px")
  })

  it("Test 3 — default minWidth is 1100 when prop omitted", () => {
    const { container } = render(
      <AdminTableShell>
        <div data-testid="content" />
      </AdminTableShell>,
    )
    const inner = container.firstChild?.firstChild as HTMLElement
    expect(inner.style.minWidth).toBe("1100px")
  })
})
