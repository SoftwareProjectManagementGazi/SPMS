// StatusPicker keyboard integration — verifies the search-less picker focuses
// its listbox on open (so keystrokes land here, not on the sibling trigger) and
// that arrow-nav + Enter commit the HIGHLIGHTED row. The useListboxKeyboard hook
// has its own unit test; this covers the focus wiring the hook can't.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { StatusPicker } from "./status-picker"
import type { BoardColumnLite } from "@/services/project-service"

const columns: BoardColumnLite[] = [
  { id: 10, name: "To Do" },
  { id: 20, name: "In Progress" },
  { id: 30, name: "Done" },
]

beforeEach(() => {
  // jsdom doesn't implement scrollIntoView; the hook calls it on arrow nav.
  Element.prototype.scrollIntoView = vi.fn()
})

describe("StatusPicker keyboard nav", () => {
  it("focuses the listbox on open so keys land here (not the sibling trigger)", () => {
    render(
      <StatusPicker
        columns={columns}
        selectedColumnId={10}
        resolveColor={() => null}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole("listbox")).toHaveFocus()
  })

  it("ArrowDown + Enter commits the highlighted column, not always the first", () => {
    const onSelect = vi.fn()
    render(
      <StatusPicker
        columns={columns}
        selectedColumnId={10}
        resolveColor={() => null}
        onSelect={onSelect}
        onCancel={vi.fn()}
      />,
    )
    const listbox = screen.getByRole("listbox")
    // Cursor starts on the selected row (id 10, index 0) → ArrowDown → index 1.
    fireEvent.keyDown(listbox, { key: "ArrowDown" })
    fireEvent.keyDown(listbox, { key: "Enter" })
    expect(onSelect).toHaveBeenCalledWith(20)
  })

  it("Escape fires onCancel", () => {
    const onCancel = vi.fn()
    render(
      <StatusPicker
        columns={columns}
        selectedColumnId={null}
        resolveColor={() => null}
        onSelect={vi.fn()}
        onCancel={onCancel}
      />,
    )
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
