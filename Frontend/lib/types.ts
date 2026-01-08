export type TaskStatus = "todo" | "in-progress" | "done"
export type TaskPriority = "critical" | "high" | "medium" | "low"
export type TaskType = "task" | "sub-task" | "bug"
export type Methodology = "scrum" | "kanban" | "waterfall"

export interface Role {
  name: string;
  description?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: Role
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
  description: string
  status: string 
  priority: string
  assignee: User | null
  points: number
  parentTaskId: string
  createdAt: string
  updatedAt: string
  dueDate: string | null
}

export interface ParentTask {
  id: string
  // Subtask ise parent ID'si olur
  parentTaskId?: string | null 
  
  key: string
  title: string
  description: string
  status: string
  priority: string
  assignee: User | null
  reporter: User
  points: number
  projectId: string
  
  // YENİ ALANLAR (Ghost Mantığı İçin)
  isGhost?: boolean; 
  parentSummary?: {
      id: string;
      title: string;
      key: string;
      status: string;
      projectId: string;
  } | null;

  subTasks: SubTask[]
  
  createdAt: string
  updatedAt: string
  dueDate: string | null
  isRecurring: boolean
  loggedTime: number
  estimatedTime: number
  labels: string[]
  project: any // Tam proje objesi yerine any veya Project type
}

export interface Activity {
  id: string
  type: "comment" | "status_change" | "assignment" | "work_log"
  user: User
  content: string
  timestamp: string
  taskId: string
}
