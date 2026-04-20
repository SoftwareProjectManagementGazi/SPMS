// Realistic Turkish mock data for SPMS

const USERS = [
  { id: "u1", name: "Ayşe Demir", email: "ayse.demir@acme.co", role: "Admin", avColor: 1, initials: "AD" },
  { id: "u2", name: "Mert Yılmaz", email: "mert.yilmaz@acme.co", role: "Project Manager", avColor: 3, initials: "MY" },
  { id: "u3", name: "Zeynep Kaya", email: "zeynep.kaya@acme.co", role: "Project Manager", avColor: 5, initials: "ZK" },
  { id: "u4", name: "Can Aksoy", email: "can.aksoy@acme.co", role: "Member", avColor: 2, initials: "CA" },
  { id: "u5", name: "Elif Şahin", email: "elif.sahin@acme.co", role: "Member", avColor: 4, initials: "EŞ" },
  { id: "u6", name: "Burak Öztürk", email: "burak.ozturk@acme.co", role: "Member", avColor: 6, initials: "BÖ" },
  { id: "u7", name: "Selin Arslan", email: "selin.arslan@acme.co", role: "Member", avColor: 7, initials: "SA" },
  { id: "u8", name: "Emre Çelik", email: "emre.celik@acme.co", role: "Member", avColor: 8, initials: "EÇ" },
  { id: "u9", name: "Deniz Acar", email: "deniz.acar@acme.co", role: "Member", avColor: 2, initials: "DA" },
  { id: "u10", name: "Kaan Polat", email: "kaan.polat@acme.co", role: "Member", avColor: 3, initials: "KP" },
];

const CURRENT_USER = USERS[0]; // Ayşe (Admin) to show everything

const PROJECTS = [
  { id: "p1", key: "MOBIL", name: "Mobil Bankacılık 3.0", methodology: "scrum", leadId: "u2", description: "iOS ve Android için tam yeniden yazım, biometrik kimlik doğrulama.", start: "2026-01-15", end: "2026-09-30", progress: 0.64, memberIds: ["u2","u4","u5","u6","u7"], phase: "execution", status: "active" },
  { id: "p2", key: "KAYIT", name: "Müşteri Kayıt Sistemi", methodology: "kanban", leadId: "u3", description: "KYC süreci ve veri tabanı göçü.", start: "2026-02-01", end: "2026-07-30", progress: 0.42, memberIds: ["u3","u4","u8","u9"], phase: "execution", status: "active" },
  { id: "p3", key: "ERP", name: "Tedarik Zinciri ERP", methodology: "waterfall", leadId: "u2", description: "Dağıtık depo yönetimi, SAP entegrasyonu.", start: "2026-01-01", end: "2026-12-31", progress: 0.28, memberIds: ["u2","u5","u6","u8","u10"], phase: "design", status: "active" },
  { id: "p4", key: "ANALZ", name: "Veri Analitik Platformu", methodology: "scrum", leadId: "u3", description: "BI dashboard, Snowflake veri ambarı.", start: "2026-03-01", end: "2026-10-15", progress: 0.18, memberIds: ["u3","u7","u10"], phase: "planning", status: "active" },
  { id: "p5", key: "WEB", name: "Kurumsal Web Yenileme", methodology: "kanban", leadId: "u2", description: "Next.js tabanlı yeni site, CMS entegrasyonu.", start: "2026-02-15", end: "2026-06-30", progress: 0.81, memberIds: ["u2","u4","u7","u9"], phase: "execution", status: "active" },
  { id: "p6", key: "GUVEN", name: "Bilgi Güvenliği Denetimi", methodology: "waterfall", leadId: "u3", description: "ISO 27001 uyumluluk süreci.", start: "2026-01-01", end: "2026-05-30", progress: 0.72, memberIds: ["u3","u6","u8"], phase: "testing", status: "completed" },
];

const STATUSES = [
  { id: "todo", name: { tr: "Yapılacak", en: "To Do" }, color: "status-todo", wipLimit: null },
  { id: "progress", name: { tr: "Devam Ediyor", en: "In Progress" }, color: "status-progress", wipLimit: 5 },
  { id: "review", name: { tr: "İncelemede", en: "In Review" }, color: "status-review", wipLimit: 3 },
  { id: "done", name: { tr: "Tamamlandı", en: "Done" }, color: "status-done", wipLimit: null },
];

