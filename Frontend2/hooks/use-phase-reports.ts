// PhaseReport hooks (Phase 12 Plan 12-01) — list + create + update + PDF
// download.
//
// CONTEXT D-58: PDF download invokes the service Blob fetcher then triggers
// a browser download via createObjectURL + anchor click + revokeObjectURL.
// Filename pattern: `Phase-Report-{project-key}-{phase-slug}-rev{N}.pdf`.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  phaseReportService,
  type PhaseReport,
  type PhaseReportCreateDTO,
  type PhaseReportUpdateDTO,
} from "@/services/phase-report-service"

export function usePhaseReports(projectId: number | null | undefined) {
  return useQuery<PhaseReport[]>({
    queryKey: ["phase-reports", "project", projectId],
    queryFn: () => phaseReportService.getByProject(projectId!),
    enabled: !!projectId,
  })
}

export function useCreatePhaseReport(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: PhaseReportCreateDTO) =>
      phaseReportService.create(projectId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["phase-reports", "project", projectId] })
    },
  })
}

export function useUpdatePhaseReport(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: PhaseReportUpdateDTO }) =>
      phaseReportService.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["phase-reports", "project", projectId] })
    },
  })
}

function slugify(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "phase"
}

export function useDownloadPhaseReportPdf() {
  return useMutation({
    mutationFn: async ({
      reportId,
      projectKey,
      phaseSlug,
      revision,
    }: {
      reportId: number
      projectKey: string
      phaseSlug: string
      revision: number
    }) => {
      const blob = await phaseReportService.getPdf(reportId)
      if (typeof window === "undefined") return blob
      const url = window.URL.createObjectURL(blob)
      const anchor = window.document.createElement("a")
      anchor.href = url
      anchor.download = `Phase-Report-${projectKey}-${slugify(phaseSlug)}-rev${revision}.pdf`
      window.document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      return blob
    },
  })
}
