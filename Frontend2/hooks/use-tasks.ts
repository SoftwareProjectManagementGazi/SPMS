import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { taskService, type CreateTaskDTO, type Task } from "@/services/task-service"

export function useTasks(projectId: number | null, filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["tasks", "project", projectId, filters],
    queryFn: () => taskService.getByProject(projectId!, filters),
    enabled: !!projectId,
  })
}

export function useMyTasks() {
  return useQuery({ queryKey: ["tasks", "my-tasks"], queryFn: taskService.getMyTasks })
}

export function useTaskSearch(_q: string, debouncedQ: string) {
  // `debouncedQ` is the already-debounced string from the caller; the hook is pure.
  return useQuery({
    queryKey: ["tasks", "search", debouncedQ],
    queryFn: () => taskService.search(debouncedQ),
    enabled: debouncedQ.trim().length >= 2,
    staleTime: 30 * 1000,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateTaskDTO) => taskService.create(dto),
    onSuccess: (_task, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["projects", variables.project_id] })
    },
  })
}

/**
 * Optimistic per-field PATCH. Used by InlineEdit in the Properties sidebar (D-38).
 * Writes optimistic value -> rolls back on error -> always invalidates on settle.
 */
export function useUpdateTask(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ field, value }: { field: string; value: unknown }) =>
      taskService.patchField(taskId, field, value),
    onMutate: async ({ field, value }) => {
      await qc.cancelQueries({ queryKey: ["tasks", taskId] })
      const prev = qc.getQueryData<Task>(["tasks", taskId])
      if (prev) {
        qc.setQueryData<Task>(["tasks", taskId], { ...prev, [field]: value } as Task)
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", taskId], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId] })
    },
  })
}

/**
 * Board drag-drop status change. Optimistic on both project task list + single task.
 */
export function useMoveTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      taskService.patchField(id, "status", status),
    onMutate: async ({ id, status }) => {
      const key = ["tasks", "project", projectId] as const
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueriesData<Task[]>({ queryKey: key })
      prev.forEach(([k, data]) => {
        if (data) qc.setQueryData(k, data.map((t) => (t.id === id ? { ...t, status } : t)))
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach(([k, data]) => qc.setQueryData(k, data))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
    },
  })
}
