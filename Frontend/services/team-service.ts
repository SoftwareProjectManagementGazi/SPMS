import { apiClient } from '@/lib/api-client';
import { resolveAvatarUrl } from '@/services/auth-service';

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

type RawUserListDTO = { id: number; email: string; username: string; avatar_url?: string };

function mapRawUser(u: RawUserListDTO): TeamMember {
  return {
    id: u.id,
    email: u.email,
    full_name: u.username ?? "",
    avatar: resolveAvatarUrl(u.avatar_url),
  };
}

export const teamService = {
  listMyTeams: async (): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>('/teams');
    return response.data;
  },

  getTeam: async (teamId: number): Promise<Team> => {
    const response = await apiClient.get<{ id: number; name: string; description?: string; owner_id: number; members: RawUserListDTO[] }>(`/teams/${teamId}`);
    const d = response.data;
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      owner_id: d.owner_id,
      members: d.members.map(mapRawUser),
    };
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

  /** Search users by name or email for team invite (debounced, server-side). */
  searchUsers: async (query: string): Promise<TeamMember[]> => {
    const response = await apiClient.get<RawUserListDTO[]>('/teams/users/search', { params: { q: query } });
    return response.data.map(mapRawUser);
  },
};
