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
  /** Optional CSS colour painted as a 8px square left of the label (project / status pickers). */
  dot?: string
  /** Optional mono sub-text appended after the label (e.g. project key). */
  sub?: string
  /** Optional pre-rendered icon node painted before the dot (priority picker uses 4-bar PriorityChip here). */
  icon?: React.ReactNode
}

export interface MTPickerProps {
  value: string
  onChange: (id: string) => void
  options: MTPickerOption[]
  /** Trigger-only icon when no per-option icon is set (e.g. sort picker chevron). */
  icon?: React.ReactNode
  /** Optional aria-label override for the trigger; defaults to the active option's label. */
  ariaLabel?: string
  /** Compact mode (Quick Add): show only the active option's icon/dot + key in the trigger. */
  compactLabel?: "label" | "sub"
  /** Disable the trigger (parent layout still renders). */
  disabled?: boolean
  /** Minimum trigger width — prevents the dropdown from shifting when the active label is short. */
  minWidth?: number
  /** Inline style override for the trigger button. */
  style?: React.CSSProperties
}

function OptionRow({
  o,
  selected,
}: {
  o: MTPickerOption
  selected: boolean
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flex: 1,
        minWidth: 0,
      }}
    >
      {o.icon}
      {o.dot && (
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: o.dot,
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: selected ? 600 : 500,
        }}
      >
        {o.label}
      </span>
      {o.sub && (
        <span
          className="mono"
          style={{
            fontSize: 10.5,
            color: "var(--fg-subtle)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {o.sub}
        </span>
      )}
    </span>
  )
}

export function MTPicker({
  value,
  onChange,
  options,
  icon,
  ariaLabel,
  compactLabel,
  disabled,
  minWidth,
  style,
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

  // Trigger uses a compact layout when the caller asks for `compactLabel="sub"`
  // — surface the active option's `sub` (project key) instead of the full
  // label, so a Quick Add row can show "PRJ-7" rather than the full project
  // name in a tight inline strip.
  const triggerCompactSub =
    compactLabel === "sub" && active?.sub ? active.sub : null

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? active?.label}
        disabled={disabled}
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
          minWidth,
          // Match the secondary Button + inset border pattern.
          boxShadow:
            "0 1px 2px oklch(0 0 0 / 0.05), inset 0 0 0 1px var(--border)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.55 : 1,
          ...style,
        }}
      >
        {icon && (
          <span style={{ color: "var(--fg-subtle)", display: "inline-flex" }}>
            {icon}
          </span>
        )}
        {active?.icon}
        {active?.dot && (
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: active.dot,
              flexShrink: 0,
            }}
          />
        )}
        <span
          className={triggerCompactSub ? "mono" : undefined}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            ...(triggerCompactSub
              ? {
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--fg-muted)",
                }
              : {}),
          }}
        >
          {triggerCompactSub ?? active?.label}
        </span>
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
            minWidth: 200,
            maxHeight: 280,
            overflowY: "auto",
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
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
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
                <OptionRow o={o} selected={selected} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
