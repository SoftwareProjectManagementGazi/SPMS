// Artifact service (Phase 12 Plan 12-01) — CRUD for project artifacts plus
// the assignee-only `/mine` PATCH path (Phase 9 D-36).
//
// Endpoints (Phase 9 API-08):
//   GET /projects/{id}/artifacts
//   POST /projects/{id}/artifacts
//   PATCH /artifacts/{id}        (PM path)
//   PATCH /artifacts/{id}/mine   (assignee path; URL encodes scope per D-36)
//   DELETE /artifacts/{id}
//   POST /artifacts/{id}/file    (multipart upload, single file per artifact)

import { apiClient } from "@/lib/api-client"

export type ArtifactStatus = "not-created" | "draft" | "done"

export interface Artifact {
  id: number
  projectId: number
  name: string
  status: ArtifactStatus
  assigneeId: number | null
  fileId: number | null
  note: string
  updatedAt: string
}

interface ArtifactResponseDTO {
  id: number
  project_id: number
  name: string
  status: ArtifactStatus
  assignee_id?: number | null
  file_id?: number | null
  note?: string | null
  updated_at: string
}

export interface ArtifactCreateDTO {
  name: string
  status?: ArtifactStatus
  assignee_id?: number | null
  note?: string
}

export interface ArtifactUpdateDTO {
  name?: string
  status?: ArtifactStatus
  assignee_id?: number | null
  note?: string
}

export interface ArtifactUpdateByMineDTO {
  status?: ArtifactStatus
  note?: string
  // assignee_id intentionally absent — D-36 split URL excludes the field
}

function mapArtifact(d: ArtifactResponseDTO): Artifact {
  return {
    id: d.id,
    projectId: d.project_id,
    name: d.name,
    status: d.status,
    assigneeId: d.assignee_id ?? null,
    fileId: d.file_id ?? null,
    note: d.note ?? "",
    updatedAt: d.updated_at,
  }
}

export const artifactService = {
  getByProject: async (projectId: number): Promise<Artifact[]> => {
    const resp = await apiClient.get<ArtifactResponseDTO[]>(
      `/projects/${projectId}/artifacts`,
    )
    return resp.data.map(mapArtifact)
  },
  create: async (projectId: number, dto: ArtifactCreateDTO): Promise<Artifact> => {
    const resp = await apiClient.post<ArtifactResponseDTO>(
      `/projects/${projectId}/artifacts`,
      dto,
    )
    return mapArtifact(resp.data)
  },
  /** PM path — full PATCH including assignee_id. */
  update: async (id: number, dto: ArtifactUpdateDTO): Promise<Artifact> => {
    const resp = await apiClient.patch<ArtifactResponseDTO>(`/artifacts/${id}`, dto)
    return mapArtifact(resp.data)
  },
  /** Assignee-only path (Phase 9 D-36). assignee_id may NOT be sent here. */
  updateMine: async (id: number, dto: ArtifactUpdateByMineDTO): Promise<Artifact> => {
    const resp = await apiClient.patch<ArtifactResponseDTO>(`/artifacts/${id}/mine`, dto)
    return mapArtifact(resp.data)
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/artifacts/${id}`)
  },
  uploadFile: async (id: number, file: File): Promise<Artifact> => {
    const formData = new FormData()
    formData.append("file", file)
    const resp = await apiClient.post<ArtifactResponseDTO>(
      `/artifacts/${id}/file`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    return mapArtifact(resp.data)
  },
}
