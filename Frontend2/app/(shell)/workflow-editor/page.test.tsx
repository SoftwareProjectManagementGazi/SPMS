// Unit tests for app/(shell)/workflow-editor/page.tsx (Phase 12 Plan 12-07).
//
// 5 cases per 12-07-PLAN.md task 1 <behavior> Tests 1-5:
//   1. ?projectId=42 + viewport 1280 → mounts EditorPage with project loaded
//   2. no ?projectId → router.replace('/projects')
//   3. ?projectId=NaN → router.replace('/projects')
//   4. viewport 768 + valid id → ViewportFallback rendered, NO EditorPage
//   5. fallback "Projeye Dön" Button → router.push('/projects/' + projectId)

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// Mocks set BEFORE the dynamic import resolves — define before importing the
// route file so the mock factory captures a pristine module set.
const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()
let currentSearchParams = mockSearchParams

vi.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: vi.fn(),
  }),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

const mockUseProjectImpl = vi.fn()
vi.mock("@/hooks/use-projects", () => ({
  useProject: (...args: unknown[]) => mockUseProjectImpl(...args),
}))

// EditorPage is heavy (uses dynamic-imported React Flow). Stub it to keep
// these route-level tests focused on viewport + redirect logic.
vi.mock("@/components/workflow-editor/editor-page", () => ({
  EditorPage: ({ project }: { project: { id: number; name: string } }) => (
    <div data-testid="editor-page">EditorPage:{project.name}</div>
  ),
}))

vi.mock("@/components/lifecycle/viewport-fallback", () => ({
  ViewportFallback: ({ projectId }: { projectId: number }) => (
    <div data-testid="viewport-fallback">
      Workflow editörü 1024px+ ekran gerektirir.
      <button onClick={() => mockPush(`/projects/${projectId}`)}>
        Projeye Dön
      </button>
    </div>
  ),
}))

import WorkflowEditorRoute from "./page"

function setSearchParams(qs: string) {
  currentSearchParams = new URLSearchParams(qs)
}

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    writable: true,
    configurable: true,
  })
}

describe("WorkflowEditorRoute", () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
    mockUseProjectImpl.mockReset()
    setSearchParams("")
  })

  it("Test 1: ?projectId=42 + viewport 1280 mounts EditorPage with project loaded", () => {
    setSearchParams("projectId=42")
    setViewport(1280)
    mockUseProjectImpl.mockReturnValue({
      data: { id: 42, name: "Mobil Bankacılık 3.0", key: "MOBIL", methodology: "SCRUM" },
      isLoading: false,
    })
    render(<WorkflowEditorRoute />)
    expect(screen.getByTestId("editor-page")).toBeTruthy()
    expect(screen.getByTestId("editor-page").textContent).toContain(
      "Mobil Bankacılık 3.0",
    )
  })

  it("Test 2: no ?projectId redirects to /projects", () => {
    setSearchParams("")
    setViewport(1280)
    mockUseProjectImpl.mockReturnValue({ data: null, isLoading: false })
    render(<WorkflowEditorRoute />)
    expect(mockReplace).toHaveBeenCalledWith("/projects")
  })

  it("Test 3: invalid (non-numeric) ?projectId redirects to /projects", () => {
    setSearchParams("projectId=banana")
    setViewport(1280)
    mockUseProjectImpl.mockReturnValue({ data: null, isLoading: false })
    render(<WorkflowEditorRoute />)
    expect(mockReplace).toHaveBeenCalledWith("/projects")
  })

  it("Test 4: viewport 768 + valid id renders ViewportFallback (no EditorPage)", () => {
    setSearchParams("projectId=42")
    setViewport(768)
    mockUseProjectImpl.mockReturnValue({
      data: { id: 42, name: "Mobil Bankacılık 3.0", key: "MOBIL", methodology: "SCRUM" },
      isLoading: false,
    })
    render(<WorkflowEditorRoute />)
    expect(screen.getByTestId("viewport-fallback")).toBeTruthy()
    expect(screen.queryByTestId("editor-page")).toBeNull()
  })

  it("Test 5: fallback 'Projeye Dön' button calls router.push('/projects/' + id)", () => {
    setSearchParams("projectId=42")
    setViewport(768)
    mockUseProjectImpl.mockReturnValue({
      data: { id: 42, name: "Mobil Bankacılık 3.0", key: "MOBIL", methodology: "SCRUM" },
      isLoading: false,
    })
    render(<WorkflowEditorRoute />)
    const btn = screen.getByText("Projeye Dön")
    fireEvent.click(btn)
    expect(mockPush).toHaveBeenCalledWith("/projects/42")
  })
})
