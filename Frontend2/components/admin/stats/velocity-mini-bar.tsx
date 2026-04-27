"use client"

// Phase 14 Plan 14-08 Task 2 — VelocityMiniBar (D-X3 + D-X4).
//
// Per-project velocity mini-card. Layout per prototype admin.jsx lines
// 466-475 (verbatim) + UI-SPEC §Typography lines 121-124:
//
//   ┌────────────────────────┐
//   │ KEY (mono 10.5)        │  <- project key chip
//   │ 76% (20px tabular-nums)│  <- big-number progress
//   │ ▌ ▌ ▌ ▍ ▌ ▍ █          │  <- 7-bar velocity history (last bar primary)
//   └────────────────────────┘
//
// Pure CSS — NO recharts geometry (D-X3 + UI-SPEC §Spacing line 38). The
// 7-bar trend is a flex row of <div>s where each bar's height = (value/max)*
// 100% and the LAST bar uses var(--primary) while others use
// var(--border-strong) (verbatim prototype line 471).
//
// Big-number typography per UI-SPEC §Typography line 121:
//   font-size 20px, font-weight 600, letter-spacing -0.5, tabular-nums.
// Project key (mono 10.5) per UI-SPEC §Typography line 124.

import * as React from "react"

export interface VelocityMiniBarData {
  projectId: number
  key: string
  name: string
  /** 0..1 progress fraction (rendered as Math.round(progress * 100) + "%"). */
  progress: number
  /** Up to 7 sprint velocity numbers; we slice the last 7 if longer. */
  velocityHistory: number[]
}

export interface VelocityMiniBarProps {
  v: VelocityMiniBarData
}

export function VelocityMiniBar({ v }: VelocityMiniBarProps) {
  // Slice last 7 entries — backend may send up to 8+ (D-X4 cap is 30
  // projects, not 30 sprints). The visualization is pinned to 7 bars per the
  // prototype.
  const history =
    v.velocityHistory.length > 7
      ? v.velocityHistory.slice(-7)
      : v.velocityHistory

  // Defensive: when history is empty (a brand-new project with no completed
  // sprints), render a flat 7-bar row at zero height instead of crashing.
  const max = history.length > 0 ? Math.max(...history, 1) : 1
  const safeHistory =
    history.length > 0 ? history : [0, 0, 0, 0, 0, 0, 0]

  const progressPct = Math.round(
    Math.max(0, Math.min(1, v.progress)) * 100,
  )

  return (
    <div
      style={{
        padding: 10,
        background: "var(--surface-2)",
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Project key — mono 10.5 (UI-SPEC §Typography line 124, verbatim
          prototype line 467). Truncated with ellipsis when long. */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--fg-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={v.name}
      >
        {v.key}
      </div>

      {/* Big-number progress — 20px, 600, -0.5 spacing, tabular-nums
          (UI-SPEC §Typography line 121, verbatim prototype line 468). */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: -0.5,
          fontVariantNumeric: "tabular-nums",
          marginTop: 4,
        }}
      >
        {progressPct}
        <span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>%</span>
      </div>

      {/* 7-bar velocity history — last bar in --primary, others in
          --border-strong (verbatim prototype line 471). */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          marginTop: 8,
          height: 28,
        }}
      >
        {safeHistory.map((value, i, arr) => {
          const isLast = i === arr.length - 1
          const heightPct = Math.max(2, (value / max) * 100) // min 2% so
          // empty bars are still visible as a hairline
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${heightPct}%`,
                background: isLast
                  ? "var(--primary)"
                  : "var(--border-strong)",
                borderRadius: 1,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
