// Bilingual strings: TR (default) / EN
// Ported from New_Frontend/src/i18n.jsx -- all keys preserved verbatim.

export type LangCode = "tr" | "en"

export interface StringEntry {
  tr: string
  en?: string
}

export type StringTree = {
  [key: string]: StringEntry | StringTree
}

export const STRINGS = {
  nav: {
    dashboard: { tr: "Panel", en: "Dashboard" },
    projects: { tr: "Projeler", en: "Projects" },
    myTasks: { tr: "Görevlerim", en: "My Tasks" },
    teams: { tr: "Takımlar", en: "Teams" },
    reports: { tr: "Raporlar", en: "Reports" },
    settings: { tr: "Ayarlar", en: "Settings" },
    admin: { tr: "Yönetim", en: "Admin" },
    notifications: { tr: "Bildirimler", en: "Notifications" },
  },
  common: {
    create: { tr: "Oluştur", en: "Create" },
    createTask: { tr: "Görev oluştur", en: "Create task" },
    createProject: { tr: "Yeni proje", en: "New project" },
    save: { tr: "Kaydet", en: "Save" },
    cancel: { tr: "Vazgeç", en: "Cancel" },
    edit: { tr: "Düzenle", en: "Edit" },
    delete: { tr: "Sil", en: "Delete" },
    back: { tr: "Geri", en: "Back" },
    search: { tr: "Ara…", en: "Search…" },
    filter: { tr: "Filtrele", en: "Filter" },
    all: { tr: "Tümü", en: "All" },
    today: { tr: "Bugün", en: "Today" },
    overdue: { tr: "Gecikmiş", en: "Overdue" },
    dueDate: { tr: "Bitiş", en: "Due" },
    assignee: { tr: "Atanan", en: "Assignee" },
    priority: { tr: "Öncelik", en: "Priority" },
    status: { tr: "Durum", en: "Status" },
    description: { tr: "Açıklama", en: "Description" },
    addComment: { tr: "Yorum ekle…", en: "Add a comment…" },
    viewAll: { tr: "Tümünü gör", en: "View all" },
    openProject: { tr: "Projeyi aç", en: "Open project" },
    loading: { tr: "Yükleniyor…", en: "Loading…" },
    empty: { tr: "Henüz bir şey yok.", en: "Nothing here yet." },
    draft: { tr: "Taslak", en: "Draft" },
    saved: { tr: "Kaydedildi", en: "Saved" },
    unsaved: { tr: "Kaydedilmemiş değişiklikler", en: "Unsaved changes" },
  },
  priority: {
    critical: { tr: "Kritik", en: "Critical" },
    high: { tr: "Yüksek", en: "High" },
    medium: { tr: "Orta", en: "Medium" },
    low: { tr: "Düşük", en: "Low" },
  },
  dashboard: {
    welcome: { tr: "Merhaba", en: "Welcome back" },
    management: { tr: "Yönetim", en: "Management" },
    myWork: { tr: "Benim İşim", en: "My Work" },
    totalProjects: { tr: "Toplam Proje", en: "Total Projects" },
    activeTasks: { tr: "Aktif Görev", en: "Active Tasks" },
    completedTasks: { tr: "Tamamlanan", en: "Completed" },
    overdue: { tr: "Gecikmiş", en: "Overdue" },
    portfolio: { tr: "Proje Portföyü", en: "Project Portfolio" },
    currentActivity: { tr: "Şu anki aktivite", en: "Current activity" },
    upcoming: { tr: "Yaklaşan Teslimler", en: "Upcoming" },
    groupedTasks: { tr: "Projeye göre görevlerim", en: "My tasks by project" },
  },
  project: {
    board: { tr: "Pano", en: "Board" },
    list: { tr: "Liste", en: "List" },
    timeline: { tr: "Zaman Çizelgesi", en: "Timeline" },
    calendar: { tr: "Takvim", en: "Calendar" },
    lifecycle: { tr: "Yaşam Döngüsü", en: "Lifecycle" },
    members: { tr: "Üyeler", en: "Members" },
    projectSettings: { tr: "Ayarlar", en: "Settings" },
    methodology: { tr: "Metodoloji", en: "Methodology" },
    lead: { tr: "Yönetici", en: "Lead" },
  },
  workflow: {
    title: { tr: "İş Akışı Tasarımcısı", en: "Workflow Designer" },
    lifecycle: { tr: "Yaşam Döngüsü", en: "Lifecycle" },
    status: { tr: "Görev Durumları", en: "Task Statuses" },
    addNode: { tr: "Düğüm ekle", en: "Add node" },
    template: { tr: "Şablon", en: "Template" },
    sequential: { tr: "Sıralı (waterfall)", en: "Sequential (waterfall)" },
    noBackward: { tr: "Geri dönüş yasak", en: "No backward transitions" },
    bidirectional: { tr: "Çift yönlü", en: "Bidirectional" },
    initial: { tr: "Başlangıç", en: "Initial" },
    final: { tr: "Bitiş", en: "Final" },
    rules: { tr: "Akış Kuralları", en: "Flow Rules" },
    locked: { tr: "Kilitli", en: "Locked" },
  },
} as const

// Resolve a dot-notation path to the translated string.
// Default language is Turkish per D-06; falls back to Turkish if English missing;
// returns the path itself if the key is not found.
export function t(path: string, lang: LangCode = "tr"): string {
  const parts = path.split(".")
  let cur: unknown = STRINGS
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return path
    }
  }
  if (!cur || typeof cur !== "object") return path
  const entry = cur as Partial<StringEntry>
  return entry[lang] || entry.tr || path
}
