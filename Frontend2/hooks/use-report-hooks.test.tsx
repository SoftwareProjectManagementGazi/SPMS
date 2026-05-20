// Reports migration v2 Wave 2 — 4 report-hook integration tests.
//
// Shared test file because the 4 hooks (use-summary, use-burndown,
// use-team-load, use-phase-progress) are thin TanStack wrappers around
// reportService. The duplication tax of 4 separate test files would
// outweigh the per-file isolation benefit; each hook gets its own
// describe block here so failures point at the right hook.
//
// What's tested (and what's NOT):
//   ✓ The capability-AND-projectId gate prevents fetches when either is
//     missing — this is the bug-prone surface (regression risk if
//     someone simplifies the `enabled` expression).
//   ✓ Cache-key shape so two consumers with the same args share the fetch.
//   ✓ Cache re-keys when projectId changes (the URL-state migration in
//     Wave 1b means projectId flips per navigation).
//   ✗ URL / mapping / DTO transforms — covered by services/report-service.test.ts.
//   ✗ TanStack internals (loading flags etc.) — covered by TanStack itself.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useSummary } from "./use-summary"
import { useBurndown } from "./use-burndown"
import { useTeamLoad } from "./use-team-load"
import { usePhaseProgress } from "./use-phase-progress"

vi.mock("@/services/report-service", () => ({
  reportService: {
    getSummary: vi.fn(),
    getBurndown: vi.fn(),
    getPerformance: vi.fn(),
    getPhaseProgress: vi.fn(),
  },
}))
import { reportService } from "@/services/report-service"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
  return { qc, Wrapper }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// useSummary
// ---------------------------------------------------------------------------

describe("useSummary", () => {
  it("does not fire when projectId is null", async () => {
    ;(reportService.getSummary as any).mockResolvedValue({
      activeTasks: 0, completedTasks: 0, totalTasks: 0, completionRate: 0,
      velocityDelta: null, completedDeltaPct: null,
      cycleTimeAvgDays: null, cycleTimeDeltaDays: null,
      blockersCount: null, blockersDelta: null,
    })
    const { Wrapper } = makeWrapper()
    function Probe() {
      useSummary({ projectId: null, dateFrom: null, dateTo: null })
      return null
    }
    render(<Probe />, { wrapper: Wrapper })
    await new Promise((r) => setTimeout(r, 20))
    expect(reportService.getSummary).not.toHaveBeenCalled()
  })

  it("does not fire when caller passes enabled=false (capability gate off)", async () => {
    const { Wrapper } = makeWrapper()
    function Probe() {
      useSummary({ projectId: 42, dateFrom: null, dateTo: null }, false)
      return null
    }
    render(<Probe />, { wrapper: Wrapper })
    await new Promise((r) => setTimeout(r, 20))
    expect(reportService.getSummary).not.toHaveBeenCalled()
  })

  it("fires once and surfaces data when projectId + enabled both true", async () => {
    const payload = {
      activeTasks: 5, completedTasks: 10, totalTasks: 15, completionRate: 66.7,
      velocityDelta: 6, completedDeltaPct: 18,
      cycleTimeAvgDays: 3.2, cycleTimeDeltaDays: -0.4,
      blockersCount: 3, blockersDelta: -2,
    }
    ;(reportService.getSummary as any).mockResolvedValue(payload)
    const { qc, Wrapper } = makeWrapper()
    function Probe() {
      useSummary({ projectId: 42, dateFrom: "2026-04-20", dateTo: "2026-05-20" })
      return null
    }
    render(<Probe />, { wrapper: Wrapper })
    await waitFor(() =>
      expect(reportService.getSummary).toHaveBeenCalledTimes(1),
    )
    // Cache key shape carries the entire filters object so date-range
    // changes correctly invalidate.
    expect(
      qc.getQueryData([
        "report", "summary",
        { projectId: 42, dateFrom: "2026-04-20", dateTo: "2026-05-20" },
      ]),
    ).toEqual(payload)
  })
})

