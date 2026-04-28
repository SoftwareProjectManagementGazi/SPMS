import { apiClient } from '@/lib/api-client';

export interface BoardColumnLite {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  key: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED';
  methodology: string;
  processTemplateId: number | null;
  managerId: number | null;
  managerName: string | null;
  managerAvatar: string | null;
  progress: number;
  /** Column NAMES — kept as the legacy shape for read-only consumers. */
  columns: string[];
  /** Column id+name pairs — needed by InlineEdit status picker because the
   *  backend's TaskUpdateDTO accepts `column_id`, not the column NAME. */
  boardColumns: BoardColumnLite[];
  processConfig: Record<string, unknown> | null;
  createdAt: string;
  /** Plan 14-05 follow-up — task aggregates; populated by the admin-bypass in
   *  GET /projects (used by /admin/projects table). Non-admin paths leave
   *  these at 0 because the backend default applies. The /admin/projects row
   *  derives its progress bar from `taskDoneCount / taskCount` since
   *  `progress` is not (yet) computed server-side. */
  taskCount: number;
  taskDoneCount: number;
}

export interface CreateProjectDTO {
  key: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  methodology: string;
  columns?: string[];
  process_config?: Record<string, unknown>;
}

interface ProjectResponseDTO {
  id: number;
  key: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  methodology: string;
  process_template_id: number | null;
  manager_id: number | null;
  manager_name: string | null;
  manager_avatar: string | null;
  progress?: number;
  columns?: Array<{ id: number; name: string } | string>;
  process_config?: Record<string, unknown>;
  created_at: string;
  /** Plan 14-05 follow-up — admin-bypass populates these for /admin/projects.
   *  Non-admin paths leave them at 0 (default in the backend DTO). */
  task_count?: number;
  task_done_count?: number;
}

function mapProject(data: ProjectResponseDTO): Project {
  return {
    id: data.id,
    key: data.key,
    name: data.name,
    description: data.description,
    startDate: data.start_date,
    endDate: data.end_date,
    status: (data.status as Project['status']) ?? 'ACTIVE',
    methodology: data.methodology,
    processTemplateId: data.process_template_id,
    managerId: data.manager_id,
    managerName: data.manager_name,
    managerAvatar: data.manager_avatar,
    progress: data.progress ?? 0,
    columns: (data.columns ?? []).map((c) =>
      typeof c === 'string' ? c : c.name
    ),
    // boardColumns preserves the {id, name} pairs that PATCH consumers need
    // (status updates → column_id). String entries lose the id, so they get
    // a synthetic 0 — InlineEdit guards against that.
    boardColumns: (data.columns ?? []).map((c) =>
      typeof c === 'string' ? { id: 0, name: c } : { id: c.id, name: c.name }
    ),
    processConfig: data.process_config ?? null,
    createdAt: data.created_at,
    taskCount: data.task_count ?? 0,
    taskDoneCount: data.task_done_count ?? 0,
  };
}

export interface ProjectMember {
  id: number
  fullName: string
  avatarPath: string | null
  roleName: string
}

interface ProjectMemberResponseDTO {
  id: number
  full_name: string
  avatar_path: string | null
  role_name: string
  is_current_member?: boolean
}

function mapMember(d: ProjectMemberResponseDTO): ProjectMember {
  return {
    id: d.id,
    fullName: d.full_name,
    avatarPath: d.avatar_path,
    roleName: d.role_name,
  }
}

