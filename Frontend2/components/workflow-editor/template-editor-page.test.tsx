// Unit tests for the ProcessTemplate canvas editor. Harness mirrors
// editor-page.test.tsx (React Flow stub + captured handlers).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"

// next/navigation mocks
const mockReplace = vi.fn()
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// useAuth — hasPermission("admin.access") toggled per test.
const mockHasPermission = vi.fn(() => true)
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ hasPermission: mockHasPermission }),
}))

const mockShowToast = vi.fn()
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockInvalidateQueries = vi.fn()
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

// projectService — template load + PATCH capture.
const mockGetTemplate = vi.fn()
const mockUpdateTemplate = vi.fn()
vi.mock("@/services/project-service", () => ({
  projectService: {
    getProcessTemplateById: (...args: unknown[]) => mockGetTemplate(...args),
    updateProcessTemplate: (...args: unknown[]) =>
      mockUpdateTemplate(...args),
  },
}))

// React Flow stub — captures the editable callbacks so tests can fire
// synthetic connect/drag sequences against the page's real handlers.
const capturedHandlers: {
  onNodesChange?: (changes: Array<Record<string, unknown>>) => void
  onNodeClick?: (e: unknown, node: unknown) => void
  onNodeDragStart?: (e: unknown, node: unknown) => void
  onNodeDragStop?: (e: unknown, node: unknown) => void
  onPaneClick?: (e: unknown) => void
  onSelectionChange?: (params: {
    nodes: Array<{ id: string; type?: string }>
    edges?: unknown[]
  }) => void
  onConnect?: (params: Record<string, unknown>) => void
} = {}
vi.mock("@xyflow/react", () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="rf-provider">{children}</div>
  ),
  useReactFlow: () => ({
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    fitView: vi.fn(),
    screenToFlowPosition: (p: { x: number; y: number }) => p,
  }),
  useStore: (selector: (s: { transform: number[] }) => unknown) =>
    selector({ transform: [0, 0, 1] }),
  ReactFlow: ({
    children,
    onNodesChange,
    onNodeClick,
    onNodeDragStart,
    onNodeDragStop,
    onPaneClick,
    onSelectionChange,
    onConnect,
  }: {
    children?: React.ReactNode
    onNodesChange?: typeof capturedHandlers.onNodesChange
    onNodeClick?: typeof capturedHandlers.onNodeClick
    onNodeDragStart?: typeof capturedHandlers.onNodeDragStart
    onNodeDragStop?: typeof capturedHandlers.onNodeDragStop
    onPaneClick?: typeof capturedHandlers.onPaneClick
    onSelectionChange?: typeof capturedHandlers.onSelectionChange
    onConnect?: typeof capturedHandlers.onConnect
  }) => {
    capturedHandlers.onNodesChange = onNodesChange
    capturedHandlers.onNodeClick = onNodeClick
    capturedHandlers.onNodeDragStart = onNodeDragStart
    capturedHandlers.onNodeDragStop = onNodeDragStop
    capturedHandlers.onPaneClick = onPaneClick
    capturedHandlers.onSelectionChange = onSelectionChange
    capturedHandlers.onConnect = onConnect
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

// Short-circuit the dynamic-import wrapper so captured handlers exist
// synchronously after render (same trick as editor-page.test.tsx).
vi.mock("./workflow-canvas", async () => {
  const inner = await import("./workflow-canvas-inner")
  return {
    WorkflowCanvas: inner.WorkflowCanvasInner,
  }
})

import { TemplateEditorPage } from "./template-editor-page"

// Wire-shape fixture — what GET /process-templates returns (snake_case).
function makeTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: 5,
    name: "Özel Süreç",
    is_builtin: false,
    columns: [],
    recurring_tasks: [],
    behavioral_flags: {},
    description: "özel açıklama",
    default_workflow: {
      mode: "flexible",
      nodes: [
        {
          id: "nd_aaaaaaaaaa",
          name: "Başlangıç",
          x: 60,
          y: 120,
          color: "status-todo",
          is_initial: true,
        },
        {
          id: "nd_bbbbbbbbbb",
          name: "Bitiş",
          x: 280,
          y: 120,
          color: "status-done",
          is_final: true,
        },
      ],
      edges: [
        {
          id: "ed_fixture001",
          source: "nd_aaaaaaaaaa",
          target: "nd_bbbbbbbbbb",
          type: "flow",
        },
      ],
      groups: [],
      capabilities: { enforce_wip_limits: true },
    },
    ...overrides,
  }
}

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

