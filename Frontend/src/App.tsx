import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TaskListTeamMember } from './components/TaskListTeamMember';
import { ProjectCards } from './components/ProjectCards';
import { SprintProgress } from './components/SprintProgress';
import { useTasks } from './hooks/useTasks';
import { useProjects } from './hooks/useProjects';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-gray-900 mb-1">Genel Bakış</h1>
              <p className="text-gray-500">Hoş geldiniz! Projelerinizde neler olduğunu görün.</p>
            </div>
            
            {tasksLoading || projectsLoading ? (
              <div className="text-center p-8">Yükleniyor...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <TaskListTeamMember tasks={tasks} />
                  </div>
                  
                  <div className="space-y-6">
                    <SprintProgress />
                  </div>
                </div>
                
                <div>
                  <ProjectCards projects={projects} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}