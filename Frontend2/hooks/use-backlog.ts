import { useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task-service"
import { resolveBacklogFilter } from "@/lib/methodology-matrix"

interface ProjectLike {
  id: number
  methodology: string
  columns?: string[]
  processConfig?: Record<string, unknown> | null
}

export function useBacklog(project: ProjectLike | null) {
  const filter = project ? resolveBacklogFilter(project) : {}
  return useQuery({
    queryKey: ["tasks", "backlog", project?.id, filter],
    queryFn: async () => {
      const tasks = await taskService.getByProject(project!.id, filter)
      // Client-side safety: never show done tasks in the backlog even if
      // the backend returns them (e.g. older API versions without exclude_done support).
      return tasks.filter((t) => !t.isDone)
    },
    enabled: !!project,
  })
}
