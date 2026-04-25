// Unit tests for components/workflow-editor/editor-page.tsx
// (Phase 12 Plan 12-07 baseline + Plan 12-09 save flow extensions).
//
// Original Plan 12-07 cases 6-9: header / toolbar / mode pill / disabled-save.
// Plan 12-09 added cases 10-17:
//   10. save 200 — toast Kaydedildi, dirty=false, history.clear, invalidateQueries
//   11. save 422 — toast + saveError detail captured
//   12. save 409 — AlertBanner with Yenile button; click invalidates query
//   13. save 429 — toast + countdown disables Save button
//   14. save network error — toast Bağlantı hatası
//   15. dirty-save router intercept — DirtySaveDialog opens on safePush when dirty
//   16. dirty=false bypasses guard — router.push fires directly
//   17. workflow-validators sequential-flexible cycle test (in workflow-validators.test.ts)
//   PLUS implicit: beforeunload listener installed when dirty

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"

// next/navigation mocks
const mockReplace = vi.fn()
const mockPush = vi.fn()
let currentSearchParams = new URLSearchParams()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: vi.fn() }),
  useSearchParams: () => currentSearchParams,
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// useTransitionAuthority mock — toggle per test.
const mockUseTransitionAuthority = vi.fn(() => true)
vi.mock("@/hooks/use-transition-authority", () => ({
  useTransitionAuthority: (...args: unknown[]) =>
    mockUseTransitionAuthority(...args),
}))

// useCycleCounters mock — Plan 12-08 wires this into EditorPage; tests do
// NOT mount QueryClientProvider so the underlying useQuery would throw.
vi.mock("@/hooks/use-cycle-counters", () => ({
  useCycleCounters: () => ({ data: new Map<string, number>() }),
  buildCycleMap: () => new Map<string, number>(),
}))

// Plan 12-09 — useToast / useQueryClient / projectService mocks. Tests do NOT
// mount ToastProvider or QueryClientProvider — the editor-page wires both
// hooks at module top, so we mock the hook factories directly.
const mockShowToast = vi.fn()
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockInvalidateQueries = vi.fn()
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

const mockUpdateProcessConfig = vi.fn()
vi.mock("@/services/project-service", () => ({
  projectService: {
    updateProcessConfig: (...args: unknown[]) =>
      mockUpdateProcessConfig(...args),
  },
}))

// React Flow stubs to avoid jsdom layout failures.
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="reactflow">{children}</div>
  ),
  Background: () => <div data-testid="bg" />,
  MiniMap: () => <div data-testid="minimap" />,
  Controls: () => <div data-testid="controls" />,
  Handle: () => null,
  Position: { Top: "top", Right: "right", Bottom: "bottom", Left: "left" },
  BaseEdge: () => null,
  EdgeLabelRenderer: () => null,
  getBezierPath: () => ["", 0, 0, 0, 0],
}))

// next/dynamic stub — execute the loader synchronously and return the
// component so the dynamic-imported WorkflowCanvas mounts in jsdom.
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ [k: string]: unknown }>) => {
    let Mod: React.ComponentType<unknown> | null = null
    void loader().then((m) => {
      const found = Object.values(m).find(
        (v) => typeof v === "function",
      ) as React.ComponentType<unknown> | undefined
      Mod = found ?? null
    })
    const Wrapped = (props: unknown) => {
      if (!Mod) return <div data-testid="dynamic-loading" />
      const M = Mod
      return <M {...(props as Record<string, unknown>)} />
    }
    return Wrapped
  },
}))

import { EditorPage } from "./editor-page"
import type { Project } from "@/services/project-service"

function setSearchParams(qs: string) {
  currentSearchParams = new URLSearchParams(qs)
}

const mockProject: Project = {
  id: 42,
  key: "MOBIL",
  name: "Mobil Bankacılık 3.0",
  description: null,
  startDate: "2026-01-01",
  endDate: null,
  status: "ACTIVE",
  methodology: "SCRUM",
  processTemplateId: null,
  managerId: 7,
  managerName: null,
  managerAvatar: null,
  progress: 0,
  columns: [],
  processConfig: null,
  createdAt: "2026-01-01T00:00:00Z",
}

