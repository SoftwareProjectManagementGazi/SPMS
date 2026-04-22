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
    queryFn: () => taskService.getByProject(project!.id, filter),
    enabled: !!project,
  })
}
