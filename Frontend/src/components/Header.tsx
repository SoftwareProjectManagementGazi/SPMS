import { Search, Bell, Plus, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* SOL TARAF: Menü + Arama */}
        <div className="flex items-center gap-3 flex-1">
          {/* Menü butonu */}
          <button
            onClick={onMenuClick}
            className="shrink-0 text-gray-600 hover:text-gray-900"
            aria-label="Menüyü aç/kapat"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* 🔍 ARAMA ALANI – FLEX, ÇAKIŞMA YOK */}
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Proje veya görev ara..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* SAĞ TARAF: Oluştur + Bildirim + Kullanıcı */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Oluştur</span>
          </button>

          <button className="relative rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 block w-2 h-2 rounded-full bg-red-500" />
          </button>

          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="text-right hidden lg:block">
              <p className="text-sm text-gray-900">Ayşe Öz</p>
              <p className="text-xs text-gray-500">Proje Yöneticisi</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              AÖ
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
