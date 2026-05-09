import { apiClient } from '@/lib/api-client';
import { resolveAvatarUrl } from '@/services/auth-service';

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

export interface TeamCreateRequest {
  name: string;
  description?: string;
}

type RawUserListDTO = {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
};

function mapRawUser(u: RawUserListDTO): TeamMember {
  return {
    id: u.id,
    email: u.email,
    full_name: u.username ?? '',
    avatar: resolveAvatarUrl(u.avatar_url),
  };
}

type RawTeamDTO = {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  members: RawUserListDTO[];
};

function mapRawTeam(d: RawTeamDTO): Team {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    owner_id: d.owner_id,
    members: d.members.map(mapRawUser),
  };
}

export const teamService = {
  listMyTeams: async (): Promise<Team[]> => {
    const res = await apiClient.get<RawTeamDTO[]>('/teams');
    return res.data.map(mapRawTeam);
  },

  getTeam: async (teamId: number): Promise<Team> => {
    const res = await apiClient.get<RawTeamDTO>(`/teams/${teamId}`);
    return mapRawTeam(res.data);
  },

  createTeam: async (data: TeamCreateRequest): Promise<Team> => {
    const res = await apiClient.post<RawTeamDTO>('/teams', data);
    return mapRawTeam(res.data);
  },

  addMember: async (teamId: number, userId: number): Promise<void> => {
    await apiClient.post(`/teams/${teamId}/members`, { user_id: userId });
  },

  removeMember: async (teamId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/members/${userId}`);
  },

  searchUsers: async (query: string): Promise<TeamMember[]> => {
    const res = await apiClient.get<RawUserListDTO[]>('/teams/users/search', {
      params: { q: query },
    });
    return res.data.map(mapRawUser);
  },
};
