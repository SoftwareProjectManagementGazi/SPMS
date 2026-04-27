"use client"

// Phase 14 Plan 14-02 Task 2 — Overview StatCards row (UI-SPEC §Surface B
// lines 304-308 + prototype admin.jsx lines 54-60).
//
// 5 cards in a 5-column grid: Kullanıcı / Aktif Proje / Onay Bekleyen /
// Şablon / Depolama. Counts come from the existing TanStack Query hooks
// (useAdminUsers / useProjects / usePendingJoinRequests / useProcessTemplates)
// — no new endpoints needed for v2.0.
//
// Storage value is the verbatim prototype mock ("12.4 GB" / "62% dolu") —
// SPMS has no storage backend in v2.0, and the prototype already rendered
// the card as a teaser. Documented in 14-02-SUMMARY.md.
//
// Note on StatCard tone: the primitive's tone enum is
// "primary"|"info"|"success"|"danger"|"neutral" (no "warning"). The prototype
// uses tone="warning" for Onay Bekleyen → mapped to tone="info" here per
// CONTEXT D-Y1 visual-fidelity guidance (closest amber-ish surface available
// without forking the primitive). Documented in commit body.

import * as React from "react"
import { Users, Folder, Clock, Workflow, BarChart3 } from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { useApp } from "@/context/app-context"
import { useAdminUsers } from "@/hooks/use-admin-users"
import { useProjects } from "@/hooks/use-projects"
import { usePendingJoinRequests } from "@/hooks/use-pending-join-requests"
import { useProcessTemplates } from "@/hooks/use-projects"
import { adminT } from "@/lib/i18n/admin-keys"

export function OverviewStatCards() {
  const { language } = useApp()

  // Data feeds — Plan 14-01 hooks (TanStack Query keyed; cached across remounts).
  const usersQ = useAdminUsers()
  const projectsQ = useProjects()
  const pendingQ = usePendingJoinRequests(5)
  const templatesQ = useProcessTemplates()

  // Defensive count derivation — every query may be loading / errored / empty.
  // Don't render "0" if data hasn't loaded; render an em-dash so the user can
  // distinguish loading from a true zero. Once loaded, we're confident.
  const userCount =
    Array.isArray(usersQ.data) ? usersQ.data.length : usersQ.data?.total ?? null
  const projectCount = Array.isArray(projectsQ.data)
    ? projectsQ.data.filter(
        (p: { status?: string }) =>
          p.status !== "ARCHIVED" && p.status !== "archived",
      ).length
    : null
  const pendingCount = pendingQ.data?.total ?? null
  const templateCount = Array.isArray(templatesQ.data)
    ? templatesQ.data.length
    : null

  const dash = "—"
  const fmt = (n: number | null) => (n == null ? dash : String(n))

  // Deltas — verbatim prototype mocks for v2.0 (templates "3 özel" etc. are
  // teasers; real "added in last month" numbers are a v2.1 candidate that
  // would query audit_log).
  const usersDeltaTpl = adminT("admin.overview.statcard_users_delta", language)
  const usersDelta = usersDeltaTpl.replace("{N}", "3") // teaser; v2.1 candidate
  const projectsDeltaTpl = adminT(
    "admin.overview.statcard_active_projects_delta",
    language,
  )
  const projectsDelta = projectsDeltaTpl.replace("{N}", "2")
  const pendingDelta = adminT("admin.overview.statcard_pending_delta", language)
  const templatesDeltaTpl = adminT(
    "admin.overview.statcard_templates_delta",
    language,
  )
  const templatesDelta = templatesDeltaTpl.replace(
    "{N}",
    String(templateCount ?? 0),
  )
  const storageDeltaTpl = adminT(
    "admin.overview.statcard_storage_delta",
    language,
  )
  const storageDelta = storageDeltaTpl.replace("{P}", "62")

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 12,
      }}
    >
      <div
        aria-label={`${adminT(
          "admin.overview.statcard_users",
          language,
        )}: ${fmt(userCount)}`}
      >
        <StatCard
          label={adminT("admin.overview.statcard_users", language)}
          value={fmt(userCount)}
          delta={usersDelta}
          tone="primary"
          icon={<Users size={14} />}
        />
      </div>
      <div
        aria-label={`${adminT(
          "admin.overview.statcard_active_projects",
          language,
        )}: ${fmt(projectCount)}`}
      >
        <StatCard
          label={adminT("admin.overview.statcard_active_projects", language)}
          value={fmt(projectCount)}
          delta={projectsDelta}
          tone="info"
          icon={<Folder size={14} />}
        />
      </div>
      <div
        aria-label={`${adminT(
          "admin.overview.statcard_pending",
          language,
        )}: ${fmt(pendingCount)}`}
      >
        {/* Prototype tone="warning" → mapped to "info" because the StatCard
            tone enum doesn't include "warning" (Plan 14-01 deferred-items.md
            tracks the primitive enum gap). Closest semantic available. */}
        <StatCard
          label={adminT("admin.overview.statcard_pending", language)}
          value={fmt(pendingCount)}
          delta={pendingDelta}
          tone="info"
          icon={<Clock size={14} />}
        />
      </div>
      <div
        aria-label={`${adminT(
          "admin.overview.statcard_templates",
          language,
        )}: ${fmt(templateCount)}`}
      >
        <StatCard
          label={adminT("admin.overview.statcard_templates", language)}
          value={fmt(templateCount)}
          delta={templatesDelta}
          tone="neutral"
          icon={<Workflow size={14} />}
        />
      </div>
      <div
        aria-label={`${adminT(
          "admin.overview.statcard_storage",
          language,
        )}: 12.4 GB`}
      >
        {/* Storage = verbatim prototype mock (no storage backend in v2.0). */}
        <StatCard
          label={adminT("admin.overview.statcard_storage", language)}
          value="12.4 GB"
          delta={storageDelta}
          tone="neutral"
          icon={<BarChart3 size={14} />}
        />
      </div>
    </div>
  )
}
