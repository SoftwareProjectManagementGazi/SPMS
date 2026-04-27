"use client"

// Phase 14 Plan 14-08 — /admin/stats (İstatistik) sub-route page.
//
// Reads the composite GET /api/v1/admin/stats payload via useAdminStats()
// (Plan 14-01 — single round trip per D-A7) and lays out 3 charts:
//
//   ┌──────────────────────────────────┬────────────────────────────┐
//   │ ActiveUsersTrendChart (recharts) │ MethodologyBars (pure CSS) │  (2fr / 1fr)
//   ├──────────────────────────────────┴────────────────────────────┤
//   │ VelocityCardsGrid (pure CSS, top-30 cap, full width)          │
//   └────────────────────────────────────────────────────────────────┘
//
// Layout per UI-SPEC §Spacing line 82:
//   gridTemplateColumns: "2fr 1fr"
//   gap: 20
//
// All 3 chart components are dynamically imported (D-C6 — keep the /admin
// Overview bundle small; only pay the recharts cost when the user visits
// /admin/stats). The page itself is light: just hooks + DataState +
// dynamic-import wrappers.
//
// useAdminStats hook (Plan 14-01) sets staleTime 60s + refetchOnWindowFocus
// true (D-W1 stats variant — active-users compute is more expensive than the
// standard 30s admin-data window per D-X2).

import * as React from "react"
import dynamic from "next/dynamic"

import { DataState } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAdminStats } from "@/hooks/use-admin-stats"
import { adminStatsT } from "@/lib/i18n/admin-stats-keys"

// ---------------------------------------------------------------------------
// Lazy-loaded chart components (D-C6).
//
// ssr: false — recharts uses browser-only DOM measurement (ResizeObserver +
// SVG getBBox) that throws under Node SSR. The same constraint applies to
// the pure-CSS bar charts only by association (they share this wrapper for
// bundle-split symmetry).
// ---------------------------------------------------------------------------

const ActiveUsersTrendChart = dynamic(
  () =>
    import("@/components/admin/stats/active-users-trend-chart").then(
      (m) => m.ActiveUsersTrendChart,
    ),
  {
    ssr: false,
    loading: () => <DataState loading>{null}</DataState>,
  },
)

const MethodologyBars = dynamic(
  () =>
    import("@/components/admin/stats/methodology-bars").then(
      (m) => m.MethodologyBars,
    ),
  {
    ssr: false,
    loading: () => <DataState loading>{null}</DataState>,
  },
)

const VelocityCardsGrid = dynamic(
  () =>
    import("@/components/admin/stats/velocity-cards-grid").then(
      (m) => m.VelocityCardsGrid,
    ),
  {
    ssr: false,
    loading: () => <DataState loading>{null}</DataState>,
  },
)

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminStatsPage() {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  const statsQ = useAdminStats()

  // DataState: error > loading > empty > children. We treat "all 3 sub-fields
  // empty" as the empty branch; any one populated still renders.
  const data = statsQ.data
  const allEmpty =
    !!data &&
    data.activeUsersTrend.length === 0 &&
    Object.keys(data.methodologyDistribution).length === 0 &&
    data.projectVelocities.length === 0

  return (
    <DataState
      loading={statsQ.isLoading}
      error={statsQ.error}
      empty={allEmpty}
      emptyFallback={
        <div
          style={{
            padding: "40px 16px",
            textAlign: "center",
            color: "var(--fg-muted)",
            fontSize: 13,
          }}
        >
          {adminStatsT("admin.stats.empty_velocity", lang)}
        </div>
      }
    >
      {data && (
        <div
          style={{
            display: "grid",
            gap: 20,
          }}
        >
          {/* Top row — 2/1 split per UI-SPEC §Spacing line 82. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 20,
            }}
          >
            <ActiveUsersTrendChart trend={data.activeUsersTrend} />
            <MethodologyBars
              distribution={data.methodologyDistribution}
            />
          </div>
          {/* Bottom row — full-width velocity grid. */}
          <VelocityCardsGrid velocities={data.projectVelocities} />
        </div>
      )}
    </DataState>
  )
}
