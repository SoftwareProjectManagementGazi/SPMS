"use client"

// Reports migration v2 Wave 3 — BurndownSkeleton.
//
// Chart-shape shimmer matching the burndown card layout: gridlines + a
// diagonal "line trending down" block so the loading preview hints at the
// AreaChart that lands after fetch. Reuses the .skeleton class +
// @keyframes shimmer from globals.css (prefers-reduced-motion honored).

import * as React from "react"

export function BurndownSkeleton() {
  return (
    <div
      style={{ height: 200, position: "relative" }}
      aria-busy="true"
      aria-label="Yükleniyor"
    >
      {/* Diagonal trend block hints at the burning-down line shape */}
      <div
        className="skeleton"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 40,
          height: 130,
          borderRadius: 4,
          clipPath:
            "polygon(0 60%, 12% 50%, 28% 42%, 45% 36%, 60% 28%, 75% 18%, 100% 8%, 100% 100%, 0 100%)",
        }}
      />
    </div>
  )
}
