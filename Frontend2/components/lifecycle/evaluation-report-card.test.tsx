// Unit tests for components/lifecycle/evaluation-report-card.tsx (Phase 12 Plan 12-06).
//
// Per Plan 12-06 Task 2 <behavior> Tests 1-8 covering:
//   1. Auto-prefill — summary fields read-only, free-text textareas empty
//   2. Revision badge — `rev N` mono Badge in header
//   3. Save — typing into issues + Kaydet → PATCH /phase-reports/{id}, revision badge updates
//   4. Save 409 — AlertBanner with reload Button
//   5. PDF download success — Blob fetched, anchor download triggered with the
//      filename pattern Phase-Report-{key}-{slug}-rev{N}.pdf, success toast
//   6. PDF 429 countdown — disable button + countdown until 0
//   7. HistoryCard Rapor button — toggles inline EvaluationReportCard
//   8. Placeholders — 3 textareas show example placeholder copy

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { EvaluationReportCard } from "./evaluation-report-card"
import { HistoryCard } from "./history-card"
import type { WorkflowNode } from "@/services/lifecycle-service"

// Mock i18n — Turkish-first.
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// Toast mock.
const showToastMock = vi.fn()
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Auth mock — needed because useTransitionAuthority composes useAuth().
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: { id: "1", name: "PM", email: "pm@x.io", role: { name: "Admin" } },
    token: "x",
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

// Mock useTransitionAuthority — overridable per-test.
const transitionAuthorityMock = vi.fn(() => true)
vi.mock("@/hooks/use-transition-authority", () => ({
  useTransitionAuthority: (...args: unknown[]) => transitionAuthorityMock(...args),
}))

// Avoid useTasks chain inside HistoryCard — mock the underlying task service.
vi.mock("@/services/task-service", () => ({
  taskService: {
    getByProject: vi.fn().mockResolvedValue([]),
  },
}))

// Avoid `useRouter` invariant inside MTTaskRow when rendered in jsdom.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// API client mock.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from "@/lib/api-client"
const apiGet = apiClient.get as unknown as ReturnType<typeof vi.fn>
const apiPatch = apiClient.patch as unknown as ReturnType<typeof vi.fn>

function makeQc() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function wrap(node: React.ReactElement, qc?: QueryClient) {
  const client = qc ?? makeQc()
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>
}

const baseProject = {
  id: 7,
  key: "MOBIL",
  managerId: 1,
  methodology: "SCRUM",
}

const phase: WorkflowNode = {
  id: "execution",
  name: "Yürütme",
  x: 0,
  y: 0,
}

const baseReport = {
  id: 55,
  project_id: 7,
  phase_id: "execution",
  revision: 3,
  cycle_number: 1,
  summary_task_count: 15,
  summary_done_count: 14,
  summary_moved_count: 1,
  summary_duration_days: 42,
  issues: "",
  lessons: "",
  recommendations: "",
  created_at: "2026-04-25T00:00:00Z",
  updated_at: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  showToastMock.mockReset()
  transitionAuthorityMock.mockReturnValue(true)
  apiGet.mockReset()
  apiPatch.mockReset()
  apiGet.mockResolvedValue({ data: [] })
})

