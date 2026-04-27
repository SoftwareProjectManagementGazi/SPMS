"use client"

// Phase 14 Plan 14-06 — /admin/workflows (Şablonlar) sub-route page.
//
// 3-column grid of process-template cards reading the existing
// useProcessTemplates() hook (Phase 13 — Frontend2/hooks/use-projects.ts).
// Layout per UI-SPEC §Spacing line 78 + prototype admin.jsx line 363:
//
//   gridTemplateColumns: repeat(3, 1fr)
//   gap: 14
//
// Active-project counts are computed client-side from the existing
// useProjects() cache. Backend doesn't expose `active_project_count` on the
// ProcessTemplateResponseDTO; CONTEXT D-B1 / Plan 14-06 critical_constraints
// forbid backend changes here, so we count projects whose
// processTemplateId === template.id. ARCHIVED projects are excluded — only
// ACTIVE / ON_HOLD / COMPLETED count toward the impact-aware delete gate.
//
// Per-card MoreH wires Düzenle (router.push) + Klonla (existing endpoint
// composed into a client-side clone) + Sil (existing endpoint with an
// impact-aware ConfirmDialog / Modal — see template-row-actions.tsx).
//
// CONTEXT D-C6 (lazy loading): the Workflows tab is a one-time mount; the
// per-card MoreH menu component already pulls hooks lazily so no extra
// dynamic import is needed for the v2.0 size budget.

import * as React from "react"

import { DataState } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProcessTemplates, useProjects } from "@/hooks/use-projects"
import { adminWorkflowsT } from "@/lib/i18n/admin-workflows-keys"

import {
  AdminTemplateCard,
  type AdminTemplateCardData,
} from "@/components/admin/workflows/admin-template-card"

export default function AdminWorkflowsPage() {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"

  const templatesQ = useProcessTemplates()
  // useProjects() with no args returns ALL statuses for admins (admin-bypass
  // at projects.py:146-149). We filter to non-ARCHIVED projects here so the
  // template usage counter reflects "active" usage — archived projects don't
  // count toward the impact-aware delete gate.
  const projectsQ = useProjects()

  // Build a map<templateId, count> once per render so per-card lookup is O(1).
  const usageMap = React.useMemo(() => {
    const map: Record<number, number> = {}
    const data = projectsQ.data as unknown
    if (Array.isArray(data)) {
      for (const p of data as Array<{
        processTemplateId: number | null
        status: string
      }>) {
        if (p.processTemplateId == null) continue
        if (p.status === "ARCHIVED") continue
        map[p.processTemplateId] = (map[p.processTemplateId] ?? 0) + 1
      }
    }
    return map
  }, [projectsQ.data])

  const templates: AdminTemplateCardData[] = React.useMemo(() => {
    const data = templatesQ.data as unknown
    if (Array.isArray(data)) return data as AdminTemplateCardData[]
    return []
  }, [templatesQ.data])

  const isEmpty =
    !templatesQ.isLoading && !templatesQ.error && templates.length === 0

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <DataState
        loading={templatesQ.isLoading}
        error={templatesQ.error}
        empty={isEmpty}
        emptyFallback={
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              color: "var(--fg-muted)",
              fontSize: 13,
            }}
          >
            {adminWorkflowsT("admin.workflows.empty", lang)}
          </div>
        }
      >
        {/* Verbatim grid: repeat(3, 1fr) gap:14 (UI-SPEC §Spacing line 78,
            prototype admin.jsx line 363). */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
          }}
        >
          {templates.map((t) => (
            <AdminTemplateCard
              key={t.id}
              template={t}
              activeProjectCount={usageMap[t.id] ?? 0}
            />
          ))}
        </div>
      </DataState>
    </div>
  )
}
