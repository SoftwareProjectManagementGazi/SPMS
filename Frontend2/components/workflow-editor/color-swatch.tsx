"use client"

// ColorSwatch (Phase 12 Plan 12-07) — 8-preset color picker per CONTEXT D-30
// + UI-SPEC NEW-primitive table line 90 + Open Question line 1791.
//
// Renders a 4×2 grid of clickable circles (8 swatches). Each circle's
// background is a CSS variable (status-todo / progress / review / done /
// blocked / priority-critical / high / primary). Selected swatch gets a
// 2px primary outer ring.
//
// Used by the right-panel SelectionPanel "Renk" field for both nodes and
// groups.

import * as React from "react"

export interface ColorSwatchProps {
  value: string
  onChange: (token: string) => void
}

// 8 token suffixes — exposed as `var(--{token})` at render time.
const TOKENS: ReadonlyArray<string> = [
  "status-todo",
  "status-progress",
  "status-review",
  "status-done",
  "status-blocked",
  "priority-critical",
  "priority-high",
  "primary",
]

export function ColorSwatch({ value, onChange }: ColorSwatchProps) {
  return (
    <div
      role="group"
      aria-label="Color swatches"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 24px)",
        gap: 8,
      }}
    >
      {TOKENS.map((token) => {
        const active = value === token
        return (
          <button
            type="button"
            key={token}
            aria-label={token}
            aria-pressed={active}
            onClick={() => onChange(token)}
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: 0,
              padding: 0,
              cursor: "pointer",
              background: `var(--${token})`,
              boxShadow: active
                ? "0 0 0 2px var(--primary), 0 0 0 4px var(--surface)"
                : "inset 0 0 0 1px color-mix(in oklch, var(--fg) 12%, transparent)",
              transition:
                "transform 0.12s ease, box-shadow 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)"
            }}
          />
        )
      })}
    </div>
  )
}
