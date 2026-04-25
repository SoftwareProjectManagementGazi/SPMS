// Unit tests for Frontend2/lib/lifecycle/shortcuts.ts (Phase 12 Plan 12-01).
//
// Per 12-01-PLAN.md task 1 <behavior> Tests 1-2:
//   - isMac() returns true for navigator.platform="MacIntel"
//   - isMac() returns false for navigator.platform="Win32"
// Plus a coverage extension for matchesShortcut.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { isMac, matchesShortcut, KEYBOARD_SHORTCUTS } from "./shortcuts"

describe("isMac", () => {
  const originalPlatform = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(navigator),
    "platform",
  )

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(Object.getPrototypeOf(navigator), "platform", originalPlatform)
    }
  })

  it("returns true for MacIntel", () => {
    Object.defineProperty(navigator, "platform", {
      value: "MacIntel",
      configurable: true,
    })
    expect(isMac()).toBe(true)
  })

  it("returns false for Win32", () => {
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    })
    expect(isMac()).toBe(false)
  })
})

describe("matchesShortcut", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    })
  })

  it("Ctrl+S triggers the save shortcut on non-Mac", () => {
    const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true })
    expect(matchesShortcut(event, KEYBOARD_SHORTCUTS.save)).toBe(true)
  })

  it("plain S without modifier does NOT trigger save", () => {
    const event = new KeyboardEvent("keydown", { key: "s" })
    expect(matchesShortcut(event, KEYBOARD_SHORTCUTS.save)).toBe(false)
  })

  it("Ctrl+Shift+Z triggers redo, not undo", () => {
    const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true })
    expect(matchesShortcut(event, KEYBOARD_SHORTCUTS.redo)).toBe(true)
    expect(matchesShortcut(event, KEYBOARD_SHORTCUTS.undo)).toBe(false)
  })
})
