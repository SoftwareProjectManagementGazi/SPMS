"use client"

// Phase 14 Plan 14-02 Task 2 — /admin (Overview / Genel) tab page.
//
// Default sub-route under app/(shell)/admin/. The AdminLayout wrapper
// (Plan 14-02 Task 1) renders the Shield-iconed page header + NavTabs strip;
// this page renders just the Overview content slot:
//
//   ┌─────────────────────────────────────────────────────────┐
//   │  5 StatCards in a 5-col grid (Users / Active Projects / │
//   │  Pending / Templates / Storage)                          │
//   ├──────────────────────────────────┬──────────────────────┤
//   │  Pending Project Join Requests   │  Role distribution   │
//   │  (top-5 + Tümünü gör modal)      │  (pure-CSS bars)     │
//   │                                  ├──────────────────────┤
//   │                                  │  Recent admin events │
//   │                                  │  (admin-table stub)  │
//   └──────────────────────────────────┴──────────────────────┘
//
// Layout grid template per UI-SPEC §Spacing line 62 + prototype
// admin.jsx lines 53-141 verbatim.
//
// D-C6 lazy-load decision: Overview is the DEFAULT sub-tab — its bundle
// must stay small. Role distribution is pure-CSS (no recharts), so no
// lazy-load needed. Audit / Stats lazy-loading is the concern of plans
// 14-07 / 14-08, not Plan 14-02.

import * as React from "react"

import { OverviewStatCards } from "@/components/admin/overview/stat-cards"
import { PendingRequestsCard } from "@/components/admin/overview/pending-requests-card"
import { RoleDistribution } from "@/components/admin/overview/role-distribution"
import { RecentAdminEvents } from "@/components/admin/overview/recent-admin-events"

export default function AdminOverviewPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Row 1 — 5 StatCards */}
      <OverviewStatCards />

      {/* Row 2 — Pending Requests (1.5fr) + side column (1fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 20,
        }}
      >
        <PendingRequestsCard />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <RoleDistribution />
          <RecentAdminEvents />
        </div>
      </div>
    </div>
  )
}
