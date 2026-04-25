"use client"

// ContextMenu (Phase 12 Plan 12-08) — right-click + Shift+F10 fallback menu
// for the Workflow Editor (CONTEXT D-20.5; UI-SPEC §15 lines 1322-1354).
//
// Selection-aware items are computed by the host (editor-page) — this
// component is a pure presentational menu that:
//   1. Auto-positions at `position.x, position.y` (absolute, no portal yet).
//   2. Supports keyboard navigation (Arrow Up/Down, Enter, Escape).
//   3. Dismisses on Escape and on outside mousedown.
//   4. Renders danger items in priority-critical color tone.
//
// CSS tokens follow UI-SPEC §15: surface/shadow-lg/border/radius-sm with
// 200px min-width and 4px vertical padding.

import * as React from "react"
import { Kbd } from "@/components/primitives"

export interface ContextMenuItem {
  id: string
  label: string
  shortcut?: string
  danger?: boolean
  /** Disabled items remain rendered but skip onSelect + arrow focus. */
  disabled?: boolean
}

export interface ContextMenuProps {
  open: boolean
  position: { x: number; y: number }
  items: ContextMenuItem[]
  onSelect: (id: string) => void
  onClose: () => void
}

export function ContextMenu({
  open,
  position,
  items,
  onSelect,
  onClose,
}: ContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const [focusIndex, setFocusIndex] = React.useState(0)

  // Reset focus to the first item every time the menu opens.
  React.useEffect(() => {
    if (open) setFocusIndex(0)
  }, [open])

  // Triage #20 — move keyboard focus onto the focused menu item so screen
  // readers + sighted keyboard users see a clear focus indicator. We also
  // remember the previously focused element and restore it on close.
  React.useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const root = menuRef.current
    const target = root?.querySelectorAll<HTMLElement>(
      "[role='menuitem']:not([disabled])",
    )?.[focusIndex]
    target?.focus()
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [open, focusIndex])

  // Keyboard handler — registered globally because right-click menus do not
  // get focus rings by default; Esc/Arrow keys must work without clicking.
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setFocusIndex((i) => {
          const next = (i + 1) % items.length
          return next
        })
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setFocusIndex((i) => (i - 1 + items.length) % items.length)
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        const item = items[focusIndex]
        if (item && !item.disabled) {
          onSelect(item.id)
          onClose()
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, items, focusIndex, onSelect, onClose])

  // Click-outside dismiss
  React.useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={menuRef}
      role="menu"
      data-focus-index={focusIndex}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 1200,
        minWidth: 200,
        background: "var(--surface)",
        boxShadow:
          "var(--shadow-lg, 0 8px 24px oklch(0 0 0 / 0.16)), inset 0 0 0 1px var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "4px 0",
      }}
    >
      {items.map((item, idx) => {
        const focused = idx === focusIndex
        return (
          <button
            key={item.id}
            role="menuitem"
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return
              onSelect(item.id)
              onClose()
            }}
            onMouseEnter={() => {
              if (!item.disabled) setFocusIndex(idx)
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "6px 10px",
              fontSize: 12.5,
              color: item.disabled
                ? "var(--fg-subtle)"
                : item.danger
                  ? "var(--priority-critical)"
                  : "var(--fg)",
              background: focused ? "var(--surface-2)" : "transparent",
              border: 0,
              cursor: item.disabled ? "not-allowed" : "pointer",
              textAlign: "left",
            }}
          >
            <span>{item.label}</span>
            {item.shortcut ? (
              <span style={{ marginLeft: "auto" }}>
                <Kbd>{item.shortcut}</Kbd>
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
