"use client"

// MTDensityIcon — three-line glyph used inside the density toggle button group.
//
// Ported 1:1 from `New_Frontend/src/pages/my-tasks.jsx` lines 499-507. Stack
// height/gap differs by density to communicate the row spacing visually.
// Width is fixed at 14px so the three buttons in the density toggle stay
// visually balanced across all three states.

import * as React from "react"

export type MTDensityKind = "compact" | "cozy" | "comfortable"

export interface MTDensityIconProps {
  kind: MTDensityKind
}

export function MTDensityIcon({ kind }: MTDensityIconProps) {
  // Prototype values — see lines 500-501 of my-tasks.jsx.
  // - compact: gap=2, line-height=1.5
  // - cozy:    gap=3, line-height=2
  // - comfortable: gap=4, line-height=2
  const gap = kind === "compact" ? 2 : kind === "cozy" ? 3 : 4
  const h = kind === "compact" ? 1.5 : 2
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap,
        width: 14,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            height: h,
            background: "currentColor",
            borderRadius: 1,
            opacity: 0.85,
          }}
        />
      ))}
    </span>
  )
}
