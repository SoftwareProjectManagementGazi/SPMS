// Phase 14 Plan 14-07 Task 1 — AdminAuditTable RTL tests.
//
// 4 mandatory cases per <behavior>:
//   1. Loading: useAdminAudit returns isLoading=true → DataState loading.
//   2. 3 mock items + truncated=false → 3 rows render, no AlertBanner.
//   3. truncated=true → AlertBanner tone="warning" appears AND text contains
//      "50.000" / "50,000" (UI-SPEC §Surface H line 486).
//   4. NO risk column rendered (D-Z1 enforcement) — assert no "Risk" column
//      header text appears in the rendered DOM.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  cleanup,
} from "@testing-library/react"

// ---- next/navigation mock ----
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/audit",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next/link", () => ({
  default: ({ href, children, style, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} style={style} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// useAdminAudit mock — overridable per-test via the ref.
type AuditQ = {
  data?: unknown
  isLoading?: boolean
  error?: unknown
}
const auditStateRef: { current: AuditQ } = {
  current: { data: undefined, isLoading: false, error: null },
}
vi.mock("@/hooks/use-admin-audit", () => ({
  useAdminAudit: () => auditStateRef.current,
}))

import { AdminAuditTable } from "./admin-audit-table"

describe("AdminAuditTable (Plan 14-07 Task 1)", () => {
  beforeEach(() => {
    cleanup()
    auditStateRef.current = {
      data: undefined,
      isLoading: false,
      error: null,
    }
  })

  it("Case 1 — isLoading=true → DataState loading copy", () => {
    auditStateRef.current = { isLoading: true, data: undefined }
    render(
      <AdminAuditTable
        filter={{ limit: 50, offset: 0 }}
        onUpdate={vi.fn()}
      />,
    )
    // DataState's default TR loading copy is "Yükleniyor…".
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument()
  })

  it("Case 2 — 3 mock items + truncated=false → 3 rows + NO AlertBanner", () => {
    auditStateRef.current = {
      isLoading: false,
      data: {
        items: [
          {
            id: 1,
            action: "task.update",
            user_id: 1,
            user_name: "Alice Admin",
            entity_label: "BANK-12",
            timestamp: new Date().toISOString(),
            metadata: { task_key: "BANK-12", task_title: "Hello" },
          },
          {
            id: 2,
            action: "user.deactivate",
            user_id: 2,
            user_name: "Bob PM",
            entity_label: "[email protected]",
            timestamp: new Date().toISOString(),
            metadata: {},
          },
          {
            id: 3,
            action: "project.archive",
            user_id: 3,
            user_name: "Carol Member",
            entity_label: "Old CRM",
            timestamp: new Date().toISOString(),
            metadata: {},
          },
        ],
        total: 3,
        truncated: false,
      },
    }
    render(
      <AdminAuditTable
        filter={{ limit: 50, offset: 0 }}
        onUpdate={vi.fn()}
      />,
    )

    // 3 distinct entity labels rendered as Target cells.
    expect(screen.getByText("BANK-12")).toBeInTheDocument()
    expect(screen.getByText("[email protected]")).toBeInTheDocument()
    expect(screen.getByText("Old CRM")).toBeInTheDocument()

    // 3 distinct actor names.
    expect(screen.getByText("Alice Admin")).toBeInTheDocument()
    expect(screen.getByText("Bob PM")).toBeInTheDocument()
    expect(screen.getByText("Carol Member")).toBeInTheDocument()

    // 3 distinct action strings.
    expect(screen.getByText("task.update")).toBeInTheDocument()
    expect(screen.getByText("user.deactivate")).toBeInTheDocument()
    expect(screen.getByText("project.archive")).toBeInTheDocument()

    // No 50k truncated warning text in the DOM.
    expect(
      screen.queryByText(/50\.000|50,000/i),
    ).not.toBeInTheDocument()
  })

  it("Case 3 — truncated=true → AlertBanner with '50.000' message visible", () => {
    auditStateRef.current = {
      isLoading: false,
      data: {
        items: [
          {
            id: 1,
            action: "task.update",
            user_id: 1,
            user_name: "Alice",
            entity_label: "BANK-1",
            timestamp: new Date().toISOString(),
            metadata: {},
          },
        ],
        total: 123_456,
        truncated: true,
      },
    }
    render(
      <AdminAuditTable
        filter={{ limit: 50, offset: 0 }}
        onUpdate={vi.fn()}
      />,
    )
    // The truncated warning text contains "50.000" verbatim per UI-SPEC.
    expect(
      screen.getByText(/50\.000/),
    ).toBeInTheDocument()
  })

  it("Case 4 — D-Z1 enforcement: NO risk column header rendered", () => {
    auditStateRef.current = {
      isLoading: false,
      data: {
        items: [
          {
            id: 1,
            action: "task.update",
            user_id: 1,
            user_name: "Alice",
            entity_label: "BANK-1",
            timestamp: new Date().toISOString(),
            metadata: {},
          },
        ],
        total: 1,
        truncated: false,
      },
    }
    render(
      <AdminAuditTable
        filter={{ limit: 50, offset: 0 }}
        onUpdate={vi.fn()}
      />,
    )
    // The 5 actual column headers are present (Detay = TR "Detay" or
    // localized "Detail").
    expect(screen.getByText("Zaman")).toBeInTheDocument()
    expect(screen.getByText("Aktör")).toBeInTheDocument()
    expect(screen.getByText("İşlem")).toBeInTheDocument()
    expect(screen.getByText("Hedef")).toBeInTheDocument()
    expect(screen.getByText("Detay")).toBeInTheDocument()

    // D-Z1 — NO column header named "Risk" / "Risiko".
    expect(screen.queryByText(/^Risk$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Risiko$/i)).not.toBeInTheDocument()
  })
})
