"use client"

// StatusPicker — searchless popover for choosing a task's board column
// (a.k.a. status). Mirrors AssigneePicker's structure so the two pickers
// feel like a family: same 240-wide card, same shadow / radius / border,
// same click-outside + Escape dismissal, same role="listbox" with
// role="option" rows. The search input is omitted because a project's
// column list is short (4–6 rows for built-in methodologies) and the
// dropdown reads at-a-glance.
//
// Each row renders a colored dot whose color tracks the workflow editor
// token (`processConfig.task_workflow.nodes[i].color`) — see
// resolveStatusColorToken in properties-sidebar.tsx for the lookup. The
// dot is a shade darker than the badge tint so it stays distinguishable
// against the row background; the rest of the row sticks to neutral
// foreground colors so the picker doesn't look like a candy store.
//
// API:
//   columns           — board columns to list (ordered as-rendered)
//   selectedColumnId  — current column id; the matching row gets a Check icon
//   resolveColor      — column-name → token resolver supplied by caller
//   onSelect          — fires with the chosen column id, then caller closes
//   onCancel          — Esc / click-outside

import * as React from "react"
import { Check } from "lucide-react"

import { useApp } from "@/context/app-context"
import type { BoardColumnLite } from "@/services/project-service"

interface StatusPickerProps {
  columns: BoardColumnLite[]
  selectedColumnId: number | null
  resolveColor: (columnName: string) => string | null
  onSelect: (columnId: number) => void
  onCancel: () => void
  /** Anchor side. "end" right-aligns so the picker grows leftward — the
   *  default in the Task Detail properties sidebar where the 300px right
   *  column sits flush with the page edge. */
  align?: "start" | "end"
}

// Darken the workflow token by mixing with black in OKLCH so the dot
// stays on-hue but reads visibly darker than the row's tinted text /
// background. 30% black ≈ "one notch darker" — same recipe used in the
// inline badge so the dot is consistent across surfaces.
function darkDotColor(token: string | null): string {
  if (!token) return "var(--fg-subtle)"
  return `color-mix(in oklch, var(--${token}) 70%, black)`
}

export function StatusPicker({
  columns,
  selectedColumnId,
  resolveColor,
  onSelect,
  onCancel,
  align = "end",
}: StatusPickerProps) {
  const { language: lang } = useApp()
  const ref = React.useRef<HTMLDivElement | null>(null)

  // Click-outside dismissal — same pattern as AssigneePicker. mousedown
  // (not click) so a row's click handler still fires before we dismiss;
  // mousedown happens once, click follows after mouseup on the same row.
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    // M-T3 — also dismiss on scroll/resize so this absolutely-positioned
    // popover never floats away from (or clips past) its trigger. capture:true
    // catches scrolls in any ancestor scroll container, not only the window.
    const onReposition = () => onCancel()
    document.addEventListener("mousedown", onDown)
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)
    return () => {
      document.removeEventListener("mousedown", onDown)
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
    }
  }, [onCancel])

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div
      ref={ref}
      onKeyDown={onKey}
      role="listbox"
      aria-label={lang === "tr" ? "Görev durumu seç" : "Select task status"}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        [align === "end" ? "right" : "left"]: 0,
        width: 200,
        background: "var(--surface)",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        zIndex: 50,
        overflow: "hidden",
        padding: 4,
      }}
    >
      {columns.length === 0 && (
        <div
          style={{
            padding: 8,
            fontSize: 12,
            color: "var(--fg-subtle)",
            textAlign: "center",
          }}
        >
          {lang === "tr" ? "Durum bulunamadı" : "No statuses"}
        </div>
      )}
      {columns.map((col) => {
        const selected = col.id === selectedColumnId
        const token = resolveColor(col.name)
        const dotColor = darkDotColor(token)
        return (
          <button
            key={col.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(col.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "6px 8px",
              fontSize: 12.5,
              background: selected ? "var(--surface-2)" : "transparent",
              color: "var(--fg)",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--radius-sm)",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                "var(--surface-2)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                selected ? "var(--surface-2)" : "transparent"
            }}
          >
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: dotColor,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {col.name}
            </span>
            {selected && (
              <Check
                size={12}
                style={{ color: "var(--primary)" }}
                aria-hidden
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
