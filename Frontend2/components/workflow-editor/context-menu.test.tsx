// Unit tests for components/workflow-editor/context-menu.tsx
// (Phase 12 Plan 12-08).
//
// 8+ cases per 12-08-PLAN.md task 2 <behavior> Tests 1-8:
//   1. right-click on node -> "Grupla", "Çoğalt", "Adı düzenle", "Sil"
//   2. right-click on edge -> "Çift yönlü yap/kaldır", "Hepsi yap", "Etiketi düzenle", "Sil"
//   3. right-click on group -> "Grubu çöz", "Adı düzenle", "Sil"
//   4. right-click on canvas -> "Buraya düğüm ekle"
//   5. Shift+F10 fallback (modeled at the host level — here we assert open=true
//      renders the menu at the supplied position regardless of trigger)
//   6. Arrow Up/Down moves focus between menu items
//   7. Esc closes (calls onClose)
//   8. Click outside dismisses (calls onClose)

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { ContextMenu, type ContextMenuItem } from "./context-menu"

const POS = { x: 100, y: 200 }

function renderMenu(
  items: ContextMenuItem[],
  opts: {
    open?: boolean
    onSelect?: (id: string) => void
    onClose?: () => void
  } = {},
) {
  return render(
    <ContextMenu
      open={opts.open ?? true}
      position={POS}
      items={items}
      onSelect={opts.onSelect ?? (() => {})}
      onClose={opts.onClose ?? (() => {})}
    />,
  )
}

const NODE_ITEMS: ContextMenuItem[] = [
  { id: "group", label: "Grupla" },
  { id: "duplicate", label: "Çoğalt", shortcut: "⌘D" },
  { id: "edit-name", label: "Adı düzenle" },
  { id: "delete", label: "Sil", shortcut: "⌫", danger: true },
]

const EDGE_ITEMS: ContextMenuItem[] = [
  { id: "toggle-bidir", label: "Çift yönlü yap/kaldır" },
  { id: "toggle-allgate", label: "Hepsi yap" },
  { id: "edit-label", label: "Etiketi düzenle" },
  { id: "delete", label: "Sil", danger: true },
]

const GROUP_ITEMS: ContextMenuItem[] = [
  { id: "ungroup", label: "Grubu çöz" },
  { id: "edit-name", label: "Adı düzenle" },
  { id: "delete", label: "Sil", danger: true },
]

const CANVAS_ITEMS: ContextMenuItem[] = [
  { id: "add-node", label: "Buraya düğüm ekle" },
]

describe("ContextMenu — selection-aware items", () => {
  it("Test 1 (right-click on node): renders 'Grupla', 'Çoğalt', 'Adı düzenle', 'Sil'", () => {
    const { getByText } = renderMenu(NODE_ITEMS)
    expect(getByText("Grupla")).toBeTruthy()
    expect(getByText("Çoğalt")).toBeTruthy()
    expect(getByText("Adı düzenle")).toBeTruthy()
    expect(getByText("Sil")).toBeTruthy()
  })

  it("Test 2 (right-click on edge): renders 'Çift yönlü yap/kaldır', 'Hepsi yap', 'Etiketi düzenle', 'Sil'", () => {
    const { getByText } = renderMenu(EDGE_ITEMS)
    expect(getByText("Çift yönlü yap/kaldır")).toBeTruthy()
    expect(getByText("Hepsi yap")).toBeTruthy()
    expect(getByText("Etiketi düzenle")).toBeTruthy()
    expect(getByText("Sil")).toBeTruthy()
  })

  it("Test 3 (right-click on group): renders 'Grubu çöz', 'Adı düzenle', 'Sil'", () => {
    const { getByText } = renderMenu(GROUP_ITEMS)
    expect(getByText("Grubu çöz")).toBeTruthy()
    expect(getByText("Adı düzenle")).toBeTruthy()
    expect(getByText("Sil")).toBeTruthy()
  })

  it("Test 4 (right-click on canvas): renders 'Buraya düğüm ekle'", () => {
    const { getByText } = renderMenu(CANVAS_ITEMS)
    expect(getByText("Buraya düğüm ekle")).toBeTruthy()
  })
})

describe("ContextMenu — open/close lifecycle", () => {
  it("Test 5 (Shift+F10 fallback): when open=true, menu renders at supplied position", () => {
    const { container } = renderMenu(NODE_ITEMS, { open: true })
    const menu = container.querySelector("[role='menu']") as HTMLElement
    expect(menu).toBeTruthy()
    expect(menu.style.left).toBe("100px")
    expect(menu.style.top).toBe("200px")
  })

  it("returns null when open=false", () => {
    const { container } = renderMenu(NODE_ITEMS, { open: false })
    expect(container.querySelector("[role='menu']")).toBeNull()
  })
})

describe("ContextMenu — keyboard nav + Esc + click-outside", () => {
  it("Test 6 (arrow navigation): ArrowDown moves focus between menu items", () => {
    const { container } = renderMenu(NODE_ITEMS)
    const items = container.querySelectorAll("[role='menuitem']")
    expect(items.length).toBe(4)
    // Initial focus on first item
    fireEvent.keyDown(window, { key: "ArrowDown" })
    // After ArrowDown, focus should be on item 1 (or 0 if first focus is none)
    // We assert by checking data-focus-index attribute on the menu
    const menu = container.querySelector("[role='menu']") as HTMLElement
    expect(menu.getAttribute("data-focus-index")).toBe("1")
  })

  it("Test 7 (Esc closes): pressing Escape calls onClose", () => {
    const onClose = vi.fn()
    renderMenu(NODE_ITEMS, { onClose })
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })

  it("Test 8 (click outside dismisses): mousedown outside the menu calls onClose", () => {
    const onClose = vi.fn()
    const { container } = renderMenu(NODE_ITEMS, { onClose })
    const menu = container.querySelector("[role='menu']") as HTMLElement
    expect(menu).toBeTruthy()
    // Fire mousedown on an element outside the menu (document.body itself)
    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalled()
  })
})

describe("ContextMenu — selection callback wiring", () => {
  it("clicking 'Sil' calls onSelect('delete')", () => {
    const onSelect = vi.fn()
    const { getByText } = renderMenu(NODE_ITEMS, { onSelect })
    fireEvent.click(getByText("Sil"))
    expect(onSelect).toHaveBeenCalledWith("delete")
  })

  it("Enter key on focused item activates onSelect", () => {
    const onSelect = vi.fn()
    renderMenu(NODE_ITEMS, { onSelect })
    fireEvent.keyDown(window, { key: "Enter" })
    // First item is focused by default -> 'group'
    expect(onSelect).toHaveBeenCalledWith("group")
  })
})
