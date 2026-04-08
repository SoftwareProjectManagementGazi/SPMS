import { apiClient } from '@/lib/api-client';

// --- Types ---
export interface ReportFilters {
  projectId: number | null;
  assigneeIds: number[];
  dateFrom: string | null; // ISO date "YYYY-MM-DD"
  dateTo: string | null;
}

export interface SummaryData {
  active_tasks: number;
  completed_tasks: number;
  total_tasks: number;
  completion_rate: number;
}

export interface BurndownPoint {
  date: string;
  remaining: number;
  total: number;
}

export interface BurndownData {
  sprint_name: string;
  sprint_id: number;
  series: BurndownPoint[];
}

export interface VelocityPoint {
  label: string;
  completed_count: number;
  completed_points: number;
}

export interface VelocityData {
  series: VelocityPoint[];
}

export interface DistributionItem {
  label: string;
  count: number;
  color: string | null;
}

export interface DistributionData {
  group_by: string;
  items: DistributionItem[];
}

export interface MemberPerformance {
  user_id: number;
  full_name: string;
  avatar_path: string | null;
  assigned: number;
  completed: number;
  in_progress: number;
  on_time_pct: number;
}

export interface PerformanceData {
  members: MemberPerformance[];
}

// --- Helper: build query params from filters ---
function buildParams(filters: ReportFilters, extra?: Record<string, string>) {
  const params: Record<string, string> = {};
  if (filters.projectId) params.project_id = String(filters.projectId);
  if (filters.assigneeIds.length > 0) params.assignee_ids = filters.assigneeIds.join(',');
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;
  if (extra) Object.assign(params, extra);
  return params;
}

// --- API methods ---
export const reportService = {
  getSummary: async (filters: ReportFilters): Promise<SummaryData> => {
    const { data } = await apiClient.get('/reports/summary', { params: buildParams(filters) });
    return data;
  },

  getBurndown: async (filters: ReportFilters, sprintId?: number): Promise<BurndownData> => {
    const extra: Record<string, string> = sprintId ? { sprint_id: String(sprintId) } : {};
    const { data } = await apiClient.get('/reports/burndown', { params: buildParams(filters, extra) });
    return data;
  },

  getVelocity: async (filters: ReportFilters): Promise<VelocityData> => {
    const { data } = await apiClient.get('/reports/velocity', { params: buildParams(filters) });
    return data;
  },

  getDistribution: async (filters: ReportFilters, groupBy: string = 'status'): Promise<DistributionData> => {
    const { data } = await apiClient.get('/reports/distribution', {
      params: buildParams(filters, { group_by: groupBy }),
    });
    return data;
  },

  getPerformance: async (filters: ReportFilters): Promise<PerformanceData> => {
    const { data } = await apiClient.get('/reports/performance', { params: buildParams(filters) });
    return data;
  },

  exportPdf: async (filters: ReportFilters): Promise<Blob> => {
    const { data } = await apiClient.get('/reports/export/pdf', {
      params: buildParams(filters),
      responseType: 'blob',
    });
    return data;
  },

  exportExcel: async (filters: ReportFilters): Promise<Blob> => {
    const { data } = await apiClient.get('/reports/export/excel', {
      params: buildParams(filters),
      responseType: 'blob',
    });
    return data;
  },
};