const TASK_TITLES = [
  "Kullanıcı onboarding akışı tasarımı",
  "JWT refresh token rotasyonu",
  "Push notification servisi entegrasyonu",
  "Kart ekleme formunda validation hatası",
  "Dashboard performans optimizasyonu",
  "3D Secure ödeme akışı",
  "KVKK aydınlatma metni revizyonu",
  "Rate limiting middleware yazımı",
  "Design system'e toast component eklenmesi",
  "Biometric login prototip denemesi",
  "Gece modu renk tokenları",
  "CI/CD pipeline migration'ı",
  "Redis cluster setup",
  "A/B test framework PoC",
  "Analytics event taxonomy dokümanı",
  "GraphQL şema validasyonu",
  "Figma dev mode handoff audit",
  "E2E test coverage artırılması",
  "Sentry alert yönlendirmeleri",
  "Accessibility WCAG AA düzeltmeleri",
  "Onaylayıcı workflow'u için state machine",
  "PDF rapor çıktısı şablonu",
  "Mikroservis SLO tanımları",
  "i18n altyapı entegrasyonu",
  "Dark mode için iconography audit",
];

function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i); return Math.abs(h); }

function generateTasks() {
  const tasks = [];
  const priorities = ["critical", "high", "medium", "low"];
  let n = 1;
  PROJECTS.forEach((proj) => {
    const count = 10 + (hashStr(proj.id) % 8);
    for (let i = 0; i < count; i++) {
      const statusIdx = (hashStr(proj.id + i) % 4);
      const status = STATUSES[statusIdx].id;
      const assigneeId = proj.memberIds[hashStr(proj.id + i + "a") % proj.memberIds.length];
      const priority = priorities[hashStr(proj.id + i + "p") % priorities.length];
      const title = TASK_TITLES[hashStr(proj.id + i + "t") % TASK_TITLES.length];
      const dueOffset = (hashStr(proj.id + i + "d") % 40) - 10; // -10..+29 days
      const due = new Date(Date.now() + dueOffset * 86400000).toISOString().slice(0, 10);
      const points = [1,2,3,5,8][hashStr(proj.id + i + "pt") % 5];
      tasks.push({
        id: `t${n}`,
        key: `${proj.key}-${i + 1}`,
        projectId: proj.id,
        title,
        status,
        assigneeId,
        priority,
        due,
        points,
        type: hashStr(proj.id + i + "ty") % 6 === 0 ? "bug" : "task",
      });
      n++;
    }
  });
  return tasks;
}

const TASKS = generateTasks();

// Workflow data per project (lifecycle + status graph)
const DEFAULT_LIFECYCLES = {
  scrum: {
    mode: "flexible",
    nodes: [
      { id: "n1", name: "Başlatma", description: "Vizyon ve hedefler", x: 60, y: 120, color: "status-todo" },
      { id: "n2", name: "Planlama", description: "Backlog ve sprint planning", x: 280, y: 120, color: "status-todo" },
      { id: "n3", name: "Yürütme", description: "Sprint'ler", x: 500, y: 120, color: "status-progress" },
      { id: "n4", name: "İzleme", description: "Metrikler ve retro", x: 720, y: 120, color: "status-review" },
      { id: "n5", name: "Kapanış", description: "Teslim ve ders", x: 940, y: 120, color: "status-done" },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
      { id: "e4", source: "n4", target: "n3", label: "Retro" },
      { id: "e5", source: "n4", target: "n5" },
    ],
  },
  waterfall: {
    mode: "sequential-locked", // bir faz bitmeden öbürüne geçilemez, geri dönülemez
    nodes: [
      { id: "n1", name: "Gereksinimler", description: "Kapsam ve dokümantasyon", x: 60, y: 120, color: "status-todo" },
      { id: "n2", name: "Tasarım", description: "Mimari ve UI", x: 280, y: 120, color: "status-progress" },
      { id: "n3", name: "Uygulama", description: "Geliştirme", x: 500, y: 120, color: "status-progress" },
      { id: "n4", name: "Test", description: "QA ve UAT", x: 720, y: 120, color: "status-review" },
      { id: "n5", name: "Yayın", description: "Dağıtım", x: 940, y: 120, color: "status-done" },
      { id: "n6", name: "Bakım", description: "Destek", x: 1160, y: 120, color: "status-done" },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
      { id: "e4", source: "n4", target: "n5" },
      { id: "e5", source: "n5", target: "n6" },
    ],
  },
  kanban: {
    mode: "continuous",
    nodes: [
      { id: "n1", name: "Sürekli Akış", description: "Tek aktif faz", x: 400, y: 120, color: "status-progress" },
    ],
    edges: [],
  },
};