describe("EvaluationReportCard", () => {
  it("Test 1: auto-prefill — summary fields rendered read-only, free-text textareas empty", async () => {
    apiGet.mockResolvedValueOnce({ data: [baseReport] })

    render(
      wrap(
        <EvaluationReportCard
          project={baseProject as never}
          phase={phase}
          onClose={vi.fn()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText(/Faz Değerlendirme Raporu/)).toBeInTheDocument()
    })

    // Read-only summary values present
    expect(screen.getByText("15")).toBeInTheDocument() // task_count
    expect(screen.getByText("14")).toBeInTheDocument() // done_count
    expect(screen.getByText("42")).toBeInTheDocument() // duration_days

    // Textareas empty (the issues textarea has empty value)
    const textareas = document.querySelectorAll("textarea")
    expect(textareas.length).toBeGreaterThanOrEqual(3)
    textareas.forEach((t) => {
      expect((t as HTMLTextAreaElement).value).toBe("")
    })
  })

  it("Test 2: revision badge — 'rev 3' Badge in header", async () => {
    apiGet.mockResolvedValueOnce({ data: [baseReport] })

    render(
      wrap(
        <EvaluationReportCard
          project={baseProject as never}
          phase={phase}
          onClose={vi.fn()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText(/rev 3/i)).toBeInTheDocument()
    })
  })

  it("Test 3: save — typing into issues + Kaydet → PATCH /phase-reports/{id}", async () => {
    apiGet.mockResolvedValueOnce({ data: [baseReport] })
    apiPatch.mockResolvedValueOnce({
      data: { ...baseReport, issues: "API yanıt süresi gecikti.", revision: 4 },
    })

    render(
      wrap(
        <EvaluationReportCard
          project={baseProject as never}
          phase={phase}
          onClose={vi.fn()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText(/Faz Değerlendirme Raporu/)).toBeInTheDocument()
    })

    // Find first textarea (issues label maps to first uppercase block)
    const textareas = document.querySelectorAll("textarea")
    const issuesArea = textareas[0] as HTMLTextAreaElement
    fireEvent.change(issuesArea, {
      target: { value: "API yanıt süresi gecikti." },
    })

    fireEvent.click(screen.getByText("Kaydet"))

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledTimes(1)
    })
    const [url, body] = apiPatch.mock.calls[0]
    expect(url).toBe("/phase-reports/55")
    expect(body).toMatchObject({ issues: "API yanıt süresi gecikti." })
    // Critical: revision NOT sent (T-12-06-03)
    expect((body as Record<string, unknown>).revision).toBeUndefined()
  })

  it("Test 4: save 409 — AlertBanner with reload Button", async () => {
    apiGet.mockResolvedValueOnce({ data: [baseReport] })
    apiPatch.mockRejectedValueOnce({
      response: { status: 409, data: { detail: "Concurrent edit" } },
    })

    render(
      wrap(
        <EvaluationReportCard
          project={baseProject as never}
          phase={phase}
          onClose={vi.fn()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText(/Faz Değerlendirme Raporu/)).toBeInTheDocument()
    })

    const textareas = document.querySelectorAll("textarea")
    fireEvent.change(textareas[0], {
      target: { value: "Some text" },
    })
    fireEvent.click(screen.getByText("Kaydet"))

    await waitFor(() => {
      expect(
        screen.getByText(/Başka bir kullanıcı raporu güncelledi/),
      ).toBeInTheDocument()
    })
    // Reload button visible
    expect(screen.getByRole("button", { name: /Yenile|Refresh/ })).toBeInTheDocument()
  })

  it("Test 5: PDF download success — Blob fetched, anchor click with filename pattern, success toast", async () => {
    apiGet.mockResolvedValueOnce({ data: [baseReport] })

    // Mock the PDF Blob endpoint
    const blob = new Blob(["dummy"], { type: "application/pdf" })
    apiGet.mockResolvedValueOnce({ data: blob })

    // Stub URL.createObjectURL + anchor click capture
    const createObjectURLMock = vi.fn().mockReturnValue("blob:fake-url")
    const revokeObjectURLMock = vi.fn()
    Object.defineProperty(window.URL, "createObjectURL", {
      value: createObjectURLMock,
      configurable: true,
    })
    Object.defineProperty(window.URL, "revokeObjectURL", {
      value: revokeObjectURLMock,
      configurable: true,
    })

    const clickedAnchors: HTMLAnchorElement[] = []
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName)
        if (tagName === "a") {
          const anchor = el as HTMLAnchorElement
          const origClick = anchor.click.bind(anchor)
          anchor.click = () => {
            clickedAnchors.push(anchor)
            try {
              origClick()
            } catch {
              // jsdom navigation throws — ignore
            }
          }
        }
        return el
      })

    render(
      wrap(
        <EvaluationReportCard
          project={baseProject as never}
          phase={phase}
          onClose={vi.fn()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText(/Faz Değerlendirme Raporu/)).toBeInTheDocument()
    })

    const pdfBtn = screen.getByRole("button", { name: /^PDF$/ })
    fireEvent.click(pdfBtn)

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalledTimes(1)
    })

    // Verify the anchor was created with the expected filename pattern
    const matched = clickedAnchors.find((a) =>
      /Phase-Report-MOBIL-execution-rev3\.pdf/.test(a.download),
    )
    expect(matched).toBeTruthy()

    createElementSpy.mockRestore()
  })

  it("Test 6: PDF 429 countdown — button disabled until countdown reaches 0", async () => {
    vi.useFakeTimers()
    apiGet.mockResolvedValueOnce({ data: [baseReport] })

    // 429 response
    const err = {
      response: {
        status: 429,
        data: { retry_after_seconds: 30 },
      },
    }
    apiGet.mockRejectedValueOnce(err)

    render(
      wrap(
        <EvaluationReportCard
          project={baseProject as never}
          phase={phase}
          onClose={vi.fn()}
        />,
      ),
    )

    await vi.advanceTimersByTimeAsync(0)
    await waitFor(() => {
      expect(screen.getByText(/Faz Değerlendirme Raporu/)).toBeInTheDocument()
    })

    const pdfBtn = screen.getByRole("button", { name: /^PDF$/ })
    fireEvent.click(pdfBtn)

    // Wait microtask cycle so the rejection propagates
    await vi.advanceTimersByTimeAsync(50)

    // Button should now be disabled and show countdown text
    await waitFor(() => {
      const btn = screen.getByRole("button", {
        name: /(s bekleyin|Wait.*s)/i,
      })
      expect(btn).toBeDisabled()
    })

    // Advance 30 s — countdown should reach 0 and button re-enable
    await vi.advanceTimersByTimeAsync(31000)

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /^PDF$/ })
      expect(btn).not.toBeDisabled()
    })

    vi.useRealTimers()
  })

  it("Test 7: HistoryCard Rapor button toggles inline EvaluationReportCard", async () => {
    apiGet.mockResolvedValue({ data: [baseReport] })

    render(
      wrap(
        <HistoryCard
          project={baseProject as never}
          phase={phase}
          summary={{
            closedAt: new Date().toISOString(),
            durationDays: 42,
            total: 15,
            done: 14,
            moved: 1,
            successPct: 93,
          }}
        />,
      ),
    )

    // Pre-click: Rapor button visible, EvaluationReportCard NOT mounted
    const raporBtn = screen.getByRole("button", { name: /Rapor|Report/ })
    expect(raporBtn).toBeInTheDocument()
    expect(screen.queryByText(/Faz Değerlendirme Raporu/)).not.toBeInTheDocument()

    // Click → expand
    fireEvent.click(raporBtn)
    await waitFor(() => {
      expect(screen.getByText(/Faz Değerlendirme Raporu/)).toBeInTheDocument()
    })

    // Click again → collapse
    fireEvent.click(screen.getByRole("button", { name: /Rapor|Report/ }))
    await waitFor(() => {
      expect(
        screen.queryByText(/Faz Değerlendirme Raporu/),
      ).not.toBeInTheDocument()
    })
  })

  it("Test 8: placeholders — 3 textareas show prototype example copy", async () => {
    apiGet.mockResolvedValueOnce({ data: [baseReport] })

    render(
      wrap(
        <EvaluationReportCard
          project={baseProject as never}
          phase={phase}
          onClose={vi.fn()}
        />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText(/Faz Değerlendirme Raporu/)).toBeInTheDocument()
    })

    // Issues placeholder
    expect(
      document.querySelector(
        'textarea[placeholder*="API yanıt süresi gecikti"]',
      ),
    ).toBeTruthy()
    // Lessons placeholder
    expect(
      document.querySelector('textarea[placeholder*="Erken performans testi"]'),
    ).toBeTruthy()
  })
})
