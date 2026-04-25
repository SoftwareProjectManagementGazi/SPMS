import * as React from "react"
import { describe, expect, it, beforeEach, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { useBacklogOpenState } from "./backlog-panel"

// Plan 11-06 backlog panel smoke tests — exercise the open-state hook
// (localStorage persistence, <1280px auto-close, defensive hydration order).
// Full component rendering requires mocked @dnd-kit + apiClient; the hook is
// the only piece with observable state transitions worth unit-testing directly.

describe("useBacklogOpenState", () => {
  beforeEach(() => {
    // Clear any stored keys from previous tests so each case starts clean.
    try {
      window.localStorage.clear()
    } catch {
      /* ignore */
    }
    // jsdom defaults innerWidth to 1024 which is < 1280 and would force the
    // hook's `narrow` flag on by default. Force a wide viewport so the
    // persistence tests observe `effectiveOpen === open`.
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1600,
    })
    window.dispatchEvent(new Event("resize"))
  })

  it("starts closed on first visit (D-14 default)", () => {
    const { result } = renderHook(() => useBacklogOpenState(999))
    expect(result.current.open).toBe(false)
    expect(result.current.effectiveOpen).toBe(false)
  })

  it("persists open=true to spms.backlog.open.{projectId}", () => {
    const { result } = renderHook(() => useBacklogOpenState(998))
    act(() => {
      result.current.setOpen(true)
    })
    expect(window.localStorage.getItem("spms.backlog.open.998")).toBe("true")
    expect(result.current.open).toBe(true)
    expect(result.current.effectiveOpen).toBe(true)
  })

  it("persists open=false over a prior true value", () => {
    window.localStorage.setItem("spms.backlog.open.997", "true")
    const { result } = renderHook(() => useBacklogOpenState(997))
    act(() => {
      result.current.setOpen(false)
    })
    expect(window.localStorage.getItem("spms.backlog.open.997")).toBe("false")
  })

  it("hydrates from localStorage on mount when a prior value exists", () => {
    window.localStorage.setItem("spms.backlog.open.996", "true")
    const { result } = renderHook(() => useBacklogOpenState(996))
    // The hook starts false then upgrades in a useEffect — after mount the
    // effect has run (renderHook flushes effects), so we observe the stored
    // value.
    expect(result.current.open).toBe(true)
  })

  it("auto-closes at narrow viewport (<1280px) regardless of stored open", () => {
    window.localStorage.setItem("spms.backlog.open.995", "true")
    // Shrink viewport BEFORE rendering so the initial resize listener fires
    // with the narrow value.
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    })
    const { result } = renderHook(() => useBacklogOpenState(995))
    // open reflects the user's intent (true), effectiveOpen is the computed
    // visibility (false because narrow) per D-54.
    expect(result.current.open).toBe(true)
    expect(result.current.narrow).toBe(true)
    expect(result.current.effectiveOpen).toBe(false)
  })

  it("each projectId has its own independent open state", () => {
    const hookA = renderHook(() => useBacklogOpenState(1))
    const hookB = renderHook(() => useBacklogOpenState(2))
    act(() => {
      hookA.result.current.setOpen(true)
    })
    expect(window.localStorage.getItem("spms.backlog.open.1")).toBe("true")
    expect(window.localStorage.getItem("spms.backlog.open.2")).toBe(null)
    expect(hookA.result.current.open).toBe(true)
    expect(hookB.result.current.open).toBe(false)
  })

  // UAT bug — toggle pill failed to reopen the panel after the X close button.
  // Root cause: `() => setOpen(!open)` in project-detail-shell.tsx captured a
  // stale `open` between renders. Fix is the functional-updater form, which
  // requires `setOpen` to accept both `(boolean)` AND `((prev) => boolean)`.
  it("setOpen accepts a functional updater (prev => next)", () => {
    const { result } = renderHook(() => useBacklogOpenState(994))
    act(() => {
      result.current.setOpen((prev) => !prev)
    })
    expect(result.current.open).toBe(true)
    expect(window.localStorage.getItem("spms.backlog.open.994")).toBe("true")
    act(() => {
      result.current.setOpen((prev) => !prev)
    })
    expect(result.current.open).toBe(false)
    expect(window.localStorage.getItem("spms.backlog.open.994")).toBe("false")
  })

  it("close → reopen sequence with functional updater (UAT regression)", () => {
    const { result } = renderHook(() => useBacklogOpenState(993))
    // Open
    act(() => {
      result.current.setOpen(true)
    })
    expect(result.current.effectiveOpen).toBe(true)
    // Close (simulates panel X button)
    act(() => {
      result.current.setOpen(false)
    })
    expect(result.current.effectiveOpen).toBe(false)
    // Reopen via the toggle's functional form — must flip back to true even
    // though the closure was created before the previous setState landed.
    act(() => {
      result.current.setOpen((prev) => !prev)
    })
    expect(result.current.open).toBe(true)
    expect(result.current.effectiveOpen).toBe(true)
  })
})

// D-15 compliance check — bulk-operation markers must NOT exist in the panel
// or row files. This is a regression guard; a future developer adding bulk-op
// code would trip this test before the change lands.
describe("D-15 bulk-ops deferred (regression guard)", () => {
  it("backlog-panel.tsx contains no bulk-selection markers", async () => {
    // Use vitest's dynamic import + raw text lookup via a side import.
    // Importing the module source is not straightforward in vitest; instead,
    // read the file via a Node fs call since we run in node + jsdom hybrid.
    const fs = await import("node:fs")
    const path = await import("node:path")
    const src = fs.readFileSync(
      path.resolve(__dirname, "backlog-panel.tsx"),
      "utf8"
    )
    expect(src).not.toMatch(/bulkSelect|bulk-action|selectAll|Toplu işlem|bulk_op/i)
  })

  it("backlog-task-row.tsx contains no bulk-selection markers", async () => {
    const fs = await import("node:fs")
    const path = await import("node:path")
    const src = fs.readFileSync(
      path.resolve(__dirname, "backlog-task-row.tsx"),
      "utf8"
    )
    expect(src).not.toMatch(/bulkSelect|bulk-action|selectAll|Toplu işlem|bulk_op/i)
  })
})

// Silence an unused-import warning for the vi symbol (kept available for any
// future mock-based test additions without churn).
void vi
