import { apiClient } from "@/lib/api-client"

export interface Task {
  id: number
  key: string
  title: string
  description: string
  status: string
  priority: "low" | "medium" | "high" | "critical"
  assigneeId: number | null
  /** Backend `assignee.username` when populated; optional so existing test
   *  fixtures created before this field existed continue to compile. mapTask
   *  fills it with "" when the API response has no assignee, so consumers
   *  can rely on `task.assigneeName ?? ""` returning a string. */
  assigneeName?: string
  reporterId: number | null
  parentTaskId: number | null
  projectId: number
  cycleId: number | null
  phaseId: string | null
  points: number | null
  start: string | null
  due: string | null
  labels: number[]
  watcherCount: number
  type: "task" | "subtask" | "bug"
  createdAt: string
}

interface UserSummaryDTO {
  id: number
  email: string
  username: string
  avatar_url?: string | null
}

interface TaskResponseDTO {
  id: number
  /** Pre-Phase-12 backends shipped this as `key`; current backend ships
   *  `task_key` (Backend/app/application/dtos/task_dtos.py:86). Both are
   *  declared here so mapTask can fall through whichever the live API uses. */
  key?: string | null
  task_key?: string | null
  title: string
  description: string
  status: string
  priority: "low" | "medium" | "high" | "critical"
  assignee_id: number | null
  /** Backend includes the populated assignee object on TaskResponseDTO. We
   *  read username for initials so the UI doesn't have to fetch /users to
   *  resolve a name. */
  assignee?: UserSummaryDTO | null
  reporter_id: number | null
  parent_task_id: number | null
  project_id: number
  cycle_id: number | null
  phase_id: string | null
  points: number | null
  start: string | null
  /** Same backend rename as task_key — was `due`, current DTO ships
   *  `due_date`. Both supported for safe fall-through. */
  due?: string | null
  due_date?: string | null
  labels: number[]
  watcher_count: number
  type: "task" | "subtask" | "bug"
  created_at: string
}

interface PaginatedTasksDTO {
  items: TaskResponseDTO[]
  total: number
  page: number
  page_size: number
}

function unwrapTaskList(data: unknown): TaskResponseDTO[] {
  if (Array.isArray(data)) return data as TaskResponseDTO[]
  if (data && typeof data === "object" && Array.isArray((data as PaginatedTasksDTO).items)) {
    return (data as PaginatedTasksDTO).items
  }
  return []
}

export interface CreateTaskDTO {
  project_id: number
  title: string
  description?: string
  priority?: "low" | "medium" | "high" | "critical"
  assignee_id?: number | null
  parent_task_id?: number | null
  cycle_id?: number | null
  phase_id?: string | null
  points?: number | null
  due?: string | null
  start?: string | null
  type?: "task" | "subtask" | "bug"
  label_ids?: number[]
  recurring?: { frequency: string; end: string | number } | null
}

// Backend serializes TaskPriority / TaskStatus enums via Pydantic, which uses
// the enum value verbatim — those values are UPPERCASE on the wire ("LOW",
// "TODO", "IN_PROGRESS", ...). Frontend2 types claim lowercase and every
// downstream consumer (PriorityChip, StatusDot, MyTasks filters, dueBucket)
// compares against lowercase tokens. Normalize at the boundary so the type
// contract is honoured and consumers don't each need their own toLowerCase.
function normalizePriority(raw: unknown): Task["priority"] {
  const s = String(raw ?? "").toLowerCase()
  if (s === "low" || s === "medium" || s === "high" || s === "critical") {
    return s
  }
  return "medium"
}

function normalizeStatus(raw: unknown): string {
  const s = String(raw ?? "").toLowerCase()
  // Map backend's "in_progress" to the prototype's "progress" token used by
  // StatusDot / dueBucket comparisons. Other unknown values pass through
  // lowercased so consumers can decide how to treat them.
  if (s === "in_progress") return "progress"
  return s
}

