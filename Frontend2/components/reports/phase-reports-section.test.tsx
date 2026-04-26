// Phase 13 Plan 13-08 Task 2 — RTL coverage for PhaseReportsSection.
//
// Tests 1–9 from the plan's <behavior> block:
//   1. 2-tab outer Tabs primitive renders with id "active" and "archived",
//      default "active".
//   2. Switching to "Arşivlenmiş" causes useProjects to be called with
//      "ARCHIVED" status.
//   3. Project picker → cascading phase picker (disabled until project picked,
//      enabled with options after).
//   4. Selecting project + phase mounts EvaluationReportCard (mocked) with
//      readOnly=true and project/phase props.
//   5. Empty state when no project selected → "Önce proje seçin."
//   6. Empty state when phase has no report → "Bu faz için rapor
//      oluşturulmamış. ..." + "Yaşam Döngüsü'ne git" Button.
//   7. Click "Yaşam Döngüsü'ne git" → router.push to lifecycle history.
//   8. Recent rows list shows up to 5 rows when reports exceed 5.
//   9. Clicking recent row sets project + phase + opens card.
//
// EvaluationReportCard is mocked because its real implementation pulls in
// useToast / useAuth / TanStack mutation chains that are exercised by their
// own test files. Here we only need to assert the prop flow.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

const routerPushMock = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}))

const useProjectsMock = vi.fn()
vi.mock("@/hooks/use-projects", () => ({
  useProjects: (status?: string) => useProjectsMock(status),
}))

const usePhaseReportsMock = vi.fn()
vi.mock("@/hooks/use-phase-reports", () => ({
  usePhaseReports: (projectId: number | null | undefined) =>
    usePhaseReportsMock(projectId),
}))

// EvaluationReportCard mock — render a sentinel div so the test can read
// the prop wiring (project id, phase id, readOnly flag).
vi.mock("@/components/lifecycle/evaluation-report-card", () => ({
  EvaluationReportCard: (props: {
    project: { id: number }
    phase: { id: string; name?: string }
    readOnly?: boolean
  }) => (
    <div
      data-testid="evaluation-report-card"
      data-project-id={String(props.project.id)}
      data-phase-id={String(props.phase.id)}
      data-readonly={String(!!props.readOnly)}
    />
  ),
}))

import { PhaseReportsSection } from "./phase-reports-section"

const mkProject = (overrides: Partial<{
  id: number
  key: string
  name: string
  managerId: number | null
  phases: Array<{ id: string; name: string }>
}> = {}) => ({
  id: overrides.id ?? 7,
  key: overrides.key ?? "ACME",
  name: overrides.name ?? "ACME Project",
  description: null,
  startDate: "2026-01-01",
  endDate: null,
  status: "ACTIVE" as const,
  methodology: "SCRUM",
  processTemplateId: null,
  managerId: overrides.managerId ?? 1,
  managerName: null,
  managerAvatar: null,
  progress: 0,
  columns: [],
  boardColumns: [],
  processConfig: {
    workflow: {
      mode: "flexible",
      nodes: (overrides.phases ?? [
        { id: "design", name: "Tasarım" },
        { id: "build", name: "Geliştirme" },
        { id: "qa", name: "Test" },
      ]).map((p) => ({ id: p.id, name: p.name })),
      edges: [],
      groups: [],
    },
  },
  createdAt: "2026-01-01",
})

const mkReport = (
  overrides: Partial<{
    id: number
    phaseId: string
    summaryTaskCount: number
    summaryDoneCount: number
    createdAt: string
    updatedAt: string | null
  }> = {},
) => ({
  id: overrides.id ?? 100,
  projectId: 7,
  phaseId: overrides.phaseId ?? "design",
  revision: 1,
  cycleNumber: 1,
  summaryTaskCount: overrides.summaryTaskCount ?? 12,
  summaryDoneCount: overrides.summaryDoneCount ?? 9,
  summaryMovedCount: 1,
  summaryDurationDays: 7,
  issues: "",
  lessons: "",
  recommendations: "",
  createdAt: overrides.createdAt ?? "2026-04-20T10:00:00Z",
  updatedAt: overrides.updatedAt ?? null,
})

beforeEach(() => {
  routerPushMock.mockReset()
  useProjectsMock.mockReset()
  usePhaseReportsMock.mockReset()

  // Default: tab "active" → return one project; tab "archived" returns empty.
  useProjectsMock.mockImplementation((status?: string) => {
    if (status === "ARCHIVED") {
      return { data: [], isLoading: false, error: null }
    }
    return { data: [mkProject()], isLoading: false, error: null }
  })

  // Default: no reports for the picked project (overridden per-test).
  usePhaseReportsMock.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  })
})

