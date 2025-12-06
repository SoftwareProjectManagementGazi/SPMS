import { Project } from '../types';

const projects: Project[] = [
  {
    id: '1',
    title: 'SPMS Web Uygulaması',
    methodology: 'Scrum',
    progress: 65,
    teamSize: 8,
    dueDate: '15 Ara 2025',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: '2',
    title: 'Mobil Entegrasyon',
    methodology: 'Kanban',
    progress: 30,
    teamSize: 6,
    dueDate: '20 Oca 2026',
    color: 'from-blue-500 to-cyan-500'
  },
];

export const getProjects = (): Promise<Project[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(projects);
    }, 500); // Simulate network delay
  });
};