async function renderLoaded(template = makeTemplate()) {
  mockGetTemplate.mockResolvedValue(template)
  render(<TemplateEditorPage templateId={5} />)
  await screen.findByText("Şablon Tasarımcısı")
  return template
}

describe("TemplateEditorPage (canvas editor)", () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
    mockShowToast.mockClear()
    mockInvalidateQueries.mockClear()
    mockGetTemplate.mockReset()
    mockUpdateTemplate.mockReset()
    mockHasPermission.mockReturnValue(true)
    capturedHandlers.onNodesChange = undefined
    capturedHandlers.onNodeClick = undefined
    capturedHandlers.onNodeDragStart = undefined
    capturedHandlers.onNodeDragStop = undefined
    capturedHandlers.onPaneClick = undefined
    capturedHandlers.onSelectionChange = undefined
    capturedHandlers.onConnect = undefined
  })

  it("loads the template: header, hydrated meta inputs, mounted canvas, toolbar", async () => {
    await renderLoaded()

    expect(screen.getByText("Şablon Tasarımcısı")).toBeTruthy()
    expect(screen.getByText("Özel Süreç")).toBeTruthy()
    // Meta inputs hydrate from the fetched template.
    expect(screen.getByLabelText("Şablon adı")).toHaveProperty(
      "value",
      "Özel Süreç",
    )
    expect(screen.getByLabelText("Açıklama")).toHaveProperty(
      "value",
      "özel açıklama",
    )
    // Real canvas (React Flow) mounted — not a JSON preview.
    expect(await screen.findByTestId("reactflow")).toBeTruthy()
    expect(screen.queryByText(/"nodes"/)).toBeNull()
    // Editing toolbar present for an editable custom template.
    expect(screen.getByText("Şablon Yükle")).toBeTruthy()
    expect(screen.getByText("Geri Al")).toBeTruthy()
    expect(screen.getByText("Düğüm")).toBeTruthy()
  })

  it("renders the not-found fallback when the template id is unknown", async () => {
    mockGetTemplate.mockResolvedValue(null)
    render(<TemplateEditorPage templateId={999} />)
    expect(await screen.findByText("Şablon bulunamadı.")).toBeTruthy()
    expect(screen.queryByTestId("reactflow")).toBeNull()
  })

  it("built-in template is fully editable for admins", async () => {
    mockUpdateTemplate.mockResolvedValue({})
    await renderLoaded(makeTemplate({ is_builtin: true, name: "Scrum" }))

    // No read-only banner; edit chrome present.
    expect(screen.queryByText(/yönetici yetkisi gerekir/)).toBeNull()
    expect(screen.getByText("Şablon Yükle")).toBeTruthy()
    expect(screen.getByText("Düğüm")).toBeTruthy()
    // Keyboard add-node works → dirty → save PATCHes the built-in.
    fireEvent.keyDown(window, { key: "n" })
    expect(await screen.findByText("Kaydedilmemiş")).toBeTruthy()
    fireEvent.click(findHeaderSaveButton())
    await waitFor(() => expect(mockUpdateTemplate).toHaveBeenCalledTimes(1))
    const [, payload] = mockUpdateTemplate.mock.calls[0] as [
      number,
      { default_workflow: { nodes: unknown[] } },
    ]
    expect(payload.default_workflow.nodes).toHaveLength(3)
  })

  it("non-admin user opens read-only with the admin-access banner", async () => {
    mockHasPermission.mockReturnValue(false)
    await renderLoaded()

    expect(
      screen.getByText(/yönetici yetkisi gerekir/),
    ).toBeTruthy()
    expect(findHeaderSaveButton().disabled).toBe(true)
  })

  it("edge connect dirties the editor; save PATCHes wire-shape default_workflow + invalidates the list", async () => {
    mockUpdateTemplate.mockResolvedValue({})
    await renderLoaded()
    await waitFor(() => expect(capturedHandlers.onConnect).toBeTruthy())

    // Reverse edge B->A — the fixture ships A->B, so this passes the
    // directional dedup and lands as a second edge.
    act(() => {
      capturedHandlers.onConnect?.({
        source: "nd_bbbbbbbbbb",
        target: "nd_aaaaaaaaaa",
        sourceHandle: "right-source",
        targetHandle: "left-target",
      })
    })

    expect(await screen.findByText("Kaydedilmemiş")).toBeTruthy()

    fireEvent.click(findHeaderSaveButton())

    await waitFor(() => expect(mockUpdateTemplate).toHaveBeenCalledTimes(1))
    const [patchedId, payload] = mockUpdateTemplate.mock.calls[0] as [
      number,
      {
        name: string
        description: string | null
        default_workflow: {
          mode: string
          nodes: Array<Record<string, unknown>>
          edges: Array<Record<string, unknown>>
          capabilities?: Record<string, unknown>
        }
      },
    ]
    expect(patchedId).toBe(5)
    expect(payload.name).toBe("Özel Süreç")
    expect(payload.description).toBe("özel açıklama")
    // Wire shape: snake_case engine fields survive the unmap round-trip.
    expect(payload.default_workflow.mode).toBe("flexible")
    expect(payload.default_workflow.nodes).toHaveLength(2)
    expect(payload.default_workflow.nodes[0]).toMatchObject({
      id: "nd_aaaaaaaaaa",
      is_initial: true,
      is_final: false,
    })
    expect(payload.default_workflow.edges).toHaveLength(2)
    expect(payload.default_workflow.edges[1]).toMatchObject({
      source: "nd_bbbbbbbbbb",
      target: "nd_aaaaaaaaaa",
    })
    // Capabilities overlay (loaded slice rides the save payload).
    expect(payload.default_workflow.capabilities).toMatchObject({
      enforce_wip_limits: true,
    })

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "success" }),
      ),
    )
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["process-templates"],
    })
    // Dirty cleared after a 200.
    await waitFor(() =>
      expect(screen.queryByText("Kaydedilmemiş")).toBeNull(),
    )
  })

  it("duplicate directional edge is rejected with a warning and does not dirty", async () => {
    await renderLoaded()
    await waitFor(() => expect(capturedHandlers.onConnect).toBeTruthy())

    act(() => {
      capturedHandlers.onConnect?.({
        source: "nd_aaaaaaaaaa",
        target: "nd_bbbbbbbbbb",
      })
    })

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "warning" }),
      ),
    )
    expect(screen.queryByText("Kaydedilmemiş")).toBeNull()
  })

  it("422 on save surfaces the INVALID_WORKFLOW_CONFIG message as toast + banner", async () => {
    mockUpdateTemplate.mockRejectedValue({
      response: {
        status: 422,
        data: {
          detail: {
            error_code: "INVALID_WORKFLOW_CONFIG",
            message: "Workflow must have at least one node with is_initial=True (D-19 rule 4)",
          },
        },
      },
    })
    await renderLoaded()

    // Dirty the form via the name input so Save enables.
    fireEvent.change(screen.getByLabelText("Şablon adı"), {
      target: { value: "Özel Süreç v2" },
    })
    fireEvent.click(findHeaderSaveButton())

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "error",
          message: expect.stringContaining("Doğrulama hatası"),
        }),
      ),
    )
    expect(
      await screen.findByText(/D-19 rule 4/),
    ).toBeTruthy()
    // Still dirty — user can fix and retry.
    expect(screen.getByText("Kaydedilmemiş")).toBeTruthy()
  })

  it("Geri with unsaved changes opens DirtySaveDialog; Atıp Çık discards and navigates to /admin/workflows", async () => {
    await renderLoaded()

    fireEvent.change(screen.getByLabelText("Şablon adı"), {
      target: { value: "Dirty Ad" },
    })
    fireEvent.click(screen.getByText("Geri"))

    expect(
      await screen.findByText("Kaydedilmemiş Değişiklikler"),
    ).toBeTruthy()
    expect(mockPush).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText("Atıp Çık"))
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/admin/workflows"),
    )
  })

  it("Geri without changes navigates immediately (no dialog)", async () => {
    await renderLoaded()

    fireEvent.click(screen.getByText("Geri"))
    expect(screen.queryByText("Kaydedilmemiş Değişiklikler")).toBeNull()
    expect(mockPush).toHaveBeenCalledWith("/admin/workflows")
  })

  it("empty name blocks save", async () => {
    await renderLoaded()

    fireEvent.change(screen.getByLabelText("Şablon adı"), {
      target: { value: "   " },
    })
    expect(await screen.findByText("Kaydedilmemiş")).toBeTruthy()
    expect(findHeaderSaveButton().disabled).toBe(true)
    expect(mockUpdateTemplate).not.toHaveBeenCalled()
  })
})
