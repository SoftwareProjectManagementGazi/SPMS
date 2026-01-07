import { apiClient } from '@/lib/api-client';
import { ParentTask, TaskPriority, User } from '@/lib/types';

export interface TaskResponseDTO {
    id: number;
    title: string;
    description: string | null;
    priority: TaskPriority;
    due_date: string | null;
    points: number | null;
    is_recurring: boolean;
    
    project_id: number;
    sprint_id: number | null;
    column_id: number | null;
    assignee_id: number | null;
    reporter_id: number | null;
    parent_task_id: number | null;
    
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
    assignee_id?: number;
}

const mapTaskResponseToParentTask = (data: TaskResponseDTO): ParentTask => {
    // Placeholder users until we have a user service/store
    const placeholderUser: User = {
        id: data.assignee_id?.toString() || "0",
        name: "User " + (data.assignee_id || "?"),
        email: "user@example.com",
        avatar: "/placeholder-user.jpg",
        role: "member"
    };

    return {
        id: data.id.toString(),
        key: `TSK-${data.id}`,
        title: data.title,
        description: data.description || "",
        status: "todo", // Backend doesn't return status directly yet (might depend on column_id)
        priority: data.priority,
        assignee: data.assignee_id ? placeholderUser : null,
        reporter: placeholderUser, // TODO: map correctly
        points: data.points || 0,
        projectId: data.project_id.toString(),
        project: {} as any, // Only needed if fully populated
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

    getById: async (taskId: string): Promise<ParentTask> => {
        const response = await apiClient.get<TaskResponseDTO>(`/tasks/${taskId}`);
        return mapTaskResponseToParentTask(response.data);
    },

    update: async (taskId: string, data: Partial<CreateTaskDTO>): Promise<ParentTask> => {
        const response = await apiClient.put<TaskResponseDTO>(`/tasks/${taskId}`, data);
        return mapTaskResponseToParentTask(response.data);
    },

    delete: async (taskId: string): Promise<void> => {
        await apiClient.delete(`/tasks/${taskId}`);
    }
};
