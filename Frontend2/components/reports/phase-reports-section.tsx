"use client"

// Phase 13 Plan 13-08 Task 2 — PhaseReportsSection (REPT-04).
//
// Faz Raporları section on the global /reports page. 2-tab outer Tabs
// primitive ("Aktif + Tamamlanan" default, "Arşivlenmiş") wrapping a
// cascading project + phase picker, an inline EvaluationReportCard expand
// (Phase 12 D-57 — REUSED in read-only mode per D-E2), and a "Son raporlar"
// recent rows panel that surfaces the 5 most recent reports of the selected
// project (cross-project aggregation deferred per CONTEXT — see SUMMARY).
//
// Decision contract (CONTEXT D-E1..D-E4):
//   - D-E1 — 2-tab outer split based on project status. Tab 1 pulls
//     ACTIVE+COMPLETED; tab 2 pulls ARCHIVED. Each tab body has its own
//     picker + recent rows.
//   - D-E2 — Inline expand uses Phase 12 EvaluationReportCard with the new
//     readOnly prop wired to true. The Reports page must NEVER expose write
//     paths (T-13-08-04 Tampering mitigation); readOnly forces canEdit=false
//     in the EvaluationReportCard regardless of the viewer's transition
//     authority on the project.
//   - D-E3 — useProjects("ACTIVE,COMPLETED") | useProjects("ARCHIVED")
//     depending on outerTab. Cache key strategy: status string is part of
//     the queryKey so the two tabs are independently memoized.
//   - D-E4 — Empty (no project) → "Önce proje seçin." Empty (project but
//     no report for selected phase) → message + "Yaşam Döngüsü'ne git" deep
//     link to /projects/{id}?tab=lifecycle&sub=history.
//
// Cross-project recent rows aggregation deferred (CONTEXT "Faz Raporları
// cross-project listing" — v2.1 candidate). Rows shown here are the SELECTED
// project's reports only. The deferral is documented in 13-08-SUMMARY.md.

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  Tabs,
  Button,
} from "@/components/primitives"
import { EvaluationReportCard } from "@/components/lifecycle/evaluation-report-card"
import { useProjects } from "@/hooks/use-projects"
import { usePhaseReports } from "@/hooks/use-phase-reports"
import { useApp } from "@/context/app-context"
import type { Project } from "@/services/project-service"
import type { WorkflowNode } from "@/services/lifecycle-service"
import type { PhaseReport } from "@/services/phase-report-service"

type OuterTabId = "active" | "archived"

interface PhaseOption {
  id: string
  name: string
}

interface RecentRow {
  reportId: number
  projectId: number
  projectKey: string
  projectName: string
  phaseId: string
  phaseName: string
  closedAt?: string | null
  taskCount: number
  successPct: number | null
}

// Project shape exposed by useProjects — camelCase via project-service mapper.
// We DON'T import Project directly because the picker only needs the small
// subset (id, key, name, processConfig). Typing the picker option list against
// Project keeps the read narrow.
type PickerProject = Pick<
  Project,
  "id" | "key" | "name" | "managerId" | "processConfig"
>

function derivePhaseOptions(project: PickerProject | undefined): PhaseOption[] {
  if (!project) return []
  // processConfig is camelCase via project-service mapProject; the wire shape
  // uses snake_case `process_config`. We tolerate both so the picker keeps
  // working if a consumer ever passes the raw DTO unmapped.
  const cfg = project.processConfig as
    | { workflow?: { nodes?: Array<{ id: string; name?: string; label?: string }> } }
    | { process_config?: { workflow?: { nodes?: Array<{ id: string; name?: string; label?: string }> } } }
    | null
  // First try the camelCase shape, then fall back to the snake_case raw shape.
  const nodes =
    (cfg as { workflow?: { nodes?: Array<{ id: string; name?: string; label?: string }> } } | null)
      ?.workflow?.nodes ??
    (project as unknown as { process_config?: { workflow?: { nodes?: Array<{ id: string; name?: string; label?: string }> } } })
      .process_config?.workflow?.nodes ??
    []
  return nodes.map((n) => ({ id: n.id, name: n.name || n.label || n.id }))
}

