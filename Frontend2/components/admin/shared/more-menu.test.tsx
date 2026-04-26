// Phase 14 Plan 14-01 Task 1 — Shared MoreMenu primitive tests.
//
// Verifies:
// - Trigger renders + menu starts closed
// - Click trigger opens menu with N items
// - Click item fires its onClick AND closes menu
// - Destructive item has var(--priority-critical) color
// - Disabled item is non-clickable + non-destructive on click
// - Click-outside dismisses menu
// - ESC dismisses menu

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MoreMenu, type MoreMenuItem } from "./more-menu"

// Stub primitives Button to a plain button so the click handler chain works
// without lucide-react SVG paths interfering with assertions.
vi.mock("@/components/primitives", () => ({
  Button: ({ children, onClick, "aria-label": ariaLabel, icon }: any) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {icon}
      {children}
    </button>
  ),
}))

const ITEMS: MoreMenuItem[] = [
  { id: "deactivate", label: "Devre dışı bırak", onClick: vi.fn() },
  { id: "reset", label: "Şifre sıfırla", onClick: vi.fn() },
  { id: "delete", label: "Sil", destructive: true, onClick: vi.fn() },
]

const ITEMS_WITH_DISABLED: MoreMenuItem[] = [
  { id: "edit", label: "Düzenle", onClick: vi.fn() },
  { id: "transfer", label: "Devret", disabled: true, onClick: vi.fn() },
]

describe("MoreMenu (Plan 14-01 Task 1 — shared dropdown)", () => {
  it("renders trigger button + menu starts closed", () => {
    render(<MoreMenu items={ITEMS} ariaLabel="Test menüsü" />)
    expect(screen.getByLabelText("Test menüsü")).toBeInTheDocument()
    // Menu items not yet rendered (closed by default)
    expect(screen.queryByText("Devre dışı bırak")).toBeNull()
  })

  it("clicking trigger opens menu and renders all items", () => {
    render(<MoreMenu items={ITEMS} ariaLabel="Aç" />)
    fireEvent.click(screen.getByLabelText("Aç"))
    expect(screen.getByText("Devre dışı bırak")).toBeInTheDocument()
    expect(screen.getByText("Şifre sıfırla")).toBeInTheDocument()
    expect(screen.getByText("Sil")).toBeInTheDocument()
  })

  it("clicking an item fires its onClick AND closes the menu", () => {
    const onClick = vi.fn()
    const items: MoreMenuItem[] = [
      { id: "act", label: "Eylem", onClick },
    ]
    render(<MoreMenu items={items} ariaLabel="Aç" />)
    fireEvent.click(screen.getByLabelText("Aç"))
    expect(screen.getByText("Eylem")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Eylem"))
    expect(onClick).toHaveBeenCalledTimes(1)
    // Menu closed — text gone
    expect(screen.queryByText("Eylem")).toBeNull()
  })

  it("destructive item is styled with var(--priority-critical)", () => {
    render(<MoreMenu items={ITEMS} ariaLabel="Aç" />)
    fireEvent.click(screen.getByLabelText("Aç"))
    const deleteBtn = screen.getByText("Sil").closest("button")
    expect(deleteBtn).not.toBeNull()
    // Inline style attribute carries the color token literally
    expect(deleteBtn!.style.color).toContain("var(--priority-critical)")
  })

  it("disabled item does NOT fire onClick when clicked", () => {
    const onTransfer = vi.fn()
    const items: MoreMenuItem[] = [
      { id: "transfer", label: "Devret", disabled: true, onClick: onTransfer },
    ]
    render(<MoreMenu items={items} ariaLabel="Aç" />)
    fireEvent.click(screen.getByLabelText("Aç"))
    fireEvent.click(screen.getByText("Devret"))
    // The button itself is `disabled`, so click should be a no-op.
    expect(onTransfer).not.toHaveBeenCalled()
  })

  it("clicking outside the menu closes it (mousedown listener)", () => {
    render(
      <div>
        <MoreMenu items={ITEMS} ariaLabel="Aç" />
        <div data-testid="outside">Dış element</div>
      </div>,
    )
    fireEvent.click(screen.getByLabelText("Aç"))
    expect(screen.getByText("Devre dışı bırak")).toBeInTheDocument()
    // Simulate the document-level mousedown that the effect listens to.
    fireEvent.mouseDown(screen.getByTestId("outside"))
    expect(screen.queryByText("Devre dışı bırak")).toBeNull()
  })

  it("ESC key closes the menu", () => {
    render(<MoreMenu items={ITEMS} ariaLabel="Aç" />)
    fireEvent.click(screen.getByLabelText("Aç"))
    expect(screen.getByText("Sil")).toBeInTheDocument()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByText("Sil")).toBeNull()
  })
})
