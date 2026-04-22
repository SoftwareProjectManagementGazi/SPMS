export interface MockTask {
  id: number
  key: string
  title: string
  description: string
  status: string
  priority: "low" | "medium" | "high" | "critical"
  assignee_id: number | null
  reporter_id: number | null
  parent_task_id: number | null
  project_id: number
  cycle_id: number | null
  phase_id: string | null
  points: number | null
  start: string | null
  due: string | null
  labels: number[]
  watcher_count: number
  type: "task" | "subtask" | "bug"
}

export const mockTasks: MockTask[] = [
  {
    id: 101,
    key: "MOBIL-1",
    title: "Auth akışı",
    description: "",
    status: "todo",
    priority: "high",
    assignee_id: 1,
    reporter_id: 1,
    parent_task_id: null,
    project_id: 1,
    cycle_id: 1,
    phase_id: "n1",
    points: 5,
    start: "2026-04-10",
    due: "2026-04-30",
    labels: [],
    watcher_count: 1,
    type: "task",
  },
  {
    id: 102,
    key: "MOBIL-2",
    title: "Login UI",
    description: "",
    status: "progress",
    priority: "medium",
    assignee_id: 2,
    reporter_id: 1,
    parent_task_id: 101,
    project_id: 1,
    cycle_id: 1,
    phase_id: "n2",
    points: 3,
    start: "2026-04-12",
    due: "2026-04-25",
    labels: [],
    watcher_count: 0,
    type: "subtask",
  },
  {
    id: 103,
    key: "MOBIL-3",
    title: "Hata: token expires",
    description: "",
    status: "review",
    priority: "critical",
    assignee_id: 1,
    reporter_id: 2,
    parent_task_id: null,
    project_id: 1,
    cycle_id: 1,
    phase_id: null,
    points: null,
    start: null,
    due: "2026-04-20",
    labels: [],
    watcher_count: 3,
    type: "bug",
  },
  {
    id: 104,
    key: "MOBIL-4",
    title: "Backlog item A",
    description: "",
    status: "todo",
    priority: "low",
    assignee_id: null,
    reporter_id: 1,
    parent_task_id: null,
    project_id: 1,
    cycle_id: null,
    phase_id: null,
    points: null,
    start: null,
    due: null,
    labels: [],
    watcher_count: 0,
    type: "task",
  },
  {
    id: 105,
    key: "WEB-1",
    title: "Homepage",
    description: "",
    status: "todo",
    priority: "medium",
    assignee_id: 1,
    reporter_id: 1,
    parent_task_id: null,
    project_id: 2,
    cycle_id: null,
    phase_id: null,
    points: 2,
    start: null,
    due: "2026-05-01",
    labels: [],
    watcher_count: 0,
    type: "task",
  },
]
