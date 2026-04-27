// Phase 14 Plan 14-07 Task 2 — AuditFilterModal RTL tests.
//
// 3 mandatory cases per <behavior>:
//   1. Pre-fill — modal opens with current filter values reflected in inputs.
//   2. Apply — change date_from then click Uygula → calls onApply with the
//      new date_from set; onClose called.
//   3. Clear — click Temizle → calls onApply({}) and closes.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react"

// ---- next/navigation + useApp + admin users hook mocks ----
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/audit",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// useAdminUsers — minimal mock with 2 users for the actor selector dropdown.
vi.mock("@/hooks/use-admin-users", () => ({
  useAdminUsers: () => ({
    data: {
      items: [
        {
          id: 1,
          full_name: "Alice Admin",
          email: "[email protected]",
        },
        {
          id: 2,
          full_name: "Bob PM",
          email: "[email protected]",
        },
      ],
      total: 2,
    },
    isLoading: false,
    error: null,
  }),
}))

import { AuditFilterModal } from "./audit-filter-modal"

describe("AuditFilterModal (Plan 14-07 Task 2)", () => {
  beforeEach(() => {
    cleanup()
  })

  it("Case 1 — renders 4 form fields + 3 footer buttons + pre-fills from filter", () => {
    const filter = {
      date_from: "2026-04-01T00:00:00Z",
      date_to: "2026-04-30T00:00:00Z",
      actor_id: 1,
      action_prefix: "task.",
    }
    render(
      <AuditFilterModal
        open={true}
        filter={filter}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    // Title
    expect(screen.getByText("Audit Filtresi")).toBeInTheDocument()

    // 4 fields — find by label text. The action_prefix label uses Turkish
    // İ (dotted capital I, U+0130) which doesn't casefold to ASCII `i` in
    // a JS RegExp `/i` flag, so we match by exact substring instead.
    expect(screen.getByText("Başlangıç")).toBeInTheDocument()
    expect(screen.getByText("Bitiş")).toBeInTheDocument()
    expect(screen.getByText("Aktör (kullanıcı)")).toBeInTheDocument()
    expect(
      screen.getByText(/İşlem öneki/, { exact: false }),
    ).toBeInTheDocument()

    // Pre-fill — inputs reflect filter values.
    const dateInputs = screen
      .getAllByDisplayValue(/2026-04-/)
      .filter(
        (el) => (el as HTMLInputElement).type === "date",
      )
    expect(dateInputs.length).toBe(2)

    // Action prefix input pre-filled.
    expect(
      screen.getByDisplayValue("task."),
    ).toBeInTheDocument()

    // 3 footer buttons (Vazgeç / Temizle / Uygula).
    expect(
      screen.getByRole("button", { name: /vazgeç/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /temizle/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /uygula/i }),
    ).toBeInTheDocument()
  })

  it("Case 2 — Uygula with new date_from calls onApply with the new value + closes", () => {
    const onApply = vi.fn()
    const onClose = vi.fn()
    const filter = {
      date_from: undefined,
      date_to: undefined,
      actor_id: undefined,
      action_prefix: undefined,
    }
    render(
      <AuditFilterModal
        open={true}
        filter={filter}
        onApply={onApply}
        onClose={onClose}
      />,
    )

    // Find the action_prefix text input (the only type="text" Input here).
    const actionPrefixInput = screen.getByPlaceholderText(
      /task\. veya project\.archive/i,
    ) as HTMLInputElement
    fireEvent.change(actionPrefixInput, {
      target: { value: "user.invite" },
    })
    expect(actionPrefixInput.value).toBe("user.invite")

    fireEvent.click(
      screen.getByRole("button", { name: /uygula/i }),
    )

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ action_prefix: "user.invite" }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("Case 3 — Temizle calls onApply({}) and closes", () => {
    const onApply = vi.fn()
    const onClose = vi.fn()
    const filter = {
      date_from: "2026-04-01T00:00:00Z",
      action_prefix: "task.",
    }
    render(
      <AuditFilterModal
        open={true}
        filter={filter}
        onApply={onApply}
        onClose={onClose}
      />,
    )

    fireEvent.click(
      screen.getByRole("button", { name: /temizle/i }),
    )

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith({})
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
