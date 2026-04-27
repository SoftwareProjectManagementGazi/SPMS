"use client"

// Phase 14 Plan 14-07 — Admin audit table row.
//
// Single audit log row rendered in the 6-column admin audit table grid:
//
//   90px       160px         180px         1fr        1fr      28px
//   Time   |   Actor    |   Action    |   Target  |  Detay  | (MoreH stub)
//
// Critical contracts:
//   1. NO risk column (D-Z1). The prototype's `risk` column is replaced by
//      `Detay` which renders the Jira-style metadata via <ActivityRow
//      variant="admin-table"/>. Plan 14-10 fills the variant render branch;
//      until then the existing default-variant render is acceptable
//      degradation per CONTEXT D-D5 hand-off note.
//
//   2. Time column = formatRelativeTime + tooltip absolute datetime, mono
//      font 11px (UI-SPEC §Surface H + §Typography Caption mono).
//
//   3. Action column color-codes by action prefix per UI-SPEC §Color line 195
//      (status-progress for create/update; priority-critical for
//      delete/deactivate/destroy).
//
//   4. MoreH cell currently renders an empty 28px placeholder so the grid
//      alignment is preserved. Per CONTEXT Discretion default + Plan 14-07
//      PLAN.md line 171, row click is no-op (Detay column already shows the
//      full story; deep-link via refLabel suffices). When a future plan
//      wires per-row actions, the slot already exists.

import * as React from "react"

import { Avatar } from "@/components/primitives"
import { ActivityRow } from "@/components/activity/activity-row"
import { useApp } from "@/context/app-context"
import { formatRelativeTime } from "@/lib/activity-date-format"
import { getInitials } from "@/lib/initials"
import type { ActivityItem } from "@/services/activity-service"

export const ADMIN_AUDIT_GRID =
  "90px 160px 180px 1fr 1fr 28px" as const

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
      {/* Time — mono 11, relative + absolute tooltip */}
      <div
        className="mono"
        style={{
          color: "var(--fg-muted)",
          fontSize: 11,
        }}
        title={tooltipDate}
      >
        {time}
      </div>

      {/* Actor — small avatar + name (sans 12.5) */}
      <div
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

      {/* Action — mono, color-coded by prefix */}
      <div
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

      {/* Target — sans, ellipsis-truncate */}
      <div
        style={{
          fontSize: 12.5,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {target}
      </div>

      {/* Detay — Plan 14-10 fills the variant="admin-table" branch.
          For now the existing default-variant render flows through
          (graceful degradation per CONTEXT D-D5 hand-off note). */}
      <div
        style={{
          fontSize: 12,
          color: "var(--fg-muted)",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <ActivityRow event={item} variant="admin-table" />
      </div>

      {/* MoreH placeholder — preserves grid alignment.
          Per CONTEXT Discretion default + Plan 14-07 PLAN.md line 171,
          v2.0 row actions are no-op; the slot is reserved for a future plan. */}
      <div aria-hidden style={{ width: 28 }} />
    </div>
  )
}
