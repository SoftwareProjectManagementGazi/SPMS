// Phase Report service (Phase 12 Plan 12-01) — CRUD + sync PDF download.
//
// Endpoints (Phase 9 API-09 + D-58):
//   GET /projects/{id}/phase-reports
//   POST /projects/{id}/phase-reports
//   PATCH /phase-reports/{id}     (revision auto-increments backend-side, T-09-07-01)
//   DELETE /phase-reports/{id}
//   GET /phase-reports/{id}/pdf   (fpdf2 sync, 30 s rate-limit per Phase 9 D-51)

import { apiClient } from "@/lib/api-client"

export interface PhaseReport {
  id: number
  projectId: number
  phaseId: string
  revision: number
  cycleNumber: number | null
  summaryTaskCount: number
  summaryDoneCount: number
  summaryMovedCount: number
  summaryDurationDays: number
  issues: string
  lessons: string
  recommendations: string
  createdAt: string
  updatedAt?: string | null
}

interface PhaseReportResponseDTO {
  id: number
  project_id: number
  phase_id: string
  revision: number
  cycle_number?: number | null
  summary_task_count?: number
  summary_done_count?: number
  summary_moved_count?: number
  summary_duration_days?: number
  issues?: string | null
  lessons?: string | null
  recommendations?: string | null
  created_at: string
  updated_at?: string | null
}

export interface PhaseReportCreateDTO {
  phase_id: string
  // Backend D-25 auto-calculates cycle_number; frontend never sends it.
  issues?: string
  lessons?: string
  recommendations?: string
}

export interface PhaseReportUpdateDTO {
  // Backend D-25 auto-increments revision; frontend never sends it.
  issues?: string
  lessons?: string
  recommendations?: string
}

function mapReport(d: PhaseReportResponseDTO): PhaseReport {
  return {
    id: d.id,
    projectId: d.project_id,
    phaseId: d.phase_id,
    revision: d.revision,
    cycleNumber: d.cycle_number ?? null,
    summaryTaskCount: d.summary_task_count ?? 0,
    summaryDoneCount: d.summary_done_count ?? 0,
    summaryMovedCount: d.summary_moved_count ?? 0,
    summaryDurationDays: d.summary_duration_days ?? 0,
    issues: d.issues ?? "",
    lessons: d.lessons ?? "",
    recommendations: d.recommendations ?? "",
    createdAt: d.created_at,
    updatedAt: d.updated_at ?? null,
  }
}

export const phaseReportService = {
  getByProject: async (projectId: number): Promise<PhaseReport[]> => {
    const resp = await apiClient.get<PhaseReportResponseDTO[]>(
      `/projects/${projectId}/phase-reports`,
    )
    return resp.data.map(mapReport)
  },
  create: async (
    projectId: number,
    dto: PhaseReportCreateDTO,
  ): Promise<PhaseReport> => {
    const resp = await apiClient.post<PhaseReportResponseDTO>(
      `/projects/${projectId}/phase-reports`,
      dto,
    )
    return mapReport(resp.data)
  },
  update: async (id: number, dto: PhaseReportUpdateDTO): Promise<PhaseReport> => {
    const resp = await apiClient.patch<PhaseReportResponseDTO>(
      `/phase-reports/${id}`,
      dto,
    )
    return mapReport(resp.data)
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/phase-reports/${id}`)
  },
  /**
   * Direct Blob download. Rate-limited 30s/user (Phase 9 D-51) — caller
   * surfaces 429 toast.
   */
  getPdf: async (reportId: number): Promise<Blob> => {
    const resp = await apiClient.get(`/phase-reports/${reportId}/pdf`, {
      responseType: "blob",
    })
    return resp.data as Blob
  },
}
