// Milestone hooks (Phase 12 Plan 12-01) — TanStack Query wrappers around
// milestone-service. Mutations follow the Phase 11 D-38 optimistic +
// rollback pattern (see hooks/use-tasks.ts).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  milestoneService,
  type Milestone,
  type MilestoneCreateDTO,
  type MilestoneUpdateDTO,
} from "@/services/milestone-service"

export function useMilestones(projectId: number | null | undefined) {
  return useQuery<Milestone[]>({
    queryKey: ["milestones", "project", projectId],
    queryFn: () => milestoneService.getByProject(projectId!),
    enabled: !!projectId,
  })
}

export function useCreateMilestone(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: MilestoneCreateDTO) => milestoneService.create(projectId, dto),
    onMutate: async (dto) => {
      const key = ["milestones", "project", projectId] as const
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Milestone[]>(key)
      // Optimistic insert at the top with a temp negative id so onSettled's
      // refetch replaces it cleanly.
      const optimistic: Milestone = {
        id: -Date.now(),
        projectId,
        name: dto.name,
        targetDate: dto.target_date,
        status: "PLANNED",
        linkedPhaseIds: dto.linked_phase_ids ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: null,
      }
      qc.setQueryData<Milestone[]>(key, (old) => [optimistic, ...(old ?? [])])
      return { prev }
    },
    onError: (_err, _dto, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["milestones", "project", projectId], ctx.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["milestones", "project", projectId] })
    },
  })
}

export function useUpdateMilestone(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: MilestoneUpdateDTO }) =>
      milestoneService.update(id, dto),
    onMutate: async ({ id, dto }) => {
      const key = ["milestones", "project", projectId] as const
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Milestone[]>(key)
      qc.setQueryData<Milestone[]>(key, (old) =>
        (old ?? []).map((m) =>
          m.id === id
            ? {
                ...m,
                name: dto.name ?? m.name,
                targetDate: dto.target_date ?? m.targetDate,
                status: dto.status ?? m.status,
                linkedPhaseIds: dto.linked_phase_ids ?? m.linkedPhaseIds,
              }
            : m,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["milestones", "project", projectId], ctx.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["milestones", "project", projectId] })
    },
  })
}

export function useDeleteMilestone(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => milestoneService.remove(id),
    onMutate: async (id) => {
      const key = ["milestones", "project", projectId] as const
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Milestone[]>(key)
      qc.setQueryData<Milestone[]>(key, (old) =>
        (old ?? []).filter((m) => m.id !== id),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["milestones", "project", projectId], ctx.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["milestones", "project", projectId] })
    },
  })
}
