// Phase 14 Plan 14-16 Task 2 (Cluster D Path B) — AdminAuditTable RTL tests.
//
// Path is LOCKED to Path B per <user_decision_locked> 2026-04-28: 5-column
// AuditTable (Zaman / Aktör / İşlem / Hedef / Detay), IP column dropped.
// These tests REPLACE the legacy 14-07 Plan tests (4 cases against the broken
// 6-col grid + aria-hidden filler at row-end) with the 4 mandatory <behavior>
// cases from PLAN 14-16:
//
//   1. EXACTLY 5 columnheader cells in order [Zaman, Aktör, İşlem, Hedef, Detay].
//   2. entity_label="Yapay Zeka Modülü" renders in the 4th body cell (Hedef
//      column position) — verified by column INDEX, not by text-search alone.
//   3. NO duplicate Zaman cell at the right edge — getAllByText for the
//      formatted timestamp returns EXACTLY 1 match per row.
//   4. (M-4 hideTimestamp companion) Both AdminAuditTable rows AND
//      <ActivityRow variant="admin-table" hideTimestamp /> defenses are
//      asserted in activity-row.test.tsx — this file proves the table-level
//      contract; activity-row.test.tsx proves the component-level prop.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  cleanup,
  within,
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
import { formatRelativeTime } from "@/lib/activity-date-format"

// Use a fixed timestamp so formatRelativeTime returns a deterministic string
// when looked up via getAllByText. "1 hour ago" / "1 saat önce" stays stable
// for any timestamp older than ~1h but still within the same day.
const FIXED_ISO = new Date(Date.now() - 60 * 60 * 1000).toISOString()

describe("AdminAuditTable (Plan 14-16 Cluster D Path B)", () => {
  beforeEach(() => {
    cleanup()
    auditStateRef.current = {
      data: undefined,
      isLoading: false,
      error: null,
    }
  })

  it("Test 1 — renders EXACTLY 5 columnheaders in order [Zaman, Aktör, İşlem, Hedef, Detay]", () => {
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
            timestamp: FIXED_ISO,
            metadata: { task_key: "BANK-12", task_title: "Hello" },
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

    // Path B contract: 5 columnheaders, NOT 6, NOT 4. The 6th aria-hidden
    // filler from the broken 14-07 grid must be removed.
    const headers = screen.getAllByRole("columnheader")
    expect(headers).toHaveLength(5)
    expect(headers[0].textContent).toBe("Zaman")
    expect(headers[1].textContent).toBe("Aktör")
    expect(headers[2].textContent).toBe("İşlem")
    expect(headers[3].textContent).toBe("Hedef")
    expect(headers[4].textContent).toBe("Detay")
  })

  it("Test 2 — entity_label='Yapay Zeka Modülü' renders in the Hedef column (4th body cell, by index not text-search)", () => {
    auditStateRef.current = {
      isLoading: false,
      data: {
        items: [
          {
            id: 1,
            action: "project.archive",
            user_id: 1,
            user_name: "Yusuf",
            entity_label: "Yapay Zeka Modülü",
            entity_type: "project",
            entity_id: 4,
            timestamp: FIXED_ISO,
            metadata: { project_name: "Yapay Zeka Modülü" },
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

    // Path B contract: rows have role="row" with 5 role="cell" children.
    // The Hedef cell is at index 3 (0-based: Zaman=0 Aktör=1 İşlem=2 Hedef=3
    // Detay=4). This verifies POSITION, not just presence — guarding against
    // the original bug where entity_label was emitted but rendered in the
    // wrong cell.
    const rows = screen.getAllByRole("row")
    // First row is the header (5 columnheader cells in role="row"),
    // body row is the second one. We assert the body row's Hedef cell.
    const bodyRow = rows[1]
    expect(bodyRow).toBeDefined()
    const cells = within(bodyRow).getAllByRole("cell")
    expect(cells).toHaveLength(5)
    expect(cells[3].textContent).toContain("Yapay Zeka Modülü")
  })

  it("Test 3 — NO duplicate Zaman cell at right edge (formatted timestamp appears EXACTLY once per row)", () => {
    auditStateRef.current = {
      isLoading: false,
      data: {
        items: [
          // CRITICAL — these rows MUST satisfy mapAuditToSemantic so the inner
          // <ActivityRow variant="admin-table"/> doesn't early-return null.
          // entity_type="task" + action="updated" maps to task_field_updated
          // which renders Detay cell content INCLUDING (without the M-4 fix)
          // an inner mono timestamp. That second timestamp is the duplicate
          // Zaman bug; the M-4 hideTimestamp prop suppresses it.
          {
            id: 1,
            action: "updated",
            entity_type: "task",
            entity_id: 1,
            field_name: "due_date",
            user_id: 1,
            user_name: "Alice",
            entity_label: "BANK-1",
            timestamp: FIXED_ISO,
            metadata: {
              task_key: "BANK-1",
              task_title: "Some task",
              field_name: "due_date",
              old_value_label: "2026-04-25",
              new_value_label: "2026-05-01",
            },
          },
          {
            id: 2,
            action: "updated",
            entity_type: "task",
            entity_id: 2,
            field_name: "priority",
            user_id: 2,
            user_name: "Bob",
            entity_label: "BANK-2",
            timestamp: FIXED_ISO,
            metadata: {
              task_key: "BANK-2",
              task_title: "Other task",
              field_name: "priority",
              old_value_label: "Düşük",
              new_value_label: "Yüksek",
            },
          },
        ],
        total: 2,
        truncated: false,
      },
    }
    render(
      <AdminAuditTable
        filter={{ limit: 50, offset: 0 }}
        onUpdate={vi.fn()}
      />,
    )

    // Path B contract: only the leftmost Zaman cell renders the timestamp.
    // The Detay cell uses <ActivityRow variant="admin-table" hideTimestamp />
    // so its inner mono timestamp is suppressed. Net: ONE timestamp per row.
    // Without the M-4 fix this test reports 4 matches (2 rows × 2 dups).
    const formatted = formatRelativeTime(FIXED_ISO, "tr")
    const matches = screen.getAllByText(formatted)
    expect(matches).toHaveLength(2)
  })

  it("Test 4 — D-Z1 enforcement preserved: NO 'Risk' / 'Risiko' column header, NO 'IP' header (Path B drops IP)", () => {
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
            timestamp: FIXED_ISO,
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

    // D-Z1 — NO "Risk" column header (carried forward from Plan 14-07 Task 1).
    expect(screen.queryByText(/^Risk$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Risiko$/i)).not.toBeInTheDocument()
    // Path B — NO "IP" / "IP Adresi" column header (deferred to v2.1).
    expect(screen.queryByText(/^IP$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^IP Adresi$/i)).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Carry-forward from Plan 14-07: loading + truncated states still work.
  // These guard against regressions during the column-schema rewrite.
  // ---------------------------------------------------------------------------

  it("Carry-forward — isLoading=true → DataState loading copy", () => {
    auditStateRef.current = { isLoading: true, data: undefined }
    render(
      <AdminAuditTable
        filter={{ limit: 50, offset: 0 }}
        onUpdate={vi.fn()}
      />,
    )
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument()
  })

  it("Carry-forward — truncated=true → AlertBanner with '50.000' message visible", () => {
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
            timestamp: FIXED_ISO,
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
    expect(screen.getByText(/50\.000/)).toBeInTheDocument()
  })
})
