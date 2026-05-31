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
// Phase 15 Plan 15-01 (TIDY-04 harness fix) — declare with explicit
// `[project: unknown], boolean` generic args so the (project) passthrough
// below type-checks (was TS2554 — 0 vs 1 args after the spread fix).
const mockUseTransitionAuthority = vi.fn<[project: unknown], boolean>(
  () => true,
)
vi.mock("@/hooks/use-transition-authority", () => ({
  useTransitionAuthority: (project: unknown) =>
    mockUseTransitionAuthority(project),
}))

// useCycleCounters mock — Plan 12-08 wires this into EditorPage; tests do
// NOT mount QueryClientProvider so the underlying useQuery would throw.
// Phase 15 Plan 15-01 (TIDY-04 harness fix) — return STABLE Map references
// so the editor's cycleMap-dep useEffect does not refire every render and
// drive an infinite render loop. Using `new Map()` per call worked when the
// editor's data flow short-circuited earlier (pre @tanstack/react-query
// useQuery wiring) but post-Triage #3 the projection effects depend on
// cycleMap and must observe a stable identity. vi.hoisted ensures the
// constant exists at the time vitest hoists the vi.mock factory.
const { STABLE_EMPTY_CYCLE_MAP } = vi.hoisted(() => ({
  STABLE_EMPTY_CYCLE_MAP: new Map<string, number>(),
}))
vi.mock("@/hooks/use-cycle-counters", () => ({
  useCycleCounters: () => ({ data: STABLE_EMPTY_CYCLE_MAP }),
  buildCycleMap: () => STABLE_EMPTY_CYCLE_MAP,
}))

