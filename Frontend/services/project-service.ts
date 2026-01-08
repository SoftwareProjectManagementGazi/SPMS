import { apiClient } from '@/lib/api-client';
import { Project, User, Methodology, BoardColumn } from '@/lib/types';

// Backend Response Type (Backend'den gelen ham veri tipi)
interface ProjectResponse {
  id: number;
  key: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  methodology: Methodology;
  manager_id: number;
  created_at: string;
  columns?: BoardColumn[];
  custom_fields?: Record<string, any>;
}

// Frontend'den Backend'e giden veri tipi
export interface CreateProjectDTO {
  key: string;
  name: string;
  description?: string;
  methodology: Methodology;
  start_date: string;
  end_date?: string;
  columns?: string[];
  custom_fields?: Record<string, any>;
}

// Mapper Function: Backend verisini Frontend'in beklediği yapıya çevirir
const mapProjectResponseToProject = (data: ProjectResponse): Project => {
  // TODO: Gerçek uygulamada manager_id ile kullanıcı bilgilerini de çekmek gerekebilir.
  // Şimdilik placeholder bir kullanıcı oluşturuyoruz.
  const placeholderLead: User = {
    id: data.manager_id.toString(),
    name: "Project Manager", // Backend'den gelmediği için
    email: "manager@example.com",
    avatar: "/placeholder-user.jpg",
    role: "manager"
  };

  return {
    id: data.id.toString(),
    key: data.key,
    name: data.name,
    description: data.description || "",
    methodology: data.methodology,
    lead: placeholderLead,
    startDate: data.start_date,
    endDate: data.end_date || "",
    progress: 0, // Backend'den gelmediği için default
    columns: data.columns || [],
  };
};

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get<ProjectResponse[]>('/projects');
    return response.data.map(mapProjectResponseToProject);
  },

  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get<ProjectResponse>(`/projects/${id}`);
    return mapProjectResponseToProject(response.data);
  },

  create: async (data: CreateProjectDTO): Promise<Project> => {
    const response = await apiClient.post<ProjectResponse>('/projects/', data);
    return mapProjectResponseToProject(response.data);
  }
};
