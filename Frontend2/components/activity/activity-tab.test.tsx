// Phase 13 Plan 13-04 Task 2 — RTL coverage for ActivityTab.
//
// Tests 1–8 from the plan's <behavior> block:
//   1. projectId variant calls useProjectActivity (renders an event row)
//   2. userId variant calls useUserActivity (project hook NOT enabled)
//   3. filter persistence — read on mount from spms.activity.filter.{id}
//   4. filter persistence — write on chip change
//   5. "Daha fazla yükle" increments showCount by 30 (visible count grows)
//   6. filter-empty state renders when active filter yields zero matches
//   7. zero-total empty state when no events at all
//   8. DataState wraps loading → ActivityTimelineSkeleton (aria-busy)

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// Hooks mocks ----------------------------------------------------------------
const projectActivitySpy = vi.fn()
const userActivitySpy = vi.fn()

vi.mock("@/hooks/use-project-activity", () => ({
  useProjectActivity: (...args: unknown[]) => projectActivitySpy(...args),
}))
vi.mock("@/hooks/use-user-activity", () => ({
  useUserActivity: (...args: unknown[]) => userActivitySpy(...args),
}))

// next/navigation router (ActivityRow uses useRouter)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Language fixed to TR for the verb / chip label assertions.
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// TaskModal — provide a stub openTaskModal so ActivityEmpty's CTA renders.
const openTaskModalSpy = vi.fn()
vi.mock("@/context/task-modal-context", () => ({
  useTaskModal: () => ({
    isOpen: false,
    defaults: null,
    openTaskModal: openTaskModalSpy,
    closeTaskModal: vi.fn(),
  }),
}))

import { ActivityTab } from "./activity-tab"
import type { ActivityItem } from "@/services/activity-service"

const isoNow = () => new Date().toISOString()

function makeTaskEvent(id: number, overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id,
    action: "created",
    entity_type: "task",
    user_id: 7,
    user_name: "Yusuf Bayrakcı",
    timestamp: isoNow(),
    entity_label: `MOBIL-${id}`,
    metadata: { task_key: `MOBIL-${id}` },
    ...overrides,
  }
}

function makeQueryResult(items: ActivityItem[], extra: Partial<{ isLoading: boolean; error: unknown }> = {}) {
  return {
    data: { items, total: items.length },
    isLoading: extra.isLoading ?? false,
    error: extra.error ?? null,
  }
}

beforeEach(() => {
  projectActivitySpy.mockReset()
  userActivitySpy.mockReset()
  openTaskModalSpy.mockReset()
  // Always default to an empty disabled-second-hook so userQuery doesn't blow up
  projectActivitySpy.mockReturnValue(makeQueryResult([]))
  userActivitySpy.mockReturnValue(makeQueryResult([]))
  // Wipe persisted filter for each test to keep them isolated
  if (typeof window !== "undefined") {
    window.localStorage.clear()
  }
})

