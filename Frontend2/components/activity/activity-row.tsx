"use client"

// Phase 13 Plan 13-04 Task 2 — ActivityRow per-event renderer.
// Phase 14 Plan 14-10 Task 2 — extended with `variant?: "default" | "admin-table"`
// + 5 new conditional render branches per CONTEXT D-D4 (D-D5 admin-table /
// D-D6 graceful fallback).
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
//   5. Phase 14 Pitfall 2 — extra_metadata keys are read directly in
//      snake_case (md.task_key, md.task_title, md.project_name, md.field_name,
//      md.old_value_label, md.new_value_label, md.comment_excerpt,
//      md.user_email, md.target_role, md.source_role, md.target_user_name).
//      Every read is `as | undefined` so Phase 14 D-D6 backward compat with
//      pre-Phase-14 audit rows (extra_metadata=null) is graceful.
//   6. Phase 14 D-D5 — when `variant === "admin-table"`, the row renders as a
//      compact grid (1fr auto), single-line, NO Avatar bubble, time on the
//      right. Used by /admin/audit (Plan 14-07 already passes the prop).

import * as React from "react"

import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Avatar, Badge } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { eventMeta } from "@/lib/activity/event-meta"
import {
  mapAuditToSemantic,
  type SemanticEventType,
} from "@/lib/audit-event-mapper"
import { formatRelativeTime } from "@/lib/activity-date-format"
import { getFieldLabel } from "@/lib/admin/audit-field-labels"
import { getInitials } from "@/lib/initials"
import type { ActivityItem } from "@/services/activity-service"

const COMMENT_PREVIEW_MAX = 160 // D-B6

export interface ActivityRowProps {
  event: ActivityItem
  /** When set, taskKey/phase reference clicks route under that project. */
  projectId?: number
  /**
   * Phase 14 Plan 14-10 — variant slot.
   * - "default" (legacy): full anatomy — Avatar + content column with
   *   secondary title row + status pair + assign target + comment block.
   * - "admin-table" (D-D5): compact single-line grid — NO Avatar bubble,
   *   time pinned right. Used by /admin/audit Detay column (Plan 14-07).
   */
  variant?: "default" | "admin-table"
}

/** Audit log column_id values are integers; we don't have a column-name lookup
 *  at row level, so we surface the raw value rather than render an empty span. */
function statusLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return value
}

