// Unit tests for hooks/use-editor-history.ts (Phase 12 Plan 12-01).
//
// 4 cases per 12-01-PLAN.md task 2 <behavior> Tests 1-4. Uses RTL's
// renderHook. The hook itself only depends on React state, no providers.

import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useEditorHistory } from "./use-editor-history"
import type { WorkflowConfig } from "@/services/lifecycle-service"

function wf(label: string): WorkflowConfig {
  return {
    mode: "flexible",
    nodes: [{ id: label, name: label, x: 0, y: 0 }],
    edges: [],
  }
}

describe("useEditorHistory", () => {
  it("push 3 workflows -> past has 3 entries, future is empty", () => {
    const { result } = renderHook(() => useEditorHistory())
    act(() => result.current.push(wf("a")))
    act(() => result.current.push(wf("b")))
    act(() => result.current.push(wf("c")))
    expect(result.current.past).toHaveLength(3)
    expect(result.current.future).toHaveLength(0)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it("undo -> past shrinks, future grows, returns popped snapshot", () => {
    const { result } = renderHook(() => useEditorHistory())
    act(() => result.current.push(wf("a")))
    act(() => result.current.push(wf("b")))
    act(() => result.current.push(wf("c")))
    let popped: WorkflowConfig | null = null
    act(() => {
      popped = result.current.undo(wf("current"))
    })
    expect(popped).not.toBeNull()
    expect((popped as unknown as WorkflowConfig).nodes[0].id).toBe("c")
    expect(result.current.past).toHaveLength(2)
    expect(result.current.future).toHaveLength(1)
  })

  it("redo -> past grows, future shrinks, returns next snapshot", () => {
    const { result } = renderHook(() => useEditorHistory())
    act(() => result.current.push(wf("a")))
    act(() => result.current.push(wf("b")))
    act(() => result.current.push(wf("c")))
    act(() => {
      result.current.undo(wf("current"))
    })
    let nextSnap: WorkflowConfig | null = null
    act(() => {
      nextSnap = result.current.redo(wf("after-undo"))
    })
    expect(nextSnap).not.toBeNull()
    expect(result.current.past).toHaveLength(3)
    expect(result.current.future).toHaveLength(0)
  })

  it("clear -> past = [] AND future = []", () => {
    const { result } = renderHook(() => useEditorHistory())
    act(() => result.current.push(wf("a")))
    act(() => result.current.push(wf("b")))
    act(() => {
      result.current.undo(wf("current"))
    })
    expect(result.current.past.length).toBeGreaterThan(0)
    expect(result.current.future.length).toBeGreaterThan(0)
    act(() => result.current.clear())
    expect(result.current.past).toHaveLength(0)
    expect(result.current.future).toHaveLength(0)
  })
})