describe("ActivityTab", () => {
  it("Test 1: projectId variant renders rows fetched from useProjectActivity", () => {
    projectActivitySpy.mockReturnValue(
      makeQueryResult([
        makeTaskEvent(1, { entity_label: "MOBIL-1" }),
        makeTaskEvent(2, { entity_label: "MOBIL-2" }),
      ]),
    )
    render(<ActivityTab projectId={42} variant="full" />)
    // Both rows show their entity_label refs
    expect(screen.getByText("MOBIL-1")).toBeInTheDocument()
    expect(screen.getByText("MOBIL-2")).toBeInTheDocument()
    // Spy got the projectId argument; user spy was called with undefined
    expect(projectActivitySpy).toHaveBeenCalled()
    const projArgs = projectActivitySpy.mock.calls[0]
    expect(projArgs[0]).toBe(42)
  })

  it("Test 2: userId variant routes through useUserActivity (project hook receives undefined)", () => {
    userActivitySpy.mockReturnValue(
      makeQueryResult([makeTaskEvent(99, { entity_label: "USR-99" })]),
    )
    render(<ActivityTab userId={7} variant="full" />)
    expect(screen.getByText("USR-99")).toBeInTheDocument()
    // Both hooks are called every render (Rules of Hooks); enabled flag inside
    // each hook decides whether the actual fetch fires. The useUserActivity
    // hook receives the user id; useProjectActivity receives undefined.
    expect(userActivitySpy).toHaveBeenCalled()
    expect(userActivitySpy.mock.calls[0][0]).toBe(7)
    expect(projectActivitySpy).toHaveBeenCalled()
    expect(projectActivitySpy.mock.calls[0][0]).toBeUndefined()
  })

  it("Test 3: filter persistence — read on mount from spms.activity.filter.{projectId}", async () => {
    window.localStorage.setItem(
      "spms.activity.filter.42",
      JSON.stringify({ type: "comment", userIdFilter: null, showCount: 30 }),
    )
    projectActivitySpy.mockReturnValue(
      makeQueryResult([
        makeTaskEvent(1),
        makeTaskEvent(2, {
          entity_type: "comment",
          action: "created",
          new_value: "hi there",
        }),
      ]),
    )
    render(<ActivityTab projectId={42} variant="full" />)
    // After useEffect mount-load runs, state flips from default ('all') to 'comment'.
    // Comment filter excludes MOBIL-1 (task_created); only the comment event remains.
    await waitFor(() => {
      expect(screen.queryByText("MOBIL-1")).toBeNull()
      expect(screen.getByText("hi there")).toBeInTheDocument()
    })
  })

  it("Test 4: filter persistence — write on chip change", async () => {
    projectActivitySpy.mockReturnValue(
      makeQueryResult([makeTaskEvent(1)]),
    )
    render(<ActivityTab projectId={42} variant="full" />)
    // Wait for mount-load effect
    await waitFor(() => {
      expect(window.localStorage.getItem("spms.activity.filter.42")).toBeTruthy()
    })
    // Click the "Yaşam Döngüsü" chip
    fireEvent.click(screen.getByRole("button", { name: "Yaşam Döngüsü" }))
    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem("spms.activity.filter.42") || "{}",
      )
      expect(stored.type).toBe("lifecycle")
    })
  })

  it("Test 5: 'Daha fazla yükle' increments showCount by 30", async () => {
    // 60 events → first paint shows 30 → click button → shows 60.
    const events = Array.from({ length: 60 }, (_, i) =>
      makeTaskEvent(i + 1, { entity_label: `MOBIL-${i + 1}` }),
    )
    projectActivitySpy.mockReturnValue(makeQueryResult(events))
    render(<ActivityTab projectId={42} variant="full" />)
    // 30 visible at first
    expect(screen.queryAllByText(/MOBIL-/).length).toBe(30)
    // Caption shows total filtered count = 60
    expect(screen.getByText(/60 olay/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Daha fazla yükle" }))
    await waitFor(() => {
      expect(screen.queryAllByText(/MOBIL-/).length).toBe(60)
    })
  })

  it("Test 6: filter-empty state — active filter, zero matches", async () => {
    // All events are task_created; user activates 'comment' filter
    projectActivitySpy.mockReturnValue(
      makeQueryResult([makeTaskEvent(1), makeTaskEvent(2)]),
    )
    render(<ActivityTab projectId={42} variant="full" />)
    fireEvent.click(screen.getByRole("button", { name: "Yorum" }))
    await waitFor(() => {
      expect(
        screen.getByText("Bu filtreyle eşleşen olay yok."),
      ).toBeInTheDocument()
    })
  })

  it("Test 7: zero-total empty — no events + default filter", async () => {
    projectActivitySpy.mockReturnValue(makeQueryResult([]))
    render(<ActivityTab projectId={42} variant="full" />)
    expect(screen.getByText("Henüz aktivite yok.")).toBeInTheDocument()
    // CTA renders since openTaskModal is provided
    expect(
      screen.getByRole("button", { name: "Bir görev oluştur" }),
    ).toBeInTheDocument()
  })

  it("Test 8: DataState wraps loading — ActivityTimelineSkeleton (aria-busy)", () => {
    projectActivitySpy.mockReturnValue(
      makeQueryResult([], { isLoading: true }),
    )
    const { container } = render(<ActivityTab projectId={42} variant="full" />)
    // The skeleton wrapper has aria-busy="true"
    const busy = container.querySelector('[aria-busy="true"]')
    expect(busy).not.toBeNull()
  })
})
