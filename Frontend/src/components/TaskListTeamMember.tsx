import { AlertCircle, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, Fragment } from 'react';
import { Task } from '../types';

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
  'yuksek': <AlertCircle className="w-4 h-4 text-red-500 fill-red-100" />,
  'orta': <Circle className="w-4 h-4 text-orange-500 fill-orange-100" />,
  'dusuk': <Circle className="w-4 h-4 text-gray-400" />,
};

interface TaskListTeamMemberProps {
  tasks: Task[];
}

export function TaskListTeamMember({ tasks }: TaskListTeamMemberProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set(['1']));

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-gray-900">Görevlerim</h2>
        <p className="text-sm text-gray-500 mt-1">Atanan görevleri takip edin ve yönetin</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider w-10">
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Kod
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Görev Adı
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Proje
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Öncelik
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <Fragment key={task.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    {task.subtasks && task.subtasks.length > 0 && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <a href="#" className="text-xs text-purple-600 hover:text-purple-800 hover:underline">
                      {task.key}
                    </a>
                  </td>
                  <td className="px-3 lg:px-6 py-4">
                    <a href="#" className="text-sm text-purple-600 hover:text-purple-800 hover:underline">
                      {task.name}
                    </a>
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className="text-sm text-gray-600">{task.project}</span>
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs w-20 ${statusConfig[task.status].color}`}>
                      {statusConfig[task.status].label}
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      {priorityIcons[task.priority]}
                      <span className="text-sm text-gray-600">{priorityLabels[task.priority]}</span>
                    </div>
                  </td>
                </tr>
                
                {task.subtasks && expandedTasks.has(task.id) && (
                  <tr>
                    <td colSpan={6} className="bg-gray-50 px-3 lg:px-6 py-0">
                      <div className="overflow-hidden transition-all duration-300 ease-in-out">
                        <div className="py-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 pl-6 lg:pl-10">Alt Görevler</p>
                          <div className="space-y-1">
                            {task.subtasks.map((subtask) => (
                              <a
                                key={subtask.id}
                                href="#"
                                className="flex items-center gap-2 lg:gap-4 pl-8 lg:pl-16 pr-3 lg:pr-6 py-2 hover:bg-gray-100 transition-colors rounded"
                              >
                                <span className="text-xs text-purple-600 hover:text-purple-800 w-16 lg:w-20 flex-shrink-0">
                                  {subtask.key}
                                </span>
                                <span className="flex-1 text-sm text-gray-700 min-w-0 truncate">
                                  {subtask.text}
                                </span>
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs flex-shrink-0 ${statusConfig[subtask.status].color}`}>
                                  {statusConfig[subtask.status].label}
                                </span>
                                <div className="hidden md:flex items-center gap-1 w-24 flex-shrink-0">
                                  {priorityIcons[subtask.priority]}
                                  <span className="text-sm text-gray-600">{priorityLabels[subtask.priority]}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}