const DEFAULT_STATUS_FLOWS = {
  scrum: {
    mode: "flexible",
    nodes: [
      { id: "s1", name: "Backlog", x: 60, y: 140, isInitial: true, color: "status-todo" },
      { id: "s2", name: "Seçildi", x: 240, y: 140, color: "status-todo" },
      { id: "s3", name: "Devam Ediyor", x: 420, y: 140, color: "status-progress", wipLimit: 5 },
      { id: "s4", name: "İncelemede", x: 600, y: 140, color: "status-review", wipLimit: 3 },
      { id: "s5", name: "Tamamlandı", x: 780, y: 140, isFinal: true, color: "status-done" },
    ],
    edges: [
      { id: "e1", source: "s1", target: "s2" },
      { id: "e2", source: "s2", target: "s3" },
      { id: "e3", source: "s3", target: "s4" },
      { id: "e4", source: "s4", target: "s3", label: "Geri gönder" },
      { id: "e5", source: "s4", target: "s5" },
    ],
  },
  waterfall: {
    mode: "sequential-locked",
    nodes: [
      { id: "s1", name: "Yapılacak", x: 60, y: 140, isInitial: true, color: "status-todo" },
      { id: "s2", name: "Aktif", x: 260, y: 140, color: "status-progress" },
      { id: "s3", name: "QA", x: 460, y: 140, color: "status-review" },
      { id: "s4", name: "Yayınlandı", x: 660, y: 140, isFinal: true, color: "status-done" },
    ],
    edges: [
      { id: "e1", source: "s1", target: "s2" },
      { id: "e2", source: "s2", target: "s3" },
      { id: "e3", source: "s3", target: "s4" },
    ],
  },
  kanban: {
    mode: "flexible",
    nodes: [
      { id: "s1", name: "Yapılacak", x: 60, y: 140, isInitial: true, color: "status-todo" },
      { id: "s2", name: "Devam Ediyor", x: 260, y: 140, color: "status-progress", wipLimit: 3 },
      { id: "s3", name: "Bloklu", x: 260, y: 280, color: "status-blocked" },
      { id: "s4", name: "Tamamlandı", x: 460, y: 140, isFinal: true, color: "status-done" },
    ],
    edges: [
      { id: "e1", source: "s1", target: "s2" },
      { id: "e2", source: "s2", target: "s3", label: "Bloke" },
      { id: "e3", source: "s3", target: "s2", label: "Çöz" },
      { id: "e4", source: "s2", target: "s4" },
    ],
  },
};

const NOTIFICATIONS = [
  { id: "nt1", type: "assigned", title: "Size yeni bir görev atandı", body: "MOBIL-12: JWT refresh token rotasyonu", actor: "u2", time: "2 dakika önce", unread: true },
  { id: "nt2", type: "mention", title: "Can Aksoy sizden bahsetti", body: "@Ayşe bu endpoint'i incelemen gerekiyor…", actor: "u4", time: "18 dakika önce", unread: true },
  { id: "nt3", type: "status", title: "Görev tamamlandı", body: "WEB-4: Hero section yeniden tasarımı — Tamamlandı", actor: "u7", time: "1 saat önce", unread: true },
  { id: "nt4", type: "comment", title: "Yeni yorum", body: "ERP-7 üzerinde Emre Çelik yorum yaptı", actor: "u8", time: "3 saat önce", unread: false },
  { id: "nt5", type: "deadline", title: "Yaklaşan teslim", body: "KAYIT-2 yarın bitiyor", actor: null, time: "Bugün", unread: false },
];

const PENDING_REQUESTS = [
  { id: "r1", pm: "u2", user: "u9", project: "p5", note: "Frontend işlerinde yardıma ihtiyacımız var.", time: "1 saat önce" },
  { id: "r2", pm: "u3", user: "u10", project: "p4", note: null, time: "Dün" },
];

function getUser(id) { return USERS.find((u) => u.id === id); }
function getProject(id) { return PROJECTS.find((p) => p.id === id); }

// Methodology cycle labels (§15)
const CYCLE_LABELS = {
  scrum: { tr: "Sprint", en: "Sprint" },
  waterfall: { tr: "Faz Dönemi", en: "Phase Period" },
  kanban: { tr: "Dönem", en: "Period" },
  iterative: { tr: "İterasyon", en: "Iteration" },
  "v-model": { tr: "Faz Dönemi", en: "Phase Period" },
  spiral: { tr: "Döngü", en: "Cycle" },
  incremental: { tr: "Artım", en: "Increment" },
  evolutionary: { tr: "Prototip", en: "Prototype" },
  rad: { tr: "Döngü", en: "Cycle" },
};

