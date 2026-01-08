export type TaskStatus = string // Artık enum değil dinamik string (örn: "todo", "done")
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" // Backend Enum ile eşleşmeli
export type TaskType = "task" | "sub-task" | "bug"
export type Methodology = "scrum" | "kanban" | "waterfall"

export interface Role {
  name: string;
  description?: string
}

export interface User {
  id: string
  name: string
  email?: string
  avatar?: string
  role?: { name: string }
}

export interface Project {
  id: string
  name: string
  key: string
  description: string
  methodology: Methodology
  lead: User
  startDate: string
  endDate: string
  progress: number
}

export interface SubTask {
  id: string
  key: string
  title: string
  status: string 
  priority: TaskPriority
  // Subtask özetinde assignee detayı olmayabilir, opsiyonel bırakıyoruz
  assignee?: User | null 
}

export interface ParentTask {
  id: string
  parentTaskId?: string | null 
  
  key: string
  title: string
  description: string
  status: string
  priority: TaskPriority
  
  assignee: User | null
  reporter: User | null
  
  points: number
  projectId: string
  
  isGhost?: boolean; 
  parentSummary?: {
      id: string;
      title: string;
      key: string;
      status: string;
      projectId: string;
  } | null;

  // Backend'den gelen 'sub_tasks' buraya map edilecek
  subTasks: SubTask[]
  
  createdAt: string
  updatedAt: string
  dueDate: string | null
  isRecurring: boolean
  loggedTime: number
  estimatedTime: number
  labels: string[]
  project: {
      id: string;
      name: string;
      key: string;
  }
}

export interface Activity {
  id: string
  type: "comment" | "status_change" | "assignment" | "work_log"
  user: User
  content: string
  timestamp: string
  taskId: string
}
