import { apiClient } from '@/lib/api-client';

export interface SystemConfig {
  config: Record<string, string>;
}

export const adminSettingsService = {
  get: async (): Promise<SystemConfig> => {
    const { data } = await apiClient.get('/admin/settings');
    return data;
  },
  update: async (config: Record<string, string>): Promise<SystemConfig> => {
    const { data } = await apiClient.put('/admin/settings', { config });
    return data;
  },
};
