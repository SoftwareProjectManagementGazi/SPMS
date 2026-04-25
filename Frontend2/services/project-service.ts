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
