"use client"

// EvaluationReportCard (Phase 12 Plan 12-06) — inline-expand panel rendered
// inside HistoryCard when the user clicks "Rapor". Implements LIFE-07.
//
// Anatomy: 12-UI-SPEC.md §8 EvaluationReportCard (lines 1066-1112).
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 304-329.
// Decisions consumed:
//   - D-57 hybrid auto-prefill + PM-editable: backend pre-fills the read-only
//     summary fields; PM types into 3 free-text textareas (issues / lessons /
//     recommendations).
//   - D-58 PDF download: GET /phase-reports/{id}/pdf returns Blob; trigger
//     download with filename `Phase-Report-{key}-{slug}-rev{N}.pdf`. 30s
//     rate-limit per Phase 9 D-51 → countdown UI on 429.
//   - D-25 (Phase 9) revision auto-increment: frontend NEVER sends `revision`
//     in PATCH body — T-12-06-03 mitigation.
//   - D-40 permission gate: when canEdit=false, hide Kaydet but keep PDF
//     visible (any project member can download).
//
// State machine:
//   - Local issues/lessons/recommendations seeded from server response on
//     first render. Reset effect re-seeds when `report.id` changes (e.g. a
//     newly-created PhaseReport replaces the placeholder mid-session).
//   - saveError: present after a 409 → AlertBanner with reload Button.
//   - pdfCountdown: 0 = idle, >0 = button disabled showing "${n}s bekleyin",
//     interval decrements every second.

import * as React from "react"
import { Download, X } from "lucide-react"

