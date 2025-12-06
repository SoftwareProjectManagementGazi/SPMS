import { Task } from '../types';

const tasks: Task[] = [
  {
    id: '1',
    key: 'SPMS-101',
    name: 'Veritabanı ER Diyagramı',
    project: 'SPMS Web',
    status: 'bitti',
    priority: 'yuksek',
    subtasks: [
      { id: 's1', key: 'SPMS-101-A', text: 'Tablo yapılarını belirle', status: 'bitti', priority: 'yuksek' },
      { id: 's2', key: 'SPMS-101-B', text: 'İlişkileri (FK/PK) tanımla', status: 'bitti', priority: 'yuksek' },
      { id: 's3', key: 'SPMS-101-C', text: 'Normalizasyon kontrolü yap', status: 'suruyor', priority: 'orta' },
    ]
  },
  {
    id: '2',
    key: 'SPMS-104',
    name: 'Arayüz Tasarımı (UI)',
    project: 'SPMS Web',
    status: 'suruyor',
    priority: 'orta',
  },
  {
    id: '3',
    key: 'MOB-12',
    name: 'API Endpoint Testleri',
    project: 'Mobil App',
    status: 'bekliyor',
    priority: 'dusuk',
  },
];

export const getTasks = (): Promise<Task[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(tasks);
    }, 500); // Simulate network delay
  });
};
