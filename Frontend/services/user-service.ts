import { apiClient } from '@/lib/api-client';
import { User } from '@/lib/types';

export const userService = {
    // Projedeki veya sistemdeki kullanıcıları getir
    getAll: async (): Promise<User[]> => {
        // Backend'de '/users' endpoint'i olduğunu varsayıyoruz. 
        // Yoksa auth/users veya projects/{id}/members kullanabiliriz.
        // Şimdilik genel users endpoint'i varsayalım.
        const response = await apiClient.get<any[]>('/auth/users'); 
        return response.data.map(u => ({
            id: u.id.toString(),
            name: u.full_name || u.username,
            email: u.email,
            avatar: u.avatar_url
        }));
    }
};