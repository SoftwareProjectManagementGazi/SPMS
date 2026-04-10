import { apiClient } from '@/lib/api-client';

export interface ProcessTemplate {
  id: number;
  name: string;
  is_builtin: boolean;
  columns: Array<{ name: string; order: number; wip_limit?: number }>;
  recurring_tasks: Array<{ name: string; recurrence_type: string }>;
  behavioral_flags: Record<string, boolean>;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProcessTemplateDTO {
  name: string;
  columns?: Array<{ name: string; order: number; wip_limit?: number }>;
  recurring_tasks?: Array<{ name: string; recurrence_type: string }>;
  behavioral_flags?: Record<string, boolean>;
  description?: string;
}

export interface UpdateProcessTemplateDTO {
  name?: string;
  columns?: Array<{ name: string; order: number; wip_limit?: number }>;
  recurring_tasks?: Array<{ name: string; recurrence_type: string }>;
  behavioral_flags?: Record<string, boolean>;
  description?: string;
}

export const processTemplateService = {
  getAll: async (): Promise<ProcessTemplate[]> => {
    const { data } = await apiClient.get('/api/v1/process-templates');
    return data;
  },
  create: async (dto: CreateProcessTemplateDTO): Promise<ProcessTemplate> => {
    const { data } = await apiClient.post('/api/v1/process-templates', dto);
    return data;
  },
  update: async (id: number, dto: UpdateProcessTemplateDTO): Promise<ProcessTemplate> => {
    const { data } = await apiClient.patch(`/api/v1/process-templates/${id}`, dto);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/process-templates/${id}`);
  },
};
