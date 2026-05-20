"use client"

// Reports migration v2 (Strategy D) Wave 1b — page rewire.
//
// Changes vs Phase 13:
// - URL-state filters (D-C5-style) so /reports?projectId=42&range=30 round-
//   trips through refresh / bookmark / share. Adopts the audit-page pattern
//   at app/(shell)/admin/audit/page.tsx (Suspense wrapping + useSearchParams
//   + router.replace).
// - Capability gating moved to backend via useChartCapabilities — the FE
//   never reads project.methodology to decide what to render. CFD / Lead /
//   Iteration chart cards still receive an `applicable: boolean | null`
//   prop for prop-API stability, but the boolean now comes from the
//   backend capability response instead of the deleted FE applicability
//   mirror (chartApplicabilityFor).
// - Wave 2 will wire StatCards / Burndown / TeamLoad. Wave 3 adds the new
//   chart components. This commit deliberately keeps the placeholder cards
//   intact (still showing the prototype's v1.0 shell) so the page layout
//   is stable for the data/chart rewire in subsequent waves.

import * as React from "react"
import {
  useSearchParams,
  useRouter,
  usePathname,
} from "next/navigation"
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
import { useChartCapabilities } from "@/hooks/use-chart-capabilities"

// ---------------------------------------------------------------------------
// URL <-> filter encoding
// ---------------------------------------------------------------------------

const DEFAULT_RANGE: DateRange = 30
const VALID_RANGES: DateRange[] = [7, 30, 90, "q2"]

function parseProjectId(raw: string | null): number | null {
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

function parseRange(raw: string | null): DateRange {
  if (!raw) return DEFAULT_RANGE
  if (raw === "q2") return "q2"
  const n = parseInt(raw, 10)
  return (VALID_RANGES as Array<DateRange | number>).includes(n)
    ? (n as DateRange)
    : DEFAULT_RANGE
}

// ---------------------------------------------------------------------------
// Default export — Suspense wrapper (Next.js 16 useSearchParams CSR-bailout)
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  return (
    <React.Suspense fallback={null}>
      <ReportsPageInner />
    </React.Suspense>
  )
}

function ReportsPageInner() {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? "/reports"

  const { data: projects } = useProjects("ACTIVE,COMPLETED")
  const projectList = (projects as Project[] | undefined) ?? []

  // URL is the source of truth — re-derive every render so refresh /
  // bookmark / share works.
  const selectedProjectId = React.useMemo(
    () => parseProjectId(searchParams?.get("projectId") ?? null),
    [searchParams],
  )
  const globalRange = React.useMemo(
    () => parseRange(searchParams?.get("range") ?? null),
    [searchParams],
  )

  const updateParams = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "")
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") {
          next.delete(key)
        } else {
          next.set(key, value)
        }
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const setSelectedProjectId = React.useCallback(
    (id: number | null) =>
      updateParams({ projectId: id == null ? null : String(id) }),
    [updateParams],
  )
  const setGlobalRange = React.useCallback(
    (next: DateRange) =>
      updateParams({ range: String(next) }),
    [updateParams],
  )

  // First-paint convenience: when no projectId is in the URL and the project
  // list resolves, seed the URL with the first project so the page is not
  // empty on /reports landings (e.g. nav-tab click without a query string).
  React.useEffect(() => {
    if (selectedProjectId == null && projectList.length > 0) {
      setSelectedProjectId(projectList[0].id)
    }
  }, [projectList, selectedProjectId, setSelectedProjectId])

  // Backend is the single source of truth for chart visibility. We never
  // re-derive capabilities from project.methodology on the FE.
  const capsQuery = useChartCapabilities(selectedProjectId)
  const caps = capsQuery.data

  // Charts only consume 7 | 30 | 90; the "q2" decorative chip falls back to
  // 90d so the chart series still load coherently.
  const chartRange: 7 | 30 | 90 =
    globalRange === "q2" ? 90 : (globalRange as 7 | 30 | 90)

  // While caps are loading we surface `null` to legacy chart props so they
  // sit in the "idle" branch (skeleton via DataState) instead of flashing
  // a methodology-mismatch banner. Once resolved we pass the actual bool.
  const cfdApplicable: boolean | null = caps ? caps.cfd : null
  const iterationApplicable: boolean | null = caps ? caps.iteration : null

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

      {/* 4 StatCards row — Wave 2 will wire these to /reports/summary.
          Until then the prototype shell stays so the page layout doesn't
          shift between Wave 1b and Wave 2 commits. */}
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

      {/* Burndown + Team Load row — Wave 3 will replace these placeholder
          shells with <BurndownChart> and <TeamLoadCard>. Layout (1.5fr /
          1fr) is the prototype's contract; preserved across the rewire so
          the visual rhythm is stable mid-migration. */}
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

      {/* CFD card — capability-gated (Strategy D). Backend returns
          caps.cfd=true iff the project has the {todo, in_progress, done}
          category triple in its columns. */}
      <CFDChart
        projectId={selectedProjectId}
        globalRange={chartRange}
        applicable={cfdApplicable}
      />

      {/* Lead/Cycle row — always applicable per the rule registry. */}
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

      {/* Iteration card — capability-gated. Backend returns caps.iteration
          based on sprint presence (sprint_count > 0), NOT methodology. A
          custom workflow project with sprints gets the chart; a Scrum-named
          project with zero sprints does not. */}
      <IterationChart
        projectId={selectedProjectId}
        applicable={iterationApplicable}
      />

      {/* Phase Reports — independent surface (own pickers). Wave 3 will
          insert a Phase Progress chart between Iteration and this section
          for projects with phase_workflow.nodes. */}
      <PhaseReportsSection />
    </div>
  )
}
