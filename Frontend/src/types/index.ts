export interface Subtask {
  id: string;
  key: string;
  text: string;
  status: 'bekliyor' | 'suruyor' | 'bitti';
  priority: 'yuksek' | 'orta' | 'dusuk';
}

export interface Task {
  id: string;
  key: string;
  name: string;
  project: string;
  status: 'bekliyor' | 'suruyor' | 'bitti';
  priority: 'yuksek' | 'orta' | 'dusuk';
  subtasks?: Subtask[];
}

export interface Project {
  id: string;
  title: string;
  methodology: 'Scrum' | 'Kanban';
  progress: number;
  teamSize: number;
  dueDate: string;
  color: string;
}
