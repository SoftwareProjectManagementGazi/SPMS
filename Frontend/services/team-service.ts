import { apiClient } from '@/lib/api-client';

export interface TeamCreateRequest {
  name: string;
  description?: string;
}

export interface TeamMember {
  id: number;
  email: string;
  full_name: string;
  avatar?: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  members: TeamMember[];
}

export const teamService = {
  listMyTeams: async (): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>('/teams');
    return response.data;
  },

  createTeam: async (data: TeamCreateRequest): Promise<Team> => {
    const response = await apiClient.post<Team>('/teams', data);
    return response.data;
  },

  addMember: async (teamId: number, userId: number): Promise<void> => {
    await apiClient.post(`/teams/${teamId}/members`, { user_id: userId });
  },

  removeMember: async (teamId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/members/${userId}`);
  },

  searchUsers: async (query: string): Promise<TeamMember[]> => {
    if (query.length < 2) return [];
    const response = await apiClient.get<TeamMember[]>('/teams/users/search', { params: { q: query } });
    return response.data;
  },
};
