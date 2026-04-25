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
 * Status change for any task surfaced in the MyTasks list. Optimistically
 * patches every cached `["tasks", ...]` array that contains this task id, so
 * the row visual updates instantly across MyTasks + per-project caches.
 * On error rolls every cache slot back; on settle invalidates ["tasks"]
 * broadly to be safe.
 */
export function useChangeTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      taskService.patchField(id, "status", status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] })
      const snapshots = qc.getQueriesData<Task[] | Task>({ queryKey: ["tasks"] })
      snapshots.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData(
            key,
            data.map((t) => (t.id === id ? { ...t, status } : t))
          )
        } else if (data && (data as Task).id === id) {
          qc.setQueryData(key, { ...(data as Task), status })
        }
      })
      return { snapshots }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
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
