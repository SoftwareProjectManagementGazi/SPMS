import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, act, renderHook } from "@testing-library/react"
import { TaskModalProvider, useTaskModal } from "./task-modal-context"

describe("useTaskModal", () => {
  it("throws outside provider", () => {
    const Consumer = () => {
      useTaskModal()
      return null
    }
    // Suppress React error logging in test output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<Consumer />)).toThrow(/useTaskModal must be used within TaskModalProvider/)
    spy.mockRestore()
  })

  it("opens and closes the modal, stores defaults", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TaskModalProvider>{children}</TaskModalProvider>
    )
    const { result } = renderHook(() => useTaskModal(), { wrapper })

    expect(result.current.isOpen).toBe(false)
    expect(result.current.defaults).toBeNull()

    act(() => {
      result.current.openTaskModal({ defaultProjectId: 1, defaultType: "subtask", defaultParentId: 42 })
    })
    expect(result.current.isOpen).toBe(true)
    expect(result.current.defaults).toEqual({ defaultProjectId: 1, defaultType: "subtask", defaultParentId: 42 })

    act(() => {
      result.current.closeTaskModal()
    })
    expect(result.current.isOpen).toBe(false)
    expect(result.current.defaults).toBeNull()
  })

  it("memoizes context value when inputs unchanged (stable identity on re-render)", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TaskModalProvider>{children}</TaskModalProvider>
    )
    const { result, rerender } = renderHook(() => useTaskModal(), { wrapper })
    const firstValue = result.current
    rerender()
    // openTaskModal/closeTaskModal are useCallback-stable; isOpen/defaults unchanged.
    expect(result.current.openTaskModal).toBe(firstValue.openTaskModal)
    expect(result.current.closeTaskModal).toBe(firstValue.closeTaskModal)
  })
})
