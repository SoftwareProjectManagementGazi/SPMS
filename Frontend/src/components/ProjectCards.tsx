import { Calendar, Users } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardsProps {
  projects: Project[];
}

export function ProjectCards({ projects }: ProjectCardsProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-gray-900">Aktif Projeler</h2>
        <p className="text-sm text-gray-500 mt-1">Devam eden projeler ve ilerleme durumları</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className={`h-2 bg-gradient-to-r ${project.color}`}></div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-gray-900 mb-2">{project.title}</h3>
                  <span className="inline-flex px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                    {project.methodology}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">İlerleme</span>
                    <span className="text-sm text-gray-900">%{project.progress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${project.color}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{project.teamSize} üye</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{project.dueDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}