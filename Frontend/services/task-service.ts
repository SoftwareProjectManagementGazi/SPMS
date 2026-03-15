import { apiClient } from '@/lib/api-client';
import { ParentTask, TaskPriority, User } from '@/lib/types';

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
}

// Backend Response DTO ile birebir eşleşmeli
export interface TaskResponseDTO {
    id: number;
    title: string;
    description: string | null;
    priority: TaskPriority;
    status: string; // Backend hesaplayıp gönderiyor
    due_date: string | null;
    points: number | null;
    is_recurring: boolean;
    
    project_id: number;
    project?: {
        id: number;
        name: string;
        key: string;
    };
    
    sprint_id: number | null;
    recurrence_interval: string | null;
    recurrence_end_date: string | null;
    recurrence_count: number | null;
    column_id: number | null;
    assignee_id: number | null;
    assignee?: {
        id: number;
        email: string;
        username: string;
        avatar_url?: string;
    } | null;   
    reporter_id: number | null;
    parent_task_id: number | null;

    parent_task_summary?: {
        id: number;
        title: string;
        key: string;
        status: string;
        project_id: number;
        priority: TaskPriority;
    } | null;

    // YENİ: Backend artık subtask listesini gönderiyor
    sub_tasks: Array<{
        id: number;
        title: string;
        key: string;
        status: string;
        priority: TaskPriority;
    }>;

    created_at: string;
    updated_at: string | null;
}

export interface CreateTaskDTO {
    title: string;
    description?: string;
    priority?: TaskPriority;
    due_date?: string;
    points?: number;
    project_id: number;
    parent_task_id?: number;
    assignee_id?: number;
    column_id?: number; // Status yerine Column ID gönderiyoruz
    is_recurring?: boolean;
    recurrence_interval?: 'daily' | 'weekly' | 'monthly';
    recurrence_end_date?: string;
    recurrence_count?: number;
}

const mapTaskResponseToParentTask = (data: TaskResponseDTO): ParentTask => {
    // Proje Key ve ID oluşturma
    const projectKey = data.project?.key || "TASK";
    const taskKey = `${projectKey}-${data.id}`;

    // Placeholder User (Eğer user detay endpoint'i yoksa ID gösteririz)
    // İdeal dünyada Backend assignee detayını 'expand' edip göndermeli.
    // Şimdilik basit tutuyoruz.
    const assigneeUser: User | null = data.assignee ? {
        id: data.assignee.id.toString(),
        name: data.assignee.username, // Backend DTO'da username olarak mapledik
        email: data.assignee.email,
        avatar: data.assignee.avatar_url
    } : null;
    return {
        id: data.id.toString(),
        parentTaskId: data.parent_task_id ? data.parent_task_id.toString() : null,
        key: taskKey,
        title: data.title,
        description: data.description || "",
        status: data.status,
        columnId: data.column_id ? data.column_id.toString() : undefined, // YENİ MAPPING
        priority: data.priority,
        assignee: assigneeUser,
        reporter: null, // İsteğe bağlı
        points: data.points || 0,
        projectId: data.project_id.toString(),
        
        project: data.project ? {
            id: data.project.id.toString(),
            name: data.project.name,
            key: data.project.key
        } : { id: data.project_id.toString(), name: "Unknown", key: "UNK" },

        parentSummary: data.parent_task_summary ? {
            id: data.parent_task_summary.id.toString(),
            title: data.parent_task_summary.title,
            key: data.parent_task_summary.key,
            status: data.parent_task_summary.status,
            projectId: data.parent_task_summary.project_id.toString(),
            priority: data.parent_task_summary.priority // YENİ: Priority eklendi
        } : null,

        // YENİ: Backend'den gelen listeyi map ediyoruz
        subTasks: data.sub_tasks.map(st => ({
            id: st.id.toString(),
            key: st.key,
            title: st.title,
            status: st.status,
            priority: st.priority,
            assignee: null // Subtask özetinde assignee yoksa null
        })),

        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
        dueDate: data.due_date,
        isRecurring: data.is_recurring,
        sprintId: data.sprint_id,
        recurrenceInterval: data.recurrence_interval ?? null,
        recurrenceEndDate: data.recurrence_end_date ?? null,
        recurrenceCount: data.recurrence_count ?? null,
        loggedTime: 0,
        estimatedTime: 0,
        labels: []
    };
};

export const taskService = {
    getByProjectId: async (projectId: string | number): Promise<ParentTask[]> => {
        const response = await apiClient.get<TaskResponseDTO[] | PaginatedResponse<TaskResponseDTO>>(`/tasks/project/${Number(projectId)}`, {
            params: { page: 1, page_size: 100 }
        });
        const items = Array.isArray(response.data) ? response.data : response.data.items;
        return items.map(mapTaskResponseToParentTask);
    },

    getByProjectPaginated: async (
        projectId: string | number,
        page: number = 1,
        pageSize: number = 20
    ): Promise<PaginatedResponse<ParentTask>> => {
        const response = await apiClient.get<PaginatedResponse<TaskResponseDTO>>(`/tasks/project/${Number(projectId)}`, {
            params: { page, page_size: pageSize }
        });
        return {
            items: response.data.items.map(mapTaskResponseToParentTask),
            total: response.data.total,
            page: response.data.page,
            page_size: response.data.page_size,
        };
    },

    searchSimilar: async (projectId: number, query: string): Promise<ParentTask[]> => {
        const response = await apiClient.get<TaskResponseDTO[]>('/tasks/search', {
            params: { project_id: projectId, q: query }
        });
        return response.data.map(mapTaskResponseToParentTask);
    },

    create: async (data: CreateTaskDTO): Promise<ParentTask> => {
        const response = await apiClient.post<TaskResponseDTO>('/tasks/', data);
        return mapTaskResponseToParentTask(response.data);
    },

    getMyTasks: async (): Promise<ParentTask[]> => {
        const response = await apiClient.get<TaskResponseDTO[]>('/tasks/my-tasks');
        return response.data.map(mapTaskResponseToParentTask);
    },

    getTask: async (taskId: string): Promise<ParentTask> => {
        const response = await apiClient.get<TaskResponseDTO>(`/tasks/${taskId}`);
        return mapTaskResponseToParentTask(response.data);
    },

    updateTask: async (taskId: string, taskData: any) => {
        // Partial update için
        const response = await apiClient.put<TaskResponseDTO>(`/tasks/${taskId}`, taskData);
        return mapTaskResponseToParentTask(response.data);
    },

    patchTask: async (
        taskId: string,
        partial: Partial<{ column_id: number; due_date: string | null; sprint_id: number | null }>
    ): Promise<ParentTask> => {
        const response = await apiClient.patch<TaskResponseDTO>(`/tasks/${taskId}`, partial);
        return mapTaskResponseToParentTask(response.data);
    },

    deleteTask: async (taskId: string) => {
        await apiClient.delete(`/tasks/${taskId}`);
    }
};