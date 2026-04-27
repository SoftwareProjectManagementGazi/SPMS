"use client"

// Phase 13 Plan 13-07 — Reports page REWRITE.
//
// Replaces the 12-line Phase 8 stub with the full prototype-faithful
// ReportsPage:
//   - Header (title + subtitle on the left, ProjectPicker + DateRangeFilter
//     + PDF Button on the right per D-A1 + D-A5).
//   - 4 StatCards row (Sprint Velocity / Cycle Time / Completed / Blockers)
//     verbatim from prototype line 374–379 (D-A2 — keep v1.0 layout).
//   - Burndown + Team Load row (1.5fr / 1fr) — preserved per D-A2 last
//     sentence. Phase 13 keeps the v1.0 surface intact and adds new charts
//     below.
//   - CFDChart (Kanban-only, methodology-gated per D-A4).
//   - Lead/Cycle row pair (1fr / 1fr — all methodologies per D-A4).
//
// Plan 13-08 will append IterationChart and PhaseReportsSection BELOW the
// Lead/Cycle row. The current layout intentionally leaves space at the
// bottom so 13-08 can mount its components without re-architecting this
// file.
//
// StatCards / Burndown / Team Load values are placeholders ("—"): D-A2
// requires the v1.0 prototype layout to be preserved exactly while the
// underlying summary endpoint wiring lands as a follow-up. Rendering an
// empty-shell card now is honest about where the data is missing without
// removing the visual section the user is used to seeing.

import * as React from "react"
import {
  Download,
  Folder,
  ListChecks,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react"
import { Card, Button, ProgressBar } from "@/components/primitives"
import { StatCard } from "@/components/dashboard/stat-card"
import { useApp } from "@/context/app-context"
import { useProjects } from "@/hooks/use-projects"
import type { Project } from "@/services/project-service"
import { ProjectPicker } from "@/components/reports/project-picker"
import {
  DateRangeFilter,
  type DateRange,
} from "@/components/reports/date-range-filter"
import { CFDChart } from "@/components/reports/cfd-chart"
import { LeadCycleChart } from "@/components/reports/lead-cycle-chart"
import { IterationChart } from "@/components/reports/iteration-chart"
import { PhaseReportsSection } from "@/components/reports/phase-reports-section"
import { chartApplicabilityFor } from "@/lib/charts/applicability"
import type { Methodology } from "@/lib/methodology-matrix"

export default function ReportsPage() {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const { data: projects } = useProjects("ACTIVE,COMPLETED")
  const projectList = (projects as Project[] | undefined) ?? []

  const [selectedProjectId, setSelectedProjectId] = React.useState<number | null>(null)
  const [globalRange, setGlobalRange] = React.useState<DateRange>(30)

  // Auto-select the first project once the list resolves so the page is not
  // empty on first paint after sign-in.
  React.useEffect(() => {
    if (selectedProjectId == null && projectList.length > 0) {
      setSelectedProjectId(projectList[0].id)
    }
  }, [projectList, selectedProjectId])

  const project = projectList.find((p) => p.id === selectedProjectId)
  const applicable = project
    ? chartApplicabilityFor(project.methodology as Methodology)
    : null

  // Charts only consume 7 | 30 | 90; the "q2" decorative chip falls back to
  // 90d so the chart series still load coherently.
  const chartRange: 7 | 30 | 90 =
    globalRange === "q2" ? 90 : (globalRange as 7 | 30 | 90)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: -0.4,
              margin: 0,
            }}
          >
            {T("Raporlar", "Reports")}
          </h1>
          <div
            style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}
          >
            {T(
              "Performans ve verimlilik metrikleri",
              "Performance & velocity metrics",
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <ProjectPicker
            value={selectedProjectId}
            onChange={setSelectedProjectId}
          />
          <DateRangeFilter value={globalRange} onChange={setGlobalRange} />
          <Button variant="secondary" size="sm" icon={<Download size={13} />}>
            PDF
          </Button>
        </div>
      </div>

      {/* 4 StatCards row — verbatim layout from prototype line 374–379.
          Values are placeholders until the v1.0 summary endpoint is wired
          to this page; the visible-but-empty cards preserve the prototype
          layout per D-A2. */}
      <div
        className="reports-stat-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        <StatCard
          label={T("Sprint Velocity", "Sprint velocity")}
          value="—"
          tone="primary"
          icon={<ListChecks size={14} />}
        />
        <StatCard
          label={T("Döngü Süresi", "Cycle time")}
          value="—"
          tone="info"
          icon={<Folder size={14} />}
        />
        <StatCard
          label={T("Tamamlanan", "Completed")}
          value="—"
          tone="success"
          icon={<CheckCircle2 size={14} />}
        />
        <StatCard
          label={T("Engeller", "Blockers")}
          value="—"
          tone="danger"
          icon={<AlertOctagon size={14} />}
        />
      </div>

      {/* Burndown + Team Load row — preserved 1.5fr/1fr layout per D-A2.
          Both cards render the prototype shells with placeholder content
          until the v1.0 burndown / team-load data layer ships. New Phase 13
          charts go BELOW this row. */}
      <div
        className="reports-burndown-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 16,
        }}
      >
        <Card padding={16}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            {T("Burndown — Sprint 23", "Burndown — Sprint 23")}
          </h3>
          <div
            style={{
              height: 160,
              color: "var(--fg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}
          >
            {T("Burndown grafiği — v1.0 verisi", "Burndown chart — v1.0 data")}
          </div>
        </Card>
        <Card padding={16}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            {T("Takım Yükü", "Team Load")}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: "7px 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span>—</span>
                <span className="mono">0%</span>
              </div>
              <ProgressBar value={0} max={100} />
            </div>
          </div>
        </Card>
      </div>

      {/* CFD card — Kanban only (D-A4 methodology gate). The chart hides
          itself behind an info AlertBanner for non-Kanban projects. */}
      <CFDChart
        projectId={selectedProjectId}
        globalRange={chartRange}
        applicable={applicable?.cfd ?? null}
      />

      {/* Lead/Cycle row — all methodologies per D-A4. Plan 13-08 will append
          IterationChart + PhaseReportsSection BELOW this row. */}
      <div
        className="reports-leadcycle-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <LeadCycleChart
          projectId={selectedProjectId}
          kind="lead"
          globalRange={chartRange}
        />
        <LeadCycleChart
          projectId={selectedProjectId}
          kind="cycle"
          globalRange={chartRange}
        />
      </div>

      {/* Iteration card — Scrum / Iterative / Incremental / Evolutionary /
          RAD only (D-A4). Returns null entirely for non-cycle methodologies
          (different gate strategy than CFD's AlertBanner — for iteration the
          card is removed from the layout flow because the data simply does
          not exist for non-cycle workflows). */}
      <IterationChart
        projectId={selectedProjectId}
        applicable={applicable?.iteration ?? null}
      />

      {/* Faz Raporları section — 2-tab outer Tabs (Aktif+Tamamlanan /
          Arşivlenmiş) + cascading project/phase pickers + inline
          EvaluationReportCard expand (Phase 12 reuse, read-only per D-E2).
          Independent of the page's selectedProjectId / chartRange — the
          section maintains its own picker state because users may want to
          look at a different project's reports than the one they're viewing
          charts for (D-E1). */}
      <PhaseReportsSection />
    </div>
  )
}
