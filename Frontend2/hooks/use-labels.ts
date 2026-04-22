import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { labelService } from "@/services/label-service"

export function useProjectLabels(projectId: number | null) {
  return useQuery({
    queryKey: ["labels", "project", projectId],
    queryFn: () => labelService.getByProject(projectId!),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  })
}

export function useCreateLabel(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      labelService.create(projectId, name, color),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labels", "project", projectId] })
    },
  })
}
