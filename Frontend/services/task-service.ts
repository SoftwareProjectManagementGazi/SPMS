import { apiClient } from '@/lib/api-client';
import { ParentTask, TaskPriority, User } from '@/lib/types';

export interface TaskResponseDTO {
    id: number;
    title: string;
    description: string | null;
    status: string;
    priority: any;
    due_date: string | null;
    points: number | null;
    is_recurring: boolean;
    project_id: number;
    assignee_id: number | null;
    reporter_id: number | null;
    parent_task_id: number | null;
    
    parent_task_summary?: {
        id: number;
        title: string;
        key: string;
        status: string;
        project_id: number;
    } | null;

    created_at: string;
    updated_at: string | null;

    project?: {
        id: number;
        name: string;
        key: string;
    };
}

export interface CreateTaskDTO {
    title: string;
    description?: string;
    priority?: TaskPriority;
    due_date?: string;
    points?: number;
    status: string;
    project_id: number;
    assignee_id?: number;
}

const mapTaskResponseToParentTask = (data: TaskResponseDTO): ParentTask => {
    const placeholderUser: User = {
        id: data.assignee_id?.toString() || "0",
        name: "User " + (data.assignee_id || "?"),
        email: "user@example.com",
        avatar: "/placeholder-user.jpg",
        role: { name: "member" }
    };

    // DÜZELTME: Key'i artık elle 'TSK' yazmıyoruz.
    // Backend'den gelen proje key'ini kullanıyoruz (örn: SPMS, MOB).
    // Eğer proje bilgisi yoksa fallback olarak 'TASK' kullanıyoruz.
    const projectKey = data.project?.key || "TASK";

    return {
        id: data.id.toString(),
        parentTaskId: data.parent_task_id ? data.parent_task_id.toString() : null,
        
        parentSummary: data.parent_task_summary ? {
            id: data.parent_task_summary.id.toString(),
            title: data.parent_task_summary.title,
            key: data.parent_task_summary.key,
            status: data.parent_task_summary.status,
            projectId: data.parent_task_summary.project_id.toString()
        } : null,

        isGhost: false,

        // Dinamik Key Kullanımı
        key: `${projectKey}-${data.id}`,
        
        title: data.title,
        description: data.description || "",
        status: data.status || "todo",
        priority: data.priority,
        assignee: data.assignee_id ? placeholderUser : null,
        reporter: placeholderUser,
        points: data.points || 0,
        projectId: data.project_id.toString(),
        
        project: data.project ? {
            id: data.project.id.toString(),
            name: data.project.name,
            key: data.project.key,
            description: ""
        } : { id: data.project_id.toString(), name: "Unknown Project" } as any,
        
        subTasks: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
        dueDate: data.due_date || null,
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
        const response = await apiClient.put<TaskResponseDTO>(`/tasks/${taskId}`, taskData);
        return mapTaskResponseToParentTask(response.data);
    },

    deleteTask: async (taskId: string) => {
        await apiClient.delete(`/tasks/${taskId}`);
    }
};