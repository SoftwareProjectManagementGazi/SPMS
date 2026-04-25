// Unit tests for components/workflow-editor/editor-page.tsx (Phase 12 Plan 12-07).
//
// 4 cases per 12-07-PLAN.md task 1 <behavior> Tests 6-9:
//   6. header H1 + subtitle + Save/Geri/Çoğalt buttons render
//   7. toolbar mode pill + template + Undo/Redo + zoom render
//   8. mode pill change updates ?mode= URL via router.replace
//   9. Save button disabled when useTransitionAuthority=false (with Tooltip)

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

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
    mockUseTransitionAuthority.mockReturnValue(true)
    setSearchParams("projectId=42")
  })

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
})
