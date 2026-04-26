"use client"

// Phase 13 Plan 13-07 Task 2 — LeadCycleSkeleton (D-F3).
//
// 5-bar histogram shimmer matching the chart shape (5 buckets:
// 0-1d / 1-3d / 3-5d / 5-10d / 10d+). Bar heights are varied for visual
// realism so the loading state previews the histogram silhouette.
//
// Reuses the .skeleton class + @keyframes shimmer added to globals.css
// by Plan 13-04. aria-busy="true" on the wrapper signals load state to
// assistive tech.

import * as React from "react"

const HEIGHTS = [30, 70, 90, 55, 20]

export function LeadCycleSkeleton() {
  return (
    <div
      className="chart-card-leadcycle-svg"
      style={{
        height: 120,
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        padding: "0 8px",
      }}
      aria-busy="true"
    >
      {HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ flex: 1, height: `${h}%`, borderRadius: 4 }}
        />
      ))}
    </div>
  )
}
