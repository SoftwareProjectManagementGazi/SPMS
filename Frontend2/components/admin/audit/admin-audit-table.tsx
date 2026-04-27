"use client"

// Phase 14 Plan 14-07 — Admin audit log table.
//
// Renders the audit log table per UI-SPEC §Surface H lines 457-487:
//   - 6-column grid: Time(90px) / Actor(160px) / Action(180px) / Target(1fr)
//     / Detay(1fr) / MoreH(28px). NO risk column (D-Z1).
//   - Pitfall 6 — when response.truncated=true, render AlertBanner tone="warning"
//     ABOVE the header row with the "50.000" cap message.
//   - Empty / error states via DataState (Phase 13 D-F2 primitive).
//   - Pagination toolbar rendered inside the Card so the bottom border lines
//     up with the rest of the surface.
//
// Critical: per CONTEXT D-D5, the Detay column wraps the existing
// <ActivityRow variant="admin-table"/> from Frontend2/components/activity/
// activity-row.tsx. Plan 14-10 fills the variant render branch — for now
// the existing default-variant render flows through, which is the agreed
// graceful-degradation strategy (Plan 14-02 Summary documented this
// hand-off).

import * as React from "react"

import { Card, AlertBanner, DataState } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminAuditT } from "@/lib/i18n/admin-audit-keys"
import { useAdminAudit } from "@/hooks/use-admin-audit"
import type { AdminAuditFilter } from "@/services/admin-audit-service"

import {
  AdminAuditRow,
  ADMIN_AUDIT_GRID,
} from "./admin-audit-row"
import { AdminAuditPagination } from "./admin-audit-pagination"

interface AdminAuditTableProps {
  filter: AdminAuditFilter
  /** Update offset / limit when the user paginates — parent owns URL state. */
  onUpdate: (next: Partial<AdminAuditFilter>) => void
}

export function AdminAuditTable({ filter, onUpdate }: AdminAuditTableProps) {
  const { language } = useApp()
  const q = useAdminAudit(filter)
  const items = q.data?.items ?? []
  const total = q.data?.total ?? 0
  const truncated = Boolean(q.data?.truncated)

  // Empty-state copy depends on whether filters are active.
  const hasFilters = Boolean(
    filter.date_from ||
      filter.date_to ||
      filter.actor_id !== undefined ||
      filter.action_prefix,
  )
  const emptyKey = hasFilters
    ? "admin.audit.empty_no_match"
    : "admin.audit.empty_no_audit"

  const isEmpty = !q.isLoading && !q.error && items.length === 0

  return (
    <Card padding={0}>
      {/* Pitfall 6 — 50k cap warning AlertBanner.
          Renders ABOVE the header row when the backend truncated the result
          set. Copy includes the actual total so admins know how wide their
          filter caught (e.g., "Filtre çok geniş (123,456 satır)…"). */}
      {truncated && (
        <div style={{ padding: "10px 16px 0 16px" }}>
          <AlertBanner tone="warning">
            {adminAuditT("admin.audit.truncated_warning", language).replace(
              "{N}",
              total.toLocaleString(),
            )}
          </AlertBanner>
        </div>
      )}

      {/* Header row — 6 columns, NO risk column (D-Z1). */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: ADMIN_AUDIT_GRID,
          padding: "10px 16px",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          color: "var(--fg-subtle)",
          fontWeight: 600,
          borderBottom: "1px solid var(--border)",
          gap: 8,
        }}
      >
        <div>{adminAuditT("admin.audit.col_time", language)}</div>
        <div>{adminAuditT("admin.audit.col_actor", language)}</div>
        <div>{adminAuditT("admin.audit.col_action", language)}</div>
        <div>{adminAuditT("admin.audit.col_target", language)}</div>
        <div>{adminAuditT("admin.audit.col_detay", language)}</div>
        <div aria-hidden />
      </div>

      {/* Body — DataState handles loading / error / empty / data. */}
      <DataState
        loading={q.isLoading}
        error={q.error}
        empty={isEmpty}
        emptyFallback={
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              fontSize: 12.5,
              color: "var(--fg-subtle)",
            }}
          >
            {adminAuditT(emptyKey, language)}
          </div>
        }
      >
        <div>
          {items.map((item, i) => (
            <AdminAuditRow
              key={item.id}
              item={item}
              isLast={i === items.length - 1}
            />
          ))}
        </div>
      </DataState>

      {/* Pagination — always rendered when we have data so the user can move
          back/forward; hidden when DataState is in loading/error/empty branch. */}
      {!q.isLoading && !q.error && items.length > 0 && (
        <AdminAuditPagination
          total={total}
          truncated={truncated}
          size={filter.limit ?? 50}
          offset={filter.offset ?? 0}
          onSizeChange={(n) => onUpdate({ limit: n, offset: 0 })}
          onOffsetChange={(n) => onUpdate({ offset: n })}
        />
      )}
    </Card>
  )
}
