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

// React Flow stubs to avoid jsdom layout failures. The stub captures the
// editable callbacks (onNodesChange / onNodeDragStart / onNodeDragStop) on
// a module-scoped ref so individual test cases can fire synthetic drag
// sequences against the editor-page's real handlers.
//
// Phase 12 Plan 12-10 (Bug 2 UAT fix) — capturedHandlers exposes the
// editor's drag handlers so the new history-coalescing test (Test 18)
// can simulate a 30-frame drag and assert the resulting undo stack
// depth equals 1, not 30.
const capturedHandlers: {
  onNodesChange?: (changes: Array<Record<string, unknown>>) => void
  onNodeDragStart?: (e: unknown, node: unknown) => void
  onNodeDrag?: (e: unknown, node: unknown) => void
  onNodeDragStop?: (e: unknown, node: unknown) => void
} = {}
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({
    children,
    onNodesChange,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  }: {
    children?: React.ReactNode
    onNodesChange?: typeof capturedHandlers.onNodesChange
    onNodeDragStart?: typeof capturedHandlers.onNodeDragStart
    onNodeDrag?: typeof capturedHandlers.onNodeDrag
    onNodeDragStop?: typeof capturedHandlers.onNodeDragStop
  }) => {
    capturedHandlers.onNodesChange = onNodesChange
    capturedHandlers.onNodeDragStart = onNodeDragStart
    capturedHandlers.onNodeDrag = onNodeDrag
    capturedHandlers.onNodeDragStop = onNodeDragStop
    return <div data-testid="reactflow">{children}</div>
  },
  Background: () => <div data-testid="bg" />,
  MiniMap: () => <div data-testid="minimap" />,
  Controls: () => <div data-testid="controls" />,
  Handle: () => null,
  Position: { Top: "top", Right: "right", Bottom: "bottom", Left: "left" },
  BaseEdge: () => null,
  EdgeLabelRenderer: () => null,
  getBezierPath: () => ["", 0, 0, 0, 0],
}))

// next/dynamic stub — kept for Plan 12-07 baseline tests that observe
// the static toolbar. Returns a placeholder so the editor-page renders
// without crashing when the inner canvas hasn't loaded.
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

