"use client"

// Phase 14 Plan 14-05 — /admin/projects (Projeler) table.
//
// Verbatim grid template per UI-SPEC §Spacing + prototype admin.jsx line 325:
//   60px 2fr 110px 150px 120px 90px 90px 28px
//
// 8 columns: key chip / name / methodology badge / lead avatar / tasks / progress
// bar / created date / MoreH trigger.
//
// Reads from existing useProjects() hook. Backend admin-bypass at
// /projects (Phase 9-10) returns ALL statuses including ARCHIVED for admins,
// so no `include_archived=true` extension is needed — admins automatically
// see archived projects via the existing filter-less list call.
//
// Filter: client-side substring match on project.name + project.key (D-C5
// localStorage persistence handled by the parent /admin/projects/page.tsx).

import * as React from "react"

import { Card, DataState } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProjects } from "@/hooks/use-projects"
import { adminProjectsT } from "@/lib/i18n/admin-projects-keys"
import type { Project } from "@/services/project-service"
// Plan 14-18 (Cluster F UAT Test 34) — viewport overflow shell.
import { AdminTableShell } from "@/lib/admin/admin-table-shell"

import {
  AdminProjectRow,
  ROW_GRID_TEMPLATE,
} from "./admin-project-row"

export interface AdminProjectsTableFilter {
  q?: string
}

export interface AdminProjectsTableProps {
  filter: AdminProjectsTableFilter
}

export function AdminProjectsTable({ filter }: AdminProjectsTableProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  // No status filter passed — admins receive all statuses including ARCHIVED
  // via the backend admin-bypass in projects.py list_projects (lines 146-149).
  const q = useProjects()

  // Tolerate both response shapes: array (mapped Project[]) AND undefined/null
  // during loading. The service mapper already returns Project[] from getAll.
  const items: Project[] = React.useMemo(() => {
    const data = q.data as unknown
    if (Array.isArray(data)) return data as Project[]
    return []
  }, [q.data])

  // Client-side filter — substring match on name + key.
  const trimmedQ = (filter.q ?? "").trim().toLowerCase()
  const filtered: Project[] = React.useMemo(() => {
    if (!trimmedQ) return items
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(trimmedQ) ||
        p.key.toLowerCase().includes(trimmedQ),
    )
  }, [items, trimmedQ])

  const isEmpty = !q.isLoading && !q.error && filtered.length === 0

  const empty_no_match = adminProjectsT("admin.projects.empty_no_match", lang)
  const empty_no_projects = adminProjectsT(
    "admin.projects.empty_no_projects",
    lang,
  )
  const emptyCopy = trimmedQ ? empty_no_match : empty_no_projects

  return (
    // Plan 14-18 — AdminTableShell wraps the Card so narrow viewports get
    // a horizontal scrollbar instead of overlapping cells.
    // Projects table grid total ≈ 1100px (8-col ROW_GRID_TEMPLATE).
    <AdminTableShell minWidth={1100}>
      <Card padding={0}>
        {/* Header row (table column labels) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: ROW_GRID_TEMPLATE,
            padding: "10px 16px",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            color: "var(--fg-subtle)",
            fontWeight: 600,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>{adminProjectsT("admin.projects.col_key", lang)}</div>
          <div>{adminProjectsT("admin.projects.col_name", lang)}</div>
          <div>{adminProjectsT("admin.projects.col_method", lang)}</div>
          <div>{adminProjectsT("admin.projects.col_lead", lang)}</div>
          <div>{adminProjectsT("admin.projects.col_tasks", lang)}</div>
          <div>{adminProjectsT("admin.projects.col_progress", lang)}</div>
          <div>{adminProjectsT("admin.projects.col_created", lang)}</div>
          <div />
        </div>

        {/* Body — DataState fallback + row list */}
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
              {emptyCopy}
            </div>
          }
        >
          <div>
            {filtered.map((p, i) => (
              <AdminProjectRow
                key={p.id}
                project={p}
                // Task counts now flow through project.taskCount / project.taskDoneCount,
                // populated by the backend admin-bypass aggregate
                // (project_repo.task_counts_by_project_ids — Plan 14-05 follow-up).
                isLast={i === filtered.length - 1}
              />
            ))}
          </div>
        </DataState>
      </Card>
    </AdminTableShell>
  )
}
