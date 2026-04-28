"use client"

// Phase 14 Plan 14-18 (Cluster F UAT Test 34) — single shared overflow-x
// wrapper consumed by all admin tables (Users / Audit / Projects).
//
// At narrow viewports (<1280px design width — admins commonly window down
// to 1024 or 1180 on side-by-side editing) the original tables silently
// truncated their rightmost cells because the inner grid template columns
// added up to ~1180-1240px while the parent Card was width: 100%. The
// truncated cells visually overlapped neighboring cells and the user
// couldn't scroll horizontally to recover them.
//
// The shell sets:
//   - overflow-x: auto on the outer container
//   - max-width: 100% so the wrapper itself respects its parent's width
//   - min-width on the inner content (passed via prop) so the scrollbar
//     surfaces at a predictable threshold
//
// Per-table min-width tuning per the row grid templates the tables already
// use (verbatim Plan 14-03/05/07/16 grids):
//   - Users (8 cols, ROW_GRID_TEMPLATE)        → 1180
//   - Audit (5 cols post 14-16 Path B)         → 1180
//   - Projects (8 cols, ROW_GRID_TEMPLATE)     → 1100
//
// The shell is intentionally PRESENTATIONAL — no business logic. Single
// producer / multiple consumers per the v2.0 admin primitive convention.

import * as React from "react"

interface AdminTableShellProps {
  children: React.ReactNode
  /** Inner content min-width in pixels. Defaults to 1100 — fits the
   *  narrowest of the 3 admin tables (Projects). */
  minWidth?: number
}

export function AdminTableShell({
  children,
  minWidth = 1100,
}: AdminTableShellProps) {
  return (
    <div style={{ overflowX: "auto", maxWidth: "100%" }}>
      <div style={{ minWidth: `${minWidth}px` }}>{children}</div>
    </div>
  )
}