// Activity events (§7)
const ACTIVITY_EVENTS = [
  { id: "ae1", projectId: "p1", type: "status", actor: "u4", taskKey: "MOBIL-3", taskTitle: "Push notification servisi entegrasyonu", from: "todo", to: "progress", time: Date.now() - 300000 },
  { id: "ae2", projectId: "p1", type: "comment", actor: "u5", taskKey: "MOBIL-7", taskTitle: "Rate limiting middleware yazımı", text: "Endpoint'lerin hepsini kontrol ettim, sorun yok.", time: Date.now() - 1080000 },
  { id: "ae3", projectId: "p1", type: "assign", actor: "u2", taskKey: "MOBIL-12", taskTitle: "JWT refresh token rotasyonu", to: "u4", time: Date.now() - 3600000 },
  { id: "ae4", projectId: "p1", type: "create", actor: "u2", taskKey: "MOBIL-15", taskTitle: "Biometric login prototip denemesi", time: Date.now() - 7200000 },
  { id: "ae5", projectId: "p1", type: "status", actor: "u7", taskKey: "MOBIL-5", taskTitle: "Dashboard performans optimizasyonu", from: "progress", to: "review", time: Date.now() - 14400000 },
  { id: "ae6", projectId: "p1", type: "status", actor: "u6", taskKey: "MOBIL-8", taskTitle: "Design system'e toast component eklenmesi", from: "review", to: "done", time: Date.now() - 28800000 },
  { id: "ae7", projectId: "p1", type: "phase", actor: "u2", phaseName: "Planlama → Yürütme", time: Date.now() - 86400000 },
  { id: "ae8", projectId: "p1", type: "comment", actor: "u4", taskKey: "MOBIL-3", taskTitle: "Push notification servisi entegrasyonu", text: "Firebase token'ları refresh ediliyor mu kontrol edelim.", time: Date.now() - 90000000 },
  { id: "ae9", projectId: "p1", type: "create", actor: "u5", taskKey: "MOBIL-16", taskTitle: "Accessibility WCAG AA düzeltmeleri", time: Date.now() - 120000000 },
  { id: "ae10", projectId: "p1", type: "delete", actor: "u2", taskKey: "MOBIL-99", taskTitle: "Duplicate test görevi", time: Date.now() - 172800000 },
  { id: "ae11", projectId: "p2", type: "create", actor: "u3", taskKey: "KAYIT-1", taskTitle: "KYC form tasarımı", time: Date.now() - 200000000 },
  { id: "ae12", projectId: "p2", type: "status", actor: "u8", taskKey: "KAYIT-5", taskTitle: "Veri tabanı göçü", from: "progress", to: "done", time: Date.now() - 250000000 },
  { id: "ae13", projectId: "p3", type: "assign", actor: "u2", taskKey: "ERP-4", taskTitle: "SAP API entegrasyonu", to: "u8", time: Date.now() - 300000000 },
  { id: "ae14", projectId: "p5", type: "status", actor: "u7", taskKey: "WEB-4", taskTitle: "Hero section yeniden tasarımı", from: "review", to: "done", time: Date.now() - 3600000 },
  { id: "ae15", projectId: "p5", type: "comment", actor: "u9", taskKey: "WEB-7", taskTitle: "CMS entegrasyonu", text: "Strapi mı Sanity mi karar verelim.", time: Date.now() - 86400000 },
];

// Milestones (§3 milestones sub-tab)
const MILESTONES = [
  { id: "ms1", projectId: "p1", name: "Alpha Sürümü", dueDate: "2026-05-15", status: "completed", phases: ["n3"], progress: 100 },
  { id: "ms2", projectId: "p1", name: "Beta Sürümü", dueDate: "2026-07-01", status: "in-progress", phases: ["n3","n4"], progress: 45 },
  { id: "ms3", projectId: "p1", name: "Production Deploy", dueDate: "2026-09-15", status: "pending", phases: ["n5"], progress: 0 },
  { id: "ms4", projectId: "p3", name: "SRS Onayı", dueDate: "2026-03-01", status: "completed", phases: ["n1"], progress: 100 },
  { id: "ms5", projectId: "p3", name: "UAT Başlangıcı", dueDate: "2026-08-01", status: "pending", phases: ["n4"], progress: 0 },
];

