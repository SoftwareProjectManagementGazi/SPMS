"use client"

// Phase 14 Plan 14-02 Task 2 — Recent admin events card (UI-SPEC §Surface B
// + prototype admin.jsx lines 120-138).
//
// Reads useAdminAudit({limit: 10}) — the Plan 14-01 hook (TanStack Query
// keyed; staleTime 30s; refetchOnWindowFocus). Renders a compact list using
// the existing <ActivityRow variant="admin-table"/>. Plan 14-10 will fill
// the variant="admin-table" render branch — for now the variant prop is
// accepted but the row renders in default mode (graceful degradation).
//
// Footer link "Audit'a git →" navigates to /admin/audit (D-W1 deep-link).
// Prototype rendered 4 mock rows; real data via /admin/audit endpoint.

import * as React from "react"
import Link from "next/link"

import { Card, DataState } from "@/components/primitives"
import { ActivityRow } from "@/components/activity/activity-row"
import { useApp } from "@/context/app-context"
import { adminT } from "@/lib/i18n/admin-keys"
import { useAdminAudit } from "@/hooks/use-admin-audit"
import type { ActivityItem } from "@/services/activity-service"

export function RecentAdminEvents() {
  const { language } = useApp()
  const q = useAdminAudit({ limit: 10 })
  const items: ActivityItem[] = q.data?.items ?? []

  return (
    <Card padding={16}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ flex: 1 }}>
          {adminT("admin.overview.recent_admin_events_title", language)}
        </span>
      </div>

      <DataState
        loading={q.isLoading}
        error={q.error}
        empty={!q.isLoading && items.length === 0}
        emptyFallback={
          <div
            style={{
              padding: "24px 8px",
              textAlign: "center",
              fontSize: 12.5,
              color: "var(--fg-subtle)",
            }}
          >
            {adminT("admin.overview.recent_admin_events_empty", language)}
          </div>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            margin: "-12px -16px 0",
            // Negative margin lifts ActivityRow's 12/16 padding outside the
            // Card so the rows align with the card edges (matches the way
            // dashboard/activity-feed.tsx flows the rows in a 0-padding Card).
          }}
        >
          {items.map((event) => (
            <ActivityRow
              key={event.id}
              event={event}
              variant="admin-table"
            />
          ))}
        </div>
      </DataState>

      {/* Deep-link footer (D-W1) */}
      <div
        style={{
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
          marginTop: 10,
          textAlign: "right",
        }}
      >
        <Link
          href="/admin/audit"
          style={{
            fontSize: 12,
            color: "var(--primary)",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {adminT("admin.overview.recent_admin_events_view_all", language)}
        </Link>
      </div>
    </Card>
  )
}
