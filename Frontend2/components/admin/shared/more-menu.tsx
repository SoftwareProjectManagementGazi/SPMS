"use client"

// Phase 14 Plan 14-01 — Shared MoreH dropdown menu (Wave 0).
//
// Donor source: Frontend2/components/projects/project-card.tsx lines 167-197
// (existing icon-button dropdown pattern with click-outside dismiss).
//
// Consumed by Plans 14-02 (Pending requests), 14-03 (Users row), 14-05
// (Projects row), 14-06 (Workflow templates), 14-07 (Audit row). Building
// it once in Wave 0 keeps Wave 2 surface plans purely consumer-side and
// resists per-plan dropdown drift (RESEARCH § Don't Hand-Roll line 830).
//
// API:
// - <MoreMenu items={[{id, label, icon?, onClick, disabled?, destructive?}]} trigger?={...}/>
// - Trigger defaults to a ghost icon button with the MoreHorizontal icon
//   (matches the prototype's per-row admin table action buttons).
// - Destructive items render with var(--priority-critical) color.
// - Click-outside dismiss via document mousedown listener.
// - ESC key closes the menu.

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/primitives"

export interface MoreMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}

export interface MoreMenuProps {
  items: MoreMenuItem[]
  trigger?: React.ReactNode
  ariaLabel?: string  // a11y label for the default icon trigger
}

export function MoreMenu({ items, trigger, ariaLabel = "İşlemler" }: MoreMenuProps) {
  const [open, setOpen] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  // Click-outside dismiss (donor pattern: project-card.tsx:71-82).
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // ESC key dismiss
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  const handleItemClick = (item: MoreMenuItem) => {
    if (item.disabled) return
    setOpen(false)
    item.onClick()
  }

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", display: "inline-flex" }}
      onClick={(e) => e.stopPropagation()}
    >
      {trigger ? (
        <span onClick={() => setOpen((v) => !v)}>{trigger}</span>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          aria-label={ariaLabel}
          onClick={() => setOpen((v) => !v)}
          icon={<MoreHorizontal size={16} />}
        />
      )}
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            minWidth: 160,
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-lg)",
            padding: 4,
            zIndex: 50,
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className="hover-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: item.disabled ? "not-allowed" : "pointer",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: 12.5,
                color: item.destructive ? "var(--priority-critical)" : "var(--fg)",
                opacity: item.disabled ? 0.5 : 1,
              }}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