import {
  AlertBanner,
  Badge,
  Button,
  Input,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import {
  useCreatePhaseReport,
  useDownloadPhaseReportPdf,
  usePhaseReports,
  useUpdatePhaseReport,
} from "@/hooks/use-phase-reports"
import { useTransitionAuthority } from "@/hooks/use-transition-authority"
import { useQueryClient } from "@tanstack/react-query"
import type { WorkflowNode } from "@/services/lifecycle-service"
import type { PhaseReport } from "@/services/phase-report-service"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface EvaluationReportCardProject {
  id: number
  key?: string
  managerId?: number | null
  manager_id?: number | null
}

export interface EvaluationReportCardProps {
  project: EvaluationReportCardProject
  phase: WorkflowNode
  onClose?: () => void
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function EvaluationReportCard({
  project,
  phase,
  onClose,
}: EvaluationReportCardProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const { showToast } = useToast()
  const qc = useQueryClient()

  const { data: reports = [] } = usePhaseReports(project.id)
  const update = useUpdatePhaseReport(project.id)
  const create = useCreatePhaseReport(project.id)
  const downloadPdf = useDownloadPhaseReportPdf()
  const canEdit = useTransitionAuthority(
    project as { id: number; managerId?: number | null; manager_id?: number | null },
  )

  // Find the report for this phase. May be null on first open — Save will
  // create it lazily.
  const report: PhaseReport | null = React.useMemo(
    () => reports.find((r) => r.phaseId === phase.id) ?? null,
    [reports, phase.id],
  )

  // Local state — seeded from the report's free-text fields. Re-seeded when
  // the report id changes (e.g. after lazy create).
  const [issues, setIssues] = React.useState(report?.issues ?? "")
  const [lessons, setLessons] = React.useState(report?.lessons ?? "")
  const [recommendations, setRecommendations] = React.useState(
    report?.recommendations ?? "",
  )
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [pdfCountdown, setPdfCountdown] = React.useState<number | null>(null)

  // Reset local state if the underlying report.id changes (newly-created
  // report after first save, or a different phase being opened in the same
  // mounted card).
  React.useEffect(() => {
    setIssues(report?.issues ?? "")
    setLessons(report?.lessons ?? "")
    setRecommendations(report?.recommendations ?? "")
    setSaveError(null)
  }, [report?.id, report?.issues, report?.lessons, report?.recommendations])

  // Countdown ticker: when pdfCountdown > 0, decrement every 1s; clear at 0.
  React.useEffect(() => {
    if (pdfCountdown == null || pdfCountdown <= 0) return
    const timer = setInterval(() => {
      setPdfCountdown((cur) => {
        if (cur == null) return null
        if (cur <= 1) return null
        return cur - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [pdfCountdown])

  // ---- handlers ----

  const handleSave = async () => {
    setSaveError(null)
    try {
      if (report) {
        // PATCH — revision NOT sent (T-12-06-03 + Phase 9 D-25)
        await update.mutateAsync({
          id: report.id,
          dto: { issues, lessons, recommendations },
        })
      } else {
        // POST — first save creates the report. cycle_number is auto-set
        // server-side (Phase 9 D-25); frontend never sends it.
        await create.mutateAsync({
          phase_id: phase.id,
          issues,
          lessons,
          recommendations,
        })
      }
      showToast({
        variant: "success",
        message: T("Rapor kaydedildi.", "Report saved."),
      })
    } catch (err: unknown) {
      const code = (err as { response?: { status?: number } })?.response?.status
      if (code === 409) {
        setSaveError(
          T(
            "Başka bir kullanıcı raporu güncelledi. Yenileyin.",
            "Another user updated the report. Refresh.",
          ),
        )
      } else {
        showToast({
          variant: "error",
          message: T("Rapor kaydedilemedi.", "Report could not be saved."),
        })
      }
    }
  }

  const handlePdf = async () => {
    if (!report || pdfCountdown != null) return
    try {
      await downloadPdf.mutateAsync({
        reportId: report.id,
        projectKey: project.key ?? `project-${project.id}`,
        phaseSlug: phase.id,
        revision: report.revision,
      })
      showToast({
        variant: "success",
        message: T("PDF indirildi.", "PDF downloaded."),
      })
    } catch (err: unknown) {
      const code = (err as { response?: { status?: number } })?.response?.status
      if (code === 429) {
        const retryAfter =
          (err as {
            response?: { data?: { retry_after_seconds?: number } }
          })?.response?.data?.retry_after_seconds ?? 30
        setPdfCountdown(retryAfter)
        showToast({
          variant: "warning",
          message: T(
            `${retryAfter} saniye bekleyin.`,
            `Wait ${retryAfter} seconds.`,
          ),
        })
      } else {
        showToast({
          variant: "error",
          message: T("PDF indirilemedi.", "PDF download failed."),
        })
      }
    }
  }

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["phase-reports", "project", project.id] })
    setSaveError(null)
  }

  // ---- render helpers ----

  const summaryFields: Array<{ label: string; value: number }> = [
    {
      label: T("Toplam Görev", "Total Tasks"),
      value: report?.summaryTaskCount ?? 0,
    },
    {
      label: T("Tamamlanan", "Completed"),
      value: report?.summaryDoneCount ?? 0,
    },
    {
      label: T("Taşınan", "Carried"),
      value: report?.summaryMovedCount ?? 0,
    },
    {
      label: T("Süre (gün)", "Duration (days)"),
      value: report?.summaryDurationDays ?? 0,
    },
  ]

  const pdfLabel =
    pdfCountdown != null && pdfCountdown > 0
      ? T(`${pdfCountdown}s bekleyin`, `Wait ${pdfCountdown}s`)
      : downloadPdf.isPending
        ? T("PDF oluşturuluyor…", "Generating PDF…")
        : "PDF"
  const pdfDisabled =
    pdfCountdown != null || downloadPdf.isPending || !report
  const saving = update.isPending || create.isPending

  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        background: "var(--bg-2)",
        borderRadius: "var(--radius)",
        boxShadow: "inset 0 0 0 1px var(--border)",
      }}
    >
      {/* Header — title + revision Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {T("Faz Değerlendirme Raporu", "Phase Evaluation Report")} —{" "}
          {phase.name}
        </div>
        <Badge size="xs" tone="mono">
          rev {report?.revision ?? 1}
        </Badge>
        <div style={{ flex: 1 }} />
        {onClose && (
          <Button
            size="icon"
            variant="ghost"
            icon={<X size={12} />}
            onClick={onClose}
            title={T("Kapat", "Close")}
            aria-label={T("Kapat", "Close")}
          />
        )}
      </div>

      {/* Read-only summary mini-rows */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {summaryFields.map((f) => (
          <div
            key={f.label}
            style={{
              padding: 10,
              background: "var(--surface-2)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: "var(--fg)",
              }}
            >
              {f.value}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: "var(--fg-muted)",
                marginTop: 4,
              }}
            >
              {f.label}
            </div>
          </div>
        ))}
      </div>

      {/* 3 textareas — issues / lessons / recommendations */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          fontSize: 12.5,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {T("Karşılaşılan Sorunlar", "Issues Encountered")}
          </span>
          <textarea
            rows={3}
            placeholder={T(
              "API yanıt süresi gecikti, Redis cache ile çözüldü.",
              "API response time was slow, resolved with Redis cache.",
            )}
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            disabled={!canEdit}
            style={{
              resize: "vertical",
              padding: 8,
              background: "var(--surface)",
              border: 0,
              borderRadius: "var(--radius-sm)",
              boxShadow: "inset 0 0 0 1px var(--border)",
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              color: "var(--fg)",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {T("Öğrenilen Dersler", "Lessons Learned")}
          </span>
          <textarea
            rows={2}
            placeholder={T(
              "Erken performans testi kritik. Her sprint'te mini-benchmark.",
              "Early perf test is critical. Mini-benchmark every sprint.",
            )}
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            disabled={!canEdit}
            style={{
              resize: "vertical",
              padding: 8,
              background: "var(--surface)",
              border: 0,
              borderRadius: "var(--radius-sm)",
              boxShadow: "inset 0 0 0 1px var(--border)",
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              color: "var(--fg)",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {T("Sonraki Faz Önerileri", "Next Phase Recommendations")}
          </span>
          <textarea
            rows={2}
            placeholder={T(
              "Sonraki faz için öneri yazın…",
              "Write recommendations for the next phase…",
            )}
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            disabled={!canEdit}
            style={{
              resize: "vertical",
              padding: 8,
              background: "var(--surface)",
              border: 0,
              borderRadius: "var(--radius-sm)",
              boxShadow: "inset 0 0 0 1px var(--border)",
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              color: "var(--fg)",
            }}
          />
        </label>

        {saveError && (
          <AlertBanner
            tone="warning"
            action={
              <Button size="xs" variant="ghost" onClick={handleRefresh}>
                {T("Yenile", "Refresh")}
              </Button>
            }
          >
            {saveError}
          </AlertBanner>
        )}

        {/* Bottom button row — PDF + Kaydet (canEdit gates Kaydet) */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <Button
            size="sm"
            variant="secondary"
            icon={<Download size={12} />}
            disabled={pdfDisabled}
            onClick={handlePdf}
          >
            {pdfLabel}
          </Button>
          {canEdit && (
            <Button
              size="sm"
              variant="primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? T("Kaydediliyor…", "Saving…") : T("Kaydet", "Save")}
            </Button>
          )}
        </div>

        {/* Reserved Input ref to satisfy a future inline-revision summary input
            without re-importing the primitive. The element renders nothing. */}
        {/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */}
        {false && <Input value="" />}
      </div>
    </div>
  )
}
