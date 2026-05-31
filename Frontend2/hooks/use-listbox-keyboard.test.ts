// Unit tests for useListboxKeyboard — the shared picker keyboard-nav hook.

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useListboxKeyboard } from "./use-listbox-keyboard"

// Minimal synthetic-event stub — only key + preventDefault are read.
function key(k: string): React.KeyboardEvent {
  return { key: k, preventDefault: vi.fn() } as unknown as React.KeyboardEvent
}

describe("useListboxKeyboard", () => {
  it("initialises the cursor on the selected row", () => {
    const { result } = renderHook(() =>
      useListboxKeyboard({
        itemCount: 5,
        selectedIndex: 2,
        onEnter: vi.fn(),
        onCancel: vi.fn(),
      }),
    )
    expect(result.current.activeIndex).toBe(2)
  })

  it("defaults the cursor to 0 when nothing is selected", () => {
    const { result } = renderHook(() =>
      useListboxKeyboard({
        itemCount: 4,
        selectedIndex: -1,
        onEnter: vi.fn(),
        onCancel: vi.fn(),
      }),
    )
    expect(result.current.activeIndex).toBe(0)
  })

  it("ArrowDown / ArrowUp move the cursor and clamp at both ends", () => {
    const { result } = renderHook(() =>
      useListboxKeyboard({
        itemCount: 3,
        selectedIndex: -1,
        onEnter: vi.fn(),
        onCancel: vi.fn(),
      }),
    )
    act(() => result.current.onKeyDown(key("ArrowUp"))) // already at 0 → clamp
    expect(result.current.activeIndex).toBe(0)
    act(() => result.current.onKeyDown(key("ArrowDown")))
    act(() => result.current.onKeyDown(key("ArrowDown")))
    act(() => result.current.onKeyDown(key("ArrowDown"))) // clamp at last (2)
    expect(result.current.activeIndex).toBe(2)
    act(() => result.current.onKeyDown(key("ArrowUp")))
    expect(result.current.activeIndex).toBe(1)
  })

  it("Home / End jump to the first / last row", () => {
    const { result } = renderHook(() =>
      useListboxKeyboard({
        itemCount: 4,
        selectedIndex: 1,
        onEnter: vi.fn(),
        onCancel: vi.fn(),
      }),
    )
    act(() => result.current.onKeyDown(key("End")))
    expect(result.current.activeIndex).toBe(3)
    act(() => result.current.onKeyDown(key("Home")))
    expect(result.current.activeIndex).toBe(0)
  })

  it("Enter commits the ARROW-highlighted row, not always index 0", () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() =>
      useListboxKeyboard({
        itemCount: 3,
        selectedIndex: -1,
        onEnter,
        onCancel: vi.fn(),
      }),
    )
    act(() => result.current.onKeyDown(key("ArrowDown")))
    act(() => result.current.onKeyDown(key("Enter")))
    expect(onEnter).toHaveBeenCalledWith(1)
  })

  it("Escape fires onCancel", () => {
    const onCancel = vi.fn()
    const { result } = renderHook(() =>
      useListboxKeyboard({
        itemCount: 3,
        selectedIndex: 0,
        onEnter: vi.fn(),
        onCancel,
      }),
    )
    act(() => result.current.onKeyDown(key("Escape")))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("Enter is a no-op on an empty list", () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() =>
      useListboxKeyboard({
        itemCount: 0,
        selectedIndex: -1,
        onEnter,
        onCancel: vi.fn(),
      }),
    )
    act(() => result.current.onKeyDown(key("Enter")))
    expect(onEnter).not.toHaveBeenCalled()
  })

  it("re-snaps the cursor when the selection changes (e.g. value updated)", () => {
    const { result, rerender } = renderHook(
      ({ selectedIndex }) =>
        useListboxKeyboard({
          selectedIndex,
          itemCount: 5,
          onEnter: vi.fn(),
          onCancel: vi.fn(),
        }),
      { initialProps: { selectedIndex: 0 } },
    )
    act(() => result.current.onKeyDown(key("ArrowDown"))) // cursor → 1
    expect(result.current.activeIndex).toBe(1)
    rerender({ selectedIndex: 3 }) // selection moved out from under the cursor
    expect(result.current.activeIndex).toBe(3)
  })
})