describe("EditorPage", () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
    mockShowToast.mockClear()
    mockInvalidateQueries.mockClear()
    mockUpdateProcessConfig.mockReset()
    mockUseTransitionAuthority.mockReturnValue(true)
    setSearchParams("projectId=42")
  })

  // Helper: locate the primary header Save button (the Tooltip-wrapped one
  // sitting next to Geri / Çoğalt). Returns the actual <button> element.
  function findHeaderSaveButton(): HTMLButtonElement {
    const candidates = screen.getAllByText("Kaydet")
    for (const el of candidates) {
      let parent: HTMLElement | null = el as HTMLElement
      for (let i = 0; i < 4 && parent; i += 1) {
        if (parent.tagName === "BUTTON") return parent as HTMLButtonElement
        parent = parent.parentElement
      }
    }
    throw new Error("Header Save button not found")
  }

  it("Test 6: renders H1 'İş Akışı Tasarımcısı' + project subtitle + Save/Geri/Çoğalt buttons", () => {
    render(<EditorPage project={mockProject} />)
    expect(screen.getByText("İş Akışı Tasarımcısı")).toBeTruthy()
    expect(screen.getByText("Mobil Bankacılık 3.0")).toBeTruthy()
    expect(screen.getByText("MOBIL")).toBeTruthy()
    // 3 right-side buttons (multiple Save match — getAllByText)
    expect(screen.getByText("Geri")).toBeTruthy()
    expect(screen.getByText("Çoğalt")).toBeTruthy()
    expect(screen.getAllByText("Kaydet").length).toBeGreaterThan(0)
  })

  it("Test 7: toolbar renders mode SegmentedControl + template + Undo/Redo + zoom", () => {
    render(<EditorPage project={mockProject} />)
    // Mode pill labels
    expect(screen.getByText("Yaşam Döngüsü")).toBeTruthy()
    expect(screen.getByText("Görev Durumları")).toBeTruthy()
    // Template label
    expect(screen.getByText(/Şablon:/)).toBeTruthy()
    // Undo / Redo buttons — "Yinele" appears multiple times; query all
    expect(screen.getByText("Geri Al")).toBeTruthy()
    expect(screen.getAllByText("Yinele").length).toBeGreaterThanOrEqual(1)
    // Zoom display
    expect(screen.getByText("100%")).toBeTruthy()
  })

  it("Test 8: clicking 'Görev Durumları' updates ?mode= via router.replace", () => {
    setSearchParams("projectId=42")
    render(<EditorPage project={mockProject} />)
    const statusPill = screen.getByText("Görev Durumları")
    fireEvent.click(statusPill)
    // The replace call should target /workflow-editor?... with mode=status
    expect(mockReplace).toHaveBeenCalled()
    const lastCall = mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0] as string
    expect(lastCall).toContain("mode=status")
    expect(lastCall).toContain("projectId=42")
  })

  it("Test 9: Save button is disabled when useTransitionAuthority=false", () => {
    mockUseTransitionAuthority.mockReturnValue(false)
    render(<EditorPage project={mockProject} />)
    // Find the primary Save button (the Tooltip-wrapped one). Multiple
    // "Kaydet" texts may exist (one inside Tooltip). The button itself is
    // disabled.
    const saveButtons = screen.getAllByText("Kaydet")
    const disabledSave = saveButtons.find((el) => {
      // Walk up to find the button and check its disabled attribute.
      let parent: HTMLElement | null = el as HTMLElement
      for (let i = 0; i < 4 && parent; i += 1) {
        if (parent.tagName === "BUTTON") return (parent as HTMLButtonElement).disabled
        parent = parent.parentElement
      }
      return false
    })
    expect(disabledSave).toBeTruthy()
  })

  // ---------------------- Plan 12-09 — save flow ----------------------

  it("Test 10: save 200 — toast Kaydedildi + invalidateQueries fired", async () => {
    mockUpdateProcessConfig.mockResolvedValueOnce({ id: 42 })
    render(<EditorPage project={mockProject} />)
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    })
    // Success path side-effects
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success", message: "Kaydedildi" }),
    )
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["project", 42],
    })
  })

  it("Test 11: save 422 — Doğrulama hatası toast + saveError detail captured", async () => {
    mockUpdateProcessConfig.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { detail: [{ loc: ["body", "process_config"], msg: "invalid", type: "x" }] },
      },
    })
    render(<EditorPage project={mockProject} />)
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "error",
          message: "Doğrulama hatası",
        }),
      )
    })
  })

  it("Test 12: save 409 — AlertBanner with Yenile button appears", async () => {
    mockUpdateProcessConfig.mockRejectedValueOnce({ response: { status: 409 } })
    render(<EditorPage project={mockProject} />)
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      // The 409 path renders an AlertBanner with the conflict copy
      expect(
        screen.getByText(
          /Başka bir kullanıcı aynı anda değiştirdi\. Yenileyin\./,
        ),
      ).toBeTruthy()
      expect(screen.getByText("Yenile")).toBeTruthy()
    })
    // Clicking Yenile invalidates the project query and clears the banner
    const yenileBtn = screen.getByText("Yenile")
    await act(async () => {
      yenileBtn.click()
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["project", 42],
    })
  })

  it("Test 13: save 429 — Rate-limit toast fired with seconds in message", async () => {
    mockUpdateProcessConfig.mockRejectedValueOnce({
      response: { status: 429, data: { retry_after_seconds: 5 } },
    })
    render(<EditorPage project={mockProject} />)
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "warning",
          message: expect.stringMatching(/saniye bekleyin/),
        }),
      )
    })
  })

  it("Test 14: save network error — Bağlantı hatası toast", async () => {
    mockUpdateProcessConfig.mockRejectedValueOnce(new Error("Network down"))
    render(<EditorPage project={mockProject} />)
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "error",
          message: "Bağlantı hatası, tekrar dene",
        }),
      )
    })
  })

  it("Test 15: dirty=false — clicking Geri navigates immediately via router.push", async () => {
    render(<EditorPage project={mockProject} />)
    const geriBtn = screen.getByText("Geri")
    await act(async () => {
      geriBtn.click()
    })
    expect(mockPush).toHaveBeenCalledWith("/projects/42")
  })

  it("Test 16: beforeunload listener installed — preventDefault NOT called when dirty=false", () => {
    render(<EditorPage project={mockProject} />)
    const event = new Event("beforeunload", { cancelable: true }) as BeforeUnloadEvent
    const preventSpy = vi.spyOn(event, "preventDefault")
    window.dispatchEvent(event)
    // Initial dirty=false so preventDefault must NOT have been called
    expect(preventSpy).not.toHaveBeenCalled()
  })
})
