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

  // Plan 14-15 (Cluster C, Diagnosis A — B-4 PRE-COMMITTED) — explicit
  // DTO → ActivityItem normalizer.
  //
  // Previously: `q.data?.items ?? [] as ActivityItem[]` — bald TS cast that
  // shipped AdminAuditItem rows directly into ActivityRow's admin-table
  // variant. Today the wire shapes happen to overlap (both services type
  // their items as ActivityItem), but this is a latent bug: any future field
  // drift between AdminAuditItem and ActivityItem (e.g. an
  // entity_label-only field on the admin side) would silently break the
  // audit-event-mapper dispatch in this card and route every row to the
  // generic "değiştirdi bir görev alanını" catch-all (Test 11 failure mode).
  //
  // Fix: explicitly map every field the mapper + admin-table render branch
  // reads. mapAuditToSemantic in audit-event-mapper.ts reads `entity_type`,
  // `field_name`, and `action`; the render branch reads metadata.{task_title,
  // project_name, comment_excerpt, …} — preserve all of these. useMemo
  // because q.data?.items is a stable reference per fetch but we want to
  // avoid recomputing on unrelated re-renders.
  //
  // Diagnoses B (legacy un-enriched rows) + C (mapper ordering) were
  // explicitly DEFERRED per checker B-4 — re-open ONLY if this normalizer
  // fix doesn't make Test 11 pass on real-DB data.
  const items: ActivityItem[] = React.useMemo(
    () =>
      (q.data?.items ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        user_name: row.user_name,
        user_avatar: row.user_avatar,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        entity_label: row.entity_label,
        field_name: row.field_name,
        old_value: row.old_value,
        new_value: row.new_value,
        timestamp: row.timestamp,
        metadata: row.metadata,
      })),
    [q.data?.items],
  )

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
