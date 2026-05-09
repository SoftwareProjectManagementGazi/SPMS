import { apiClient } from '@/lib/api-client';
import { resolveAvatarUrl } from '@/services/auth-service';

// ---------------------------------------------------------------
// Request / Update DTO'ları
// ---------------------------------------------------------------

export interface TeamCreateRequest {
  name: string;
  description?: string;
  color?: string;
  department?: string;
  leader_id?: number;
  member_ids?: number[];
}

export interface TeamUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
  department?: string;
}

// ---------------------------------------------------------------
// Response tipleri
// ---------------------------------------------------------------

export interface TeamMember {
  id: number;
  email: string;
  full_name: string;
  avatar?: string;
  role?: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  leader_id?: number | null;
  color: string;                    // backend default "#3b82f6"
  department?: string | null;
  created_at?: string;              // ISO
  members: TeamMember[];
  // Aggregate alanlar (gerektiğinde populate olur):
  project_count?: number | null;
  active_task_count?: number | null;
  completion_rate?: number | null;
}

export interface TeamsStats {
  total_teams: number;
  total_members: number;
  active_tasks: number;
  completion_rate: number;          // 0..1
}

export interface TeamProject {
  id: number;
  name: string;
  description?: string | null;
  status?: string | null;
  progress?: number | null;         // 0..1
  member_count: number;
  task_count: number;               // toplam görev
  done_count: number;               // tamamlanan görev
}

export interface TeamActivityItem {
  id: number;
  actor_id?: number | null;
  actor_name?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: number | null;
  target_label?: string | null;
  created_at: string;               // ISO
}

export interface TeamMemberStat {
  user_id: number;
  full_name: string;
  total_count: number;
  done_count: number;
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

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
  description?: string | null;
  owner_id: number;
  leader_id?: number | null;
  color?: string;
  department?: string | null;
  created_at?: string | null;
  members?: RawUserListDTO[];
  project_count?: number | null;
  active_task_count?: number | null;
  completion_rate?: number | null;
};

function mapRawTeam(d: RawTeamDTO): Team {
  return {
    id: d.id,
    name: d.name,
    description: d.description ?? undefined,
    owner_id: d.owner_id,
    leader_id: d.leader_id ?? null,
    color: d.color ?? '#3b82f6',
    department: d.department ?? null,
    created_at: d.created_at ?? undefined,
    members: (d.members ?? []).map(mapRawUser),
    project_count: d.project_count ?? null,
    active_task_count: d.active_task_count ?? null,
    completion_rate: d.completion_rate ?? null,
  };
}

// ---------------------------------------------------------------
// Service
// ---------------------------------------------------------------

export const teamService = {
  /** GET /teams — kullanıcının dahil olduğu tüm takımlar (avatar dahil ilk birkaç üye populated). */
  listMyTeams: async (): Promise<Team[]> => {
    const res = await apiClient.get<RawTeamDTO[]>('/teams');
    return res.data.map(mapRawTeam);
  },

  /** GET /teams/stats — sayfa üst stats stripi için toplu sayım. */
  getStats: async (): Promise<TeamsStats> => {
    const res = await apiClient.get<TeamsStats>('/teams/stats');
    return res.data;
  },

  /** GET /teams/{id} — tek takım, tüm üye detaylarıyla. */
  getTeam: async (teamId: number): Promise<Team> => {
    const res = await apiClient.get<RawTeamDTO>(`/teams/${teamId}`);
    return mapRawTeam(res.data);
  },

  /** POST /teams — yeni takım oluştur. owner_id otomatik current user. */
  createTeam: async (data: TeamCreateRequest): Promise<Team> => {
    const res = await apiClient.post<RawTeamDTO>('/teams', data);
    return mapRawTeam(res.data);
  },

  /** PATCH /teams/{id} — partial update (ad, açıklama, renk, departman). */
  updateTeam: async (teamId: number, data: TeamUpdateRequest): Promise<Team> => {
    const res = await apiClient.patch<RawTeamDTO>(`/teams/${teamId}`, data);
    return mapRawTeam(res.data);
  },

  /** PATCH /teams/{id}/leader — lider belirle veya sıfırla. Owner veya admin. */
  setLeader: async (teamId: number, leaderId: number | null): Promise<void> => {
    await apiClient.patch(`/teams/${teamId}/leader`, { leader_id: leaderId });
  },

  /** DELETE /teams/{id} — owner-only soft delete. */
  deleteTeam: async (teamId: number): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}`);
  },

  /** POST /teams/{id}/leave — non-owner üye takımdan ayrılır. */
  leaveTeam: async (teamId: number): Promise<void> => {
    await apiClient.post(`/teams/${teamId}/leave`);
  },

  // --- Üye yönetimi ---

  addMember: async (teamId: number, userId: number): Promise<void> => {
    await apiClient.post(`/teams/${teamId}/members`, { user_id: userId });
  },

  removeMember: async (teamId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/members/${userId}`);
  },

  /** Server-side search — fallback olarak kullanılır (en az 2 karakter). */
  searchUsers: async (query: string): Promise<TeamMember[]> => {
    const res = await apiClient.get<RawUserListDTO[]>('/teams/users/search', {
      params: { q: query },
    });
    return res.data.map(mapRawUser);
  },

  /** Tüm kullanıcıları bir kez getir, client-side filtre — daha hızlı UX. */
  listAllUsers: async (): Promise<TeamMember[]> => {
    const res = await apiClient.get<RawUserListDTO[]>('/teams/users/all');
    return res.data.map(mapRawUser);
  },

  // --- Detay sayfası sekmeleri ---

  /** GET /teams/{id}/projects — takıma bağlı projeler ve ilerleme. */
  getProjects: async (teamId: number): Promise<TeamProject[]> => {
    const res = await apiClient.get<TeamProject[]>(`/teams/${teamId}/projects`, {
      silentFailure: true,
    } as any);
    return res.data;
  },

  /** GET /teams/{id}/activity — takıma ait son audit log olayları.
   *
   * NOT: Backend endpoint henüz implement edilmemiş olabilir; hata sessizce
   * yutulur ve UI boş feed gösterir. */
  getActivity: async (teamId: number, limit: number = 50): Promise<TeamActivityItem[]> => {
    const res = await apiClient.get<TeamActivityItem[]>(`/teams/${teamId}/activity`, {
      params: { limit },
      silentFailure: true,
    } as any);
    return res.data;
  },

  /** GET /teams/{id}/member-stats — per-member done-task count. */
  getMemberStats: async (teamId: number): Promise<TeamMemberStat[]> => {
    const res = await apiClient.get<TeamMemberStat[]>(`/teams/${teamId}/member-stats`, {
      silentFailure: true,
    } as any);
    return res.data ?? [];
  },

  /** POST /teams/{id}/projects — takıma proje ata. Owner veya admin. */
  assignProject: async (teamId: number, projectId: number): Promise<void> => {
    await apiClient.post(`/teams/${teamId}/projects`, { project_id: projectId });
  },

  /** DELETE /teams/{id}/projects/{projectId} — takımdan proje bağlantısını kaldır. */
  unassignProject: async (teamId: number, projectId: number): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/projects/${projectId}`);
  },
};