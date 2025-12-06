import { ArrowUp, ArrowRight, Minus } from 'lucide-react';

interface Task {
  id: string;
  key: string;
  name: string;
  status: 'bekliyor' | 'suruyor' | 'bitti';
  priority: 'yuksek' | 'orta' | 'dusuk';
  assignee: {
    name: string;
    avatar: string;
    initials: string;
  };
}

const tasks: Task[] = [
  {
    id: '1',
    key: 'SPMS-101',
    name: 'Veritabanı ER Diyagramı',
    status: 'bitti',
    priority: 'yuksek',
    assignee: { name: 'Ayşe Öz', avatar: '', initials: 'AÖ' }
  },
  {
    id: '2',
    key: 'SPMS-102',
    name: 'Kullanıcı Yetkilendirme Modülü',
    status: 'suruyor',
    priority: 'yuksek',
    assignee: { name: 'Yusuf Bal', avatar: '', initials: 'YB' }
  },
  {
    id: '3',
    key: 'SPMS-103',
    name: 'API Entegrasyonu',
    status: 'bekliyor',
    priority: 'orta',
    assignee: { name: 'Ayşe Öz', avatar: '', initials: 'AÖ' }
  },
  {
    id: '4',
    key: 'SPMS-104',
    name: 'Arayüz Tasarımı (UI)',
    status: 'suruyor',
    priority: 'orta',
    assignee: { name: 'Yusuf Bal', avatar: '', initials: 'YB' }
  },
];

const statusConfig = {
  'bekliyor': { label: 'Bekliyor', color: 'bg-gray-100 text-gray-700' },
  'suruyor': { label: 'Sürüyor', color: 'bg-blue-100 text-blue-700' },
  'bitti': { label: 'Bitti', color: 'bg-green-100 text-green-700' },
};

const priorityLabels = {
  'yuksek': 'Yüksek',
  'orta': 'Orta',
  'dusuk': 'Düşük',
};

const priorityIcons = {
  'yuksek': <ArrowUp className="w-4 h-4 text-red-500" />,
  'orta': <ArrowRight className="w-4 h-4 text-orange-500" />,
  'dusuk': <Minus className="w-4 h-4 text-gray-400" />,
};

const avatarColors = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-blue-500',
];

export function TaskList() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-gray-900">Görevlerim</h2>
        <p className="text-sm text-gray-500 mt-1">Atanan görevleri takip edin ve yönetin</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Kod
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Görev Adı
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Öncelik
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Atanan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task, index) => (
              <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs text-gray-500">{task.key}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{task.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs ${statusConfig[task.status].color}`}>
                    {statusConfig[task.status].label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {priorityIcons[task.priority]}
                    <span className="text-sm text-gray-600">{priorityLabels[task.priority]}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center text-white text-xs`}>
                      {task.assignee.initials}
                    </div>
                    <span className="text-sm text-gray-700">{task.assignee.name}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}