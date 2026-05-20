// Reports migration v2 Wave 2 — report-service tests.
//
// Real apiClient mock + observable behaviour. Each test asserts the exact
// endpoint URL, query params shape, and the snake→camel mapping. Tests
// would fail if we silently dropped fields or changed the URL.

import { describe, it, expect, vi, beforeEach } from "vitest"
import { reportService } from "./report-service"

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn() },
}))
import { apiClient } from "@/lib/api-client"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("reportService.getSummary", () => {
  it("hits /reports/summary with project_id + date params and maps snake→camel", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: {
        active_tasks: 10,
        completed_tasks: 24,
        total_tasks: 34,
        completion_rate: 70.5,
        velocity_delta: 6,
        completed_delta_pct: 18,
        cycle_time_avg_days: 3.2,
        cycle_time_delta_days: -0.4,
        blockers_count: 3,
        blockers_delta: -2,
      },
    })

    const result = await reportService.getSummary({
      projectId: 42,
      dateFrom: "2026-04-20",
      dateTo: "2026-05-20",
    })

    expect(apiClient.get).toHaveBeenCalledWith(
      "/reports/summary",
      { params: { project_id: "42", date_from: "2026-04-20", date_to: "2026-05-20" } },
    )
    expect(result).toEqual({
      activeTasks: 10,
      completedTasks: 24,
      totalTasks: 34,
      completionRate: 70.5,
      velocityDelta: 6,
      completedDeltaPct: 18,
      cycleTimeAvgDays: 3.2,
      cycleTimeDeltaDays: -0.4,
      blockersCount: 3,
      blockersDelta: -2,
    })
  })

  it("omits date params when null and surfaces missing deltas as null", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: {
        active_tasks: 0,
        completed_tasks: 0,
        total_tasks: 0,
        completion_rate: 0,
        // BE omits delta fields when prev period has no data
      },
    })

    const result = await reportService.getSummary({
      projectId: 1,
      dateFrom: null,
      dateTo: null,
    })

    expect(apiClient.get).toHaveBeenCalledWith(
      "/reports/summary",
      { params: { project_id: "1" } },
    )
    expect(result.velocityDelta).toBeNull()
    expect(result.cycleTimeAvgDays).toBeNull()
    expect(result.blockersCount).toBeNull()
  })
})

describe("reportService.getBurndown", () => {
  it("passes sprint_id when provided", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: {
        sprint_name: "Sprint 23",
        sprint_id: 23,
        series: [
          { date: "2026-05-01", remaining: 30, total: 30 },
          { date: "2026-05-02", remaining: 28, total: 30 },
        ],
      },
    })

    const result = await reportService.getBurndown(42, 23)

    expect(apiClient.get).toHaveBeenCalledWith(
      "/reports/burndown",
      { params: { project_id: "42", sprint_id: "23" } },
    )
    expect(result.sprintName).toBe("Sprint 23")
    expect(result.series).toHaveLength(2)
    expect(result.series[1].remaining).toBe(28)
  })

  it("omits sprint_id param when caller passes undefined", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: { sprint_name: "", sprint_id: 0, series: [] },
    })

    await reportService.getBurndown(42)

    expect(apiClient.get).toHaveBeenCalledWith(
      "/reports/burndown",
      { params: { project_id: "42" } },
    )
  })
})

describe("reportService.getPerformance", () => {
  it("derives loadEntries with peer-relative load scaling", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: {
        members: [
          { user_id: 1, full_name: "Ada",   avatar_path: null, assigned: 10, completed: 8, in_progress: 2, on_time_pct: 100 },
          { user_id: 2, full_name: "Bora",  avatar_path: null, assigned: 12, completed: 4, in_progress: 8, on_time_pct: 50 },
          { user_id: 3, full_name: "Cem",   avatar_path: null, assigned: 5,  completed: 1, in_progress: 4, on_time_pct: 75 },
        ],
      },
    })

    const result = await reportService.getPerformance({
      projectId: 42, dateFrom: null, dateTo: null,
    })

    expect(result.members).toHaveLength(3)
    // Peer scaling: peak in_progress = 8 (Bora). Bora → 100%, Cem (4/8) → 50%, Ada (2/8) → 25%.
    const loadByName = Object.fromEntries(
      result.loadEntries.map((e) => [e.fullName, e.loadPct]),
    )
    expect(loadByName).toEqual({ Bora: 100, Cem: 50, Ada: 25 })
    // Sorted heaviest-first so the card's slice(0,6) picks the busiest members.
    expect(result.loadEntries.map((e) => e.fullName)).toEqual(["Bora", "Cem", "Ada"])
  })

  it("returns 0% loads when nobody has any in-progress work", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: {
        members: [
          { user_id: 1, full_name: "Ada", avatar_path: null, assigned: 0, completed: 0, in_progress: 0, on_time_pct: 0 },
        ],
      },
    })
    const result = await reportService.getPerformance({
      projectId: 42, dateFrom: null, dateTo: null,
    })
    expect(result.loadEntries[0].loadPct).toBe(0)
  })
})

describe("reportService.getPhaseProgress", () => {
  it("hits the v2 endpoint and snake→camel maps in_progress field", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: {
        phases: [
          { id: "design", name: "Design", order: 0, total: 3, done: 3, in_progress: 0, todo: 0 },
          { id: "build",  name: "Build",  order: 1, total: 5, done: 2, in_progress: 2, todo: 1 },
        ],
      },
    })

    const result = await reportService.getPhaseProgress(42)

    expect(apiClient.get).toHaveBeenCalledWith("/projects/42/charts/phase-progress")
    expect(result.phases).toHaveLength(2)
    expect(result.phases[1].inProgress).toBe(2)
    expect(result.phases[0].done).toBe(3)
  })
})

describe("reportService.exportPdf / exportExcel", () => {
  it("requests blob responseType for both export endpoints", async () => {
    const fakeBlob = new Blob(["pdf"], { type: "application/pdf" })
    ;(apiClient.get as any).mockResolvedValue({ data: fakeBlob })

    const blob = await reportService.exportPdf({
      projectId: 42, dateFrom: "2026-04-20", dateTo: "2026-05-20",
    })

    expect(apiClient.get).toHaveBeenCalledWith(
      "/reports/export/pdf",
      {
        params: { project_id: "42", date_from: "2026-04-20", date_to: "2026-05-20" },
        responseType: "blob",
      },
    )
    expect(blob).toBe(fakeBlob)
  })

  it("excel export uses the .xlsx endpoint", async () => {
    ;(apiClient.get as any).mockResolvedValue({
      data: new Blob(["xlsx"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    })
    await reportService.exportExcel({
      projectId: 42, dateFrom: null, dateTo: null,
    })
    expect(apiClient.get).toHaveBeenCalledWith(
      "/reports/export/excel",
      {
        params: { project_id: "42" },
        responseType: "blob",
      },
    )
  })
})
