import { LayoutDashboard, Briefcase, FolderKanban, BarChart3, Users, Settings, LogOut, X } from 'lucide-react';

const navigationItems = [
  { icon: LayoutDashboard, label: 'Genel Bakış', active: true },
  { icon: Briefcase, label: 'İşlerim', active: false },
  { icon: FolderKanban, label: 'Projeler', active: false },
  { icon: BarChart3, label: 'Raporlar', active: false },
  { icon: Users, label: 'Ekip', active: false },
  { icon: Settings, label: 'Ayarlar', active: false },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[#1a1f37] text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <span className="text-lg">SPMS</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.label}>
                <a
                  href="#"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-[#252b45] hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:bg-[#252b45] hover:text-white rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>
    </>
  );
}