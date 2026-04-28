// Phase 14 Plan 14-18 (Cluster F, UAT Test 12 side-finding) — Users-toolbar
// search debounce tests.
//
// The original Plan 14-03 implementation forwarded EVERY keystroke to the
// parent's onFilterChange (Frontend2/components/admin/users/users-toolbar.tsx
// line 97). Combined with useAdminUsers having no placeholderData, the
// table re-fetched + re-rendered on every character typed in the search
// input — visually "thrashing" with 200ms latency loops.
//
// Plan 14-18 fix: the q field is debounced via setTimeout (250ms). The
// useAdminUsers hook now sets placeholderData: keepPreviousData (v5.99.2
// syntax — verified via Frontend2/package.json + node_modules pre-flight)
// so the previous results stay visible while the new query refetches.
//
// Tests (vitest fakeTimers):
//   1. Typing 3 characters fires onFilterChange ONLY ONCE after the
//      debounce window settles (not 3x).
//   2. Role filter (SegmentedControl) is NOT debounced — fires immediately.

import * as React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

// download-authenticated.ts is unrelated to debounce; stub the side-effect.
vi.mock("@/lib/admin/download-authenticated", () => ({
  downloadAuthenticated: vi.fn(),
}))

import { UsersToolbar } from "./users-toolbar"

describe("UsersToolbar search debounce (Plan 14-18 UAT Test 12)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("Test 1 — typing 3 chars in search fires onFilterChange ONCE after the debounce", () => {
    const onFilterChange = vi.fn()
    render(
      <UsersToolbar
        filter={{ q: "" }}
        onFilterChange={onFilterChange}
        onOpenAddUser={() => {}}
        onOpenBulkInvite={() => {}}
      />,
    )

    // Type 3 characters in the search input one at a time.
    const searchInput = screen.getByPlaceholderText(/ara/i)
    fireEvent.change(searchInput, { target: { value: "j" } })
    fireEvent.change(searchInput, { target: { value: "ja" } })
    fireEvent.change(searchInput, { target: { value: "jan" } })

    // BEFORE the debounce window: onFilterChange should not have fired
    // for q changes — it might have fired for non-q updates but here
    // there are none.
    expect(onFilterChange).not.toHaveBeenCalled()

    // Advance past the debounce window (250ms is the configured value).
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // After the debounce: a SINGLE onFilterChange invocation with the
    // FINAL q value ("jan").
    expect(onFilterChange).toHaveBeenCalledTimes(1)
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ q: "jan" }),
    )
  })

  it("Test 2 — role filter (SegmentedControl) is NOT debounced — fires immediately", () => {
    const onFilterChange = vi.fn()
    render(
      <UsersToolbar
        filter={{ q: "" }}
        onFilterChange={onFilterChange}
        onOpenAddUser={() => {}}
        onOpenBulkInvite={() => {}}
      />,
    )

    // Click the "Admin" segment — this is a role filter change, not
    // a search-input change, so it must not be debounced.
    const adminSegment = screen.getByText("Admin")
    fireEvent.click(adminSegment)

    // Should have fired immediately (no fake-timer advance needed).
    expect(onFilterChange).toHaveBeenCalledTimes(1)
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ role: "Admin" }),
    )
  })
})