export const projectService = {
  getAll: async (status?: string): Promise<Project[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const response = await apiClient.get<ProjectResponseDTO[]>('/projects', { params });
    return response.data.map(mapProject);
  },

  getById: async (id: string | number): Promise<Project> => {
    const response = await apiClient.get<ProjectResponseDTO>(`/projects/${id}`);
    return mapProject(response.data);
  },

  // Project member roster — used by the Task Detail assignee picker so it
  // can offer a searchable list instead of asking for a numeric user id.
  // Optional `q` triggers backend-side full_name substring filtering.
  getMembers: async (
    projectId: number | string,
    q?: string,
  ): Promise<ProjectMember[]> => {
    const params = q && q.trim() ? { q: q.trim() } : undefined
    const response = await apiClient.get<ProjectMemberResponseDTO[]>(
      `/projects/${projectId}/members`,
      { params },
    )
    return response.data.map(mapMember)
  },

  create: async (data: CreateProjectDTO): Promise<Project> => {
    const response = await apiClient.post<ProjectResponseDTO>('/projects', data);
    return mapProject(response.data);
  },

  updateStatus: async (id: number, status: string): Promise<Project> => {
    const response = await apiClient.patch<ProjectResponseDTO>(`/projects/${id}`, { status });
    return mapProject(response.data);
  },

  // Phase 14 Plan 14-05 — admin-tab project delete. Backend DELETE /projects/{id}
  // already exists (Phase 9-10) and returns 204. The /admin/projects MoreH "Sil"
  // flow uses this with a two-step typing confirm in the UI.
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // Phase 11 Plan 04: Settings > Genel sub-tab patches arbitrary project fields
  // (name, description, start_date, end_date, process_config, status). The backend
  // PATCH /projects/{id} accepts ProjectUpdateDTO with all these keys.
  update: async (
    id: number,
    patch: {
      name?: string;
      description?: string | null;
      start_date?: string | null;
      end_date?: string | null;
      methodology?: string;
      process_config?: Record<string, unknown>;
      status?: string;
    }
  ): Promise<Project> => {
    const response = await apiClient.patch<ProjectResponseDTO>(`/projects/${id}`, patch);
    return mapProject(response.data);
  },

  // Phase 12 Plan 12-09: Workflow Editor save flow.
  // PATCHes /projects/{id} with body { process_config: { ...current, workflow: newWorkflow } }.
  // The caller is responsible for spreading the existing processConfig and replacing
  // workflow with the new (already snake_case-serialized via unmapWorkflowConfig)
  // shape. Backend re-validates the entire process_config; 422 surfaces validation
  // errors, 409 on concurrent edit, 429 on rate-limit.
  updateProcessConfig: async (
    projectId: number,
    processConfig: Record<string, unknown>,
  ): Promise<Project> => {
    const response = await apiClient.patch<ProjectResponseDTO>(`/projects/${projectId}`, {
      process_config: processConfig,
    });
    return mapProject(response.data);
  },

  getActivity: async (limit = 20, offset = 0) => {
    // Phase 12 Plan 12-10 (Bug Z UAT fix) — /api/v1/activity is admin-only
    // (Phase 10 BL-01 mitigation). Non-admin callers predictably receive
    // 403 and useGlobalActivity already swallows the error to render an
    // empty Dashboard widget. We opt the request into the interceptor's
    // expected-failure list so the global `console.error` for 403 stays
    // quiet — only real surprises (other status codes) log.
    const response = await apiClient.get('/activity', {
      params: { limit, offset },
      // Custom axios config flag — see Frontend2/lib/api-client.ts response
      // interceptor for the gate logic.
      // @ts-expect-error — expectedFailureCodes is a custom flag, not in axios types
      expectedFailureCodes: [403],
    });
    return response.data;
  },

  getProcessTemplates: async () => {
    const response = await apiClient.get('/process-templates');
    return response.data;
  },

  // Phase 14 Plan 14-06 — admin Workflows tab. Reads a single template so we
  // can compose a client-side clone (no backend /clone route per CONTEXT D-B1
  // "use existing endpoints"). Uses GET /process-templates/{id} via the list
  // endpoint and a client-side filter — the existing router exposes only a
  // list endpoint at /process-templates/, so we filter here.
  getProcessTemplateById: async (
    id: number,
  ): Promise<{
    id: number
    name: string
    is_builtin: boolean
    columns: unknown[]
    recurring_tasks: unknown[]
    behavioral_flags: Record<string, unknown>
    description: string | null
  } | null> => {
    const response = await apiClient.get<
      Array<{
        id: number
        name: string
        is_builtin: boolean
        columns: unknown[]
        recurring_tasks: unknown[]
        behavioral_flags: Record<string, unknown>
        description: string | null
      }>
    >('/process-templates')
    const found = response.data.find((t) => t.id === id)
    return found ?? null
  },

  // Phase 14 Plan 14-06 — admin Workflows tab Klonla flow.
  // No backend /clone endpoint exists; per Plan 14-06 critical_constraints we
  // must NOT add one. Implementation: read the source template, then POST a
  // new one with the same payload + a "(Kopya)" / "(Copy)" suffix on name.
  // Returns the new template object so the call site can refetch / toast.
  cloneProcessTemplate: async (
    id: number,
    nameSuffix: string,
  ): Promise<unknown> => {
    const source = await projectService.getProcessTemplateById(id)
    if (!source) {
      throw new Error(`Process template ${id} not found`)
    }
    const newName = `${source.name}${nameSuffix}`
    // POST /process-templates expects ProcessTemplateCreateDTO — name +
    // columns + recurring_tasks + behavioral_flags + description. is_builtin
    // is server-forced to false (manage_process_templates.CreateProcessTemplate).
    const response = await apiClient.post('/process-templates', {
      name: newName,
      columns: source.columns,
      recurring_tasks: source.recurring_tasks,
      behavioral_flags: source.behavioral_flags,
      description: source.description,
    })
    return response.data
  },

  // Phase 14 Plan 14-06 — admin Workflows tab Sil flow.
  // Backend DELETE /process-templates/{id} exists (manage_process_templates
  // DeleteProcessTemplateUseCase); returns 204. Built-in templates raise
  // PermissionError → 403; the UI gates the Sil action behind the
  // ConfirmDialog so an admin can't accidentally trigger it.
  deleteProcessTemplate: async (id: number): Promise<void> => {
    await apiClient.delete(`/process-templates/${id}`)
  },

  // Phase 14 Plan 14-18 (Cluster F, B-5) — admin Workflows Düzenle flow.
  // Backend PATCH /process-templates/{id} exists already (Backend/app/api/v1/
  // process_templates.py:61 — UpdateProcessTemplateUseCase). Built-in
  // templates raise PermissionError → 403; the UI gates the Düzenle action
  // by hiding the form's edit affordances when is_builtin=true.
  updateProcessTemplate: async (
    id: number,
    payload: {
      name?: string
      description?: string | null
      columns?: unknown[]
      recurring_tasks?: unknown[]
      behavioral_flags?: Record<string, unknown>
    },
  ): Promise<unknown> => {
    const response = await apiClient.patch(
      `/process-templates/${id}`,
      payload,
    )
    return response.data
  },

  // D-26: task statistics for Dashboard StatCard 4 (open/in-progress/done task counts)
  // Uses /tasks/my-tasks — the only task-list endpoint with no path param. Backend has no
  // global GET /tasks route (405 Method Not Allowed); project-scoped lists live at
  // /tasks/project/{project_id}.
  getTaskStats: async (): Promise<{
    total: number;
    open: number;
    in_progress: number;
    done: number;
  }> => {
    const response = await apiClient.get<Array<{ status: string }>>('/tasks/my-tasks');
    const tasks = response.data;
    return {
      total: tasks.length,
      open: tasks.filter(
        (t) => t.status === 'TODO' || t.status === 'todo'
      ).length,
      in_progress: tasks.filter(
        (t) => t.status === 'IN_PROGRESS' || t.status === 'in_progress'
      ).length,
      done: tasks.filter(
        (t) => t.status === 'DONE' || t.status === 'done'
      ).length,
    };
  },
};
