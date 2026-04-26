"use client"

// Phase 13 Plan 13-07 Task 1 — CFDSkeleton (D-F3).
//
// Chart-shape shimmer for the CFD card during initial load. Renders 4
// horizontal stacked bands so the loading state visually previews the
// 4-band cumulative-flow area chart that lands once the data resolves.
//
// The .skeleton class + @keyframes shimmer were added to globals.css by
// Plan 13-04 (D-F3 infrastructure) and are reused here without a
// duplicate keyframes block. prefers-reduced-motion is honored at the
// CSS layer.

import * as React from "react"

export function CFDSkeleton() {
  return (
    <div
      className="chart-card-cfd-svg"
      style={{ height: 200, position: "relative" }}
      aria-busy="true"
      aria-label="Yükleniyor"
    >
      {/* 4 horizontal bands — bottom (todo) is widest, top (done) is narrowest */}
      <div
        className="skeleton"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 130,
          height: 60,
          borderRadius: 4,
        }}
      />
      <div
        className="skeleton"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 80,
          height: 50,
          borderRadius: 4,
        }}
      />
      <div
        className="skeleton"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 40,
          height: 40,
          borderRadius: 4,
        }}
      />
      <div
        className="skeleton"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 10,
          height: 30,
          borderRadius: 4,
        }}
      />
    </div>
  )
}