// Plan 12-09 — useToast / useQueryClient / projectService mocks. Tests do NOT
// mount ToastProvider or QueryClientProvider — the editor-page wires both
// hooks at module top, so we mock the hook factories directly.
const mockShowToast = vi.fn()
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockInvalidateQueries = vi.fn()
// Phase 15 Plan 15-01 (TIDY-04 harness fix) — editor-page.tsx now imports
// `useQuery` directly (Triage #3 phase-transitions BFS feed). Without this
// stub the entire test file errors at first render: '"useQuery" export is
// not defined on the "@tanstack/react-query" mock'. Return a STABLE
// (frozen, hoisted) v5 UseQueryResult shape so the editor's
// `transitionsQuery.data ?? []` fallback returns the same reference every
// render — otherwise the `nodeStates` useMemo dep churns and we burn the
// vitest worker into JS-heap-OOM. vi.hoisted is required because vitest
// hoists vi.mock factories above the rest of the module body.
const { STABLE_EMPTY_QUERY } = vi.hoisted(() => ({
  STABLE_EMPTY_QUERY: Object.freeze({
    data: Object.freeze([]),
    isPending: false,
    isError: false,
    isSuccess: true,
    error: null,
  }),
}))
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useQuery: () => STABLE_EMPTY_QUERY,
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
  onNodeClick?: (e: unknown, node: unknown) => void
  onNodeDragStart?: (e: unknown, node: unknown) => void
  onNodeDrag?: (e: unknown, node: unknown) => void
  onNodeDragStop?: (e: unknown, node: unknown) => void
} = {}
vi.mock("@xyflow/react", () => ({
  // Phase 15 Plan 15-01 (TIDY-04 harness fix) — production wraps the inner
  // canvas in <ReactFlowProvider> (workflow-canvas-inner.tsx:129) and uses
  // useReactFlow() to expose imperative zoom/fit handles. Both must exist on
  // the mock object or the component crashes at first render.
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="rf-provider">{children}</div>
  ),
  useReactFlow: () => ({
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    fitView: vi.fn(),
    screenToFlowPosition: (p: { x: number; y: number }) => p,
  }),
  ReactFlow: ({
    children,
    onNodesChange,
    onNodeClick,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  }: {
    children?: React.ReactNode
    onNodesChange?: typeof capturedHandlers.onNodesChange
    onNodeClick?: typeof capturedHandlers.onNodeClick
    onNodeDragStart?: typeof capturedHandlers.onNodeDragStart
    onNodeDrag?: typeof capturedHandlers.onNodeDrag
    onNodeDragStop?: typeof capturedHandlers.onNodeDragStop
  }) => {
    capturedHandlers.onNodesChange = onNodesChange
    capturedHandlers.onNodeClick = onNodeClick
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
  applyNodeChanges: <T,>(_changes: unknown, items: T[]) => items,
  applyEdgeChanges: <T,>(_changes: unknown, items: T[]) => items,
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
  // Phase 15 Plan 15-01 (TIDY-04 harness fix) — Project type added
  // boardColumns/taskCount/taskDoneCount fields after this fixture was
  // written (project-service.ts maps board_columns + task_count +
  // task_done_count from the API). Test was not consuming them; provide
  // minimal-shape defaults so tsc --noEmit passes.
  boardColumns: [],
  taskCount: 0,
  taskDoneCount: 0,
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
    capturedHandlers.onNodeClick = undefined
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

  it("Test 6: renders H1 'İş Akışı Tasarımcısı' + project subtitle + Save/Geri buttons", () => {
    render(<EditorPage project={mockProject} />)
    expect(screen.getByText("İş Akışı Tasarımcısı")).toBeTruthy()
    expect(screen.getByText("Mobil Bankacılık 3.0")).toBeTruthy()
    expect(screen.getByText("MOBIL")).toBeTruthy()
    // Phase 15 Plan 15-01 (TIDY-04 harness fix) — header was redesigned
    // before this baseline; "Çoğalt" button was demoted to context-menu
    // only (editor-page.tsx:830). Header now exposes Geri + Kaydet.
    expect(screen.getByText("Geri")).toBeTruthy()
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
    // Project with a single node so we can drag it. C10 — V2 canonical shape.
    const dragProject: Project = {
      ...mockProject,
      processConfig: {
        phase_workflow: {
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
    // C10 — V2 canonical shape.
    const dragProject: Project = {
      ...mockProject,
      processConfig: {
        phase_workflow: {
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

    // Inspect the PATCH body — process_config.phase_workflow.nodes must include
    // the Incremental preset's "Artırım 1" node. (C10 — Workflow Engine V2.)
    const callArgs = mockUpdateProcessConfig.mock.calls[0]
    expect(callArgs[0]).toBe(42)
    const processConfig = callArgs[1] as {
      phase_workflow?: { nodes: Array<{ id: string; name?: string }> }
    }
    expect(processConfig.phase_workflow).toBeDefined()
    const nodeNames = (processConfig.phase_workflow!.nodes ?? []).map(
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
      phase_workflow?: { nodes: Array<{ id: string }> }
    }
    expect(processConfig.phase_workflow).toBeDefined()
    const nodeIds = (processConfig.phase_workflow!.nodes ?? []).map((n) => n.id)
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
      phase_workflow?: { nodes: Array<{ id: string }> }
    }
    const nodeIds = (processConfig.phase_workflow!.nodes ?? []).map((n) => n.id)
    const NODE_ID_REGEX = /^nd_[a-z0-9]{10}$/
    expect(nodeIds.length).toBeGreaterThan(0)
    for (const id of nodeIds) {
      expect(NODE_ID_REGEX.test(id)).toBe(true)
    }
  })

  // ---------------------- Wave 2 W2-C5 — save handler wiring ----------------------

  // W2-C5 Test 1: capabilities slice flows into the PATCH body.
  // Pre-W2-C5 the editor-page maintained lifecycleCapabilities /
  // statusCapabilities slices (W2-C4) but the save handler IGNORED them — so
  // the CapabilitiesPanel was a vitrine. This test guards the wire-up by
  // toggling enforce_wip_limits in lifecycle mode and asserting the PATCH
  // body's phase_workflow.capabilities reflects the change.
  it("Test 22 (W2-C5): toggling a capability flows into PATCH body.phase_workflow.capabilities", async () => {
    mockUpdateProcessConfig.mockResolvedValueOnce({ id: 42 })

    // Seed the project with a workflow so the CapabilitiesPanel mounts inside
    // a populated editor (mockProject.processConfig=null is fine — initial
    // capability slice defaults to {} and the toggle still dispatches).
    const projectWithCaps: Project = {
      ...mockProject,
      processConfig: {
        phase_workflow: {
          mode: "flexible",
          nodes: [
            {
              id: "nd_phase01a01",
              name: "İlk Faz",
              x: 100,
              y: 100,
              is_initial: true,
              is_final: true,
            },
          ],
          edges: [],
          groups: [],
          capabilities: { enforce_wip_limits: false },
        },
        task_workflow: {
          mode: "continuous",
          nodes: [],
          edges: [],
          groups: [],
          capabilities: {},
        },
      } as never,
    }

    render(<EditorPage project={projectWithCaps} />)

    // 2026-05-18 bug fix — RightPanel is now tabbed. Activate the
    // "Yetenek" tab before reading the toggle.
    fireEvent.click(screen.getByTestId("tab-capabilities"))

    // CapabilitiesPanel renders in the RightPanel. Toggle "WIP limitlerini
    // uygula" (TR label per useApp mock language="tr").
    const wipToggle = screen.getByRole("switch", {
      name: "WIP limitlerini uygula",
    })
    fireEvent.click(wipToggle)

    // Save.
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockUpdateProcessConfig.mock.calls[0]
    const processConfig = callArgs[1] as {
      phase_workflow?: { capabilities?: Record<string, unknown> }
      task_workflow?: { capabilities?: Record<string, unknown> }
    }
    expect(processConfig.phase_workflow?.capabilities).toBeDefined()
    expect(processConfig.phase_workflow?.capabilities?.enforce_wip_limits).toBe(
      true,
    )
  })

  // W2-C5 Test 2: save emits the V2-canonical `task_workflow` key (not the
  // legacy `status_workflow`). Wave 1 C10 began this rename but the editor-
  // page save handler kept emitting the old key — W2-C5 completes it on the
  // write side. Read-side fallback remains for legacy persisted projects.
  it("Test 23 (W2-C5): save emits task_workflow (V2 canonical) and NOT status_workflow", async () => {
    mockUpdateProcessConfig.mockResolvedValueOnce({ id: 42 })

    // Seed with a legacy `status_workflow` key in the persisted shape so we
    // can assert it is dropped on save (and replaced with `task_workflow`).
    const legacyProject: Project = {
      ...mockProject,
      processConfig: {
        phase_workflow: {
          mode: "flexible",
          nodes: [
            {
              id: "nd_phase01a01",
              name: "İlk Faz",
              x: 100,
              y: 100,
              is_initial: true,
              is_final: true,
            },
          ],
          edges: [],
          groups: [],
        },
        status_workflow: {
          mode: "continuous",
          nodes: [
            { id: "col_1", name: "Yapılacak", x: 0, y: 0 },
          ],
          edges: [],
          groups: [],
        },
      } as never,
    }

    render(<EditorPage project={legacyProject} />)

    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockUpdateProcessConfig.mock.calls[0]
    const body = callArgs[1] as Record<string, unknown>
    // Wave 2 W2-C5 — write side emits task_workflow only.
    expect("task_workflow" in body).toBe(true)
    expect("status_workflow" in body).toBe(false)
  })

  // W2-C5 Test 3: status-mode capability toggles route into
  // task_workflow.capabilities (NOT phase_workflow.capabilities). The
  // editor maintains two parallel capability slices so a toggle in one mode
  // doesn't leak into the other.
  it("Test 24 (W2-C5): status-mode capability toggle reaches task_workflow.capabilities", async () => {
    mockUpdateProcessConfig.mockResolvedValueOnce({ id: 42 })
    setSearchParams("projectId=42&mode=status")

    const projectStatus: Project = {
      ...mockProject,
      processConfig: {
        phase_workflow: {
          mode: "flexible",
          nodes: [],
          edges: [],
          groups: [],
        },
        task_workflow: {
          mode: "continuous",
          nodes: [{ id: "col_1", name: "Yapılacak", x: 0, y: 0 }],
          edges: [],
          groups: [],
          capabilities: { has_recurring: false },
        },
      } as never,
    }

    render(<EditorPage project={projectStatus} />)

    // 2026-05-18 bug fix — RightPanel is now tabbed. Activate the
    // "Yetenek" tab before reading the toggle.
    fireEvent.click(screen.getByTestId("tab-capabilities"))

    // In status mode the panel renders the "Tekrarlayan görevler" toggle for
    // task_workflow.capabilities.has_recurring.
    const recurringToggle = screen.getByRole("switch", {
      name: "Tekrarlayan görevler",
    })
    fireEvent.click(recurringToggle)

    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    })

    const body = mockUpdateProcessConfig.mock.calls[0][1] as {
      phase_workflow?: { capabilities?: Record<string, unknown> }
      task_workflow?: { capabilities?: Record<string, unknown> }
    }
    expect(body.task_workflow?.capabilities?.has_recurring).toBe(true)
    // The lifecycle slice must remain untouched — toggling in status mode
    // never leaks into phase_workflow.capabilities.
    expect(body.phase_workflow?.capabilities?.has_recurring).toBeUndefined()
  })

  // ---------------------- Wave E — M-W4 single delete path ----------------------

  // M-W4: React Flow's built-in delete is disabled (deleteKeyCode={null}), so a
  // node delete flows through the single deleteSelection() path — removing the
  // node AND its connected edges in ONE commit. Pre-fix, RF ALSO emitted
  // onNodesChange/onEdgesChange removes from a stale `workflow` closure, causing
  // a double history push + lost update. This locks the consolidated path.
  it("Test 25 (M-W4): selecting a node + Delete removes it + its edge in one clean commit", async () => {
    mockUpdateProcessConfig.mockResolvedValueOnce({ id: 42 })
    const proj: Project = {
      ...mockProject,
      processConfig: {
        phase_workflow: {
          mode: "flexible",
          nodes: [
            { id: "nd_aaaaaaaaaa", name: "A", x: 0, y: 0, is_initial: true },
            { id: "nd_bbbbbbbbbb", name: "B", x: 100, y: 0, is_final: true },
          ],
          edges: [
            { id: "ed_1", source: "nd_aaaaaaaaaa", target: "nd_bbbbbbbbbb" },
          ],
          groups: [],
        },
      } as never,
    }
    render(<EditorPage project={proj} />)
    await waitFor(() => {
      expect(capturedHandlers.onNodeClick).toBeTypeOf("function")
    })
    // Select node A, then press Delete (window keydown → deleteSelection).
    await act(async () => {
      capturedHandlers.onNodeClick!({} as never, { id: "nd_aaaaaaaaaa" })
    })
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }))
    })
    // Save → inspect the PATCH body.
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    })
    const body = mockUpdateProcessConfig.mock.calls[0][1] as {
      phase_workflow: {
        nodes: Array<{ id: string }>
        edges: Array<{ id: string }>
      }
    }
    const nodeIds = body.phase_workflow.nodes.map((n) => n.id)
    expect(nodeIds).not.toContain("nd_aaaaaaaaaa") // deleted node gone
    expect(nodeIds).toContain("nd_bbbbbbbbbb") // sibling remains
    expect(body.phase_workflow.edges.length).toBe(0) // edge to deleted node removed
  })

  it("Test 26 (T2a): dragging a loose node into a group's hull associates it (parent_id + group children)", async () => {
    mockUpdateProcessConfig.mockResolvedValueOnce({ id: 42 })
    const proj: Project = {
      ...mockProject,
      processConfig: {
        phase_workflow: {
          mode: "flexible",
          nodes: [
            { id: "nd_aaaaaaaaaa", name: "A", x: 0, y: 0, is_initial: true, parent_id: "g1" },
            { id: "nd_bbbbbbbbbb", name: "B", x: 200, y: 0, is_final: true, parent_id: "g1" },
            // Loose node parked far from the cloud (center 1070,1030).
            { id: "nd_cccccccccc", name: "C", x: 1000, y: 1000 },
          ],
          edges: [],
          groups: [
            { id: "g1", name: "Grup", color: "primary", children: ["nd_aaaaaaaaaa", "nd_bbbbbbbbbb"] },
          ],
        },
      } as never,
    }
    render(<EditorPage project={proj} />)
    await waitFor(() => {
      expect(capturedHandlers.onNodeDragStart).toBeTypeOf("function")
    })
    // Drag C so its CENTER (pos + 70,30) lands inside g1's hull spanning
    // A(0,0)..B(200,0). Drop at (100,0) => center (170,30) = hull dead-center.
    // (applyNodeChanges is a no-op in the stub, so A/B stay at their workflow
    // positions in rfNodes — the drag-IN reads C's drop point from node.position.)
    await act(async () => {
      capturedHandlers.onNodeDragStart!({} as never, { id: "nd_cccccccccc" })
    })
    await act(async () => {
      capturedHandlers.onNodesChange!([
        { type: "position", id: "nd_cccccccccc", position: { x: 100, y: 0 }, dragging: true },
      ])
    })
    await act(async () => {
      capturedHandlers.onNodeDragStop!(
        {} as never,
        { id: "nd_cccccccccc", position: { x: 100, y: 0 } },
      )
    })
    // Save → inspect the PATCH body for the new association.
    const saveBtn = findHeaderSaveButton()
    await act(async () => {
      saveBtn.click()
    })
    await waitFor(() => {
      expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    })
    const body = mockUpdateProcessConfig.mock.calls[0][1] as {
      phase_workflow: {
        nodes: Array<{ id: string; parent_id?: string }>
        groups: Array<{ id: string; children: string[] }>
      }
    }
    const cNode = body.phase_workflow.nodes.find((n) => n.id === "nd_cccccccccc")
    expect(cNode?.parent_id).toBe("g1") // node now claims the group
    const g1 = body.phase_workflow.groups.find((g) => g.id === "g1")
    expect(g1?.children).toContain("nd_cccccccccc") // group lists the new child
  })
})
