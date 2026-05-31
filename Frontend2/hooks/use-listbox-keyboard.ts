"use client"

// useListboxKeyboard — shared arrow-key / Home / End / Enter navigation for the
// popover listboxes (task-detail Status / Sprint / Priority / Assignee pickers).
// Generalises the M-R4 ProjectPicker keyboard pattern so every picker shares one
// implementation instead of each re-deriving it (most had Escape-only handlers
// and selected index 0 on Enter regardless of the highlighted row).
//
//   * activeIndex is the keyboard cursor — distinct from the selected value.
//   * It snaps to the selected row whenever the item set or selection changes,
//     so a far-down selection is highlighted + scrolled into view on open (and
//     re-snaps while a search box filters the list).
//   * scrollIntoView keeps the active row visible during arrow nav.
//   * onKeyDown wires Escape→cancel, Arrow/Home/End→move, Enter→commit.
//
// The hook owns ONLY the cursor + key handling; each picker keeps its own row
// JSX and wires rowRefs[i] / id / aria-selected / onMouseEnter so mouse +
// keyboard share one highlight source.
//
// NOTE: the Reports ProjectPicker keeps its inline pre-hook original (it's
// working, shipped, and untested — refactoring it carries regression risk with
// no safety net), so it is intentionally left untouched; new pickers use this.

import * as React from "react"

export interface UseListboxKeyboardOptions {
  /** Number of navigable rows (the role="option" buttons). */
  itemCount: number
  /** Index of the currently-selected row, or -1 when none — the active cursor
   *  snaps here whenever it (or itemCount) changes. */
  selectedIndex: number
  /** Commit the row at the given index (fired on Enter). */
  onEnter: (index: number) => void
  /** Dismiss the popover (fired on Escape). */
  onCancel: () => void
}

export interface UseListboxKeyboardResult {
  activeIndex: number
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>
  /** Attach to each row: ref={(el) => { rowRefs.current[i] = el }}. */
  rowRefs: React.MutableRefObject<(HTMLElement | null)[]>
  /** Spread onto the role="listbox" container (or a keydown-capturing ancestor). */
  onKeyDown: (e: React.KeyboardEvent) => void
}

function clampStart(selectedIndex: number, itemCount: number): number {
  const next = selectedIndex >= 0 ? selectedIndex : 0
  return Math.min(Math.max(next, 0), Math.max(itemCount - 1, 0))
}

export function useListboxKeyboard({
  itemCount,
  selectedIndex,
  onEnter,
  onCancel,
}: UseListboxKeyboardOptions): UseListboxKeyboardResult {
  const [activeIndex, setActiveIndex] = React.useState(() =>
    clampStart(selectedIndex, itemCount),
  )
  const rowRefs = React.useRef<(HTMLElement | null)[]>([])

  // Snap the cursor to the selection whenever the list or selection changes
  // (open, search-filter, external value change). Clamp into range.
  React.useEffect(() => {
    setActiveIndex(clampStart(selectedIndex, itemCount))
  }, [itemCount, selectedIndex])

  // Keep the active row visible during arrow nav (and on open, since the cursor
  // may initialise to a far-down selection). Optional-chained so an unmounted /
  // not-yet-attached row is a no-op.
  React.useEffect(() => {
    rowRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onCancel()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, itemCount - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Home") {
        e.preventDefault()
        setActiveIndex(0)
      } else if (e.key === "End") {
        e.preventDefault()
        setActiveIndex(Math.max(itemCount - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (itemCount > 0) onEnter(activeIndex)
      }
    },
    [itemCount, activeIndex, onEnter, onCancel],
  )

  return { activeIndex, setActiveIndex, rowRefs, onKeyDown }
}