describe("PhaseReportsSection", () => {
  it("Test 1: renders 2-tab outer Tabs with default 'active'", () => {
    render(<PhaseReportsSection />)
    expect(
      screen.getByRole("button", { name: "Aktif + Tamamlanan" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Arşivlenmiş" }),
    ).toBeInTheDocument()
    // Active tab styling — tabs primitive uses font-weight 600 for the active
    // tab. We assert via the call sequence: "active" was passed to
    // useProjects via the "ACTIVE,COMPLETED" status filter, while archived
    // would be "ARCHIVED".
    expect(useProjectsMock).toHaveBeenCalledWith("ACTIVE,COMPLETED")
    expect(useProjectsMock).not.toHaveBeenCalledWith("ARCHIVED")
  })

  it("Test 2: switching to 'Arşivlenmiş' calls useProjects with 'ARCHIVED'", () => {
    render(<PhaseReportsSection />)
    fireEvent.click(screen.getByRole("button", { name: "Arşivlenmiş" }))
    expect(useProjectsMock).toHaveBeenCalledWith("ARCHIVED")
  })

  it("Test 3: phase picker is disabled until project picked, enabled with options after", () => {
    render(<PhaseReportsSection />)
    const phaseSelect = screen.getByLabelText("Faz seç") as HTMLSelectElement
    expect(phaseSelect.disabled).toBe(true)

    // Pick the project — phase select enables, options populate.
    const projectSelect = screen.getByLabelText("Proje seç") as HTMLSelectElement
    fireEvent.change(projectSelect, { target: { value: "7" } })
    expect(phaseSelect.disabled).toBe(false)
    // 3 phase options + the "Faz seç" placeholder = 4 options.
    expect(phaseSelect.querySelectorAll("option").length).toBe(4)
  })

  it("Test 4: selecting project + phase with a report mounts EvaluationReportCard with readOnly=true", () => {
    usePhaseReportsMock.mockReturnValue({
      data: [mkReport({ phaseId: "design" })],
      isLoading: false,
      error: null,
    })
    render(<PhaseReportsSection />)
    fireEvent.change(screen.getByLabelText("Proje seç") as HTMLSelectElement, {
      target: { value: "7" },
    })
    fireEvent.change(screen.getByLabelText("Faz seç") as HTMLSelectElement, {
      target: { value: "design" },
    })
    const card = screen.getByTestId("evaluation-report-card")
    expect(card).toBeInTheDocument()
    expect(card.getAttribute("data-project-id")).toBe("7")
    expect(card.getAttribute("data-phase-id")).toBe("design")
    expect(card.getAttribute("data-readonly")).toBe("true")
  })

  it("Test 5: empty state when no project selected", () => {
    render(<PhaseReportsSection />)
    expect(screen.getByText("Önce proje seçin.")).toBeInTheDocument()
  })

  it("Test 6: empty state when phase has no report — message + 'Yaşam Döngüsü'ne git' Button", () => {
    usePhaseReportsMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })
    render(<PhaseReportsSection />)
    fireEvent.change(screen.getByLabelText("Proje seç") as HTMLSelectElement, {
      target: { value: "7" },
    })
    fireEvent.change(screen.getByLabelText("Faz seç") as HTMLSelectElement, {
      target: { value: "design" },
    })
    expect(
      screen.getByText(/Bu faz için rapor oluşturulmamış\./),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Yaşam Döngüsü'ne git" }),
    ).toBeInTheDocument()
  })

  it("Test 7: clicking 'Yaşam Döngüsü'ne git' deep-links to lifecycle history", () => {
    usePhaseReportsMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })
    render(<PhaseReportsSection />)
    fireEvent.change(screen.getByLabelText("Proje seç") as HTMLSelectElement, {
      target: { value: "7" },
    })
    fireEvent.change(screen.getByLabelText("Faz seç") as HTMLSelectElement, {
      target: { value: "design" },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Yaşam Döngüsü'ne git" }),
    )
    expect(routerPushMock).toHaveBeenCalledWith(
      "/projects/7?tab=lifecycle&sub=history",
    )
  })

  it("Test 8: recent rows list caps at 5 even when 8 reports exist", () => {
    const reports = Array.from({ length: 8 }, (_, i) =>
      mkReport({
        id: 200 + i,
        phaseId: i % 2 === 0 ? "design" : "build",
        createdAt: `2026-04-${String(20 - i).padStart(2, "0")}T10:00:00Z`,
      }),
    )
    usePhaseReportsMock.mockReturnValue({
      data: reports,
      isLoading: false,
      error: null,
    })
    render(<PhaseReportsSection />)
    fireEvent.change(screen.getByLabelText("Proje seç") as HTMLSelectElement, {
      target: { value: "7" },
    })
    const rows = screen.getAllByTestId("phase-report-row")
    expect(rows.length).toBe(5)
  })

  it("Test 9: clicking a recent row sets project + phase + mounts the report card", () => {
    usePhaseReportsMock.mockReturnValue({
      data: [
        mkReport({ id: 300, phaseId: "build" }),
        mkReport({ id: 301, phaseId: "design" }),
      ],
      isLoading: false,
      error: null,
    })
    render(<PhaseReportsSection />)
    // Pick project so the recent rows panel renders.
    fireEvent.change(screen.getByLabelText("Proje seç") as HTMLSelectElement, {
      target: { value: "7" },
    })
    const rows = screen.getAllByTestId("phase-report-row")
    expect(rows.length).toBeGreaterThanOrEqual(1)
    // Click the first row — its phaseId is set on the picker, the
    // EvaluationReportCard mounts with that phase id.
    fireEvent.click(rows[0])
    const card = screen.getByTestId("evaluation-report-card")
    expect(card).toBeInTheDocument()
    // The first row corresponds to id=300 (sorted by created_at desc — both
    // reports have the same default createdAt, so insertion order resolves).
    // We assert the card receives a phaseId from one of the two reports.
    const cardPhase = card.getAttribute("data-phase-id")
    expect(["build", "design"]).toContain(cardPhase)
  })
})

// Catch the unused `within` import warning when refactoring leaves it dead.
void within
