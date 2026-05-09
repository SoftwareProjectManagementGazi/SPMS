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
  leader_id?: number | null;
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
  leader_id?: number | null;
  members: RawUserListDTO[];
};

function mapRawTeam(d: RawTeamDTO): Team {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    owner_id: d.owner_id,
    leader_id: d.leader_id ?? null,
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

  deleteTeam: async (teamId: number): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}`);
  },

  leaveTeam: async (teamId: number): Promise<void> => {
    await apiClient.post(`/teams/${teamId}/leave`);
  },

  addMember: async (teamId: number, userId: number): Promise<void> => {
    await apiClient.post(`/teams/${teamId}/members`, { user_id: userId });
  },

  removeMember: async (teamId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/members/${userId}`);
  },

  /** Set or clear the team leader. Pass null to clear. Owner or admin only. */
  setLeader: async (teamId: number, leaderId: number | null): Promise<void> => {
    await apiClient.patch(`/teams/${teamId}/leader`, { leader_id: leaderId });
  },

  /** Server-side search — used as fallback when users/all is not yet loaded. */
  searchUsers: async (query: string): Promise<TeamMember[]> => {
    const res = await apiClient.get<RawUserListDTO[]>('/teams/users/search', {
      params: { q: query },
    });
    return res.data.map(mapRawUser);
  },

  /** Fetch all users once for client-side filtering (faster UX than per-keystroke search). */
  listAllUsers: async (): Promise<TeamMember[]> => {
    const res = await apiClient.get<RawUserListDTO[]>('/teams/users/all');
    return res.data.map(mapRawUser);
  },
};
