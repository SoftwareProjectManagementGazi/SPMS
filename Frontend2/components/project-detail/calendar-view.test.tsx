import * as React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, waitFor } from "@testing-library/react"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"

import { CalendarTab } from "./calendar-view"

const pushSpy = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
}))

// Mock apiClient so useTasks returns fixture data with `due` dates we can
// place in the current month.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.startsWith("/tasks/project/")) {
        // Use a stable test month (April 2026) — tests freeze Date below.
        return Promise.resolve({
          data: [
            // Five tasks on 2026-04-15 so we exceed the 3-visible limit.
            ...[101, 102, 103, 104, 105].map((id) => ({
              id,
              key: `X-${id}`,
              title: `Task ${id}`,
              description: "",
              status: "todo",
              priority: "high",
              assignee_id: null,
              reporter_id: 1,
              parent_task_id: null,
              project_id: 1,
              cycle_id: null,
              phase_id: null,
              points: null,
              start: null,
              due: "2026-04-15",
              labels: [],
              watcher_count: 0,
              type: "task",
              created_at: "2026-01-01T00:00:00Z",
            })),
            // One task on 2026-04-20 (navigation target)
            {
              id: 200,
              key: "NAV-1",
              title: "Nav target",
              description: "",
              status: "todo",
              priority: "medium",
              assignee_id: null,
              reporter_id: 1,
              parent_task_id: null,
              project_id: 1,
              cycle_id: null,
              phase_id: null,
              points: null,
              start: null,
              due: "2026-04-20",
              labels: [],
              watcher_count: 0,
              type: "task",
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
        })
      }
      return Promise.resolve({ data: [] })
    }),
  },
}))

// Freeze Date.now so "today" is a stable April 2026 day. We have to stub
// Date's constructor too so `new Date()` inside the component also returns
// the frozen date.
const FROZEN_NOW = new Date("2026-04-15T10:00:00Z").getTime()

describe("CalendarTab", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dateNowSpy: any

  beforeEach(() => {
    pushSpy.mockClear()
    try {
      window.localStorage.clear()
    } catch {
      /* ignore */
    }
    dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(FROZEN_NOW)
  })

  afterEach(() => {
    dateNowSpy.mockRestore()
  })

  it("renders 7-column weekday header with Turkish labels", async () => {
    const { getByText } = renderWithProviders(
      <CalendarTab project={mockProjects[0]} />
    )
    expect(getByText("Pzt")).toBeInTheDocument()
    expect(getByText("Sal")).toBeInTheDocument()
    expect(getByText("Çar")).toBeInTheDocument()
    expect(getByText("Per")).toBeInTheDocument()
    expect(getByText("Cum")).toBeInTheDocument()
    expect(getByText("Cmt")).toBeInTheDocument()
    expect(getByText("Paz")).toBeInTheDocument()
  })

  it("shows the '+N more' chip when a day has more than 3 tasks", async () => {
    const { findByText } = renderWithProviders(
      <CalendarTab project={mockProjects[0]} />
    )
    // 5 tasks on April 15 → 3 visible + "+2 diğer" overflow chip
    const overflow = await findByText(/\+2/)
    expect(overflow).toBeInTheDocument()
  })

  it("clicking '+N more' opens the day popover listing all tasks for that day", async () => {
    const { findByText, container } = renderWithProviders(
      <CalendarTab project={mockProjects[0]} />
    )
    const overflow = await findByText(/\+2/)
    fireEvent.click(overflow)
    // Popover should contain Task 101 through Task 105 titles
    await waitFor(() => {
      const t105 = container.querySelector(
        '[data-day-popover-task="105"]'
      )
      if (!t105) throw new Error("popover not ready")
    })
    const popover = container.querySelector("[data-day-popover]")
    expect(popover).not.toBeNull()
  })

  it("Ctrl+wheel reduces/grows cell height within [60, 160] and persists the value", async () => {
    const { findByText, container } = renderWithProviders(
      <CalendarTab project={mockProjects[0]} />
    )
    await findByText(/\+2/) // ensures grid is mounted
    const grid = container.querySelector(
      "[data-calendar-grid]"
    ) as HTMLElement
    expect(grid).not.toBeNull()
    // Initial default cell height is 100
    const firstCell = grid.firstElementChild as HTMLElement
    const initialHeight = parseInt(firstCell.style.minHeight, 10)
    expect(initialHeight).toBe(100)

    // deltaY>0 → height shrinks by (delta * 2); we use delta=10 → -20px → 80
    fireEvent.wheel(grid, { deltaY: 10, ctrlKey: true })
    const shrunkHeight = parseInt(firstCell.style.minHeight, 10)
    expect(shrunkHeight).toBeLessThan(initialHeight)
    expect(shrunkHeight).toBeGreaterThanOrEqual(60)

    // wait for debounced localStorage persistence (>300ms)
    await new Promise((resolve) => setTimeout(resolve, 350))
    const stored = window.localStorage.getItem(
      `spms.calendar.zoom.${mockProjects[0].id}`
    )
    expect(stored).not.toBeNull()
    expect(Number(stored)).toBe(shrunkHeight)
  })

  it("clicking a task chip navigates to /projects/{id}/tasks/{taskId}", async () => {
    const { findByText } = renderWithProviders(
      <CalendarTab project={mockProjects[0]} />
    )
    const chip = await findByText(/NAV-1/)
    fireEvent.click(chip)
    expect(pushSpy).toHaveBeenCalledWith(
      `/projects/${mockProjects[0].id}/tasks/200`
    )
  })

  it("Today button resets navigation to the current month", async () => {
    const { getByText, getByLabelText } = renderWithProviders(
      <CalendarTab project={mockProjects[0]} />
    )
    // Navigate away and back
    fireEvent.click(getByLabelText("Next"))
    fireEvent.click(getByText("Bugün"))
    // After returning, the April heading is visible (TR: "Nisan 2026")
    expect(getByText(/Nisan/)).toBeInTheDocument()
  })
})
