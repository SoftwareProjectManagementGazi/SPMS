export type TaskStatus = "todo" | "in-progress" | "done"
export type TaskPriority = "critical" | "high" | "medium" | "low"
export type TaskType = "task" | "sub-task" | "bug"
export type Methodology = "scrum" | "kanban" | "waterfall"

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: "manager" | "member"
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
  status: TaskStatus
  priority: TaskPriority
  assignee: User | null
  points: number
  parentTaskId: string
  createdAt: string
  updatedAt: string
  dueDate: string | null
}

export interface ParentTask {
  id: string
  key: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee: User | null
  reporter: User
  points: number
  projectId: string
  project: Project
  subTasks: SubTask[]
  createdAt: string
  updatedAt: string
  dueDate: string | null
  isRecurring: boolean
  recurringFrequency?: "daily" | "weekly" | "monthly"
  loggedTime: number
  estimatedTime: number
  labels: string[]
}

export interface Activity {
  id: string
  type: "comment" | "status_change" | "assignment" | "work_log"
  user: User
  content: string
  timestamp: string
  taskId: string
}
