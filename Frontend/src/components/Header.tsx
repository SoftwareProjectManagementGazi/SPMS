import { Search, Bell, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={onMenuClick}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Proje veya görev ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4 ml-2 lg:ml-6">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 lg:px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Oluştur</span>
          </button>
          
          <button className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden lg:block">
              <p className="text-sm text-gray-900">Ayşe Öz</p>
              <p className="text-xs text-gray-500">Proje Yöneticisi</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
              AÖ
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}