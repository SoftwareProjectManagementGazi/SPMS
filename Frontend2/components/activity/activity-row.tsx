"use client"

// Phase 13 Plan 13-04 Task 2 — ActivityRow per-event renderer.
//
// Per UI-SPEC §C.1 EventRow anatomy: Avatar(28) + bottom-right event badge,
// content column with primary line / secondary task title / status pair (for
// task_status_changed) / assign target row (for task_assigned) / comment block
// (for comment_created — D-B6 160 char + ellipsis with HTML strip per
// T-13-04-01) / time row.
//
// Critical contracts:
//   1. mapAuditToSemantic(item) drives the render path — no second hardcoded
//      switch over event types lives here. New event types are added by
//      extending eventMeta + the audit-event-mapper alone.
//   2. Avatar in the row gets href={`/users/${user.id}`} (D-D4 click-to-profile).
//      Avatar's e.stopPropagation() guarantees parent row click handlers (none
//      today on Activity rows, but defended-in-depth) don't fire.
//   3. Comment body is HTML-stripped via /<[^>]*>/g BEFORE the 160-char clamp
//      so we can't render arbitrary tags from audit_log payload (T-13-04-01
//      mitigation; matches Phase 11 D-09 pattern for comments-section.tsx).
//   4. Status pair / assign target / comment block render conditionally per
//      semantic type — the JSX is intentionally inline so a reader can see the
//      full row anatomy in one place (matches prototype activity-tab.jsx
//      lines 135–177 verbatim).

import * as React from "react"

import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Avatar, Badge } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { eventMeta } from "@/lib/activity/event-meta"
import { mapAuditToSemantic } from "@/lib/audit-event-mapper"
import { formatRelativeTime } from "@/lib/activity-date-format"
import { getInitials } from "@/lib/initials"
import type { ActivityItem } from "@/services/activity-service"

const COMMENT_PREVIEW_MAX = 160 // D-B6

export interface ActivityRowProps {
  event: ActivityItem
  /** When set, taskKey/phase reference clicks route under that project. */
  projectId?: number
  /**
   * Phase 14 Plan 14-02 — variant slot, STUB for Plan 14-10.
   * Plan 14-10 will add the "admin-table" branch (compact single-line render
   * for the /admin/audit table cell + Recent Admin Events list). For Plan
   * 14-02 the prop is accepted but the renderer falls through to the default
   * branch — callers can pass it today and the visual upgrade lands when
   * Plan 14-10 ships.
   */
  variant?: "default" | "admin-table"
}

/** Audit log column_id values are integers; we don't have a column-name lookup
 *  at row level, so we surface the raw value rather than render an empty span. */
function statusLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return value
}

export function ActivityRow({ event, projectId }: ActivityRowProps) {
  const { language } = useApp()
  const router = useRouter()

  const semantic = mapAuditToSemantic(event)
  if (!semantic) return null

  const meta = eventMeta[semantic]
  const userName = event.user_name || ""
  const initials = getInitials(userName) || "?"
  const actorAvatar = {
    initials,
    avColor: ((event.user_id ?? 0) % 8) + 1,
  }
  const firstName = userName.split(" ")[0] || ""

  // Optional metadata fields — backend's audit_log payload may carry these in
  // the JSONB metadata column (Phase 9 D-46). We read defensively because not
  // every audit entry will populate them.
  const md = (event.metadata ?? {}) as Record<string, unknown>
  const taskKey = typeof md.task_key === "string" ? md.task_key : undefined
  const taskTitle = typeof md.task_title === "string" ? md.task_title : undefined
  const phaseId = typeof md.phase_id === "string" ? md.phase_id : undefined

  const refLabel = event.entity_label || taskKey || null

  const onRefClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (projectId == null) return
    if (taskKey) {
      router.push(`/projects/${projectId}/tasks/${taskKey}`)
    } else if (phaseId) {
      router.push(`/projects/${projectId}?tab=lifecycle&sub=history`)
    }
  }

  const ariaLabel = `${userName} ${meta.verb(language)}${
    event.timestamp ? ` — ${formatRelativeTime(event.timestamp, language)}` : ""
  }`

  const statusBadgeTone = (raw: string | null | undefined) => {
    // Backend sends column_id (integer-as-string) so tone is a best-effort
    // mapping based on common naming conventions. Falls back to neutral.
    if (!raw) return "neutral" as const
    const v = raw.toLowerCase()
    if (v.includes("done") || v === "4" || v === "5") return "success" as const
    if (v.includes("progress") || v === "2") return "info" as const
    if (v.includes("review") || v === "3") return "warning" as const
    return "neutral" as const
  }

  return (
    <div
      className="hover-row activity-event-row"
      role="article"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 16px",
        position: "relative",
      }}
    >
      {/* Avatar + event-type badge bubble */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Avatar
          user={actorAvatar}
          size={28}
          href={event.user_id ? `/users/${event.user_id}` : undefined}
          className="activity-event-avatar"
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: meta.color,
            boxShadow: "0 0 0 2px var(--surface)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <meta.Icon size={9} color="var(--primary-fg)" />
        </div>
      </div>

      {/* Content column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5 }}>
          <span style={{ fontWeight: 600 }}>{firstName}</span>
          <span style={{ color: "var(--fg-muted)" }}> {meta.verb(language)} </span>
          {refLabel && (
            <span
              style={{
                color: "var(--primary)",
                cursor: projectId != null ? "pointer" : "default",
                fontWeight: 500,
              }}
              onClick={onRefClick}
            >
              {refLabel}
            </span>
          )}
        </div>

        {taskTitle && (
          <div
            style={{
              fontSize: 12,
              color: "var(--fg-muted)",
              marginTop: 2,
            }}
          >
            {taskTitle}
          </div>
        )}

        {/* Status pair (task_status_changed) */}
        {semantic === "task_status_changed" && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
            }}
          >
            {event.old_value && (
              <Badge size="xs" tone={statusBadgeTone(event.old_value)}>
                {statusLabel(event.old_value)}
              </Badge>
            )}
            <ArrowRight size={11} style={{ color: "var(--fg-subtle)" }} />
            {event.new_value && (
              <Badge size="xs" tone={statusBadgeTone(event.new_value)}>
                {statusLabel(event.new_value)}
              </Badge>
            )}
          </div>
        )}

        {/* Assign target row (task_assigned) */}
        {semantic === "task_assigned" && event.new_value && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
              fontSize: 12,
              color: "var(--fg-muted)",
            }}
          >
            <ArrowRight size={11} style={{ color: "var(--fg-subtle)" }} />
            <Avatar user={{ initials: "?" }} size={18} />
            <span>{event.new_value}</span>
          </div>
        )}

        {/* Comment block — D-B6 + T-13-04-01 XSS hardening */}
        {semantic === "comment_created" && event.new_value && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              background: "var(--surface-2)",
              borderRadius: 6,
              boxShadow: "inset 0 0 0 1px var(--border)",
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "var(--fg-muted)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {(() => {
              const stripped = event.new_value.replace(/<[^>]*>/g, "")
              return stripped.length > COMMENT_PREVIEW_MAX
                ? stripped.slice(0, COMMENT_PREVIEW_MAX) + "…"
                : stripped
            })()}
          </div>
        )}

        {/* Time row */}
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-subtle)",
            marginTop: 4,
          }}
        >
          {event.timestamp ? formatRelativeTime(event.timestamp, language) : ""}
        </div>
      </div>
    </div>
  )
}
