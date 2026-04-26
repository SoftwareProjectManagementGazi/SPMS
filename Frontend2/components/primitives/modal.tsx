"use client"

// Phase 14 Plan 14-01 — Modal primitive (UI-SPEC § Spacing).
//
// Reusable overlay + panel + slot sub-components. Used by AddUserModal,
// BulkInviteModal, AuditFilterModal, PendingRequestsModal (4 admin sites
// in Wave 2 plans 14-02 / 14-03 / 14-07).
//
// ConfirmDialog stays separate (different ergonomics — title/body/buttons
// are hard-coded). Modal is the general-purpose primitive for richer modal
// UIs that need custom Header / Body / Footer slots.
//
// Accessibility:
// - role="dialog" + aria-modal="true" on the overlay container
// - ESC key dismiss (document keydown listener mounted while open)
// - Click-outside dismiss (overlay onClick)
// - Click inside panel does NOT dismiss (e.stopPropagation on panel)

import * as React from "react"

export interface ModalProps {
  open: boolean
  onClose: () => void
  width?: number  // default 480
  children: React.ReactNode
}

export function Modal({ open, onClose, width = 480, children }: ModalProps) {
  React.useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
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
      onClick={onClose}
    >
      <div
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
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
