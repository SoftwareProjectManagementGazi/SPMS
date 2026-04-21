import { apiClient } from '@/lib/api-client';

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
  columns: string[];
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
    processConfig: data.process_config ?? null,
    createdAt: data.created_at,
  };
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

  create: async (data: CreateProjectDTO): Promise<Project> => {
    const response = await apiClient.post<ProjectResponseDTO>('/projects', data);
    return mapProject(response.data);
  },

  updateStatus: async (id: number, status: string): Promise<Project> => {
    const response = await apiClient.patch<ProjectResponseDTO>(`/projects/${id}`, { status });
    return mapProject(response.data);
  },

  getActivity: async (limit = 20, offset = 0) => {
    const response = await apiClient.get('/activity', { params: { limit, offset } });
    return response.data;
  },

  getProcessTemplates: async () => {
    const response = await apiClient.get('/process-templates');
    return response.data;
  },

  // D-26: task statistics for Dashboard StatCard 4 (open/in-progress/done task counts)
  getTaskStats: async (): Promise<{
    total: number;
    open: number;
    in_progress: number;
    done: number;
  }> => {
    const response = await apiClient.get<Array<{ status: string }>>('/tasks');
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
