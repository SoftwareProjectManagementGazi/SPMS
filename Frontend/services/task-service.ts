import { apiClient } from '@/lib/api-client';
import { ParentTask, TaskPriority, User } from '@/lib/types';

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
            projectId: data.parent_task_summary.project_id.toString()
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
        loggedTime: 0,
        estimatedTime: 0,
        labels: []
    };
};

export const taskService = {
    getByProjectId: async (projectId: string | number): Promise<ParentTask[]> => {
        const response = await apiClient.get<TaskResponseDTO[]>(`/tasks/project/${Number(projectId)}`);
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

    getTasksByProject: async (projectId: string): Promise<ParentTask[]> => {
        const response = await apiClient.get<TaskResponseDTO[]>(`/tasks/project/${projectId}`);
        return response.data.map(mapTaskResponseToParentTask);
    },

    getTask: async (taskId: string): Promise<ParentTask> => {
        const response = await apiClient.get<TaskResponseDTO>(`/tasks/${taskId}`);
        return mapTaskResponseToParentTask(response.data);
    },

    createTask: async (taskData: any) => {
        const response = await apiClient.post<TaskResponseDTO>('/tasks', taskData);
        return mapTaskResponseToParentTask(response.data);
    },

    updateTask: async (taskId: string, taskData: any) => {
        // Partial update için
        const response = await apiClient.put<TaskResponseDTO>(`/tasks/${taskId}`, taskData);
        return mapTaskResponseToParentTask(response.data);
    },

    deleteTask: async (taskId: string) => {
        await apiClient.delete(`/tasks/${taskId}`);
    }
};