// ---------------------------------------------------------------------------
// useBurndown
// ---------------------------------------------------------------------------

describe("useBurndown", () => {
  it("re-keys when projectId changes so caches don't collide", async () => {
    ;(reportService.getBurndown as any).mockImplementation(async (pid: number) => ({
      sprintName: `S-${pid}`, sprintId: pid, series: [],
    }))
    const { qc, Wrapper } = makeWrapper()
    function Probe({ pid }: { pid: number }) {
      useBurndown(pid)
      return null
    }
    const { rerender } = render(<Probe pid={1} />, { wrapper: Wrapper })
    await waitFor(() =>
      expect(qc.getQueryData(["report", "burndown", 1, null])).toBeDefined(),
    )
    rerender(<Probe pid={2} />)
    await waitFor(() =>
      expect(qc.getQueryData(["report", "burndown", 2, null])).toBeDefined(),
    )
    // Both cache slots populated — distinct projects don't share a cache key.
    expect((qc.getQueryData(["report", "burndown", 1, null]) as any).sprintName).toBe("S-1")
    expect((qc.getQueryData(["report", "burndown", 2, null]) as any).sprintName).toBe("S-2")
  })

  it("includes sprintId in the cache key so re-selecting a different sprint refetches", async () => {
    ;(reportService.getBurndown as any).mockResolvedValue({
      sprintName: "Sprint 23", sprintId: 23, series: [],
    })
    const { qc, Wrapper } = makeWrapper()
    function Probe({ sid }: { sid?: number }) {
      useBurndown(42, sid)
      return null
    }
    const { rerender } = render(<Probe />, { wrapper: Wrapper })
    await waitFor(() =>
      expect(qc.getQueryData(["report", "burndown", 42, null])).toBeDefined(),
    )
    rerender(<Probe sid={23} />)
    await waitFor(() =>
      expect(qc.getQueryData(["report", "burndown", 42, 23])).toBeDefined(),
    )
    // 2 distinct queries → 2 fetches.
    expect(reportService.getBurndown).toHaveBeenCalledTimes(2)
  })
})

// ---------------------------------------------------------------------------
// useTeamLoad
// ---------------------------------------------------------------------------

describe("useTeamLoad", () => {
  it("is gated on both enabled flag and projectId", async () => {
    const { Wrapper } = makeWrapper()
    function ProbeNoProject() {
      useTeamLoad({ projectId: null, dateFrom: null, dateTo: null }, true)
      return null
    }
    function ProbeDisabled() {
      useTeamLoad({ projectId: 42, dateFrom: null, dateTo: null }, false)
      return null
    }
    render(
      <>
        <ProbeNoProject />
        <ProbeDisabled />
      </>,
      { wrapper: Wrapper },
    )
    await new Promise((r) => setTimeout(r, 20))
    expect(reportService.getPerformance).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// usePhaseProgress
// ---------------------------------------------------------------------------

describe("usePhaseProgress", () => {
  it("fires once for a valid projectId and shares the cache across consumers", async () => {
    ;(reportService.getPhaseProgress as any).mockResolvedValue({ phases: [] })
    const { Wrapper } = makeWrapper()
    function Probe() {
      usePhaseProgress(42)
      return null
    }
    render(
      <>
        <Probe />
        <Probe />
      </>,
      { wrapper: Wrapper },
    )
    await waitFor(() =>
      expect(reportService.getPhaseProgress).toHaveBeenCalledTimes(1),
    )
  })

  it("does not fire when capability gate hands enabled=false", async () => {
    const { Wrapper } = makeWrapper()
    function Probe() {
      usePhaseProgress(42, false)
      return null
    }
    render(<Probe />, { wrapper: Wrapper })
    await new Promise((r) => setTimeout(r, 20))
    expect(reportService.getPhaseProgress).not.toHaveBeenCalled()
  })
})
