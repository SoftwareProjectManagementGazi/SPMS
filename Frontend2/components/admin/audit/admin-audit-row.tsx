"use client"

// Phase 14 Plan 14-07 + Plan 14-16 (Cluster D, Path B) — Admin audit table row.
//
// Path B locked per <user_decision_locked> 2026-04-28: 5-column grid (IP
// column dropped permanently). Original 14-07 6-track grid + 28px MoreH
// placeholder is replaced with a 5-track grid that aligns with the 5-cell
// header in admin-audit-table.tsx.
//
//   90px       160px         180px         1fr        1.5fr
//   Time   |   Actor    |   Action    |   Target  |   Detay
//
// Critical contracts:
//   1. NO risk column (D-Z1). The prototype's `risk` column is replaced by
//      `Detay` which renders the Jira-style metadata via <ActivityRow
//      variant="admin-table" hideTimestamp/>. Plan 14-16 wires hideTimestamp
//      to suppress the inner mono timestamp in the Detay cell — without it
//      the table would show two timestamps per row (left Zaman cell + Detay
//      cell). 14-16 must_haves.truths #3.
//
//   2. Time column = formatRelativeTime + tooltip absolute datetime, mono
//      font 11px (UI-SPEC §Surface H + §Typography Caption mono). This is
//      the ONLY timestamp the table renders — the Detay cell carries no
//      additional time string.
//
//   3. Action column color-codes by action prefix per UI-SPEC §Color line 195
//      (status-progress for create/update; priority-critical for
//      delete/deactivate/destroy).
//
//   4. Hedef column never renders empty / never renders raw entity_id. The
//      backend resolver in audit_repo._resolve_entity_label always supplies
//      either a real metadata-driven name (project_name / task_title / …)
//      or the f"{ENTITY}-{id}" legacy fallback (D-D6). The em-dash fallback
//      below is only the catastrophic failure mode (resolver returned None
//      because entity_type and entity_id are both missing).
//
//   5. role="row" on the row container + role="cell" on each child cell so
//      RTL tests can assert column ORDER positionally (Plan 14-16 Test 2).
//      The grid CSS handles visual layout; ARIA roles handle accessibility +
//      test querying.
//
//   6. MoreH placeholder REMOVED. Path B drops the unused 28px column track
//      because no future plan in v2.0 wires row-level actions (CONTEXT
//      Discretion — row click is no-op, refLabel deep-link is sufficient).
//      v2.1 can re-introduce the column with a dedicated grid template.

import * as React from "react"

import { Avatar } from "@/components/primitives"
import { ActivityRow } from "@/components/activity/activity-row"
import { useApp } from "@/context/app-context"
import { formatRelativeTime } from "@/lib/activity-date-format"
import { getInitials } from "@/lib/initials"
import type { ActivityItem } from "@/services/activity-service"

// Plan 14-16 (Cluster D, Path B) — 5-track grid (IP deferred to v2.1).
// Order: Zaman 90px | Aktör 160px | İşlem 180px | Hedef 1fr | Detay 1.5fr
// Detay is wider so the Jira-style enriched primary line has room.
// PATH A NOTE (only if user opts in via plan 14-19 + signoff):
//   "90px 160px 180px 1fr 110px 1.5fr"  (IP at 110px between Hedef and Detay)
export const ADMIN_AUDIT_GRID =
  "90px 160px 180px 1fr 1.5fr" as const

interface AdminAuditRowProps {
  item: ActivityItem
  isLast?: boolean
}

/**
 * Map an action string (e.g. "task.update", "user.deactivate") to a CSS
 * variable for color-coding the Action column.
 *
 * Mapping mirrors UI-SPEC §Color line 195 — destructive actions
 * (delete/deactivate/archive/destroy) get the priority-critical token;
 * everything else (create/update/login/etc.) gets status-progress.
 */
function actionColorVar(action: string | null | undefined): string {
  if (!action) return "var(--fg-muted)"
  const lc = action.toLowerCase()
  if (
    lc.includes("delete") ||
    lc.includes("deactivate") ||
    lc.includes("destroy") ||
    lc.includes("archive") ||
    lc.includes("reject")
  ) {
    return "var(--priority-critical)"
  }
  return "var(--status-progress)"
}

function formatAbsoluteDate(timestamp: string | undefined | null): string {
  if (!timestamp) return ""
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleString()
}

export function AdminAuditRow({ item, isLast }: AdminAuditRowProps) {
  const { language } = useApp()

  const userName = item.user_name || ""
  const initials = getInitials(userName) || "?"
  const actorAvatar = {
    initials,
    avColor: ((item.user_id ?? 0) % 8) + 1,
  }

  const target = item.entity_label || ""
  const time = formatRelativeTime(item.timestamp ?? "", language)
  const tooltipDate = formatAbsoluteDate(item.timestamp)
  const action = item.action ?? ""

  return (
    <div
      className="hover-row"
      // Plan 14-16 — role="row" lets RTL tests query for the body row by
      // position (header row + body rows together via getAllByRole("row")).
      role="row"
      style={{
        display: "grid",
        gridTemplateColumns: ADMIN_AUDIT_GRID,
        padding: "8px 16px",
        alignItems: "center",
        fontSize: 11.5,
        borderBottom: isLast ? "0" : "1px solid var(--border)",
        gap: 8,
      }}
    >
      {/* Cell 1 — Zaman: mono 11, relative + absolute tooltip.
          Plan 14-16 must_haves.truths #2 — this is the ONE and ONLY
          timestamp rendered in the row. The Detay cell below passes
          hideTimestamp to suppress its inner mono timestamp. */}
      <div
        role="cell"
        className="mono"
        style={{
          color: "var(--fg-muted)",
          fontSize: 11,
        }}
        title={tooltipDate}
      >
        {time}
      </div>

      {/* Cell 2 — Aktör: small avatar + name (sans 12.5) */}
      <div
        role="cell"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
        }}
      >
        <Avatar
          user={actorAvatar}
          size={18}
          href={item.user_id ? `/users/${item.user_id}` : undefined}
        />
        <span
          style={{
            fontSize: 12.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {userName}
        </span>
      </div>

      {/* Cell 3 — İşlem: mono, color-coded by prefix */}
      <div
        role="cell"
        className="mono"
        style={{
          color: actionColorVar(action),
          fontSize: 11.5,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {action}
      </div>

      {/* Cell 4 — Hedef: sans, ellipsis-truncate. Plan 14-16 must_haves.truths
          #2 — Hedef NEVER renders empty / NEVER renders raw entity_id.
          target is the resolved entity_label from the backend
          _resolve_entity_label helper (project_name / task_title / …) with
          em-dash as the catastrophic failure fallback. */}
      <div
        role="cell"
        style={{
          fontSize: 12.5,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {target || "—"}
      </div>

      {/* Cell 5 — Detay: <ActivityRow variant="admin-table" hideTimestamp />.
          Plan 14-16 (M-4) — hideTimestamp={true} suppresses the inner mono
          timestamp so the table doesn't render two timestamps per row.
          Recent Events (recent-admin-events.tsx) leaves the prop unset
          (default false) because that card has no outer Zaman cell. */}
      <div
        role="cell"
        style={{
          fontSize: 12,
          color: "var(--fg-muted)",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <ActivityRow event={item} variant="admin-table" hideTimestamp />
      </div>
    </div>
  )
}
