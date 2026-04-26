"use client"

// Phase 13 Plan 13-04 Task 1 — ActivityTimelineSkeleton (D-F3).
//
// 10 placeholder rows with shimmer animation, mirroring the timeline event
// row layout (28px round avatar + 2 lines of text-block shimmer). The
// shimmer is driven by the `.skeleton` class + `@keyframes shimmer` defined
// in `Frontend2/app/globals.css` (added in this plan if not already present).
//
// `aria-busy="true"` on the wrapper signals to assistive tech that the area
// is loading; `aria-label` provides the "Loading" announcement.

import * as React from "react"

import { useApp } from "@/context/app-context"

const ROW_COUNT = 10

export function ActivityTimelineSkeleton() {
  const { language } = useApp()
  const ariaLabel = language === "tr" ? "Yükleniyor" : "Loading"

  return (
    <div aria-busy="true" aria-label={ariaLabel}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 16px",
            alignItems: "center",
          }}
        >
          <div
            className="skeleton"
            style={{ width: 28, height: 28, borderRadius: "50%" }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="skeleton"
              style={{ width: "60%", height: 10, marginBottom: 6 }}
            />
            <div
              className="skeleton"
              style={{ width: "40%", height: 8 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
