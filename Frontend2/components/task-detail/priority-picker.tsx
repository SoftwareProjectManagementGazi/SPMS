"use client"

// PriorityPicker — searchless popover for choosing a task's priority
// (critical / high / medium / low). Twin of StatusPicker + SprintPicker
// in structure (same 200-wide card, role="listbox", click-outside +
// Escape dismissal) but each row reuses the PriorityChip primitive so
// the 4-bar ascending icon stays the user's primary signal for severity.
// Rendering the chip inside each row also gives users an at-a-glance
// preview of what the trigger will look like after they pick.

import * as React from "react"
import { Check } from "lucide-react"

import { PriorityChip, type PriorityLevel } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useListboxKeyboard } from "@/hooks/use-listbox-keyboard"

interface PriorityPickerProps {
  selected: PriorityLevel
  onSelect: (next: PriorityLevel) => void
  onCancel: () => void
  align?: "start" | "end"
}

// Ordered high-to-low because that's how users typically scan severity
// triagers (the "more urgent" options surface first). Critical at top
// also matches the visual weight of its 4-filled-bars chip.
const PRIORITY_ORDER: ReadonlyArray<PriorityLevel> = [
  "critical",
  "high",
  "medium",
  "low",
]

export function PriorityPicker({
  selected,
  onSelect,
  onCancel,
  align = "end",
}: PriorityPickerProps) {
  const { language: lang } = useApp()
  const ref = React.useRef<HTMLDivElement | null>(null)

  // Click-outside dismissal — same pattern as StatusPicker / SprintPicker.
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

  // Shared keyboard listbox nav (activeIndex cursor + arrow/Home/End/Enter).
  const selectedIndex = PRIORITY_ORDER.indexOf(selected)
  const { activeIndex, setActiveIndex, rowRefs, onKeyDown } =
    useListboxKeyboard({
      itemCount: PRIORITY_ORDER.length,
      selectedIndex,
      onEnter: (i) => {
        const level = PRIORITY_ORDER[i]
        if (level) onSelect(level)
      },
      onCancel,
    })

  return (
    <div
      ref={ref}
      onKeyDown={onKeyDown}
      role="listbox"
      aria-label={lang === "tr" ? "Öncelik seç" : "Select priority"}
      aria-activedescendant={
        PRIORITY_ORDER[activeIndex]
          ? `prio-opt-${PRIORITY_ORDER[activeIndex]}`
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
        padding: 4,
      }}
    >
      {PRIORITY_ORDER.map((level, i) => {
        const isSelected = level === selected
        const isActive = i === activeIndex
        return (
          <button
            key={level}
            type="button"
            role="option"
            id={`prio-opt-${level}`}
            ref={(el) => {
              rowRefs.current[i] = el
            }}
            aria-selected={isSelected}
            onClick={() => onSelect(level)}
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
                isActive || isSelected ? "var(--surface-2)" : "transparent",
              color: "var(--fg)",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--radius-sm)",
              textAlign: "left",
              outline: isActive ? "1px solid var(--border-strong)" : "none",
              outlineOffset: -1,
            }}
          >
            {/* PriorityChip already carries the bar icon + localized label.
                flex:1 lets the chip stretch to fill the row so the Check
                icon hugs the right edge regardless of label length. */}
            <span style={{ flex: 1, minWidth: 0 }}>
              <PriorityChip level={level} lang={lang} />
            </span>
            {isSelected && (
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
