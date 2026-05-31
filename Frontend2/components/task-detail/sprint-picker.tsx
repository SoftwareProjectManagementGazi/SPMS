"use client"

// SprintPicker — searchless popover for choosing a task's sprint /
// iteration cycle. Twin of StatusPicker (same 200-wide card, same
// click-outside + Escape dismissal, same role="listbox" with role="option"
// rows) plus an "Unassign" row at the top so the user can clear the
// cycle_id without juggling a separate control.
//
// API mirrors StatusPicker for cognitive consistency; the only extra
// concept is the optional null value (no sprint assigned). Active-vs-
// planned sprints get a small "• Aktif" tag so users can pick the
// in-flight cycle without cross-referencing the Sprints page.

import * as React from "react"
import { Check, CircleSlash } from "lucide-react"

import { useApp } from "@/context/app-context"
import { useListboxKeyboard } from "@/hooks/use-listbox-keyboard"
import type { Sprint } from "@/hooks/use-sprints"

interface SprintPickerProps {
  sprints: Sprint[]
  selectedSprintId: number | null
  onSelect: (sprintId: number | null) => void
  onCancel: () => void
  align?: "start" | "end"
}

export function SprintPicker({
  sprints,
  selectedSprintId,
  onSelect,
  onCancel,
  align = "end",
}: SprintPickerProps) {
  const { language: lang } = useApp()
  const ref = React.useRef<HTMLDivElement | null>(null)

  // Click-outside dismissal — same pattern as StatusPicker / AssigneePicker.
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener("mousedown", onDown)
    // M-T3 — also dismiss on scroll/resize so the popover doesn't float away
    // from (or clip past) its trigger (capture:true catches ancestor scroll).
    const onReposition = () => onCancel()
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)
    return () => {
      document.removeEventListener("mousedown", onDown)
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
    }
  }, [onCancel])

  // Sort: active sprint first, then planned (chronological by id), then
  // closed at the bottom. The picker is the place where the user
  // typically wants to reach the active cycle quickly.
  const orderedSprints = React.useMemo(() => {
    const rank: Record<Sprint["status"], number> = {
      ACTIVE: 0,
      PLANNED: 1,
      CLOSED: 2,
    }
    return [...sprints].sort((a, b) => {
      const r = (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
      if (r !== 0) return r
      return a.id - b.id
    })
  }, [sprints])

  // Shared keyboard listbox nav over the sprint rows (the Unassign row above is
  // mouse/Tab-only). activeIndex cursor + arrow/Home/End/Enter.
  const selectedIndex = orderedSprints.findIndex(
    (s) => s.id === selectedSprintId,
  )
  const { activeIndex, setActiveIndex, rowRefs, onKeyDown } =
    useListboxKeyboard({
      itemCount: orderedSprints.length,
      selectedIndex,
      onEnter: (i) => {
        const s = orderedSprints[i]
        if (s) onSelect(s.id)
      },
      onCancel,
    })

  // Focus the listbox on open so arrow-key nav + Escape land here. This
  // search-less picker has no input to hold focus and the trigger is a
  // sibling, so without this the onKeyDown handler would never fire.
  React.useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <div
      ref={ref}
      onKeyDown={onKeyDown}
      tabIndex={-1}
      role="listbox"
      aria-label={lang === "tr" ? "Döngü seç" : "Select cycle"}
      aria-activedescendant={
        orderedSprints[activeIndex]
          ? `sprint-opt-${orderedSprints[activeIndex].id}`
          : undefined
      }
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
        outline: "none",
      }}
    >
      {/* Unassign row — surfaced only when a sprint is currently picked,
          mirroring AssigneePicker's "Atamayı kaldır" affordance. */}
      {selectedSprintId != null && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "6px 10px",
            fontSize: 12.5,
            background: "transparent",
            color: "var(--fg-muted)",
            border: "none",
            cursor: "pointer",
            borderBottom: "1px solid var(--border)",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              "var(--surface-2)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              "transparent"
          }}
        >
          <CircleSlash size={13} aria-hidden />
          <span>{lang === "tr" ? "Atamayı kaldır" : "Unassign"}</span>
        </button>
      )}

      {/* Result list */}
      <div
        style={{
          maxHeight: 240,
          overflowY: "auto",
          padding: 4,
        }}
      >
        {orderedSprints.length === 0 && (
          <div
            style={{
              padding: 8,
              fontSize: 12,
              color: "var(--fg-subtle)",
              textAlign: "center",
            }}
          >
            {lang === "tr" ? "Döngü bulunamadı" : "No cycles"}
          </div>
        )}
        {orderedSprints.map((s, i) => {
          const selected = s.id === selectedSprintId
          const isActive = i === activeIndex
          const isClosed = s.status === "CLOSED"
          return (
            <button
              key={s.id}
              type="button"
              role="option"
              id={`sprint-opt-${s.id}`}
              ref={(el) => {
                rowRefs.current[i] = el
              }}
              aria-selected={selected}
              onClick={() => onSelect(s.id)}
              // Hover sets the active row so mouse + keyboard share one highlight.
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 8px",
                fontSize: 12.5,
                background:
                  isActive || selected ? "var(--surface-2)" : "transparent",
                color: isClosed ? "var(--fg-subtle)" : "var(--fg)",
                border: "none",
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                textAlign: "left",
                outline: isActive ? "1px solid var(--border-strong)" : "none",
                outlineOffset: -1,
              }}
            >
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.name}
              </span>
              {s.status === "ACTIVE" && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--status-progress)",
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  {lang === "tr" ? "Aktif" : "Active"}
                </span>
              )}
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
    </div>
  )
}
