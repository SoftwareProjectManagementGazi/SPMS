"use client"

// Phase 14 Plan 14-05 — Single project row in the /admin/projects table.
//
// Verbatim grid template from prototype admin.jsx line 325 + UI-SPEC §Surface F:
//   60px 2fr 110px 150px 120px 90px 90px 28px
//   ↑    ↑   ↑     ↑     ↑     ↑    ↑    ↑
//   key  nm  meth  lead  tasks prog cre  MoreH
//
// Methodology badge tone (UI-SPEC §Color):
//   - scrum     → primary
//   - kanban    → warning
//   - waterfall → neutral
//   - iterative → success
//
// Archived projects render with opacity 0.6 + an "Arşivli" Badge tone="neutral"
// next to the name (UI-SPEC §Color line 215 — archived projects are visually
// dimmed in lists).
//
// Per-row actions live in <AdminProjectRowActions/> (EXACTLY 2 menu items —
// Arşivle + Sil — D-B5; NO transfer-ownership).

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  Avatar,
  Badge,
  type AvatarUser,
  type BadgeTone,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminProjectsT } from "@/lib/i18n/admin-projects-keys"
import { getInitials } from "@/lib/initials"
import type { Project } from "@/services/project-service"

import { AdminProjectRowActions } from "./admin-project-row-actions"

export interface AdminProjectRowProps {
  project: Project
  /** Optional overrides for tests; production reads project.taskCount /
   *  project.taskDoneCount populated by the admin-bypass in the backend. */
  taskCount?: number
  taskDoneCount?: number
  isLast: boolean
}

export const ROW_GRID_TEMPLATE =
  "60px 2fr 110px 150px 120px 90px 90px 28px"

function methodBadgeTone(method: string): BadgeTone {
  const m = method.toLowerCase()
  if (m.includes("scrum")) return "primary"
  if (m.includes("kanban")) return "warning"
  if (m.includes("waterfall")) return "neutral"
  if (m.includes("iterative")) return "success"
  return "neutral"
}

function formatCreatedAt(iso: string, lang: "tr" | "en"): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
  })
}

export function AdminProjectRow({
  project,
  taskCount,
  taskDoneCount,
  isLast,
}: AdminProjectRowProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const router = useRouter()

  const isArchived = project.status === "ARCHIVED"

  // Real task counts: prop overrides take precedence (test usage); production
  // reads project.taskCount / project.taskDoneCount which the backend admin
  // bypass populates via task_counts_by_project_ids (Plan 14-05 follow-up).
  const totalTasks = taskCount ?? project.taskCount ?? 0
  const doneTasks = taskDoneCount ?? project.taskDoneCount ?? 0

  // Progress = doneTasks / totalTasks. project.progress is never sent by the
  // backend so the previous `(project.progress ?? 0) * 100` always yielded 0%.
  // 0-task projects render 0% (rather than NaN).
  const progressPct =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Lead avatar — derived from manager fields.
  const leadName = project.managerName ?? ""
  const leadFirstName = leadName.split(" ")[0] ?? ""
  const avUser: AvatarUser | null = leadName
    ? {
        initials: getInitials(leadName) || leadName[0]?.toUpperCase() || "?",
        avColor: ((project.managerId ?? project.id) % 8) + 1,
      }
    : null

  const tasksDoneSuffix = adminProjectsT(
    "admin.projects.tasks_done_suffix",
    lang,
  )
  const archivedBadgeLabel = adminProjectsT(
    "admin.projects.archived_badge",
    lang,
  )

  // Row-level navigation: clicking anywhere on the row (except the MoreH cell
  // and the lead avatar's inner Link) routes to /projects/{id}. Built as a
  // button role on the wrapper rather than wrapping the grid in <Link> because
  // the row already contains nested anchors (Avatar.href -> /users/{managerId})
  // and nested <a> inside <a> is invalid HTML.
  const goToDetail = React.useCallback(() => {
    router.push(`/projects/${project.id}`)
  }, [router, project.id])

  const onRowKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        goToDetail()
      }
    },
    [goToDetail],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={onRowKeyDown}
      aria-label={`${project.key} ${project.name}`}
      style={{
        display: "grid",
        gridTemplateColumns: ROW_GRID_TEMPLATE,
        padding: "10px 16px",
        alignItems: "center",
        gap: 8,
        borderBottom: isLast ? "0" : "1px solid var(--border)",
        fontSize: 12.5,
        // Archived projects: opacity 0.6 visual dim per UI-SPEC §Color line 215.
        // The MoreH actions remain interactive (a11y: arşivden çıkarma + sil
        // need to stay reachable on archived rows).
        opacity: isArchived ? 0.6 : 1,
        transition: "opacity 0.12s, background 0.12s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-2)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
      }}
    >
      {/* 1) Key chip — mono font 10.5px per UI-SPEC §Typography line 124 */}
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--fg-muted)",
          background: "var(--surface-2)",
          padding: "2px 5px",
          borderRadius: 4,
          display: "inline-block",
          width: "fit-content",
        }}
      >
        {project.key}
      </div>

      {/* 2) Name — fontWeight 500 + optional Arşivli badge */}
      <div
        style={{
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {project.name}
        </span>
        {isArchived && (
          <Badge size="xs" tone="neutral">
            {archivedBadgeLabel}
          </Badge>
        )}
      </div>

      {/* 3) Methodology badge */}
      <div>
        <Badge size="xs" tone={methodBadgeTone(project.methodology)}>
          {project.methodology}
        </Badge>
      </div>

      {/* 4) Lead — Avatar + first name. Avatar.href is an internal Link to
           /users/{managerId}; we stopPropagation so clicking the avatar
           navigates to the user profile rather than the row's project detail. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Avatar
          user={avUser}
          size={20}
          href={
            project.managerId ? `/users/${project.managerId}` : undefined
          }
        />
        <span
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {leadFirstName}
        </span>
      </div>

      {/* 5) Tasks — "{N} · {M} bitti" */}
      <div
        className="mono"
        style={{ fontSize: 11, color: "var(--fg-muted)" }}
      >
        {totalTasks} · {doneTasks} {tasksDoneSuffix}
      </div>

      {/* 6) Progress bar + percent */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div
          style={{
            flex: 1,
            height: 4,
            background: "var(--surface-2)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "var(--primary)",
              borderRadius: 2,
            }}
          />
        </div>
        <span
          className="mono"
          style={{ fontSize: 10.5, color: "var(--fg-muted)" }}
        >
          {progressPct}%
        </span>
      </div>

      {/* 7) Created — short date */}
      <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>
        {formatCreatedAt(project.createdAt, lang)}
      </div>

      {/* 8) MoreH — EXACTLY 2 actions (Arşivle + Sil), D-B5 NO transfer.
           stopPropagation so opening the menu / picking an action doesn't
           also route the row to /projects/{id}. */}
      <div
        style={{ position: "relative" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <AdminProjectRowActions
          project={{
            id: project.id,
            key: project.key,
            name: project.name,
            status: project.status,
          }}
        />
      </div>
    </div>
  )
}
