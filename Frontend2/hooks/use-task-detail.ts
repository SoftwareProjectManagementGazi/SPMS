import { useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task-service"

export function useTaskDetail(taskId: number | null) {
  return useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => taskService.getById(taskId!),
    enabled: !!taskId,
  })
}

export function useTaskHistory(taskId: number | null) {
  return useQuery({
    queryKey: ["tasks", taskId, "history"],
    queryFn: () => taskService.getHistory(taskId!),
    enabled: !!taskId,
  })
}