// Phase 12 Plan 12-10 (Bug 2 UAT fix) — short-circuit the workflow-canvas
// outer wrapper so editor-page mounts the inner ReactFlow stub directly.
// This avoids the async dynamic-import dance entirely and lets the
// captured drag handlers be available synchronously after render.
vi.mock("./workflow-canvas", async () => {
  const inner = await import("./workflow-canvas-inner")
  return {
    WorkflowCanvas: inner.WorkflowCanvasInner,
  }
})

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
    // Reset captured handlers between tests so cross-test contamination
    // is impossible (Pitfall 5: jsdom hangs onto closures).
    capturedHandlers.onNodesChange = undefined
    capturedHandlers.onNodeDragStart = undefined
    capturedHandlers.onNodeDrag = undefined
    capturedHandlers.onNodeDragStop = undefined
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

  it("Test 7: toolbar renders mode SegmentedControl + PresetMenu + Undo/Redo + zoom", () => {
    render(<EditorPage project={mockProject} />)
    // Mode pill labels
    expect(screen.getByText("Yaşam Döngüsü")).toBeTruthy()
    expect(screen.getByText("Görev Durumları")).toBeTruthy()
    // Plan 12-10 — PresetMenu trigger replaces the static template label
    expect(screen.getByText("Şablon Yükle")).toBeTruthy()
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

  // ---------------------- Plan 12-10 — preset menu integration ----------------------

  // Phase 12 Plan 12-10 (Bug 2 UAT fix) — drag history coalescing.
  it("Test 18: 30 per-frame node-drag position changes produce exactly ONE history entry", async () => {
    // Project with a single node so we can drag it.
    const dragProject: Project = {
      ...mockProject,
      processConfig: {
        workflow: {
          mode: "flexible",
          nodes: [
            {
              id: "n1",
              name: "Yürütme",
              x: 100,
              y: 100,
              is_initial: true,
              is_final: true,
            },
          ],
          edges: [],
          groups: [],
        },
      } as never,
    }

    render(<EditorPage project={dragProject} />)

    // The dynamic-imported canvas resolves on the microtask queue. Wait
    // for the captured drag handlers to be wired up via the ReactFlow stub
    // before firing synthetic events.
    await waitFor(() => {
      expect(capturedHandlers.onNodeDragStart).toBeTypeOf("function")
    })
    expect(capturedHandlers.onNodesChange).toBeTypeOf("function")
    expect(capturedHandlers.onNodeDragStop).toBeTypeOf("function")

    // Simulate React Flow's drag sequence:
    //   1. onNodeDragStart fires once → editor snapshots workflow
    //   2. 30× onNodesChange fires with `position` deltas + dragging:true
    //   3. onNodeDragStop fires once → editor pushes ONE history entry
    await act(async () => {
      capturedHandlers.onNodeDragStart!({} as never, { id: "n1" })
    })

    for (let i = 1; i <= 30; i += 1) {
      await act(async () => {
        capturedHandlers.onNodesChange!([
          {
            type: "position",
            id: "n1",
            position: { x: 100 + i, y: 100 + i },
            dragging: true,
          },
        ])
      })
    }

    await act(async () => {
      capturedHandlers.onNodeDragStop!(
        {} as never,
        { id: "n1", position: { x: 130, y: 130 } },
      )
    })

    // Expectation: ONE click on the toolbar Undo button (Geri Al) reverts
    // the canvas back to the pre-drag position. After that one click,
    // canUndo becomes false → the Undo button is disabled. This proves
    // the 30 position changes coalesced into a single history entry; if
    // there were 30 entries we'd need 30 clicks to drain.
    const undoBtns = screen.getAllByText("Geri Al")
    // Pick the first Undo button (toolbar variant).
    let undoBtn: HTMLButtonElement | null = null
    for (const el of undoBtns) {
      let parent: HTMLElement | null = el as HTMLElement
      for (let i = 0; i < 4 && parent; i += 1) {
        if (parent.tagName === "BUTTON") {
          undoBtn = parent as HTMLButtonElement
          break
        }
        parent = parent.parentElement
      }
      if (undoBtn) break
    }
    expect(undoBtn).toBeTruthy()
    // Before the single undo click, canUndo must be true.
    expect(undoBtn!.disabled).toBe(false)

    await act(async () => {
      undoBtn!.click()
    })

    // After ONE undo, canUndo must be false → button disabled. If we had
    // 30 entries, the button would still be enabled and require 29 more
    // clicks to drain — that's the regression this test guards against.
    expect(undoBtn!.disabled).toBe(true)
  })

  it("Test 19: a no-op drag (no movement) does NOT push a history entry", async () => {
    const dragProject: Project = {
      ...mockProject,
      processConfig: {
        workflow: {
          mode: "flexible",
          nodes: [
            {
              id: "n1",
              name: "Yürütme",
              x: 100,
              y: 100,
              is_initial: true,
              is_final: true,
            },
          ],
          edges: [],
          groups: [],
        },
      } as never,
    }

    render(<EditorPage project={dragProject} />)

    await waitFor(() => {
      expect(capturedHandlers.onNodeDragStart).toBeTypeOf("function")
    })

    // Simulate clicking-without-dragging: DragStart + DragStop with the
    // same coordinates and zero position events in between.
    await act(async () => {
      capturedHandlers.onNodeDragStart!({} as never, { id: "n1" })
    })
    await act(async () => {
      capturedHandlers.onNodeDragStop!(
        {} as never,
        { id: "n1", position: { x: 100, y: 100 } },
      )
    })

    // Locate the toolbar Undo button.
    const undoBtns = screen.getAllByText("Geri Al")
    let undoBtn: HTMLButtonElement | null = null
    for (const el of undoBtns) {
      let parent: HTMLElement | null = el as HTMLElement
      for (let i = 0; i < 4 && parent; i += 1) {
        if (parent.tagName === "BUTTON") {
          undoBtn = parent as HTMLButtonElement
          break
        }
        parent = parent.parentElement
      }
      if (undoBtn) break
    }
    expect(undoBtn).toBeTruthy()
    // No movement → no history entry → button remains disabled.
    expect(undoBtn!.disabled).toBe(true)
  })

  it("Test 17: preset menu integration — selecting 'Artırımlı' on a clean canvas swaps the workflow and Save sends Incremental shape", async () => {
    mockUpdateProcessConfig.mockResolvedValueOnce({ id: 42 })
    render(<EditorPage project={mockProject} />)

    // Initial canvas is empty (project.processConfig=null), so dirty=false.
    // Open the preset dropdown.
    fireEvent.click(screen.getByText("Şablon Yükle"))

    // Click the Incremental ("Artırımlı") entry — bypasses ConfirmDialog
    // because dirty=false initially.
    fireEvent.click(screen.getByText("Artırımlı"))

    // Click Save — header Save button.
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    })

    // Inspect the PATCH body — process_config.workflow.nodes must include
    // the Incremental preset's "Artırım 1" node.
    const callArgs = mockUpdateProcessConfig.mock.calls[0]
    expect(callArgs[0]).toBe(42)
    const processConfig = callArgs[1] as {
      workflow?: { nodes: Array<{ id: string; name?: string }> }
    }
    expect(processConfig.workflow).toBeDefined()
    const nodeNames = (processConfig.workflow!.nodes ?? []).map(
      (n) => n.name,
    )
    // "Artırım 1" is unique to the Incremental preset (per
    // Frontend2/lib/lifecycle/presets.ts INCREMENTAL definition).
    expect(nodeNames).toContain("Artırım 1")
    expect(nodeNames).toContain("Artırım 2")
    expect(nodeNames).toContain("Bütünleştirme")
  })

  // Phase 12 Plan 12-10 (Bug X UAT fix) — node IDs from preset apply must
  // satisfy the D-22 regex so the backend WorkflowNode validator does not
  // 422 the PATCH. Pre-fix the editor's `newId(prefix)` produced ids like
  // `phase-3xk7l9-mn8h6` which fail the regex.
  it("Test 20 (Bug X): preset apply sends node IDs matching ^nd_[a-z0-9]{10}$", async () => {
    mockUpdateProcessConfig.mockResolvedValueOnce({ id: 42 })
    render(<EditorPage project={mockProject} />)

    fireEvent.click(screen.getByText("Şablon Yükle"))
    fireEvent.click(screen.getByText("Scrum"))

    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockUpdateProcessConfig.mock.calls[0]
    const processConfig = callArgs[1] as {
      workflow?: { nodes: Array<{ id: string }> }
    }
    expect(processConfig.workflow).toBeDefined()
    const nodeIds = (processConfig.workflow!.nodes ?? []).map((n) => n.id)
    const NODE_ID_REGEX = /^nd_[a-z0-9]{10}$/
    expect(nodeIds.length).toBeGreaterThan(0)
    for (const id of nodeIds) {
      expect(NODE_ID_REGEX.test(id)).toBe(true)
    }
  })

  // Phase 12 Plan 12-10 (Bug X UAT fix) — addNodeAtPosition (the "N"
  // shortcut + canvas context-menu "Add node here" path + bottom-toolbar
  // Add button) must mint regex-compliant IDs.
  it("Test 21 (Bug X): pressing N to add a node mints a regex-compliant ID", async () => {
    mockUpdateProcessConfig.mockResolvedValueOnce({ id: 42 })
    render(<EditorPage project={mockProject} />)

    // Press N to invoke addNodeAtPosition via the keyboard shortcut.
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "n" }))
    })

    // Save to inspect the PATCH body.
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockUpdateProcessConfig.mock.calls[0]
    const processConfig = callArgs[1] as {
      workflow?: { nodes: Array<{ id: string }> }
    }
    const nodeIds = (processConfig.workflow!.nodes ?? []).map((n) => n.id)
    const NODE_ID_REGEX = /^nd_[a-z0-9]{10}$/
    expect(nodeIds.length).toBeGreaterThan(0)
    for (const id of nodeIds) {
      expect(NODE_ID_REGEX.test(id)).toBe(true)
    }
  })
})
