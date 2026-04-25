"use client"

// MTPicker — small dropdown used in the MTToolbar for the sort selector.
//
// Ported from the prototype (`New_Frontend/src/pages/my-tasks.jsx`) MTPicker
// invocation at line 479. The prototype's MTPicker is a generic select-style
// dropdown; the page only uses it for sort, so the implementation stays
// minimal here and lives next to the toolbar (single-purpose).

import * as React from "react"
import { ChevronDown } from "lucide-react"

export interface MTPickerOption {
  id: string
  label: string
}

export interface MTPickerProps {
  value: string
  onChange: (id: string) => void
  options: MTPickerOption[]
  icon?: React.ReactNode
  /** Optional aria-label override for the trigger; defaults to the active option's label. */
  ariaLabel?: string
}

export function MTPicker({
  value,
  onChange,
  options,
  icon,
  ariaLabel,
}: MTPickerProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement | null>(null)
  const active = options.find((o) => o.id === value) ?? options[0]

  // Click-outside closes the menu — matches the BoardToolbar phase filter pattern
  // (see board-toolbar.tsx lines 71-82) so behaviour is consistent across the app.
  React.useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? active?.label}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 28,
          padding: "0 10px",
          background: "var(--surface)",
          color: "var(--fg)",
          fontSize: 12.5,
          fontWeight: 500,
          borderRadius: "var(--radius-sm)",
          // Match the secondary Button + inset border pattern.
          boxShadow:
            "0 1px 2px oklch(0 0 0 / 0.05), inset 0 0 0 1px var(--border)",
          cursor: "pointer",
        }}
      >
        {icon && (
          <span style={{ color: "var(--fg-subtle)", display: "inline-flex" }}>
            {icon}
          </span>
        )}
        <span>{active?.label}</span>
        <ChevronDown size={12} style={{ color: "var(--fg-subtle)" }} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            background: "var(--surface)",
            boxShadow: "var(--shadow-lg)",
            borderRadius: "var(--radius-sm)",
            padding: 4,
            minWidth: 160,
            zIndex: 50,
            border: "1px solid var(--border)",
          }}
        >
          {options.map((o) => {
            const selected = o.id === value
            return (
              <button
                type="button"
                key={o.id}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o.id)
                  setOpen(false)
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 10px",
                  fontSize: 12.5,
                  background: selected ? "var(--surface-2)" : "transparent",
                  border: "none",
                  color: "var(--fg)",
                  cursor: "pointer",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