function mapTask(d: TaskResponseDTO): Task {
  return {
    id: d.id,
    // Backend renamed `key` -> `task_key` in the current TaskResponseDTO. Read
    // either to keep the UI working across rolling deploys. Falls back to ""
    // so consumers always see a string and never undefined.
    key: d.task_key ?? d.key ?? "",
    title: d.title,
    description: d.description ?? "",
    status: normalizeStatus(d.status),
    priority: normalizePriority(d.priority),
    assigneeId: d.assignee_id,
    // Prefer the populated assignee object's username (backend includes the
    // full user summary); fall back to "" for unassigned tasks. TaskRow uses
    // this to compute real initials instead of "#1"-style hash mocks.
    assigneeName: d.assignee?.username ?? "",
    reporterId: d.reporter_id,
    parentTaskId: d.parent_task_id,
    projectId: d.project_id,
    cycleId: d.cycle_id,
    phaseId: d.phase_id,
    points: d.points,
    start: d.start,
    // Same fallback pattern as task_key: backend renamed `due` -> `due_date`.
    due: d.due_date ?? d.due ?? null,
    labels: d.labels ?? [],
    watcherCount: d.watcher_count ?? 0,
    type: d.type,
    createdAt: d.created_at,
  }
}

export const taskService = {
  getByProject: async (projectId: number, filters: Record<string, unknown> = {}): Promise<Task[]> => {
    // Backend endpoint returns PaginatedResponse{items, total, page, page_size}.
    // Accept bare arrays too so existing test mocks keep working.
    const resp = await apiClient.get(`/tasks/project/${projectId}`, { params: filters })
    return unwrapTaskList(resp.data).map(mapTask)
  },
  getMyTasks: async (): Promise<Task[]> => {
    const resp = await apiClient.get<TaskResponseDTO[]>(`/tasks/my-tasks`)
    return resp.data.map(mapTask)
  },
  search: async (q: string): Promise<Task[]> => {
    const resp = await apiClient.get<TaskResponseDTO[]>(`/tasks/search`, { params: { q } })
    return resp.data.map(mapTask)
  },
  getById: async (id: number): Promise<Task> => {
    const resp = await apiClient.get<TaskResponseDTO>(`/tasks/${id}`)
    return mapTask(resp.data)
  },
  getHistory: async (
    id: number
  ): Promise<
    Array<{
      field_name: string
      old_value: string | null
      new_value: string | null
      user_id: number
      action: string
      timestamp: string
    }>
  > => {
    const resp = await apiClient.get(`/tasks/${id}/history`)
    return resp.data
  },
  create: async (dto: CreateTaskDTO): Promise<Task> => {
    const resp = await apiClient.post<TaskResponseDTO>(`/tasks`, dto)
    return mapTask(resp.data)
  },
  patchField: async (id: number, field: string, value: unknown): Promise<Task> => {
    const resp = await apiClient.patch<TaskResponseDTO>(`/tasks/${id}`, { [field]: value })
    return mapTask(resp.data)
  },
  update: async (id: number, dto: Partial<CreateTaskDTO>): Promise<Task> => {
    const resp = await apiClient.patch<TaskResponseDTO>(`/tasks/${id}`, dto)
    return mapTask(resp.data)
  },
  addWatcher: async (taskId: number): Promise<void> => {
    await apiClient.post(`/tasks/${taskId}/watch`)
  },
  removeWatcher: async (taskId: number): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/watch`)
  },
  listDependencies: async (taskId: number) => {
    const resp = await apiClient.get(`/tasks/${taskId}/dependencies`)
    return resp.data
  },
  addDependency: async (
    taskId: number,
    dependsOnId: number,
    type: "blocks" | "blocked_by" | "relates_to"
  ) => {
    const resp = await apiClient.post(`/tasks/${taskId}/dependencies`, {
      depends_on_id: dependsOnId,
      type,
    })
    return resp.data
  },
  removeDependency: async (taskId: number, depId: number) => {
    await apiClient.delete(`/tasks/${taskId}/dependencies/${depId}`)
  },
}
