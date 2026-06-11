import { apiClient } from '@/lib/api-client';

/** Workflow engine column category (Phase 17 backend addition).
 *  Frontend uses it as the canonical "is this a Done/In Progress/To Do"
 *  signal instead of name-based heuristics. Optional on the legacy shape
 *  because pre-Phase-17 projects may not have it populated yet. */
export type ColumnCategory = 'todo' | 'in_progress' | 'done';

export interface BoardColumnLite {
  id: number;
  name: string;
  /** Reports migration v2 — Strategy D CFD capability gate reads this to
   *  decide if the project has a {todo, in_progress, done} triple. */
  category?: ColumnCategory;
  /** Workflow engine boundary fields (Phase 17). Optional because pre-17
   *  rows have them as NULL until the backfill migration runs. */
  isInitial?: boolean;
  isTerminal?: boolean;
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
  /** Optional — derived display field populated by the BE join (read-only).
   *  Marked optional so test fixtures and pre-existing construction sites
   *  compile without forcing every Project literal to carry the field. */
  processTemplateName?: string | null;
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
  // Picked from /process-templates in the wizard. When omitted the backend
  // falls back to the methodology-name lookup, but the resulting project
  // row will be linked to the bare built-in (Scrum/Kanban/Waterfall) rather
  // than the rich one the user actually chose (V-Modeli, PRINCE2, …).
  process_template_id?: number | null;
  columns?: string[];
  process_config?: Record<string, unknown>;
}

/** Column shape as returned by the BE — extended in Phase 17 with the
 *  workflow engine fields. String form is the very-legacy fallback that
 *  some older endpoints still emit. */
type ProjectResponseColumn =
  | string
  | {
      id: number;
      name: string;
      category?: ColumnCategory;
      is_initial?: boolean;
      is_terminal?: boolean;
    };

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
  process_template_name?: string | null;
  manager_id: number | null;
  manager_name: string | null;
  manager_avatar: string | null;
  progress?: number;
  columns?: ProjectResponseColumn[];
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
    processTemplateName: data.process_template_name ?? null,
    managerId: data.manager_id,
    managerName: data.manager_name,
    managerAvatar: data.manager_avatar,
    // Y1 fix — backend GET /projects carries no `progress` field, but it now
    // populates task_count/task_done_count for ALL callers (admin + member),
    // so derive the 0–1 fraction here. PortfolioTable / ProjectCard / teams all
    // multiply this by 100. Falls back to a server-sent `progress` if one ever
    // appears, then to 0 for projects with no tasks.
    progress:
      data.progress ??
      (data.task_count && data.task_count > 0
        ? (data.task_done_count ?? 0) / data.task_count
        : 0),
    columns: (data.columns ?? []).map((c) =>
      typeof c === 'string' ? c : c.name
    ),
    // boardColumns preserves the {id, name} pairs that PATCH consumers need
    // (status updates → column_id). String entries lose the id, so they get
    // a synthetic 0 — InlineEdit guards against that.
    //
    // Reports migration v2: also carries the Phase 17 engine fields
    // (category, isInitial, isTerminal) so the chart capability layer can
    // read them without an additional fetch. Legacy string entries default
    // to undefined which the CFD gate treats as "not categorized".
    boardColumns: (data.columns ?? []).map((c) =>
      typeof c === 'string'
        ? { id: 0, name: c }
        : {
            id: c.id,
            name: c.name,
            category: c.category,
            isInitial: c.is_initial,
            isTerminal: c.is_terminal,
          }
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

// ProcessTemplateResponseDTO wire shape (snake_case, admin-only consumers).
// default_workflow uses the same WorkflowConfigDTO shape as project
// phase_workflow, so the lifecycle-service mappers apply 1:1.
export interface ProcessTemplateDetail {
  id: number
  name: string
  is_builtin: boolean
  columns: unknown[]
  recurring_tasks: unknown[]
  behavioral_flags: Record<string, unknown>
  description: string | null
  default_workflow?: Record<string, unknown> | null
  default_columns?: unknown[] | null
  default_phase_criteria?: Record<string, unknown> | null
  default_artifacts?: unknown[] | null
  cycle_label_tr?: string | null
  cycle_label_en?: string | null
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
  // PATCHes /projects/{id} with body { process_config: { ...current, phase_workflow: newWorkflow } }.
  // Workflow Engine V2 (C10) renamed `workflow` → `phase_workflow`. Backend still
  // accepts the legacy `workflow` key for one-version transition (dual-key tolerance
  // in manage_projects.py PATCH endpoint), but new clients must emit `phase_workflow`.
  // The caller is responsible for spreading the existing processConfig and replacing
  // phase_workflow with the new (already snake_case-serialized via unmapWorkflowConfig)
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

  // The router exposes only a list endpoint, so we fetch the list and filter
  // client-side.
  getProcessTemplateById: async (
    id: number,
  ): Promise<ProcessTemplateDetail | null> => {
    const response = await apiClient.get<ProcessTemplateDetail[]>(
      '/process-templates',
    )
    const found = response.data.find((t) => t.id === id)
    return found ?? null
  },

  // Client-side clone (no backend /clone route): GET the source, POST a copy
  // with a name suffix. All default_* fields ride along so the clone is a
  // full copy. is_builtin is server-forced to false.
  cloneProcessTemplate: async (
    id: number,
    nameSuffix: string,
  ): Promise<unknown> => {
    const source = await projectService.getProcessTemplateById(id)
    if (!source) {
      throw new Error(`Process template ${id} not found`)
    }
    const newName = `${source.name}${nameSuffix}`
    const response = await apiClient.post('/process-templates', {
      name: newName,
      columns: source.columns,
      recurring_tasks: source.recurring_tasks,
      behavioral_flags: source.behavioral_flags,
      description: source.description,
      default_workflow: source.default_workflow ?? null,
      default_columns: source.default_columns ?? null,
      default_phase_criteria: source.default_phase_criteria ?? null,
      default_artifacts: source.default_artifacts ?? null,
      cycle_label_tr: source.cycle_label_tr ?? null,
      cycle_label_en: source.cycle_label_en ?? null,
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

  // default_workflow is the canvas-serialized lifecycle graph; the backend
  // shape-validates it and 422s on violation. Built-ins 403.
  updateProcessTemplate: async (
    id: number,
    payload: {
      name?: string
      description?: string | null
      columns?: unknown[]
      recurring_tasks?: unknown[]
      behavioral_flags?: Record<string, unknown>
      default_workflow?: Record<string, unknown>
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