export function PhaseReportsSection() {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)
  const router = useRouter()

  const [outerTab, setOuterTab] = React.useState<OuterTabId>("active")
  const [pickerProject, setPickerProject] = React.useState<number | null>(null)
  const [pickerPhase, setPickerPhase] = React.useState<string | null>(null)

  const statusFilter = outerTab === "active" ? "ACTIVE,COMPLETED" : "ARCHIVED"
  const { data: projects } = useProjects(statusFilter)
  const { data: reports } = usePhaseReports(pickerProject)

  const projectList = (projects as PickerProject[] | undefined) ?? []
  const project = projectList.find((p) => p.id === pickerProject)

  const phaseOptions: PhaseOption[] = React.useMemo(
    () => derivePhaseOptions(project),
    [project],
  )

  // Reset phase pick on project / tab change so a stale phaseId from a
  // different project doesn't survive the dropdown change. Reset selection
  // on outer-tab change so the active project doesn't bleed through to the
  // archived tab's picker.
  React.useEffect(() => {
    setPickerPhase(null)
  }, [pickerProject])

  React.useEffect(() => {
    setPickerProject(null)
    setPickerPhase(null)
  }, [outerTab])

  // Recent rows — the SELECTED project's most-recent 5 reports. CONTEXT
  // "Faz Raporları cross-project listing" — full filterable cross-project
  // aggregation is a v2.1 candidate (no /phase-reports?status=… global
  // endpoint exists today, and adding one is out of Phase 13 scope).
  const recentRows: RecentRow[] = React.useMemo(() => {
    if (!project || !reports) return []
    return [...(reports as PhaseReport[])]
      .sort((a, b) => {
        const aDate = a.updatedAt ?? a.createdAt
        const bDate = b.updatedAt ?? b.createdAt
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
      .slice(0, 5)
      .map((r) => {
        const taskCount = r.summaryTaskCount ?? 0
        const doneCount = r.summaryDoneCount ?? 0
        const successPct =
          taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : null
        return {
          reportId: r.id,
          projectId: project.id,
          projectKey: project.key ?? "",
          projectName: project.name ?? "",
          phaseId: r.phaseId,
          phaseName:
            phaseOptions.find((o) => o.id === r.phaseId)?.name ?? r.phaseId,
          closedAt: r.updatedAt ?? r.createdAt,
          taskCount,
          successPct,
        }
      })
  }, [project, reports, phaseOptions])

  const goLifecycle = () => {
    if (pickerProject != null) {
      router.push(`/projects/${pickerProject}?tab=lifecycle&sub=history`)
    }
  }

  const reportForSelected = React.useMemo<PhaseReport | null>(() => {
    if (!pickerProject || !pickerPhase || !reports) return null
    return (
      (reports as PhaseReport[]).find((r) => r.phaseId === pickerPhase) ?? null
    )
  }, [pickerProject, pickerPhase, reports])

  // Build the WorkflowNode shape the EvaluationReportCard expects from the
  // selected phase picker option. EvaluationReportCard only reads `id` and
  // `name` from the node, but the type requires x/y so we fill them with 0.
  const evaluationPhase: WorkflowNode | null = React.useMemo(() => {
    if (!pickerPhase) return null
    const opt = phaseOptions.find((o) => o.id === pickerPhase)
    if (!opt) return null
    return { id: opt.id, name: opt.name, x: 0, y: 0 }
  }, [pickerPhase, phaseOptions])

  const evaluationProject = project
    ? { id: project.id, key: project.key, managerId: project.managerId }
    : null

  return (
    <Card padding={16}>
      {/* Section header — matches prototype line 513-518 minus the "Tümünü
          gör" button (D-E1 obsoletes it: the outer Tabs already provide the
          archived view). */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 14,
          gap: 10,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
          {T("Faz Raporları", "Phase Reports")}
        </h3>
      </div>

      {/* D-E1 — 2-tab outer Tabs primitive */}
      <Tabs
        size="md"
        active={outerTab}
        onChange={(id) => setOuterTab(id as OuterTabId)}
        tabs={[
          { id: "active", label: T("Aktif + Tamamlanan", "Active + Completed") },
          { id: "archived", label: T("Arşivlenmiş", "Archived") },
        ]}
      />

      {/* Cascading picker row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 14,
          flexWrap: "wrap",
        }}
      >
        <select
          value={pickerProject ?? ""}
          onChange={(e) =>
            setPickerProject(e.target.value ? Number(e.target.value) : null)
          }
          aria-label={T("Proje seç", "Select project")}
          style={{
            padding: "6px 10px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12.5,
            color: "var(--fg)",
            minWidth: 200,
          }}
        >
          <option value="">{T("Proje seç", "Select project")}</option>
          {projectList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} — {p.name}
            </option>
          ))}
        </select>
        <select
          value={pickerPhase ?? ""}
          onChange={(e) => setPickerPhase(e.target.value || null)}
          disabled={!pickerProject || phaseOptions.length === 0}
          aria-label={T("Faz seç", "Select phase")}
          style={{
            padding: "6px 10px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12.5,
            color: "var(--fg)",
            opacity: !pickerProject ? 0.6 : 1,
            minWidth: 180,
          }}
        >
          <option value="">{T("Faz seç", "Select phase")}</option>
          {phaseOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {/* Inline expand area — D-E2 + D-E4 empty states */}
      <div style={{ marginTop: 16 }}>
        {!pickerProject && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--fg-muted)",
              fontSize: 13,
            }}
          >
            {T("Önce proje seçin.", "Select a project first.")}
          </div>
        )}
        {pickerProject && !pickerPhase && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--fg-muted)",
              fontSize: 13,
            }}
          >
            {T("Faz seç", "Select phase")}
          </div>
        )}
        {pickerProject && pickerPhase && !reportForSelected && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--fg-muted)",
              fontSize: 13,
            }}
          >
            <div style={{ marginBottom: 12 }}>
              {T(
                "Bu faz için rapor oluşturulmamış. Oluşturmak için projenin Yaşam Döngüsü → Geçmiş sekmesine gidin.",
                "No report exists for this phase. Create one in the project's Lifecycle → History tab.",
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={goLifecycle}>
              {T("Yaşam Döngüsü'ne git", "Go to Lifecycle")}
            </Button>
          </div>
        )}
        {pickerProject &&
          pickerPhase &&
          reportForSelected &&
          evaluationProject &&
          evaluationPhase && (
            <EvaluationReportCard
              project={evaluationProject}
              phase={evaluationPhase}
              readOnly
            />
          )}
      </div>

      {/* "Son raporlar" recent rows list — selected-project scope only.
          Cross-project aggregation deferred (CONTEXT v2.1 candidate). */}
      {recentRows.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h4
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--fg-muted)",
                margin: 0,
              }}
            >
              {T("Son raporlar", "Recent reports")}
            </h4>
          </div>
          {recentRows.map((row) => (
            <button
              key={row.reportId}
              type="button"
              data-testid="phase-report-row"
              onClick={() => {
                setPickerProject(row.projectId)
                setPickerPhase(row.phaseId)
              }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 80px 80px",
                alignItems: "center",
                gap: 8,
                padding: "10px 0",
                width: "100%",
                background: "transparent",
                border: "none",
                textAlign: "left",
                borderTop: "1px solid var(--border)",
                cursor: "pointer",
                color: "inherit",
                fontSize: 12.5,
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{row.phaseName}</span>{" "}
                <span style={{ color: "var(--fg-muted)" }}>
                  — {row.projectName}
                </span>
              </div>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--fg-muted)" }}
              >
                {row.closedAt
                  ? new Date(row.closedAt).toLocaleDateString()
                  : ""}
              </span>
              <span className="mono">
                {row.taskCount} {T("görev", "tasks")}
              </span>
              <span
                className="mono"
                style={{ textAlign: "right", color: "var(--fg-muted)" }}
              >
                {row.successPct != null ? `%${row.successPct}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
