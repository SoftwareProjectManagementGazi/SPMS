// Phase 14 Plan 14-03 Task 2 — BulkInviteModal RTL tests.
//
// Verifies 3 mandatory cases per <behavior>:
//   1. File select with valid CSV (3 rows) → preview shows 3 rows + summary
//      "3 geçerli / 0 hatalı".
//   2. File select with mixed CSV (2 valid, 1 invalid email) → preview shows
//      both row groups + summary reflects counts.
//   3. File select with 600 rows → 500-row warning AlertBanner appears + CTA
//      "İlk 500'ü İşle" enabled.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ---- Context mocks ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// ---- useBulkInvite mock — overridable ----
const bulkInviteMutateMock = vi.fn()
const bulkInviteStateRef = { isPending: false }
vi.mock("@/hooks/use-bulk-invite", () => ({
  useBulkInvite: () => ({
    mutate: bulkInviteMutateMock,
    isPending: bulkInviteStateRef.isPending,
  }),
}))

// ---- parseBulkInviteCsv mock — controlled fixtures ----
const parseMock = vi.fn()
vi.mock("@/lib/admin/csv-parse", async () => {
  // Re-export the real BULK_INVITE_MAX_ROWS constant (component imports it).
  const actual: any = await vi.importActual("@/lib/admin/csv-parse")
  return {
    ...actual,
    parseBulkInviteCsv: (...args: unknown[]) => parseMock(...args),
  }
})

import { BulkInviteModal } from "./bulk-invite-modal"

function makeFile(content: string, name = "users.csv") {
  return new File([content], name, { type: "text/csv" })
}

describe("BulkInviteModal (Plan 14-03 Task 2)", () => {
  beforeEach(() => {
    parseMock.mockReset()
    bulkInviteMutateMock.mockReset()
    bulkInviteStateRef.isPending = false
  })

  it("Case 1 — valid CSV (3 rows) → preview + '3 geçerli / 0 hatalı'", async () => {
    parseMock.mockResolvedValue({
      rows: [
        { email: "[email protected]", name: "A", role: "Member" },
        { email: "[email protected]", name: "B", role: "Member" },
        { email: "[email protected]", name: "C", role: "Project Manager" },
      ],
      errors: [],
    })

    render(<BulkInviteModal open={true} onClose={vi.fn()} />)
    const fileInput = screen.getByLabelText(/csv file/i) as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [makeFile("email,name,role\na@x.io,A,Member")] },
    })

    await waitFor(() => {
      expect(screen.getByText(/3 geçerli/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/0 hatalı/i)).toBeInTheDocument()
    // 3 valid badges visible
    expect(screen.getAllByText(/^Geçerli$/i).length).toBeGreaterThanOrEqual(3)
    // Each email row rendered (use getAllByText to tolerate substring matches)
    expect(screen.getAllByText("[email protected]").length).toBeGreaterThan(0)
    expect(screen.getAllByText("[email protected]").length).toBeGreaterThan(0)
    expect(screen.getAllByText("[email protected]").length).toBeGreaterThan(0)
  })

  it("Case 2 — mixed CSV (2 valid, 1 invalid) → preview shows both groups", async () => {
    parseMock.mockResolvedValue({
      rows: [
        { email: "[email protected]", name: "A", role: "Member" },
        { email: "[email protected]", name: "B", role: "Member" },
      ],
      errors: [
        { row_number: 4, message: "Geçersiz email: bad" },
      ],
    })

    render(<BulkInviteModal open={true} onClose={vi.fn()} />)
    const fileInput = screen.getByLabelText(/csv file/i) as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [makeFile("mock")] },
    })

    await waitFor(() => {
      expect(screen.getByText(/2 geçerli/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/1 hatalı/i)).toBeInTheDocument()
    expect(screen.getByText(/3 toplam/i)).toBeInTheDocument()
    // Both Geçerli and Hatalı badges visible
    expect(screen.getAllByText(/^Geçerli$/i).length).toBe(2)
    expect(screen.getAllByText(/^Hatalı$/i).length).toBe(1)
    expect(screen.getByText(/geçersiz email/i)).toBeInTheDocument()
  })

  it("Case 3 — 600 rows → 500 warning AlertBanner + 'İlk 500'ü İşle' CTA", async () => {
    const rows = Array.from({ length: 600 }, (_, i) => ({
      email: `user${i}@x.io`,
      name: `User ${i}`,
      role: "Member" as const,
    }))
    parseMock.mockResolvedValue({ rows, errors: [] })

    render(<BulkInviteModal open={true} onClose={vi.fn()} />)
    const fileInput = screen.getByLabelText(/csv file/i) as HTMLInputElement
    fireEvent.change(fileInput, {
      target: { files: [makeFile("mock")] },
    })

    await waitFor(() => {
      // The warning AlertBanner contains both "600" (rendered count) and
      // "Maksimum 500"; getAllByText to handle substring multi-matches.
      expect(screen.getAllByText(/600/).length).toBeGreaterThan(0)
    })
    // 500-row warning AlertBanner copy mentions "Maksimum 500" and rendered
    // count "600". Use getAllByText since the substring may match multiple
    // text nodes (the warning + the summary line both surface "600").
    expect(screen.getAllByText(/maksimum 500/i).length).toBeGreaterThan(0)
    // Primary CTA button "İlk 500'ü İşle" enabled. JS regex case-folding
    // doesn't symmetrize Turkish "İ" ↔ "i", so we match by 500 + a wildcard
    // tail; getByRole accessible-name is the literal "İlk 500'ü İşle".
    const cta = screen.getByRole("button", { name: /500.*\S{2,}/i })
    expect(cta).toBeInTheDocument()
    expect(cta).not.toBeDisabled()
  })
})