// Artifacts (§3 artifacts sub-tab)
const ARTIFACTS = {
  waterfall: [
    { id: "art1", name: "SRS — Yazılım Gereksinim Spesifikasyonu", status: "completed", updatedBy: "u2", updatedAt: "2026-03-10", phase: "n1" },
    { id: "art2", name: "SDD — Yazılım Tasarım Dokümanı", status: "draft", updatedBy: "u5", updatedAt: "2026-04-02", phase: "n2" },
    { id: "art3", name: "STD — Test Dokümanı", status: "not-created", updatedBy: null, updatedAt: null, phase: "n4" },
    { id: "art4", name: "Release Notes", status: "not-created", updatedBy: null, updatedAt: null, phase: "n5" },
    { id: "art5", name: "Deployment Planı", status: "not-created", updatedBy: null, updatedAt: null, phase: "n5" },
  ],
  scrum: [
    { id: "art1", name: "Product Backlog", status: "completed", updatedBy: "u2", updatedAt: "2026-02-20", phase: "n2" },
    { id: "art2", name: "Sprint Backlog", status: "draft", updatedBy: "u4", updatedAt: "2026-04-15", phase: "n3" },
    { id: "art3", name: "Increment", status: "draft", updatedBy: "u7", updatedAt: "2026-04-18", phase: "n3" },
  ],
  kanban: [],
};

// Phase history (§3 history sub-tab)
const PHASE_HISTORY = [
  { id: "ph1", projectId: "p1", phaseName: "Başlatma", closedAt: "2026-02-01", duration: 17, total: 8, completed: 7, carried: 1, successRate: 88, note: "Vizyon dokümanı onaylandı. 1 görev planlama fazına taşındı." },
  { id: "ph2", projectId: "p1", phaseName: "Planlama", closedAt: "2026-03-15", duration: 42, total: 15, completed: 14, carried: 1, successRate: 93, note: "Backlog grooming tamamlandı. Sprint 0 başarılı." },
  { id: "ph3", projectId: "p3", phaseName: "Gereksinimler", closedAt: "2026-03-10", duration: 68, total: 12, completed: 12, carried: 0, successRate: 100, note: "SRS onaylandı. Tüm paydaş imzaları alındı." },
];

// New workflow templates (§13)
const EXTRA_LIFECYCLES = {
  "v-model": {
    mode: "sequential-flexible",
    nodes: [
      { id: "n1", name: "Gereksinimler", x: 60, y: 60, color: "status-todo", description: "Sistem gereksinimleri" },
      { id: "n2", name: "Sistem Tasarımı", x: 260, y: 60, color: "status-todo", description: "Yüksek seviye tasarım" },
      { id: "n3", name: "Modül Tasarımı", x: 460, y: 60, color: "status-progress", description: "Detaylı tasarım" },
      { id: "n4", name: "Kodlama", x: 460, y: 220, color: "status-progress", description: "Geliştirme" },
      { id: "n5", name: "Birim Testi", x: 460, y: 380, color: "status-review", description: "Unit test" },
      { id: "n6", name: "Entegrasyon Testi", x: 260, y: 380, color: "status-review", description: "Integration test" },
      { id: "n7", name: "Sistem Testi", x: 60, y: 380, color: "status-done", description: "System test" },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
      { id: "e4", source: "n4", target: "n5" },
      { id: "e5", source: "n5", target: "n6" },
      { id: "e6", source: "n6", target: "n7" },
      { id: "ev1", source: "n3", target: "n5", label: "Doğrula", type: "verification" },
      { id: "ev2", source: "n2", target: "n6", label: "Doğrula", type: "verification" },
      { id: "ev3", source: "n1", target: "n7", label: "Doğrula", type: "verification" },
    ],
    groups: [{ id: "g1", name: "Tasarım", x: 40, y: 30, width: 500, height: 200, color: "status-progress" },
             { id: "g2", name: "Test", x: 40, y: 350, width: 500, height: 100, color: "status-review" }],
  },
  spiral: {
    mode: "flexible",
    nodes: [
      { id: "n1", name: "Planlama", x: 60, y: 120, color: "status-todo" },
      { id: "n2", name: "Risk Analizi", x: 260, y: 120, color: "status-review" },
      { id: "n3", name: "Geliştirme", x: 460, y: 120, color: "status-progress" },
      { id: "n4", name: "Değerlendirme", x: 660, y: 120, color: "status-done" },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
      { id: "e4", source: "n4", target: "n1", label: "Yeni döngü", type: "feedback" },
    ],
  },
};

window.SPMSData = { USERS, CURRENT_USER, PROJECTS, STATUSES, TASKS, DEFAULT_LIFECYCLES, DEFAULT_STATUS_FLOWS, NOTIFICATIONS, PENDING_REQUESTS, CYCLE_LABELS, ACTIVITY_EVENTS, MILESTONES, ARTIFACTS, PHASE_HISTORY, EXTRA_LIFECYCLES, getUser, getProject };
