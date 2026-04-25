// Artifact hooks (Phase 12 Plan 12-01) — TanStack Query wrappers around
// artifact-service. Optimistic + rollback per Phase 11 D-38. Includes the
// assignee-only `/mine` PATCH path (Phase 9 D-36).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  artifactService,
  type Artifact,
  type ArtifactCreateDTO,
  type ArtifactUpdateDTO,
  type ArtifactUpdateByMineDTO,
} from "@/services/artifact-service"

export function useArtifacts(projectId: number | null | undefined) {
  return useQuery<Artifact[]>({
    queryKey: ["artifacts", "project", projectId],
    queryFn: () => artifactService.getByProject(projectId!),
    enabled: !!projectId,
  })
}

export function useCreateArtifact(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ArtifactCreateDTO) => artifactService.create(projectId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artifacts", "project", projectId] })
    },
  })
}

/** PM-path PATCH /artifacts/{id}. */
export function useUpdateArtifact(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ArtifactUpdateDTO }) =>
      artifactService.update(id, dto),
    onMutate: async ({ id, dto }) => {
      const key = ["artifacts", "project", projectId] as const
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Artifact[]>(key)
      qc.setQueryData<Artifact[]>(key, (old) =>
        (old ?? []).map((a) =>
          a.id === id
            ? {
                ...a,
                name: dto.name ?? a.name,
                status: dto.status ?? a.status,
                assigneeId: dto.assignee_id ?? a.assigneeId,
                note: dto.note ?? a.note,
              }
            : a,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["artifacts", "project", projectId], ctx.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["artifacts", "project", projectId] })
    },
  })
}

/** Assignee-path PATCH /artifacts/{id}/mine — D-36 split URL. */
export function useUpdateArtifactMine(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ArtifactUpdateByMineDTO }) =>
      artifactService.updateMine(id, dto),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["artifacts", "project", projectId] })
    },
  })
}

export function useDeleteArtifact(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artifactService.remove(id),
    onMutate: async (id) => {
      const key = ["artifacts", "project", projectId] as const
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Artifact[]>(key)
      qc.setQueryData<Artifact[]>(key, (old) =>
        (old ?? []).filter((a) => a.id !== id),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["artifacts", "project", projectId], ctx.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["artifacts", "project", projectId] })
    },
  })
}

export function useUploadArtifactFile(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      artifactService.uploadFile(id, file),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["artifacts", "project", projectId] })
    },
  })
}
