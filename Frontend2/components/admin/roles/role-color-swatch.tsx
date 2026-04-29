"use client"

// Phase 15 Plan 15-11 — RoleColorSwatch (D-2.8).
//
// 6 round chips inline-flex, each backed by an oklch design token (kept inside
// `var(--token-name)` so the swatch automatically follows light/dark theme):
//
//   --priority-critical, --status-progress, --fg-muted, --info, --warning,
//   --status-todo
//
// Persisted to `roles.color_token` (Migration 007). Default for a new role:
// `--fg-muted` (neutral; doesn't compete with system role colors).
//
// A11y matches RoleIconPicker — radiogroup + radio + aria-checked.

import * as React from "react"

const COLOR_TOKENS = [
  "--priority-critical",
  "--status-progress",
  "--fg-muted",
  "--info",
  "--warning",
  "--status-todo",
] as const

export type RoleColorToken = (typeof COLOR_TOKENS)[number]

interface RoleColorSwatchProps {
  value: string | null
  onChange: (token: string) => void
}

export function RoleColorSwatch({ value, onChange }: RoleColorSwatchProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Renk seç"
      style={{
        display: "inline-flex",
        gap: 8,
        marginTop: 4,
        flexWrap: "wrap",
      }}
    >
      {COLOR_TOKENS.map((token) => {
        const selected = value === token
        // Strip the leading `--` so the aria-label / radio name is e.g.
        // "priority-critical" rather than "--priority-critical".
        const label = token.replace(/^--/, "")
        return (
          <button
            key={token}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(token)}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: `var(${token})`,
              border: "1px solid var(--border)",
              boxShadow: selected
                ? "0 0 0 2px var(--surface), 0 0 0 4px var(--primary)"
                : undefined,
              cursor: "pointer",
              transition: "box-shadow 0.12s",
              padding: 0,
            }}
          />
        )
      })}
    </div>
  )
}
