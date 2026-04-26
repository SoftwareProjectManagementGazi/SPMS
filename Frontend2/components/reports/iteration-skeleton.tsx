"use client"

// Phase 13 Plan 13-08 Task 1 — IterationSkeleton (D-F3).
//
// Chart-shape shimmer for the IterationChart card. Renders 4 sprint columns,
// each a group of 3 grouped bars (planned / completed / carried), so the
// loading state visually previews the grouped-bar chart that lands once
// useIteration resolves.
//
// The .skeleton class + @keyframes shimmer were added to globals.css by
// Plan 13-04 (D-F3 infrastructure) and are reused here without a duplicate
// keyframes block. prefers-reduced-motion is honored at the CSS layer.

import * as React from "react"

export function IterationSkeleton() {
  // 4 sprints — each = 3 grouped bars with varying heights so the shimmer
  // visually previews the grouped-bar shape the real chart will render.
  const sprints: ReadonlyArray<readonly [number, number, number]> = [
    [60, 70, 30],
    [80, 90, 20],
    [50, 60, 25],
    [90, 100, 10],
  ]
  return (
    <div
      className="chart-card-iteration-svg"
      style={{
        height: 180,
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        padding: "0 10px",
      }}
      aria-busy="true"
      aria-label="Yükleniyor"
    >
      {sprints.map((bars, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
            height: "100%",
          }}
        >
          {bars.map((h, j) => (
            <div
              key={j}
              className="skeleton"
              style={{ flex: 1, height: `${h}%`, borderRadius: 4 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
