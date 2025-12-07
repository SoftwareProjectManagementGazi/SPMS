import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

const navigationItems = [
  { icon: LayoutDashboard, label: "Genel Bakış", active: true },
  { icon: Briefcase, label: "İşlerim", active: false },
  { icon: FolderKanban, label: "Projeler", active: false },
  { icon: BarChart3, label: "Raporlar", active: false },
  { icon: Users, label: "Ekip", active: false },
  { icon: Settings, label: "Ayarlar", active: false },
];

export function Sidebar() {
  return (
    <aside
      className="h-full w-72 text-white flex flex-col shadow-xl border-r border-white/10"
      // 🔥 Arka planı inline verdim, kesin lacivert olacak
      style={{ backgroundColor: "#1a1f37" }}
    >
      {/* LOGO ALANI */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
        <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          SPMS
        </span>
      </div>

      {/* MENÜ */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              item.active
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ÇIKIŞ */}
      <div className="px-4 py-4 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