export function ActivityRow({
  event,
  projectId,
  variant = "default",
}: ActivityRowProps) {
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
  // the JSONB metadata column (Phase 9 D-46, enriched in Phase 14 Plan 14-09
  // per D-D2). We read defensively because not every audit entry will populate
  // them — D-D6 graceful fallback for pre-Phase-14 rows where metadata=null.
  // Pitfall 2: snake_case keys read DIRECTLY — no camelCase mapper.
  const md = (event.metadata ?? {}) as Record<string, unknown>
  const taskKey = typeof md.task_key === "string" ? md.task_key : undefined
  const taskTitle =
    typeof md.task_title === "string" ? md.task_title : undefined
  const phaseId = typeof md.phase_id === "string" ? md.phase_id : undefined
  const projectName =
    typeof md.project_name === "string" ? md.project_name : undefined
  const fieldName =
    typeof md.field_name === "string" ? md.field_name : undefined
  const oldLabel =
    typeof md.old_value_label === "string" ? md.old_value_label : undefined
  const newLabel =
    typeof md.new_value_label === "string" ? md.new_value_label : undefined
  const commentExcerpt =
    typeof md.comment_excerpt === "string" ? md.comment_excerpt : undefined
  const userEmail =
    typeof md.user_email === "string" ? md.user_email : undefined
  const targetRole =
    typeof md.target_role === "string" ? md.target_role : undefined
  const sourceRole =
    typeof md.source_role === "string" ? md.source_role : undefined
  const targetUserName =
    typeof md.target_user_name === "string"
      ? md.target_user_name
      : undefined
  const milestoneTitle =
    typeof md.milestone_title === "string" ? md.milestone_title : undefined
  const artifactName =
    typeof md.artifact_name === "string" ? md.artifact_name : undefined
  const sourcePhaseName =
    typeof md.source_phase_name === "string"
      ? md.source_phase_name
      : undefined

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

  // ---------------------------------------------------------------------------
  // Phase 14 — render the primary line via a switch over SemanticEventType.
  // The legacy render path (firstName + verb + refLabel) is the default branch
  // — that preserves the existing behavior for the 10 Phase 13 event types
  // unchanged, including the secondary taskTitle line, status pair, assign
  // target, and comment block which render below the primary line.
  //
  // 5 NEW Phase 14 branches per CONTEXT D-D4 — they replace the primary line
  // with metadata-driven Jira-style content for the 13 new SemanticEventType
  // members. The shared "secondary rows" (status pair etc.) below remain
  // attached only to the existing Phase 13 semantic types.
  // ---------------------------------------------------------------------------

  type Phase14NewSemantic =
    | "task_field_updated"
    | "project_archived"
    | "project_status_changed"
    | "comment_edited"
    | "comment_deleted"
    | "user_invited"
    | "user_deactivated"
    | "user_activated"
    | "user_role_changed"
    | "user_password_reset_requested"
    | "project_join_request_created"
    | "project_join_request_approved"
    | "project_join_request_rejected"

  const isPhase14New = (s: SemanticEventType): s is Phase14NewSemantic =>
    s === "task_field_updated" ||
    s === "project_archived" ||
    s === "project_status_changed" ||
    s === "comment_edited" ||
    s === "comment_deleted" ||
    s === "user_invited" ||
    s === "user_deactivated" ||
    s === "user_activated" ||
    s === "user_role_changed" ||
    s === "user_password_reset_requested" ||
    s === "project_join_request_created" ||
    s === "project_join_request_approved" ||
    s === "project_join_request_rejected"

  const muted = { color: "var(--fg-muted)" } as const

  function renderPhase14Primary(): React.ReactNode {
    switch (semantic) {
      case "task_field_updated":
        return (
          <>
            <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
            <span style={muted}>{meta.verb(language)}</span>
            {taskTitle ? (
              <>
                {" "}
                {language === "tr" ? "" : "on "}
                <span style={{ fontWeight: 600 }}>
                  {`'${taskTitle}'`}
                </span>
              </>
            ) : (
              <>
                {" "}
                <span style={muted}>
                  {language === "tr" ? "bir görev alanını" : "a task field"}
                </span>
              </>
            )}
            {fieldName ? (
              <>
                {" — "}
                <span style={muted}>
                  {getFieldLabel(fieldName, language)}:
                </span>
              </>
            ) : null}
            {oldLabel || newLabel ? (
              <>
                {" "}
                {oldLabel ? <span>{oldLabel}</span> : null}
                {oldLabel && newLabel ? (
                  <>
                    {" "}
                    <ArrowRight
                      size={11}
                      style={{
                        color: "var(--fg-subtle)",
                        verticalAlign: "middle",
                      }}
                    />{" "}
                  </>
                ) : null}
                {newLabel ? (
                  <span style={{ fontWeight: 600 }}>{newLabel}</span>
                ) : null}
              </>
            ) : null}
          </>
        )

      case "project_archived":
        return (
          <>
            <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
            <span style={muted}>{meta.verb(language)}</span>
            {projectName ? (
              <>
                {" "}
                <span style={{ fontWeight: 600 }}>
                  {`'${projectName}'`}
                </span>
                {language === "tr" ? " projesini" : ""}
              </>
            ) : (
              <>
                {" "}
                <span style={muted}>
                  {language === "tr" ? "bir projeyi" : "a project"}
                </span>
              </>
            )}
          </>
        )

      case "project_status_changed":
        return (
          <>
            <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
            <span style={muted}>{meta.verb(language)}</span>
            {projectName ? (
              <>
                {" "}
                <span style={{ fontWeight: 600 }}>
                  {`'${projectName}'`}
                </span>
                {language === "tr" ? "" : ""}
              </>
            ) : null}
            {oldLabel || newLabel ? (
              <>
                {": "}
                {oldLabel ? <span>{oldLabel}</span> : null}
                {oldLabel && newLabel ? (
                  <>
                    {" "}
                    <ArrowRight
                      size={11}
                      style={{
                        color: "var(--fg-subtle)",
                        verticalAlign: "middle",
                      }}
                    />{" "}
                  </>
                ) : null}
                {newLabel ? (
                  <span style={{ fontWeight: 600 }}>{newLabel}</span>
                ) : null}
              </>
            ) : null}
          </>
        )

      case "comment_edited":
      case "comment_deleted":
        return (
          <>
            <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
            <span style={muted}>{meta.verb(language)}</span>
            {taskTitle ? (
              <>
                {" "}
                <span style={{ fontWeight: 600 }}>
                  {`'${taskTitle}'`}
                </span>{" "}
                <span style={muted}>
                  {language === "tr" ? "üzerinde" : ""}
                </span>
              </>
            ) : null}
          </>
        )

      case "user_invited":
        return (
          <>
            <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
            <span style={muted}>{meta.verb(language)}</span>{" "}
            <span style={{ fontWeight: 600 }}>
              {targetUserName ?? userEmail ?? ""}
            </span>
          </>
        )

      case "user_deactivated":
      case "user_activated":
      case "user_password_reset_requested":
        return (
          <>
            <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
            <span style={muted}>{meta.verb(language)}</span>{" "}
            <span style={{ fontWeight: 600 }}>
              {targetUserName ?? userEmail ?? ""}
            </span>
          </>
        )

      case "user_role_changed":
        return (
          <>
            <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
            <span style={muted}>{meta.verb(language)}</span>{" "}
            <span style={{ fontWeight: 600 }}>
              {targetUserName ?? userEmail ?? ""}
            </span>
            {sourceRole || targetRole ? (
              <>
                {": "}
                {sourceRole ? <span>{sourceRole}</span> : null}
                {sourceRole && targetRole ? (
                  <>
                    {" "}
                    <ArrowRight
                      size={11}
                      style={{
                        color: "var(--fg-subtle)",
                        verticalAlign: "middle",
                      }}
                    />{" "}
                  </>
                ) : null}
                {targetRole ? (
                  <span style={{ fontWeight: 600 }}>{targetRole}</span>
                ) : null}
              </>
            ) : null}
          </>
        )

      case "project_join_request_created":
        return (
          <>
            <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
            <span style={muted}>{meta.verb(language)}</span>{" "}
            <span style={{ fontWeight: 600 }}>
              {targetUserName ?? userEmail ?? ""}
            </span>
            {projectName ? (
              <>
                {" "}
                <span style={muted}>
                  {language === "tr" ? "→" : "→"}
                </span>{" "}
                <span style={{ fontWeight: 600 }}>
                  {`'${projectName}'`}
                </span>
              </>
            ) : null}
          </>
        )

      case "project_join_request_approved":
      case "project_join_request_rejected":
        return (
          <>
            <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
            <span style={muted}>{meta.verb(language)}</span>{" "}
            <span style={{ fontWeight: 600 }}>
              {targetUserName ?? userEmail ?? ""}
            </span>
            {projectName ? (
              <>
                {" "}
                <span style={muted}>
                  {language === "tr" ? "→" : "→"}
                </span>{" "}
                <span style={{ fontWeight: 600 }}>
                  {`'${projectName}'`}
                </span>
              </>
            ) : null}
          </>
        )

      default:
        // unreachable — switch is exhaustive over Phase14NewSemantic.
        return null
    }
  }

  // ---------------------------------------------------------------------------
  // Variant: admin-table (D-D5) — compact single-line grid for /admin/audit.
  // No Avatar bubble. Time pinned right. Backward-compat fallback for old
  // rows still works because the inner primary line gracefully handles
  // missing metadata via the same `?? undefined` reads.
  // ---------------------------------------------------------------------------
  if (variant === "admin-table") {
    const primary = isPhase14New(semantic) ? (
      renderPhase14Primary()
    ) : (
      // Legacy compact rendering — verb + refLabel only (one line).
      <>
        <span style={{ fontWeight: 600 }}>{firstName}</span>{" "}
        <span style={muted}>{meta.verb(language)}</span>
        {refLabel ? (
          <>
            {" "}
            <span style={{ color: "var(--primary)", fontWeight: 500 }}>
              {refLabel}
            </span>
          </>
        ) : null}
        {/* Inline status pair for the legacy task_status_changed when both
            old/new values are present — keeps Detay column meaningful for
            pre-Phase-14 rows. */}
        {semantic === "task_status_changed" &&
        event.old_value &&
        event.new_value ? (
          <>
            {": "}
            <span>{statusLabel(event.old_value)}</span>{" "}
            <ArrowRight
              size={11}
              style={{ color: "var(--fg-subtle)", verticalAlign: "middle" }}
            />{" "}
            <span style={{ fontWeight: 600 }}>
              {statusLabel(event.new_value)}
            </span>
          </>
        ) : null}
        {/* Backward-compat: when extra_metadata carries milestone/artifact
            titles, surface them so the Detay column isn't blank for legacy
            lifecycle rows. */}
        {milestoneTitle ? (
          <>
            {" "}
            <span style={{ fontWeight: 600 }}>{`'${milestoneTitle}'`}</span>
          </>
        ) : null}
        {artifactName ? (
          <>
            {" "}
            <span style={{ fontWeight: 600 }}>{`'${artifactName}'`}</span>
          </>
        ) : null}
        {sourcePhaseName ? (
          <>
            {" "}
            <span style={muted}>{`(${sourcePhaseName})`}</span>
          </>
        ) : null}
      </>
    )

    // Plan 14-15 (Cluster C N-2 fix) — compose a plain-text fallback for the
    // title attribute. This is the screen-reader / overflow-beyond-clamp
    // complement (NOT the primary affordance — the visible cell wraps to
    // up to 3 lines). When metadata is sparse (D-D6 backward-compat), fall
    // back to the ariaLabel which is guaranteed non-empty.
    const adminTablePrimaryText =
      [
        userName,
        meta.verb(language),
        taskTitle ? `'${taskTitle}'` : null,
        projectName ? `'${projectName}'` : null,
        milestoneTitle ? `'${milestoneTitle}'` : null,
        artifactName ? `'${artifactName}'` : null,
        targetUserName ?? userEmail ?? null,
        oldLabel && newLabel ? `${oldLabel} → ${newLabel}` : null,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() || ariaLabel

    return (
      <div
        role="article"
        aria-label={ariaLabel}
        // Plan 14-15 (N-2) — title as complement, not primary affordance.
        // Visible cell wraps to 3 lines; title only matters when content
        // exceeds 3 lines or for screen-reader announcements.
        title={adminTablePrimaryText}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "start",
          gap: 12,
          padding: "0",
          fontSize: 12.5,
          minWidth: 0,
        }}
      >
        {/* Plan 14-15 (Cluster C N-2 fix) — line-wrap is the DEFAULT.
            Previously single-line ellipsis required users to hover for
            content; multi-line clamp lets the user READ the full primary
            line within the table cell. WebkitLineClamp:3 caps row height at
            3 lines so the table grid stays compact (must_haves.truths #4).
            wordBreak:break-word prevents long unbroken tokens (URLs, IDs)
            from blowing up cell width. */}
        <div
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "normal",
            wordBreak: "break-word",
            minWidth: 0,
            lineHeight: 1.4,
          }}
        >
          {primary}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--fg-muted)",
            whiteSpace: "nowrap",
            // Pin the timestamp to the top of the cell so a 3-line primary
            // doesn't push the time vertically into the next row.
            paddingTop: 1,
          }}
        >
          {event.timestamp
            ? formatRelativeTime(event.timestamp, language)
            : ""}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Variant: default (existing Phase 13 layout — Avatar + content column).
  //
  // For Phase 14 NEW semantic types, the primary line is replaced by
  // renderPhase14Primary(). For the existing 10 Phase 13 types, the legacy
  // primary line + secondary rows below it remain untouched.
  // ---------------------------------------------------------------------------
  const primaryLine: React.ReactNode = isPhase14New(semantic) ? (
    renderPhase14Primary()
  ) : (
    <>
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
    </>
  )

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
        <div style={{ fontSize: 12.5 }}>{primaryLine}</div>

        {/* Secondary task-title row — Phase 13 layout only renders this for the
            existing 10 semantic types; Phase 14 new types embed the title in
            the primary line so the secondary row stays empty. */}
        {!isPhase14New(semantic) && taskTitle && (
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

        {/* Status pair (task_status_changed — Phase 13) */}
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

        {/* Assign target row (task_assigned — Phase 13) */}
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

        {/* Comment block — D-B6 + T-13-04-01 XSS hardening (Phase 13). */}
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

        {/* Phase 14 — comment excerpt rendered for comment_edited /
            comment_deleted when extra_metadata carries it (Plan 14-09 capped
            at 161 chars including ellipsis). React's default text escaping
            keeps this XSS-safe (T-14-10-03). */}
        {(semantic === "comment_edited" || semantic === "comment_deleted") &&
          commentExcerpt && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "var(--fg-muted)",
                fontStyle: "italic",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {`"${commentExcerpt}"`}
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
