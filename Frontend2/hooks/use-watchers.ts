import { useMutation, useQueryClient } from "@tanstack/react-query"
import { taskService } from "@/services/task-service"

export function useAddWatcher(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => taskService.addWatcher(taskId),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks", taskId] }),
  })
}

export function useRemoveWatcher(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => taskService.removeWatcher(taskId),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks", taskId] }),
  })
}
