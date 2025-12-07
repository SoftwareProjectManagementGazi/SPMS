import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TaskListTeamMember } from './components/TaskListTeamMember';
import { ProjectCards } from './components/ProjectCards';
import { SprintProgress } from './components/SprintProgress';
import { useTasks } from './hooks/useTasks';
import { useProjects } from './hooks/useProjects';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();

  const isLoading = tasksLoading || projectsLoading;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* SOLDAN SİDEBAR – sadece açıkken DOM’da */}
      {sidebarOpen && <Sidebar />}

      {/* HEADER + İÇERİK */}
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Genel Bakış
              </h1>
              <p className="text-gray-500">
                Hoş geldiniz! Projelerinizde neler olduğunu görün.
              </p>
            </div>

            {isLoading ? (
              <div className="text-sm text-gray-500">Yükleniyor...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
                  <div>
                    <TaskListTeamMember tasks={tasks} />
                  </div>
                  <div>
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
