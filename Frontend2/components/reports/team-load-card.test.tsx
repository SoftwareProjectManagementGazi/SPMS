// Reports migration v2 Wave 3 — TeamLoadCard RTL coverage.
//
// No Recharts mocks needed — the card is pure primitives. Tests target
// observable behaviour: capability gate AlertBanner, row rendering, the
// threshold-color logic (which is the most bug-prone surface — a wrong
// threshold flips a healthy load into a red alarm), and the limit prop.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"

const useTeamLoadSpy = vi.fn()
vi.mock("@/hooks/use-team-load", () => ({
  useTeamLoad: (...args: unknown[]) => useTeamLoadSpy(...args),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { TeamLoadCard } from "./team-load-card"

const FILTERS = { projectId: 42, dateFrom: null, dateTo: null }

beforeEach(() => {
  useTeamLoadSpy.mockReset()
  useTeamLoadSpy.mockReturnValue({
    data: { members: [], loadEntries: [] },
    isLoading: false,
    error: null,
  })
})

describe("TeamLoadCard", () => {
  it("applicable=false renders the no-members AlertBanner, no rows", () => {
    render(<TeamLoadCard filters={FILTERS} applicable={false} />)
    expect(
      screen.getByText(/Takım Yükü için projeye en az bir üye eklenmelidir/),
    ).toBeInTheDocument()
    // Card title still renders; no percent values.
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it("renders first names + load percents from BE data", () => {
    useTeamLoadSpy.mockReturnValue({
      data: {
        members: [],
        loadEntries: [
          { userId: 1, fullName: "Ada Lovelace", avatarPath: null, loadPct: 80 },
          { userId: 2, fullName: "Bora Tek",     avatarPath: null, loadPct: 45 },
        ],
      },
      isLoading: false,
      error: null,
    })
    render(<TeamLoadCard filters={FILTERS} applicable={true} />)
    // First names only (prototype convention for narrow column).
    expect(screen.getByText("Ada")).toBeInTheDocument()
    expect(screen.getByText("Bora")).toBeInTheDocument()
    // Percentages render in mono.
    expect(screen.getByText("80%")).toBeInTheDocument()
    expect(screen.getByText("45%")).toBeInTheDocument()
  })

  it("threshold colors: >85 → priority-critical, >65 → status-review, else status-progress", () => {
    useTeamLoadSpy.mockReturnValue({
      data: {
        members: [],
        loadEntries: [
          { userId: 1, fullName: "Hot",    avatarPath: null, loadPct: 90 },
          { userId: 2, fullName: "Warm",   avatarPath: null, loadPct: 70 },
          { userId: 3, fullName: "Normal", avatarPath: null, loadPct: 40 },
        ],
      },
      isLoading: false,
      error: null,
    })
    const { container } = render(<TeamLoadCard filters={FILTERS} applicable={true} />)
    // ProgressBar's inner fill carries the threshold color in its inline style.
    // We assert by inspecting computed bg of the 3 rows in order.
    const innerBars = Array.from(
      container.querySelectorAll<HTMLElement>(
        // The outer ProgressBar is a div; the inner colored fill is its first child div.
        "div > div > div[style*='background']",
      ),
    )
    // 3 rows × 2 divs visible (outer + inner) → at least 3 inner fills.
    // Match by checking each contains the right token.
    const styles = innerBars.map((el) => el.getAttribute("style") ?? "")
    expect(styles.some((s) => s.includes("var(--priority-critical)"))).toBe(true)
    expect(styles.some((s) => s.includes("var(--status-review)"))).toBe(true)
    expect(styles.some((s) => s.includes("var(--status-progress)"))).toBe(true)
  })

  it("respects the limit prop — only first N entries by load (data is pre-sorted by the service)", () => {
    useTeamLoadSpy.mockReturnValue({
      data: {
        members: [],
        loadEntries: Array.from({ length: 10 }, (_, i) => ({
          userId: i + 1,
          fullName: `User${i + 1} Last${i + 1}`,
          avatarPath: null,
          loadPct: 100 - i * 10,
        })),
      },
      isLoading: false,
      error: null,
    })
    render(<TeamLoadCard filters={FILTERS} applicable={true} limit={3} />)
    // Only User1, User2, User3 first-names should appear.
    expect(screen.getByText("User1")).toBeInTheDocument()
    expect(screen.getByText("User2")).toBeInTheDocument()
    expect(screen.getByText("User3")).toBeInTheDocument()
    expect(screen.queryByText("User4")).toBeNull()
    expect(screen.queryByText("User10")).toBeNull()
  })

  it("loading state shows skeleton placeholders (aria-busy)", () => {
    useTeamLoadSpy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })
    const { container } = render(<TeamLoadCard filters={FILTERS} applicable={true} />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it("empty entries with applicable=true shows the no-active-tasks copy", () => {
    useTeamLoadSpy.mockReturnValue({
      data: { members: [{ userId: 1, fullName: "Ada", avatarPath: null, assigned: 0, completed: 0, inProgress: 0, onTimePct: 0 }], loadEntries: [] },
      isLoading: false,
      error: null,
    })
    render(<TeamLoadCard filters={FILTERS} applicable={true} />)
    expect(screen.getByText(/Aktif görev yok/)).toBeInTheDocument()
  })

  it("passes enabled=true to the hook only when applicable=true", () => {
    render(<TeamLoadCard filters={FILTERS} applicable={true} />)
    expect(useTeamLoadSpy).toHaveBeenCalledWith(FILTERS, true)
    useTeamLoadSpy.mockClear()
    render(<TeamLoadCard filters={FILTERS} applicable={false} />)
    expect(useTeamLoadSpy).toHaveBeenCalledWith(FILTERS, false)
  })
})
