"use client"

// Modal primitive (UI-SPEC § Spacing).
//
// Reusable overlay + panel + slot sub-components. Used by AddUserModal,
// BulkInviteModal, AuditFilterModal, PendingRequestsModal and other admin sites.
//
// ConfirmDialog stays separate (different ergonomics — title/body/buttons are
// hard-coded). Modal is the general-purpose primitive for richer modal UIs that
// need custom Header / Body / Footer slots.
//
// Accessibility / robustness:
// - Rendered through a portal to document.body so ancestor overflow/transform/
//   opacity/z-index can't clip or dim it.
// - role="dialog" + aria-modal="true" on the PANEL (not the backdrop).
// - Focus is moved into the panel on open and restored to the previously
//   focused element on close.
// - Tab / Shift+Tab are trapped within the panel.
// - Body scroll is locked while open.
// - ESC dismisses.
// - Backdrop dismiss uses mousedown-origin tracking: a drag that STARTS inside
//   the panel (e.g. selecting input text) and ends on the backdrop does NOT
//   close it; only a press-and-release that both land on the backdrop closes.

import * as React from "react"
import { createPortal } from "react-dom"

export interface ModalProps {
  open: boolean
  onClose: () => void
  width?: number // default 480
  children: React.ReactNode
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, width = 480, children }: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  // Whether the current mouse gesture began on the backdrop itself. Reset on
  // every mousedown so a panel-origin drag that releases on the backdrop is
  // never treated as an outside click.
  const downOnBackdrop = React.useRef(false)

  // ESC dismiss + Tab focus trap.
  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key !== "Tab") return
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (focusables.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  // Focus-into-panel on open + restore-on-close, plus body scroll lock.
  React.useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const firstFocusable =
      panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? panel
    firstFocusable?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0 0 0 / 0.5)",
        backdropFilter: "blur(2px)",
      }}
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget
      }}
      onMouseUp={(e) => {
        const closeOnBackdrop =
          downOnBackdrop.current && e.target === e.currentTarget
        downOnBackdrop.current = false
        if (closeOnBackdrop) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          width,
          maxWidth: "calc(100% - 32px)",
          maxHeight: "calc(100% - 32px)",
          boxShadow: "var(--shadow-xl)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          outline: "none",
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

// Slot sub-components — verbatim padding from RESEARCH §Pattern 2 lines 614-625.

export function ModalHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 20,
        borderBottom: "1px solid var(--border)",
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  )
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        flex: 1,
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  )
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 12,
        borderTop: "1px solid var(--border)",
        display: "flex",
        gap: 8,
        justifyContent: "flex-end",
      }}
    >
      {children}
    </div>
  )
}
