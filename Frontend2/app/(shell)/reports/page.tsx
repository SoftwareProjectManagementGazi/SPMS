"use client"

// Reports migration v2 (Strategy D) Wave 5 — page rewire.
//
// Mounts every Wave 3 chart component (BurndownChart, TeamLoadCard,
// PhaseProgressChart) and wires the 4 StatCards to useSummary. The Wave
// 1b Suspense + URL-state + capability gating from useChartCapabilities
// is preserved end-to-end.
//
// Filter pipeline:
//   URL ?projectId=X&range=Y
//      → globalRange (7|30|90|q2)
//      → chartRange (7|30|90 for chart endpoints that need a window)
//      → filters: ReportFilters { projectId, dateFrom, dateTo }
//        built from globalRange via today() - N days ... today()
//
// Layout matches the prototype (New_Frontend/src/pages/misc.jsx:356-534)
// with one deliberate prototype extension: a full-width PhaseProgressChart
// between Iteration and PhaseReports — justified in
// .planning/REPORTS-MIGRATION-PLAN.md §1 as the Strategy D differentiator
// for projects whose methodology gates Burndown/Iteration out.

import * as React from "react"
import {
  useSearchParams,
  useRouter,
  usePathname,
} from "next/navigation"
import {
  Folder,
  ListChecks,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react"
import { AlertBanner } from "@/components/primitives"
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
import { BurndownChart } from "@/components/reports/burndown-chart"
import { TeamLoadCard } from "@/components/reports/team-load-card"
import { PhaseProgressChart } from "@/components/reports/phase-progress-chart"
import {
  ExportButton,
  type ExportMessage,
} from "@/components/reports/export-button"
import { PhaseReportsSection } from "@/components/reports/phase-reports-section"
import { useChartCapabilities } from "@/hooks/use-chart-capabilities"
import { useSummary } from "@/hooks/use-summary"
import type { ReportFilters } from "@/services/report-service"

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

/** Convert the global DateRange chip to a {dateFrom, dateTo} pair for
 *  the v1 report endpoints. "q2" decorative chip falls back to 90 days. */
function rangeToFilters(
  projectId: number | null,
  range: DateRange,
): ReportFilters {
  const dayCount = range === "q2" ? 90 : (range as 7 | 30 | 90)
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - dayCount + 1)
  return {
    projectId,
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: today.toISOString().slice(0, 10),
  }
}

// ---------------------------------------------------------------------------
// Helpers — StatCard value/delta formatting
// ---------------------------------------------------------------------------

const EM_DASH = "—"

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return EM_DASH
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

function formatDelta(
  value: number | null | undefined,
  suffix: string = "",
): string | undefined {
  if (value === null || value === undefined) return undefined
  const sign = value > 0 ? "+" : ""
  const rendered = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${sign}${rendered}${suffix}`
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
    (next: DateRange) => updateParams({ range: String(next) }),
    [updateParams],
  )

  React.useEffect(() => {
    if (selectedProjectId == null && projectList.length > 0) {
      setSelectedProjectId(projectList[0].id)
    }
  }, [projectList, selectedProjectId, setSelectedProjectId])

  // --- Capability + filter derivation ----------------------------------
  const capsQuery = useChartCapabilities(selectedProjectId)
  const caps = capsQuery.data

  const filters = React.useMemo(
    () => rangeToFilters(selectedProjectId, globalRange),
    [selectedProjectId, globalRange],
  )

  const chartRange: 7 | 30 | 90 =
    globalRange === "q2" ? 90 : (globalRange as 7 | 30 | 90)

  // --- Data hooks ------------------------------------------------------
  const summaryQuery = useSummary(filters, caps?.summary === true)
  const summary = summaryQuery.data

  // --- Capability flags as boolean | null (null = loading) -------------
  // null while the caps query is in flight; charts treat null as "idle"
  // and render the skeleton/placeholder branch.
  const cfdApplicable: boolean | null = caps ? caps.cfd : null
  const iterationApplicable: boolean | null = caps ? caps.iteration : null
  const burndownApplicable: boolean | null = caps ? caps.burndown : null
  const teamLoadApplicable: boolean | null = caps ? caps.team_load : null
  const phaseProgressApplicable: boolean | null = caps
    ? caps.phase_progress
    : null

  // --- Export message strip --------------------------------------------
  // ExportButton dispatches success/failure into this transient AlertBanner.
  // Auto-clears after 3s — no Toast primitive shipped (peer review §2.8).
  const [exportMsg, setExportMsg] = React.useState<ExportMessage | null>(null)
  const clearTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleExportMessage = React.useCallback((msg: ExportMessage) => {
    setExportMsg(msg)
    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => setExportMsg(null), 3_000)
  }, [])
  React.useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
    },
    [],
  )

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
          <ExportButton
            filters={filters}
            disabled={selectedProjectId == null}
            onMessage={handleExportMessage}
          />
        </div>
      </div>

      {/* Transient export feedback (replaces Toast primitive per peer review) */}
      {exportMsg ? (
        <AlertBanner
          tone={exportMsg.variant === "success" ? "success" : "danger"}
        >
          {exportMsg.text}
        </AlertBanner>
      ) : null}

      {/* 4 StatCards — wired to /reports/summary in Wave 5. Velocity +
          blockers come from optional SummaryDTO delta fields (Wave 1a
          added them as Optional with `null` default; backend delta
          computation lands as a follow-up). Cycle time + completion
          flow from the same payload's primary fields. */}
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
          value={formatValue(summary?.velocityDelta ?? null)}
          delta={formatDelta(summary?.velocityDelta ?? null, T(" pts", " pts"))}
          tone="primary"
          icon={<ListChecks size={14} />}
        />
        <StatCard
          label={T("Döngü Süresi", "Cycle time")}
          value={
            summary?.cycleTimeAvgDays != null
              ? `${formatValue(summary.cycleTimeAvgDays)}${T("g", "d")}`
              : EM_DASH
          }
          delta={formatDelta(
            summary?.cycleTimeDeltaDays ?? null,
            T("g", "d"),
          )}
          tone="info"
          icon={<Folder size={14} />}
        />
        <StatCard
          label={T("Tamamlanan", "Completed")}
          value={formatValue(summary?.completedTasks)}
          delta={formatDelta(summary?.completedDeltaPct ?? null, "%")}
          tone="success"
          icon={<CheckCircle2 size={14} />}
        />
        <StatCard
          label={T("Engeller", "Blockers")}
          value={formatValue(summary?.blockersCount ?? null)}
          delta={formatDelta(summary?.blockersDelta ?? null, "")}
          tone="danger"
          icon={<AlertOctagon size={14} />}
        />
      </div>

      {/* Burndown + Team Load row — now wired to real components. */}
      <div
        className="reports-burndown-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 16,
        }}
      >
        <BurndownChart
          projectId={selectedProjectId}
          applicable={burndownApplicable}
        />
        <TeamLoadCard
          filters={filters}
          applicable={teamLoadApplicable}
        />
      </div>

      {/* CFD card — Strategy D: gated on column-category triple presence. */}
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

      {/* Iteration card — Strategy D: gated on sprint presence. */}
      <IterationChart
        projectId={selectedProjectId}
        applicable={iterationApplicable}
      />

      {/* Phase Progress — NEW Strategy D differentiator. Renders for any
          project with phase_workflow.nodes (Waterfall + custom workflows). */}
      <PhaseProgressChart
        projectId={selectedProjectId}
        applicable={phaseProgressApplicable}
      />

      <PhaseReportsSection />
    </div>
  )
}
