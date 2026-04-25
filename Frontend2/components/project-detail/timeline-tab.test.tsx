import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, waitFor } from "@testing-library/react"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"

import { TimelineTab } from "./timeline-tab"

const pushSpy = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
}))

// vi.mock is hoisted above module initialization, so we can't reference a
// top-level const inside the factory. We register the mock first with an
// inline default, then swap the implementation per test via getMock().
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.startsWith("/tasks/project/")) {
        return Promise.resolve({
          data: [
            {
              id: 101,
              key: "MOBIL-1",
              title: "Auth akışı",
              description: "",
              status: "todo",
              priority: "high",
              assignee_id: 1,
              reporter_id: 1,
              parent_task_id: null,
              project_id: 1,
              cycle_id: null,
              phase_id: null,
              points: 5,
              start: "2026-04-10",
              due: "2026-04-20",
              labels: [],
              watcher_count: 0,
              type: "task",
              created_at: "2026-01-01T00:00:00Z",
            },
            {
              id: 102,
              key: "MOBIL-2",
              title: "Login UI",
              description: "",
              status: "progress",
              priority: "medium",
              assignee_id: 1,
              reporter_id: 1,
              parent_task_id: null,
              project_id: 1,
              cycle_id: null,
              phase_id: null,
              points: 3,
              start: "2026-04-15",
              due: "2026-04-25",
              labels: [],
              watcher_count: 0,
              type: "task",
              created_at: "2026-01-01T00:00:00Z",
            },
            // unscheduled — missing start, should be filtered out
            {
              id: 103,
              key: "MOBIL-3",
              title: "Unscheduled",
              description: "",
              status: "todo",
              priority: "low",
              assignee_id: null,
              reporter_id: 1,
              parent_task_id: null,
              project_id: 1,
              cycle_id: null,
              phase_id: null,
              points: null,
              start: null,
              due: "2026-04-30",
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

// Grab a typed handle to the mocked get function for per-test overrides.
import { apiClient } from "@/lib/api-client"
const apiGet = apiClient.get as unknown as ReturnType<typeof vi.fn>

describe("TimelineTab", () => {
  beforeEach(() => {
    pushSpy.mockClear()
  })

  it("renders toolbar with Day / Week / Month buttons (Turkish)", async () => {
    const { getByText } = renderWithProviders(
      <TimelineTab project={mockProjects[0]} />
    )
    await waitFor(() => getByText("Gün"))
    expect(getByText("Gün")).toBeInTheDocument()
    expect(getByText("Hafta")).toBeInTheDocument()
    expect(getByText("Ay")).toBeInTheDocument()
  })

  it("renders SVG with one <rect> bar per scheduled task (tasks without both start+due filtered out)", async () => {
    const { container, findByText } = renderWithProviders(
      <TimelineTab project={mockProjects[0]} />
    )
    // findByText waits for the element and throws if it never appears.
    await findByText(/MOBIL-1/)
    const svg = container.querySelector("svg")
    expect(svg).not.toBeNull()
    const textEls = svg!.querySelectorAll("text")
    const titleTexts = Array.from(textEls).map((t) => t.textContent ?? "")
    const mobil1Bar = titleTexts.find((t) => t.includes("MOBIL-1"))
    const mobil2Bar = titleTexts.find((t) => t.includes("MOBIL-2"))
    const mobil3Bar = titleTexts.find((t) => t.includes("MOBIL-3"))
    expect(mobil1Bar).toBeTruthy()
    expect(mobil2Bar).toBeTruthy()
    // MOBIL-3 has no start date — it must NOT appear in the chart.
    expect(mobil3Bar).toBeFalsy()
  })

  it("clicking Day toggles active view from default Week to Day", async () => {
    const { getByText, findByText, container } = renderWithProviders(
      <TimelineTab project={mockProjects[0]} />
    )
    // Wait for a scheduled task label to appear — ensures SVG is mounted.
    await findByText(/MOBIL-1/)
    const svgBefore = container.querySelector("svg") as SVGSVGElement
    expect(svgBefore).not.toBeNull()
    const widthBefore = Number(svgBefore.getAttribute("width"))
    // Click Day — day_width becomes 48 so width should grow
    fireEvent.click(getByText("Gün"))
    const svgAfter = container.querySelector("svg") as SVGSVGElement
    const widthAfter = Number(svgAfter.getAttribute("width"))
    expect(widthAfter).toBeGreaterThan(widthBefore)
  })

  it("renders empty-state message when there are no scheduled tasks", async () => {
    // Override the mock to return only unscheduled tasks
    apiGet.mockImplementationOnce((url: string) => {
      if (url.startsWith("/tasks/project/")) {
        return Promise.resolve({
          data: [
            {
              id: 201,
              key: "X-1",
              title: "No dates",
              description: "",
              status: "todo",
              priority: "low",
              assignee_id: null,
              reporter_id: 1,
              parent_task_id: null,
              project_id: 1,
              cycle_id: null,
              phase_id: null,
              points: null,
              start: null,
              due: null,
              labels: [],
              watcher_count: 0,
              type: "task",
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
        })
      }
      return Promise.resolve({ data: [] })
    })
    const { getByText } = renderWithProviders(
      <TimelineTab project={mockProjects[0]} />
    )
    await waitFor(() => getByText(/başlangıç ve bitiş tarihi/))
    expect(getByText(/başlangıç ve bitiş tarihi/)).toBeInTheDocument()
  })

  it("renders a today line when today falls inside the scheduled range", async () => {
    // Patch Date.now so today falls inside the 2026-04-10 → 2026-04-25 range
    const spy = vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-04-15T12:00:00Z").getTime()
    )
    try {
      const { container, findByText } = renderWithProviders(
        <TimelineTab project={mockProjects[0]} />
      )
      await findByText(/MOBIL-1/)
      const svg = container.querySelector("svg")
      expect(svg).not.toBeNull()
      // Today line uses strokeDasharray="4 4"
      const dashedLine = svg!.querySelector('line[stroke-dasharray="4 4"]')
      expect(dashedLine).not.toBeNull()
    } finally {
      spy.mockRestore()
    }
  })

  // ============================================================================
  // Phase 12 Plan 12-05 — milestone flag-line integration (D-51)
  // ============================================================================

  it("Test M1: milestone flag-line renders at correct x-position", async () => {
    const milestones = [
      {
        id: 1,
        projectId: 1,
        name: "Alpha Launch",
        targetDate: "2026-04-15",
        status: "PLANNED",
        linkedPhaseIds: ["planning"],
        createdAt: "2026-04-01T00:00:00Z",
        updatedAt: null,
      },
    ]
    const { container, findByText } = renderWithProviders(
      <TimelineTab project={mockProjects[0]} milestones={milestones} />
    )
    await findByText(/MOBIL-1/)
    const svg = container.querySelector("svg")
    expect(svg).not.toBeNull()
    const layer = svg!.querySelector('g[aria-label="milestones-layer"]')
    expect(layer).not.toBeNull()
    // The flag uses a dashed stroke pattern of "6 3"
    const flagLine = layer!.querySelector('line[stroke-dasharray="6 3"]')
    expect(flagLine).not.toBeNull()
    // Compute expected x using the same formula timeline-tab uses internally:
    //   ((target - min) / MS_PER_DAY) * DAY_WIDTH[view]
    // Default view is week → DAY_WIDTH=24. The min equals the earliest task
    // start (2026-04-10). 2026-04-15 → 5 days into range → x = 5 * 24 = 120.
    const x1 = Number(flagLine!.getAttribute("x1"))
    expect(x1).toBeCloseTo(120, 0)
  })

  it("Test M2: label chip renders with name + short date format", async () => {
    const milestones = [
      {
        id: 1,
        projectId: 1,
        name: "Alpha Launch",
        targetDate: "2026-04-15",
        status: "PLANNED",
        linkedPhaseIds: ["planning"],
        createdAt: "2026-04-01T00:00:00Z",
        updatedAt: null,
      },
    ]
    const { container, findByText } = renderWithProviders(
      <TimelineTab project={mockProjects[0]} milestones={milestones} />
    )
    await findByText(/MOBIL-1/)
    const svg = container.querySelector("svg")
    expect(svg).not.toBeNull()
    const texts = Array.from(svg!.querySelectorAll("text")).map(
      (t) => t.textContent ?? ""
    )
    // Turkish locale formatter (default mockProjects test env) -> "15 Nis"
    // English would be "Apr 15". Either is acceptable — assert the milestone
    // name + " · " separator appears.
    const labelText = texts.find((t) => t.includes("Alpha Launch"))
    expect(labelText).toBeDefined()
    expect(labelText).toMatch(/Alpha Launch.*·/)
  })

  it("Test M3: clicking flag opens popover with milestone details", async () => {
    const milestones = [
      {
        id: 1,
        projectId: 1,
        name: "Alpha Launch",
        targetDate: "2026-04-15",
        status: "PLANNED",
        linkedPhaseIds: ["n1"], // matches mockProjects[0].processConfig.workflow.nodes[0]
        createdAt: "2026-04-01T00:00:00Z",
        updatedAt: null,
      },
    ]
    const { container, findByText, getByText } = renderWithProviders(
      <TimelineTab project={mockProjects[0]} milestones={milestones} />
    )
    await findByText(/MOBIL-1/)
    const svg = container.querySelector("svg")
    expect(svg).not.toBeNull()
    const flagGroup = svg!.querySelector(
      'g[aria-label="milestones-layer"] > g'
    )
    expect(flagGroup).not.toBeNull()
    fireEvent.click(flagGroup!)
    // Popover renders the linked phase name (Analiz from mockProjects[0])
    await waitFor(() => {
      expect(getByText("Analiz")).toBeInTheDocument()
    })
  })

  it("Test M4: 3 milestones produce 3 distinct flag lines", async () => {
    const milestones = [
      {
        id: 1,
        projectId: 1,
        name: "MS A",
        targetDate: "2026-04-12",
        status: "PLANNED",
        linkedPhaseIds: [],
        createdAt: "2026-04-01T00:00:00Z",
        updatedAt: null,
      },
      {
        id: 2,
        projectId: 1,
        name: "MS B",
        targetDate: "2026-04-15",
        status: "PLANNED",
        linkedPhaseIds: [],
        createdAt: "2026-04-01T00:00:00Z",
        updatedAt: null,
      },
      {
        id: 3,
        projectId: 1,
        name: "MS C",
        targetDate: "2026-04-20",
        status: "PLANNED",
        linkedPhaseIds: [],
        createdAt: "2026-04-01T00:00:00Z",
        updatedAt: null,
      },
    ]
    const { container, findByText } = renderWithProviders(
      <TimelineTab project={mockProjects[0]} milestones={milestones} />
    )
    await findByText(/MOBIL-1/)
    const svg = container.querySelector("svg")
    const layer = svg!.querySelector('g[aria-label="milestones-layer"]')
    expect(layer).not.toBeNull()
    const flagLines = layer!.querySelectorAll('line[stroke-dasharray="6 3"]')
    expect(flagLines.length).toBe(3)
  })

  it("Test M5: no milestones-layer rendered when milestones empty/undefined", async () => {
    const { container, findByText } = renderWithProviders(
      <TimelineTab project={mockProjects[0]} />
    )
    await findByText(/MOBIL-1/)
    const svg = container.querySelector("svg")
    const layer = svg!.querySelector('g[aria-label="milestones-layer"]')
    expect(layer).toBeNull()
  })
})
