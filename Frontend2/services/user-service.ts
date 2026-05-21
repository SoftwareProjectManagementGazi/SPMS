import { apiClient } from '@/lib/api-client';
import { resolveAvatarUrl } from '@/services/auth-service';

export interface User {
  id: number;
  email: string;
  full_name: string;
  /** Resolved avatar URL — either a fully qualified URL or the
   *  `/placeholder.svg` sentinel when the user has no uploaded photo.
   *  Consumers can pass this straight to the Avatar primitive. */
  avatar?: string;
  role?: { name: string };
}

type RawUserDTO = {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role?: { id?: number; name: string } | string | null;
};

function mapUser(u: RawUserDTO): User {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? u.username ?? '',
    avatar: resolveAvatarUrl(u.avatar_url),
    role:
      u.role == null
        ? undefined
        : typeof u.role === 'object'
        ? { name: u.role.name }
        : { name: String(u.role) },
  };
}

export const userService = {
  list: async (): Promise<User[]> => {
    const res = await apiClient.get<RawUserDTO[]>('/users');
    return res.data.map(mapUser);
  },
};
