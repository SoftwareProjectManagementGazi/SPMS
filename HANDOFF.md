# SPMS Frontend — Claude Design Handoff

**Proje:** Software Project Management System (SPMS)
**Framework:** Next.js 16 (App Router) + React 19 + TypeScript
**UI Stack:** Tailwind CSS v4, shadcn/ui (Radix primitives), Lucide icons
**State/Data:** TanStack React Query v5, Axios, React Hook Form + Zod
**Özel Kütüphaneler:** @dnd-kit (Kanban), FullCalendar (Calendar), frappe-gantt (Timeline), **React Flow / xyflow** (Workflow editors — v2)
**UI Dili:** Türkçe (ana kullanıcı metinleri) / İngilizce (teknik etiketler karışık)

**v2 Eklentileri (bu dokümanda dahil):**
- Node-based **Project Lifecycle** editor + **Task Status Workflow** editor (Jira-style)
- Separate **Admin Panel** (user/role/workflow template yönetimi)
- **Theme Customization System** — 6 preset palette + custom brand color picker, localStorage
- **Default brand rebrand:** indigo → Claude-inspired warm terracotta

---

## 1. Route Ağacı (Sayfa Haritası)

```
/ (layout.tsx — RootLayout: fonts, QueryProvider, AuthProvider, Analytics)
│
├── /                         → Dashboard (manager/member view tab seçimli)
│
├── /login                    → Giriş sayfası (2-kolon split)
├── /forgot-password          → Şifre sıfırlama talebi
├── /reset-password?token=... → Yeni şifre belirleme
├── /session-expired          → Oturum süresi dolmuş ekranı (auto-redirect 3s)
│
├── /projects                 → Proje listesi (card grid)
├── /projects/new             → Yeni proje oluşturma wizard (template edit OR blank canvas seçimi)
├── /projects/[id]            → Proje detayı
│   └── tabs: Board | List | Timeline | Calendar | Lifecycle (NEW v2) | Members | Settings
│       └── Settings sub-tabs (NEW v2): Columns (Simple) | Workflow (Node) | Lifecycle Editor
├── /projects/[id]/sprints    → Sprint (Phase) yönetimi
│
├── /tasks/[id]               → Görev detayı (header + content + sidebar)
├── /my-tasks                 → Atanmış görevlerim (MemberView reuse)
│
├── /teams                    → Takım listesi + create form
├── /teams/[id]               → Takım detay + üye yönetimi
│
├── /notifications            → Tüm bildirimler sayfası (infinite-scroll)
├── /settings                 → Profil + Bildirim tercihleri + **Görünüm (theme) — NEW v2**
├── /reports                  → Analytics placeholder (4 grafik slot)
│
└── /admin  (NEW v2 — role === "Admin" gereklidir)
    ├── /admin                       → Admin overview dashboard
    ├── /admin/users                 → User CRUD + invite + disable
    ├── /admin/roles                 → Role definitions + permissions matrix
    ├── /admin/permissions           → PM-level permission toggles (per-role)
    ├── /admin/projects              → Cross-project view + ownership transfer
    ├── /admin/workflow-templates    → Org-level preset library (lifecycle + status)
    ├── /admin/notifications         → Notification template editor
    ├── /admin/audit                 → System-wide audit log viewer
    └── /admin/stats                 → System health + usage metrics
```

**Kimlik Doğrulama:** `AuthGuard` component `/login`, `/forgot-password`, `/reset-password`, `/session-expired` hariç tüm rotaları sarmalar.

**Admin Guard (NEW v2):** `/admin/*` rotaları için ek guard — `user.role.name === "Admin"` kontrolü, değilse `/` dashboard'a yönlendirme.

Backend doğrulandı: [`Backend/app/infrastructure/database/seeder.py:25-27`](../Backend/app/infrastructure/database/seeder.py) rolleri seed ediyor ("Admin", "Project Manager"), [`Backend/app/api/dependencies.py:133-176`](../Backend/app/api/dependencies.py) admin-bypass logic'i membership check'lerinde zaten çalışıyor. **Rol yapısı kümülatif** — admin aynı anda bir projede member olabilir.

---

## 2. Shell Bileşenleri (Her Korumalı Sayfada Görünür)

### 2.1. Main Sidebar ([components/sidebar.tsx](components/sidebar.tsx))
- **Genişlik:** Collapsed `w-16` / Expanded `w-64`, toggle butonu ile
- **Logo:** Terracotta rounded kare (primary) + "SP" monogram + "SPMS" wordmark (NEW — önceki indigo logo rebrand edildi)
- **Nav items (icon + label):**
  1. Dashboard (`LayoutDashboard`)
  2. Projeler (`FolderKanban`)
  3. Görevlerim (`CheckSquare`)
  4. Teams (`Users`)
  5. Reports (`BarChart3`)
  6. Settings (`Settings`)
  7. **Admin Paneli** (`Shield` — **sadece admin rolü için**, alt bölümde Separator ile ayrılmış) — NEW v2
- **Active state:** `bg-sidebar-accent text-sidebar-accent-foreground`
- **Alt bölüm:** Avatar + isim + rol badge

### 2.2. Header ([components/header.tsx](components/header.tsx))
- **Sol:** Global search input (şu an placeholder, henüz fonksiyonel değil)
- **Sağ:**
  - "Oluştur" CTA button (Plus) → `CreateTaskModal`
  - `NotificationBell` (unread badge, 99+ cap)
  - HelpCircle icon button
  - Avatar dropdown: Profilim (→ /settings), **Admin Paneli** (conditional → /admin — v2), Çıkış Yap (destructive)

### 2.3. Admin Shell (NEW v2 — [components/admin-shell.tsx](components/admin-shell.tsx))
- AppShell'den ayrı bir layout, **farklı görsel kimlik** (üst bar'da "Admin" badge, secondary accent)
- **Admin Sidebar** (secondary theme — hafif renk değişimi, admin context'i görsel olarak ayırır):
  1. Overview (`LayoutDashboard`)
  2. Kullanıcılar (`Users`)
  3. Roller (`Shield`)
  4. İzinler (`Lock`)
  5. Projeler (`FolderKanban`)
  6. Workflow Şablonları (`Workflow`)
  7. Bildirim Şablonları (`Mail`)
  8. Audit Log (`ScrollText`)
  9. Sistem Durumu (`Activity`)
- Üst sağ: "Kullanıcı paneline dön" link (→ /)

### 2.4. AppShell Layout Yapısı (değişmedi)
```
┌─────────────────────────────────────────┐
│  Sidebar  │         Header               │
│  (fixed)  ├──────────────────────────────┤
│           │                              │
│           │        main content          │
│           │        (p-6, overflow-auto)  │
└─────────────────────────────────────────┘
```

---

## 3. Sayfa Dokümantasyonu

### 3.1. Dashboard — `/` ([app/page.tsx](app/page.tsx))

**Amaç:** Kullanıcının rolüne göre yönetici veya üye perspektifinden özet.

**Elementler:**
- H1: "Dashboard", subtitle: "Welcome back, {user.name}"
- **View Toggle (Tabs):** "Management" ↔ "My Work"

**Manager View** ([components/dashboard/manager-view.tsx](components/dashboard/manager-view.tsx)):
- 3 Metric Card (responsive grid): Total Projects, Active Tasks, Completed Tasks
- "Project Portfolio" Table: Project Name, Methodology, Manager, End Date
- Methodology badge renkleri: scrum (blue), kanban (purple), waterfall (green)

**Member View** ([components/dashboard/member-view.tsx](components/dashboard/member-view.tsx)):
- **2 kolon grid** (lg:grid-cols-3):
  - **Sol (2 span):** Projelere gruplanmış görev listesi (Folder icon + name + task count badge, expandable TaskRow'lar)
  - **Sağ:** "Şuanki Aktivite" Card (Clock) + "Gecikmiş Görevler" Card (destructive border, AlertTriangle)

---

### 3.2. Login — `/login` ([app/login/page.tsx](app/login/page.tsx))

**Layout:** 2-kolon split.

**Sol Panel (Hero):**
- `bg-zinc-900` text-white + 3 blur gradient circle (renkler yeni palete göre güncellenecek)
- SPMS logo (terracotta primary — rebrand) + LayoutDashboard icon
- Footer: "Software Project Management System"

**Sağ Panel (Form):**
- H1 "Hoşgeldin" + subtitle
- Email Input (Zod validated)
- Password Input (show/hide toggle)
- "Şifremi unuttum" link
- Submit: `w-full h-11 bg-primary` (terracotta, önceden indigo-600)
- Error: 423 lockedUntil banner / 401 generic toast

---

### 3.3. Forgot Password — `/forgot-password`
Login ile aynı 2-kolon split. Email input + success state ("Bu e-posta kayıtlıysa sıfırlama bağlantısı gönderilecek" — user enumeration koruması).

### 3.4. Reset Password — `/reset-password?token=X`
Token yoksa destructive banner. Form: Yeni Şifre (min 8) + Onayla. Success: green banner + login link. Expired token: retry link inline.

### 3.5. Session Expired — `/session-expired`
Animated SVG hourglass (amber). 3s countdown → `/login`. "Hemen Giriş Yap" button (LogIn icon).

---

### 3.6. Projects List — `/projects` ([app/projects/page.tsx](app/projects/page.tsx))

**Layout:** `max-w-5xl mx-auto`
- H1 "Projeler" + subtitle + "Yeni Proje Oluştur" button (sağ üst)
- Empty state: Card + CTA
- **Grid:** Project Card (hover shadow + left-border accent, clickable → detail)

---

### 3.7. New Project — `/projects/new` ([app/projects/new/page.tsx](app/projects/new/page.tsx))

**Layout:** `max-w-3xl mx-auto space-y-6`

**Blok 1 — Başlık:** "Yeni bir proje oluştur"

**Blok 2 — Proje Detayları Card:**
- Sağ üst: `AiRecommendationModal` trigger
- 2-col: Proje Adı + Proje Anahtarı (uppercase, 6 char max)
- Textarea: Açıklama
- 2-col: Başlangıç + Bitiş Tarihi (Popover + Calendar)

**Blok 3 — Metodoloji Seçimi Card:**
- 3-col: Scrum / Kanban / Waterfall seçim kartları

**Blok 4 — Lifecycle & Workflow Kurulum (GÜNCELLENDİ v2):**
Metodoloji seçildikten sonra yeni 2-step sub-flow açılır:

**Step 3.7.1 — Project Lifecycle:**
- İki seçenekli `RadioGroup`:
  - **"Hazır şablondan başla"** — seçilen metodolojinin default lifecycle phases'i (Initiation → Planning → Execution → Monitoring → Closure). "Düzenle" linki lifecycle editor'e yönlendirir (inline modal)
  - **"Sıfırdan kendim tasarla"** — blank canvas editor direkt açılır
- Önizleme: seçilen/tasarlanan phases pill badge zinciri

**Step 3.7.2 — Task Status Workflow:**
- Aynı RadioGroup pattern
  - **"Hazır şablondan başla"** — default statuses (Todo → In Progress → In Review → Done). Düzenle linki → workflow editor modal
  - **"Sıfırdan kendim tasarla"** — blank canvas
- Önizleme: status node chain (color coded)

**Blok 5 — Task Fields:** FieldToggles (mevcut — process template'den gelen checkbox'lar)

**Blok 6 — Actions:** İptal (outline) + Projeyi Oluştur (primary)

**AI Recommendation Modal:** 6 Select sorgu → rule-based recommendation + "Öneriyi uygula" button.

---

### 3.8. Project Detail — `/projects/[id]` ([app/projects/[id]/page.tsx](app/projects/[id]/page.tsx))

**Layout:** `max-w-6xl mx-auto space-y-8`

**Header:** H1 project.name + key Badge, description, meta bar (Calendar + User icons), "Görev Oluştur" + overflow menu.

**7-sekme Tab Navigation (güncellendi — Lifecycle eklendi):**
Board | List | Timeline | Calendar | **Lifecycle (v2)** | Members | Settings

localStorage persist per project.

#### 3.8.1. Board Tab ([components/project/board-tab.tsx](components/project/board-tab.tsx))
- **Toolbar:** Sprint filter (All/Backlog/sprint list) + Compact/Rich toggle
- **Mobile:** Single column + horizontal tab strip
- **Desktop:** Horizontal scrollable columns (h-[70vh])
- **KanbanColumn:** name header + count badge (n/wip_limit), droppable state (ring-primary/20 + bg-primary/5)
- **KanbanCard:** priority left-border (color coded), compact/rich content, drag overlay (rotate-2 shadow-lg)
- **Move-to-Done warning:** toast.warning on last column drop

#### 3.8.2. List Tab ([components/project/list-tab.tsx](components/project/list-tab.tsx))
- Filter bar: Status / Priority / Assignee DropdownMenu checkbox filters + Clear
- Sortable table: Key, Title, Status, Assignee, Priority, Due Date
- Load More pagination

#### 3.8.3. Timeline (Gantt) Tab ([components/project/gantt-tab.tsx](components/project/gantt-tab.tsx))
- ViewMode toggle: Day / Week / Month
- frappe-gantt render, priority-based custom_class
- Hover popup: name + date range + "View full task →"

#### 3.8.4. Calendar Tab ([components/project/calendar-tab.tsx](components/project/calendar-tab.tsx))
- FullCalendar dayGrid
- Task events + recurring expansions + sprint bands (5 renk cycle)
- Drag-drop reschedule → API
- Undated tasks sidebar (draggable list)

#### 3.8.5. Lifecycle Tab (NEW v2 — [components/project/lifecycle-tab.tsx](components/project/lifecycle-tab.tsx))

**Amaç:** Proje yaşam döngüsünü görsel olarak gösterir. Yönetici için read-only overview, editleme Settings sub-tab'ında.

**Layout:** Full-width React Flow canvas
- **Top Toolbar:**
  - "Bu projenin yaşam döngüsü" subtitle
  - View mode toggle: "Overview" (read-only, zoom disabled) | "Detailed" (zoom + minimap)
  - "Düzenle" button (sadece PM/Admin) → Settings › Lifecycle Editor'e yönlendirir
- **Canvas:** Phase nodes (rounded rect, phase name + optional icon + progress %) bağlantılarla
- **Active phase highlighting:** Şu anki aktif phase = `ring-2 ring-primary` + filled bg
- **Phase click → Sprint'leri filtreler/gösterir** (popover: bu phase'in active sprint'leri + task count)
- **Minimap** (sağ alt, sadece detailed mode)

#### 3.8.6. Members Tab ([components/project/members-tab.tsx](components/project/members-tab.tsx)) — GÜNCELLENDİ v2

**Eski davranış değişti:** PM artık sistem çapında kullanıcı aramıyor. İki alt-senaryo:

**Scenario A — PM'in "add member" izni VAR** (admin panel'de togglelanmış):
- Search input (min 2 char) → **sadece kullanıcı name/email match** döner (tam profile görünmez — directory lookup tarzı)
- Match üzerinde "Add" button → direkt ekler

**Scenario B — PM'in izni YOK (default):**
- Aynı search input + match listesi görünür (görsel değişiklik yok)
- Her match üzerinde "Admin'den iste" button (mail-like icon)
- Click → modal: "Bu kullanıcıyı projeye ekleme talebi admin'e iletilecek" + optional not textarea + Gönder
- Sonuç: Admin panel'inde pending request queue'ya düşer, admin kabul/red verebilir
- PM'e sonuç notification olarak döner

**Admin rolü için:** Her iki scenario da bypass — admin direkt ekleyebilir (mevcut davranış).

**Diğer bileşenler (değişmedi):** Filter bar (member search + role dropdown), member list (Avatar + name + role + "You" badge + Remove button), Remove confirm dialog.

#### 3.8.7. Settings Tab — Sub-Tabs (GÜNCELLENDİ v2)

Settings tab artık içinde 3 sub-tab barındırır:

**Sub-tab 1: Columns (Simple)** — mevcut `BoardColumnsSettings` davranışı
- Basit list view: rename inline, reorder, add, delete (target column select)
- "Gelişmiş workflow için Workflow sub-tab'ına geçin" info banner

**Sub-tab 2: Workflow (Node) — NEW v2** ([components/project/workflow-editor.tsx](components/project/workflow-editor.tsx))
- **Full-width React Flow canvas** (h-[70vh] minimum)
- Bu editor Simple sub-tab'ın **source of truth'u** — aynı data, farklı görünüm
- Detayları: Bölüm 11

**Sub-tab 3: Lifecycle Editor — NEW v2** ([components/project/lifecycle-editor.tsx](components/project/lifecycle-editor.tsx))
- Full-width React Flow canvas
- Project lifecycle phases düzenlenir (Lifecycle tab'ının source of truth'u)
- Detayları: Bölüm 11

---

### 3.9. Sprint Management — `/projects/[id]/sprints` ([app/projects/[id]/sprints/page.tsx](app/projects/[id]/sprints/page.tsx))
SprintsList: Create Phase form (Name + Start/End) + Sprint rows (status badge + date range + goal + Close/Delete) + Close/Delete AlertDialogs (move tasks target select).

---

### 3.10. Task Detail — `/tasks/[id]` ([app/tasks/[id]/page.tsx](app/tasks/[id]/page.tsx))

**Layout:** `space-y-6`, grid `lg:grid-cols-[1fr_320px]`

**TaskHeader:** Breadcrumb + H1

**TaskContent (sol):** Açıklama (click-to-edit), Ekler (drop zone + file list), Alt Görevler Table (conditional), Activity Stream (Yorumlar / Geçmiş / Çalışma Günlükleri tabs).

**TaskSidebar (sağ 320px):**
- Watch toggle (non-assignee only)
- Durum Select — **artık workflow-aware (v2 backend değişince):** sadece izin verilen transitions görünür. Mevcut sadece `columns` listeliyor.
- Atanan Kişi Popover + Command palette
- Priority + Points
- Due Date Popover + Calendar
- Sprint Select
- Dependencies (blocks / is blocked by + add popover)
- Recurrence (conditional) + scope dialog

---

### 3.11. Create Task Modal ([components/create-task-modal.tsx](components/create-task-modal.tsx))

Dialog max-w-2xl modal. Fields: Project Select + Task Type Select + Title (debounced similar search) + Description + Parent Task (conditional) + Priority/Assignee/Due Date/Points grid + Recurring section (Checkbox + interval select + ends radiogroup).

**v2 not:** Task type dropdown'a "bug" zaten var. Workflow-aware olunca her type farklı initial status'a gider (ör. bug → "Triage").

---

### 3.12-3.17. My Tasks / Teams / Notifications / Reports

Önceki dokümantasyondan değişiklik yok (detaylar Bölüm 3 v1'de). Kısa özetler:

- **My Tasks (`/my-tasks`):** MemberView reuse
- **Teams List (`/teams`):** Create form + team grid cards
- **Team Detail (`/teams/[id]`):** Members list + add/remove + owner controls
- **Notifications (`/notifications`):** Filter tabs (Tümü/Okunmamış) + infinite scroll list + mark-all/clear buttons
- **Reports (`/reports`):** 4 placeholder chart cards ("Chart visualization coming soon")

---

### 3.18. Settings — `/settings` ([app/settings/page.tsx](app/settings/page.tsx)) — GÜNCELLENDİ v2

**Layout:** `max-w-2xl`

3 Card bölümü:

**Card 1 — Profil:**
- Avatar (h-16) + "Fotoğraf Değiştir" → AvatarCropDialog
- 2-col: Full Name + Email (email değişirse "Mevcut Şifre" conditional field)
- Kaydet button + feedback

**Card 2 — Bildirimler:** NotificationPreferencesForm (değişmedi)
- Global email toggle + deadline days + per-type matrix (in-app / email switches)

**Card 3 — Görünüm (NEW v2 — [components/settings/theme-section.tsx](components/settings/theme-section.tsx)):**

4 bloklu bölüm:

**Block 1 — Preset Palette Picker:**
- 6 preset card (3x2 grid, her biri preview swatch showing primary + bg + accent + text):
  1. **Default (Terracotta)** — Claude-inspired warm (light)
  2. **Ocean** — light teal
  3. **Forest** — light green
  4. **Monochrome** — light grayscale
  5. **Midnight** — dark purple
  6. **Graphite** — dark neutral
- Hover: preview swatch animate + border primary
- Selected: `ring-2 ring-primary` + Check icon

**Block 2 — Custom Brand Color:**
- Single color picker (HSL/OKLCH input + swatch)
- "Otomatik üretim" info text: "Seçtiğiniz renkten primary, accent, ring ve chart renkleri türetilir"
- Live preview card: sample button + card + sidebar avatar
- WCAG AA contrast guard:
  - Background ↔ primary-foreground kontrastı yetersizse destructive banner
  - Icon: AlertTriangle + text "Bu renk kombinasyonu yeterli kontrast sağlamıyor (önerilen: 4.5:1, şimdiki: 3.2:1)"
  - "Otomatik düzelt" button → sistem kontrast karşılayan en yakın varyanta snap eder

**Block 3 — Preset Edit → Custom:**
- Preset seçildikten sonra sağ üstte "Bu şablonu özelleştir" link
- Click → picker genişler, değişiklik yapıldıkça "Kaydedilmemiş değişiklikler" badge
- "Custom olarak kaydet" button → isim input modal → localStorage'a ekler
- Default preset'ler **mutate edilmez** — custom yeni bir entry olur
- Custom preset listesi preset grid'e eklenir (Delete option ile)

**Block 4 — Reset:**
- "Varsayılana dön" outline button → Default (Terracotta) preset'ine döner, custom'lar korunur
- "Tüm temaları temizle" destructive button (ConfirmDialog ile)

**Storage:** `localStorage['spms:theme']` = `{ preset: string, customColors: Record<token, oklch> | null, customPresets: Preset[] }`.

No backend sync — ileride `/me/preferences` endpoint eklenirse migration path açık bırakılmış (TODO comment).

---

## 4. Admin Panel Sayfaları (NEW v2)

Tüm admin sayfaları `AdminShell` içinde çalışır, breadcrumb pattern + page-specific action bar.

### 4.1. Admin Overview — `/admin` ([app/admin/page.tsx](app/admin/page.tsx))

**Layout:** `max-w-7xl` grid.

**Üst 4 Stat Card:**
- Aktif Kullanıcılar (sayı + son 7 gün delta)
- Aktif Projeler (sayı + methodology breakdown pie)
- Bekleyen Davetler (sayı + "Görüntüle" link)
- Sistem Sağlığı (green dot + uptime %)

**Alt 2 Card:**
- "Son Aktivite" feed (audit log'tan son 10 entry)
- "Bekleyen Admin İstekleri" (üye ekleme istekleri, işlem yapılmayı bekleyen)

### 4.2. Users — `/admin/users` ([app/admin/users/page.tsx](app/admin/users/page.tsx))

**Header:** H1 "Kullanıcılar" + Search (global) + "Yeni Kullanıcı Ekle" primary button (→ Invite Modal)

**Filter bar:** Role filter (checkbox dropdown) + Status filter (Active/Disabled/Pending) + Clear

**Table (data-dense, sticky header):**
| Kolon | İçerik |
|-|-|
| Kullanıcı | Avatar + full name + email (2-line) |
| Rol | Badge (Admin/PM/Member + secondary badges for overrides) |
| Durum | Status dot + "Aktif" / "Devre dışı" / "Davet bekliyor" |
| Son Giriş | Relative time |
| Katılım | Date |
| Projeler | Count + popover preview on hover |
| Aksiyonlar | Kebab menu: Düzenle / Rolünü değiştir / Devre dışı bırak / Sil / Daveti yenile |

**Pagination** (50/page).

### 4.3. Invite Modal
Dialog max-w-lg:
- Email Input (required, validated)
- Full Name Input (optional)
- Role Select (Admin / PM / Member)
- Projects Multi-select (optional — kullanıcıyı bu projelere otomatik üye yap)
- Custom Message Textarea (optional — davet emailine eklenir)
- Footer: İptal + "Davet Gönder" primary

**Davet akışı (email-based):** Email kayıtlı değilse → invite link (token + 7 gün expiry). Kayıtlıysa → direkt role set + project assignments + notification.

### 4.4. Roles — `/admin/roles`

**Layout:** Master-detail split (list sol, permission matrix sağ).

**Sol panel (w-72):** Role list
- Default roller: Admin, Project Manager, Member (silinemez, rename kilidi)
- "Yeni Rol Ekle" button → modal (name + description + base role template select)

**Sağ panel:** Seçilen rolün permission matrix'i
- Kategori grouped table (headers: Permission | Checkbox):
  - **User Management:** view users, invite users, edit user roles, disable users...
  - **Project Management:** create project, edit any project, delete project, transfer ownership...
  - **Task Management:** create task, edit any task, delete any task...
  - **Workflow:** create template, edit status workflow, edit lifecycle...
  - **Admin Panel:** access admin panel, edit roles, manage permissions...
- Her row: Permission name + description + Toggle Switch
- Değişiklikler otomatik save + debounced toast "Değişiklik kaydedildi"

### 4.5. Permissions — `/admin/permissions` (NEW — Q2.4'ün implementasyonu)

**Amaç:** Role-level ince yetki kontrolü. En kritik setting: "Project Manager'lar sistem çapında kullanıcı arayabilir mi?"

**Layout:** Tablo formu (Role × Permission matrix).

**Row'lar (per role):** Project Manager, Member (Admin her zaman full — display only)

**Column'lar:**
- "Proje-dışı kullanıcı arama" (global directory lookup)
- "Projeye direkt üye ekleme" (önce onboarded olanlardan)
- "Projeye email ile davet" (e-postadan yeni kullanıcı yarat)
- "Proje silme"
- "Ownership transfer"
- "Workflow template override" (proje-özel workflow'u değiştirme)

Her cell: Switch toggle + info tooltip.

**Default'lar:**
- PM: "Projeye direkt üye ekleme" KAPALI (Q2.4 kararı — admin açabilir)
- PM: "Proje-dışı kullanıcı arama" KAPALI
- Member: hepsi KAPALI

"Değişiklikleri Kaydet" persistent bar (bottom sticky) — unsaved changes varsa görünür.

### 4.6. Projects — `/admin/projects`

Cross-project overview. PM perspektifinden farklı olarak **tüm projeler** görünür.

**Filter bar:** Methodology / Lead / Active-Archived / Date range

**Table:**
- Project Name + Key
- Lead (Avatar + name)
- Members count
- Tasks count (active/total)
- Created date
- Actions: View / Transfer Ownership / Archive / Delete (TypeToConfirmDialog with project name)

**Transfer Ownership modal:** Current owner + New owner search (any user) + reason textarea + confirm.

### 4.7. Workflow Templates — `/admin/workflow-templates`

İki sub-tab: **Lifecycle Templates** | **Status Workflow Templates**

#### Lifecycle Templates
- Default org templates (Scrum / Kanban / Waterfall lifecycle phases) — silinemez, editlenebilir
- Custom templates list — admin oluşturabilir
- Her template row: name + description + phase count + "Use count" (kaç projede kullanıldı) + Edit / Duplicate / Delete
- "Yeni Template" button → full-screen React Flow editor modal (Bölüm 11 ile aynı arayüz)

#### Status Workflow Templates
- Aynı yapı ama task status workflows için (Todo → In Progress → Done varyasyonları)

**Template create/edit:** Bölüm 11'deki node editor aynısı kullanılır; sadece "Organization Template" metadata'sı taşır. Projede template seçildiğinde kopyalanır (proje-özel override mümkün).

### 4.8. Notification Templates — `/admin/notifications`

Notification tiplerinin email şablonlarını yönetir.

**Table:** Notification type + Subject + Language + Last modified + Edit action

**Edit Modal:**
- Type (read-only)
- Subject (variable support: `{{user.name}}`, `{{task.title}}`)
- Body (rich text editor — Tiptap veya benzeri)
- Available variables list (sol panel, click-to-insert)
- Preview button (sample data ile render)

### 4.9. Audit Log — `/admin/audit`

Sistem çapında audit log viewer — mevcut `tasks/activity` endpoint'inin genelleştirilmesi.

**Filter bar:**
- Entity type (Task, Project, User, Workflow, Role...)
- Action (create, update, delete, assign...)
- User (search)
- Date range (last 24h / 7d / 30d / custom)

**Table (virtualized for performance):**
- Timestamp
- User (Avatar + name)
- Action + entity
- Details (field_name: old → new)
- IP address (optional, collapsible column)

**Export:** "CSV indir" + "JSON indir" action buttons.

### 4.10. System Stats — `/admin/stats`

**4 Stat Card (üst):**
- Total users + active today
- Total projects + active this week
- Total tasks + created this week
- Storage used / quota

**4 Grafik Card:**
- User growth (line chart, 30 gün)
- Task velocity (weekly bar chart)
- Most active projects (horizontal bar, top 10)
- Notification delivery success rate (donut)

Recharts kullanarak — grafik component'leri `components/ui/chart.tsx` zaten var.

---

## 5. Node-Based Workflow Editors (NEW v2)

> **⚠ Template Semantic — Kritik Ayrım**
>
> **Template = baseline, constraint değil.** Org template'leri admin tanımlar ama proje oluşturucusu (admin ya da PM) her zaman:
>
> - **(a) Blank canvas** seçebilir — hiçbir template'e bağlı kalmak zorunda değil
> - **(b) Herhangi bir template'i baz alıp istediği gibi modifiye edebilir** — template seçildiği anda kopya oluşur (copy-on-use), source template etkilenmez
> - **(c) Workflow editor her proje için tam editleme yetkisi sunar** — kim oluşturduğundan bağımsız. **Yetki:** sadece yetkisi olan Admin ve PM'ler düzenleyebilir (Member rolü read-only). **Audit trail:** backend her node/edge değişikliğini `audit_log` tablosunda user + timestamp + diff ile tutmalı (kim neyi ne zaman değiştirdi trace edilebilir olmalı).
>
> Bu davranış entity ayrımı ile enforce edilir: `WorkflowTemplate` (library) ≠ `Workflow` (proje-özel kopya). `Workflow.templateOrigin` sadece "nereden türedi" trace bilgisi, runtime dependency değil — template sonradan silinse bile proje workflow'u bozulmaz.

### 5.1. Library Seçimi: React Flow (xyflow)

**Neden:** Jira/n8n pattern'ı için endüstri standardı. Drag/zoom/minimap/custom nodes/edges built-in. MIT license, Next.js uyumlu.

**Install:**
```bash
npm install @xyflow/react
```

### 5.2. Workflow Editor Common Pattern

Hem Project Lifecycle hem Task Status Workflow editor'leri **aynı base component'ten türer** ([components/workflow/workflow-editor-base.tsx](components/workflow/workflow-editor-base.tsx)):

**Canvas Layout:**
```
┌───────────────────────────────────────────────────┐
│ Toolbar: [Template] [Undo/Redo] [Zoom] [Save]    │
├───────────────────────────────────────────────────┤
│                                                   │
│                                                   │
│                  Node Canvas                      │
│                  (pan + zoom)                     │
│                                                   │
│                                                   │
│                          ┌─────────┐              │
│                          │ Minimap │              │
│                          └─────────┘              │
└───────────────────────────────────────────────────┘
```

**Top Toolbar:**
- **Sol:** "Şablon Seç" dropdown (Sıfırdan / Scrum / Kanban / Waterfall / Custom) — seçince mevcut graph replace edilir (confirm dialog)
- **Orta:** Undo (Ctrl+Z) / Redo (Ctrl+Shift+Z) icon buttons + disabled state
- **Sağ:**
  - Zoom controls (-/+)
  - "Fit to view" button
  - "Kaydet" primary button (saved state when no unsaved changes)

**Unsaved changes banner:** Yukarıda sticky "Kaydedilmemiş değişiklikler var" amber banner + Save/Discard buttons.

**Canvas Interactions:**
- **Pan:** Space + drag veya middle mouse drag
- **Zoom:** Ctrl + scroll
- **Double-click empty:** Yeni node ekler (input açılır)
- **Node drag:** position update
- **Node click:** select (side panel açılır)
- **Edge draw:** Node'un sağ handle'dan diğer node'un sol handle'a drag
- **Delete key:** Seçili node/edge siler (confirm if node has tasks — sadece status workflow için)

**Right Side Panel (seçim varsa):**
- Node seçildiyse: Name, Description, Color picker, Icon picker, Delete button
- Edge seçildiyse: From → To display, "Kaldır" button, **(Phase 2 — hidden) conditions accordion**

**Minimap:** Sağ alt, 200x150, canvas overview + viewport indicator.

### 5.3. Project Lifecycle Editor

**Node Type: LifecyclePhaseNode**
- Shape: rounded rectangle (120x60 min)
- Content: Phase name + icon (optional) + "N sprint" badge (link to sprints)
- Color: phase-specific (user-picks, semantic colors sabit kalır)
- State indicator: ring (Active) / gray (Upcoming) / strikethrough muted (Completed)

**Edge Type: Sequential arrow** — directional, simple line + arrowhead

**Default Templates:**
- **Scrum Lifecycle:** Initiation → Planning → Execution (multiple sprints) → Closure
- **Waterfall Lifecycle:** Requirements → Design → Implementation → Testing → Deployment → Maintenance
- **Kanban Lifecycle:** Continuous (single active phase, no hard milestones)
- **Blank Canvas:** Tek bir "Start" node

**Project-specific contexts:**
- Sprint'ler lifecycle phase'lere assign edilebilir (Settings sub-tab'dan)
- Progress calculation: phase completion = bounded sprint'lerin completion ortalaması

### 5.4. Task Status Workflow Editor

**Node Type: StatusNode**
- Shape: rounded pill (80x40 min)
- Content: Status name + Kanban position order (small number badge)
- Color: Kullanıcı preset'ten seçer (sabit palette — Q3.1 Tier C dışında)
- **Special markers:**
  - "Initial" badge — yeni task'lar bu status'e başlar (tek seçilebilir)
  - "Final" badge — closed/done status (birden fazla olabilir, ör. Done + Cancelled)
  - "WIP Limit" badge — konfigurable, column'dan miras

**Edge Type: Transition arrow**
- Directional, semantic (sadece bu yönde geçiş izinli)
- **Default çift yönlü:** Yeni edge oluşturulduğunda "Bidirectional?" toggle (tek tık iki ok)
- Edge label (optional) — transition adı ör. "Request Review"

**Default Templates:**
- **Standart Scrum:** Backlog → Selected → In Progress → Review → Done
- **Kanban Basit:** To Do → In Progress → Done
- **Kanban Gelişmiş:** To Do → In Progress ↔ Blocked → Review → Done
- **Waterfall Phase-bound:** Requirements → Design → Implementation → Testing → Release
- **Bug Workflow:** New → Triage → In Progress → Testing → Verified → Closed (Reopen arrow: Closed → Triage)
- **Blank Canvas:** Tek "Todo" node

**Editor'de Kritik Validasyonlar:**
- En az 1 "Initial" node olmalı
- En az 1 "Final" node olmalı
- Izole node'lar (hiçbir edge yok) amber warning ile göster (silmeye davet)
- "Initial"den "Final"e en az bir path olmalı (reachability check) — olmazsa kırmızı error
- Mevcut task'lar için backwards compatibility: node silmeye çalışırken "X adet task bu status'te" uyarısı + target status select

**Phase 2 — Transition Conditions (backend-only, UI'da gizli):**
- Edge üzerine sağ tık → "Edit rules" **menü öğesi yok** (kullanıcı bilmiyor)
- Backend schema bu alanı expect edebilir ama UI expose etmiyor
- Future: Edge select → side panel → "Conditions" accordion (roles, required fields, prerequisites)

### 5.5. Save Behavior

**On Save:**
- Validation check (Initial/Final/reachability)
- Passing → API PATCH → toast success
- Failing → inline error banner + affected node highlight
- **Migration check for Status Workflow:** Silinmiş status'lerde task varsa pre-save modal: "Bu status'lerdeki task'lar nereye taşınsın?" (target status select per deleted status)

**On Cancel:**
- Unsaved changes varsa ConfirmDialog "Değişiklikler kaybolacak, devam edilsin mi?"

---

## 6. Tasarım Sistemi Tokenları (GÜNCELLENDİ — Rebrand)

### 6.1. Renk Sistemi (OKLCH — [app/globals.css](app/globals.css))

**Default Brand: Terracotta (Claude-inspired warm)** — yeni varsayılan, önceki indigo rebrand edildi.

**Light Mode Core (Default = Terracotta):**
```css
--background: oklch(0.98 0.008 75)      /* warm cream */
--foreground: oklch(0.20 0.025 50)      /* deep warm ink */
--card: oklch(1 0 0)
--card-foreground: oklch(0.20 0.025 50)
--popover: oklch(1 0 0)
--popover-foreground: oklch(0.20 0.025 50)
--primary: oklch(0.60 0.17 40)          /* rich terracotta */
--primary-foreground: oklch(0.98 0.005 75)
--secondary: oklch(0.95 0.015 60)       /* soft peach */
--secondary-foreground: oklch(0.25 0.025 50)
--muted: oklch(0.94 0.01 70)            /* warm gray */
--muted-foreground: oklch(0.45 0.015 55)
--accent: oklch(0.92 0.025 50)          /* subtle warm accent */
--accent-foreground: oklch(0.25 0.025 50)
--destructive: oklch(0.55 0.22 25)      /* crimson */
--destructive-foreground: oklch(1 0 0)
--border: oklch(0.88 0.01 70)
--input: oklch(0.88 0.01 70)
--ring: oklch(0.60 0.17 40)
--chart-1: oklch(0.60 0.17 40)          /* primary terracotta */
--chart-2: oklch(0.55 0.14 150)         /* sage green */
--chart-3: oklch(0.65 0.15 85)          /* warm amber */
--chart-4: oklch(0.55 0.18 280)         /* plum */
--chart-5: oklch(0.60 0.12 220)         /* muted blue */
```

**Önemli — Sabit (user theme'e kapalı) tokens (Tier C):**
```css
--status-todo: oklch(0.7 0.01 264)
--status-progress: oklch(0.55 0.22 264)
--status-done: oklch(0.65 0.18 160)
--priority-critical: oklch(0.55 0.22 25)
--priority-high: oklch(0.7 0.18 50)
--priority-medium: oklch(0.75 0.15 85)
--priority-low: oklch(0.7 0.01 264)
```
Bu değerler **kullanıcı theme değişikliğinden bağımsız sabit** — takım iletişimi ve shared meaning korunur.

### 6.2. 6 Preset Palette (Theme System)

Her preset aşağıdaki token'ları tanımlar: background, foreground, primary, primary-foreground, accent, muted, border.

| # | Preset | Mod | Primary OKLCH | Bg OKLCH | Karakter |
|-|-|-|-|-|-|
| 1 | **Default (Terracotta)** | Light | `0.60 0.17 40` | `0.98 0.008 75` | Warm, premium, kurumsal |
| 2 | **Ocean** | Light | `0.55 0.15 210` | `0.98 0.008 220` | Fresh, calm |
| 3 | **Forest** | Light | `0.50 0.14 150` | `0.98 0.008 150` | Natural, grounded |
| 4 | **Monochrome** | Light | `0.30 0.005 0` | `0.98 0 0` | Minimal, timeless |
| 5 | **Midnight** | Dark | `0.70 0.18 280` | `0.15 0.02 280` | Cozy dark purple |
| 6 | **Graphite** | Dark | `0.75 0.06 240` | `0.18 0.01 240` | Neutral dark |

Dark preset'ler foreground değerleri `oklch(0.95+ ...)`. Dark light olmaz, user dark isterse 5 veya 6'yı seçer.

### 6.3. Custom Brand Color Derivation

User tek bir "brand color" seçer (OKLCH picker). Sistem şu token'ları türetir:

```
brand = user_input  (örn: oklch(0.55 0.18 200))

primary            = brand
primary-foreground = contrast pair (light bg için 0.98, dark için 0.15)
ring               = brand
accent             = oklch(L+0.32 C*0.15 H)     // desaturate + lighten
secondary          = oklch(L+0.35 C*0.10 H)     // more desaturate + lighten
chart-1            = brand
chart-2            = oklch(L C*0.8 H+120)       // analogous 1
chart-3            = oklch(L C*0.7 H+60)        // analogous 2
chart-4            = oklch(L C*0.85 H+240)      // complementary area
chart-5            = oklch(L C*0.5 H-40)        // muted
```

Destructive, muted, border preset'ten gelir — user değiştirmez.

**WCAG AA Contrast Check:**
- primary ↔ primary-foreground ≥ 4.5:1
- foreground ↔ background ≥ 4.5:1
- Kontrast yetersizse user'a warning + "otomatik düzelt" option (primary'nin L değerini kontrastı karşılayana iterate eder)

### 6.4. Tipografi
- **Sans:** Inter (`--font-inter`)
- **Mono:** Geist Mono (`--font-geist-mono`)
- **Hiyerarşi:**
  - Page H1: `text-2xl font-bold` / bazı heros `text-3xl font-bold tracking-tight`
  - Card title: `text-base`/`text-lg`/`text-sm font-medium text-muted-foreground`
  - Body: `text-sm`
  - Code/Key: `font-mono text-xs`

### 6.5. Spacing / Radius / Shadow
- Page containers: max-w-2xl → 6xl (page'e göre), padding `p-6`
- Stack: `space-y-4` / `6` / `8`
- Grid gap: `gap-3` / `4` / `6`
- Radius: `--radius: 0.5rem` (sm/md/lg/xl variants)
- Shadow: `shadow-sm` default, `shadow-md` hover
- Hover states: `hover:bg-accent/50`, transform `hover:scale-[1.02] active:scale-[0.98]` (primary CTAs)

---

## 7. Bileşen Kütüphanesi Envanteri

### 7.1. shadcn/ui Primitives ([components/ui/](components/ui/)) — 56 component
Mevcut liste değişmedi: accordion, alert-dialog, alert, aspect-ratio, avatar-crop-dialog, avatar, badge, breadcrumb, button-group, button, calendar, card, carousel, chart, checkbox, collapsible, command, confirm-dialog, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input-group, input-otp, input, item, kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toast, toaster, toggle-group, toggle, tooltip.

### 7.2. Mevcut Composite / Feature Components
**Shell:** `app-shell`, `sidebar`, `header`, `auth-guard`, `create-task-modal`

**Dashboard:** `dashboard/manager-view`, `dashboard/member-view`

**Project Feature (mevcut):** `project-creation`, `project/board-tab`, `project/kanban-column`, `project/kanban-card`, `project/list-tab`, `project/calendar-tab`, `project/undated-tasks-sidebar`, `project/gantt-tab`, `project/members-tab`, `project/sprints-list`, `project/board-columns-settings`, `project/edit-project-modal`, `project/ai-recommendation-modal`, `project/customize-columns`, `project/field-toggles`

**Task Detail:** `task-detail/task-header`, `task-detail/task-content`, `task-detail/task-sidebar`

**Notifications:** `notifications/notification-bell`, `notifications/notification-item`, `notifications/notification-preferences-form`

**Providers:** `providers/query-provider`, `theme-provider`

### 7.3. NEW v2 Components

**Shell (Admin):**
- `admin-shell` — admin layout wrapper
- `admin-sidebar` — admin-only nav
- `admin-guard` — role === "Admin" check

**Workflow Editors:**
- `workflow/workflow-editor-base` — React Flow tabanlı ortak canvas component
- `workflow/lifecycle-node` — LifecyclePhaseNode custom node
- `workflow/status-node` — StatusNode custom node
- `workflow/transition-edge` — custom edge (bidirectional toggle, labels)
- `workflow/editor-toolbar` — undo/redo, zoom, template picker
- `workflow/side-panel` — selected node/edge properties
- `workflow/template-picker` — preset dropdown

**Project — Node Editor Integrations:**
- `project/lifecycle-tab` — read-only lifecycle view
- `project/lifecycle-editor` — edit mode (Settings sub-tab)
- `project/workflow-editor` — status workflow editor (Settings sub-tab)
- `project/settings-sub-tabs` — Columns/Workflow/Lifecycle tab container
- `project/member-request-modal` — "Admin'den iste" dialog (Q2.4)

**Admin Panel Feature:**
- `admin/user-table`, `admin/invite-modal`, `admin/user-detail-drawer`
- `admin/role-list`, `admin/permission-matrix`
- `admin/permissions-table` — PM-level toggles
- `admin/project-list`, `admin/transfer-ownership-modal`
- `admin/workflow-templates-list`, `admin/template-editor-dialog`
- `admin/notification-template-editor`
- `admin/audit-log-table`, `admin/audit-filters`
- `admin/stat-cards`, `admin/stat-charts`
- `admin/pending-requests-list` — üye ekleme istekleri

**Settings Theme:**
- `settings/theme-section` — Görünüm card container
- `settings/preset-picker` — 6 preset grid
- `settings/brand-color-picker` — OKLCH picker + derivation preview
- `settings/contrast-guard` — WCAG AA warning banner
- `settings/theme-preview` — sample UI preview (button + card + sidebar)
- `theme/theme-provider` — genişletilmiş, localStorage + custom palette support
- `theme/palette-engine` — OKLCH derivation utility (pure fn, test edilebilir)

---

## 8. Veri Kontratları ([lib/types.ts](lib/types.ts))

Mevcut tipler değişmedi (User, Project, ParentTask, SubTask, Activity, BoardColumn...). v2'de eklenecek tipler:

```typescript
// Workflow Editors
interface WorkflowNode {
  id: string
  type: "phase" | "status"
  name: string
  position: { x: number; y: number }
  data: {
    description?: string
    color?: string  // preset palette key (sabit renkler)
    icon?: string
    isInitial?: boolean   // sadece status
    isFinal?: boolean     // sadece status
    wipLimit?: number     // sadece status
  }
}

interface WorkflowEdge {
  id: string
  source: string  // node.id
  target: string
  bidirectional: boolean
  label?: string
  // Phase 2 (backend-only, UI'da gizli)
  conditions?: TransitionCondition[]
}

interface Workflow {
  id: string
  projectId: string
  type: "lifecycle" | "status"
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  templateOrigin?: string  // "scrum" | "kanban" | "custom" | org-template-id
}

interface WorkflowTemplate {
  id: string
  name: string
  type: "lifecycle" | "status"
  scope: "system" | "organization"
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdBy: User
  usageCount: number
}

// Admin
interface Permission {
  key: string          // "users.invite"
  label: string
  description: string
  category: string
}

interface RolePermission {
  roleId: string
  permissionKey: string
  granted: boolean
}

interface ProjectMemberRequest {
  id: string
  projectId: string
  requestedUserId: string
  requestingUserId: string   // PM
  note?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

interface AuditLogEntry {
  id: string
  entityType: string    // "task" | "project" | "user" | ...
  entityId: string
  action: string        // "create" | "update" | "delete" | ...
  fieldName?: string
  oldValue?: string
  newValue?: string
  userId: string
  timestamp: string
  ipAddress?: string
}

interface NotificationTemplate {
  id: string
  type: string         // "TASK_ASSIGNED" | ...
  subject: string      // "{{user.name}} sana {{task.title}} görevini atadı"
  body: string         // rich text
  availableVariables: string[]
  language: "tr" | "en"
}

// Theme
interface ThemePreset {
  id: string
  name: string
  mode: "light" | "dark"
  tokens: Record<string, string>  // oklch strings
  isCustom?: boolean  // user-created
}

interface UserThemePreference {
  presetId: string
  customOverrides?: Partial<Record<string, string>>
  customPresets: ThemePreset[]
}
```

---

## 9. Services (Backend API Katmanı)

Mevcut servisler (değişmedi): `auth-service`, `project-service`, `task-service`, `team-service`, `user-service`, `comment-service`, `attachment-service`, `notification-service`, `sprint-service`, `board-column-service`, `task-dependency-service`.

**NEW v2 Services:**
- `workflow-service` — Workflow CRUD (get/update per project), template application
- `workflow-template-service` — Org-level template CRUD
- `admin-user-service` — User CRUD + invite + disable
- `role-service` — Role CRUD + permission matrix
- `permission-service` — Permission definitions + role grants
- `member-request-service` — Pending member addition requests
- `audit-service` — System-wide audit log query (genelleştirilmiş `tasks/activity`)
- `notification-template-service` — Template CRUD
- `system-stats-service` — Aggregate stats

**Client-side only:**
- `theme-service` — localStorage CRUD + palette engine (no backend)

---

## 10. Process Templates (GÜNCELLENDİ)

Mevcut `lib/process-templates.ts` **lifecycle + status** şablonlarına extend edilecek:

```typescript
interface ProcessTemplate {
  id: Methodology
  name: string
  // MEVCUT:
  columns: string[]              // legacy — workflow status'leri seed
  taskFields: TaskFieldDefinition[]
  dashboardWidgets?: ...
  artifacts?: ...

  // NEW v2:
  lifecycleTemplate: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }
  statusWorkflowTemplate: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }
}
```

| Methodology | Lifecycle | Status Workflow |
|-|-|-|
| **Scrum** | Initiation → Planning → Execution (sprints) → Closure | Backlog → Selected → In Progress → Review → Done |
| **Kanban** | Continuous (no hard phases) | To Do → In Progress ↔ Blocked → Done |
| **Waterfall** | Req → Design → Impl → Testing → Release → Maint | Req → Design → Impl → Testing → Release |

---

## 11. Kullanıcı Akışları — Öncelik Sıralaması (GÜNCELLENDİ)

### Öncelik 1 — Core Flow
1. Login → Dashboard → Project Grid → Project Board
2. Kanban Board (drag/drop + filter)
3. Task Detail (3-column + inline editing)
4. Create Task Modal (multi-type)

### Öncelik 2 — v2 Flagship (yeni özellikler)
5. **Node-based Workflow Editor** (status + lifecycle) — Jira-parity flagship feature
6. **Admin Panel overview** — kurumsal tanıtım için
7. **Theme Customization** — onboarding delight moment
8. **Project creation with template edit** (step 3.7.1/2)

### Öncelik 3 — Power User
9. Project Creation Wizard (methodology + columns + fields)
10. Members Management (permission-aware — Q2.4)
11. Sprints/Phases (close + delete w/ migration)
12. Calendar view with drag-drop
13. Gantt timeline
14. Admin panel sub-pages (users/roles/permissions/audit/stats)

### Öncelik 4 — Support & Admin
15. Settings (profile + theme + notifications)
16. Notifications (full page + bell popover)
17. Teams (CRUD)
18. Auth flows (forgot/reset/session-expired)
19. Reports (placeholder — grafik tasarımı bekliyor)
20. Admin workflow/notification template editors

---

## 12. Tasarımcı Notları (Claude Design için)

### 12.1. Default Brand Direction
Indigo → **Terracotta rebrand** (Claude-inspired warm, kurumsal ton).
- Mevcut `oklch(0.55 0.22 264)` (rich indigo) → `oklch(0.60 0.17 40)` (rich terracotta)
- Warm cream background, deep warm ink text
- Chart palette da warmer tonlara kayıyor (sage, amber, plum, muted blue)
- **Hero images / illustrations** da warm palette'e taşınmalı — mevcut indigo blur gradient'lar terracotta/peach/amber gradient'larla değiştirilmeli

### 12.2. Dil Tutarsızlığı (Eski Issue)
Karışık TR/EN — UI pass ile unified TR yapılmalı. Özellikle yeni admin panel sayfalarında **baştan TR** ile başlanmalı (örn. "Users" değil "Kullanıcılar").

### 12.3. Empty / Loading / Error Pattern (Değişmedi)
- Loading: merkez `Loader2 animate-spin` (h-8 w-8 text-primary)
- Error: Alert destructive + AlertCircle + detail
- Empty: Card + CTA button
**v2 için ek:** Workflow editor empty state (yeni proje, henüz workflow yok) — "İlk workflow'unu tasarla" CTA + template gallery mini preview.

### 12.4. Priority & Status Rengi Tutarlılığı
Mevcut sorun çözüldü: **Tier C renkler sabit**, user theme değişikliğinden etkilenmiyor. Component'lerde hala hafif farklılıklar var (KanbanCard bg-red-100 vs sidebar bg-red-500) — design system pass'te `priority-critical-bg`, `priority-critical-fg`, `priority-critical-border` gibi **türev token'lar** tanımlanmalı.

### 12.5. Node Editor UX — Kritik Noktalar
- **İlk kez kullanıcı pedagojisi:** Boş canvas'a ilk geldiğinde "Double click to add node" + mini animation (opsiyonel tutorial overlay)
- **Error states:** Reachability check, isolated nodes gibi warning'ler canvas üstünde **non-blocking** toast + affected node ring
- **Keyboard shortcuts:** Space+drag (pan), Delete (remove), Ctrl+Z/Y (undo/redo), Ctrl+S (save), Ctrl+D (duplicate node) — help modal (shift+/)
- **Mobile/Touch:** Editor mobil'de read-only fallback (touch targets node-editing için küçük). Aspect ratio uyarısı + "Masaüstünden düzenle" CTA.

### 12.6. Admin Panel UX — Görsel Ayrım
Admin paneli user paneline göre farklı kimlik taşımalı (yanlışlıkla admin aksiyon almayı engelle):
- **Üst bar:** Subtle accent/secondary rengi (örn. warm taupe — terracotta'nın desaturated versiyonu)
- **Breadcrumb:** "Admin › Kullanıcılar" pattern her page'de
- **Destructive actions:** ConfirmDialog + TypeToConfirmDialog (delete project/user için isim yazdır)
- **"User olarak görüntüle" toggle** — admin kendi user panelini önizleyebilir

### 12.7. Theme Customization UX — Edge Cases
- **Custom renk kaydedilmeden sayfadan çıkış:** "Kaydedilmemiş değişiklikler" ConfirmDialog
- **localStorage quota aşımı:** Küçük JSON ama custom preset'ler çoğalırsa uyarı
- **Cross-tab sync:** `storage` event listener — bir tab'da tema değişirse diğer tab'lar auto-update
- **Reduced motion:** prefers-reduced-motion için hover transitions opsiyonel
- **Print styles:** Tema background'ları print'te ignore (white bg + black text) — maliyet yok, kalite artar

### 12.8. Eksik Görseller / Placeholder Durumu
- `/placeholder.svg`, `/placeholder-user.jpg`, `man.png`, `woman.png` vb. — **terracotta-matching placeholder set gerekir**
- Reports sayfası grafik slot'ları — v2 admin stats sayfasıyla birlikte gerçek chart tasarımı alabilir
- Empty state illustrations — workflow editor, admin audit empty feed, notifications empty list

### 12.9. Animasyon / Mikro Etkileşimler
- Session expired: SVG hourglass animation (unchanged)
- **NEW:** Theme switch animation — preset değişiminde 300ms color transition (hedef smooth experience)
- **NEW:** Node editor — node add/remove fade+scale transition
- **NEW:** Admin permission toggle — Switch animation + "Değişiklik kaydedildi" micro toast

### 12.10. Roadmap / Açık Kalan Alanlar
- Workflow transitions conditional rules (Tier C) — backend hazırlanacak, UI expose **yapılmayacak** (kullanıcı farkında değil)
- Global search (Header input) — hala fonksiyonel değil
- Sub-tasks recursive hierarchy (şu an tek seviye)
- Reports grafikleri gerçek veri ile
- Worklog tracking
- i18n / dil seçimi (TR/EN toggle) — theme customization ile benzer "personal preference" altında toplanabilir

---

## 13. v2 Öncesi → Sonrası Summary Tablosu

| Alan | v1 | v2 |
|-|-|-|
| **Workflow** | `BoardColumnsSettings` (basit CRUD) | React Flow node editor (primary) + Simple list (fallback sub-tab) |
| **Lifecycle** | Sadece sprint listesi | Dedicated node-based editor + Lifecycle tab (read-only view) |
| **Admin** | Yok (rol kontrolü scattered) | Separate `/admin` panel + 9 alt-sayfa |
| **User Mgmt** | PM sistem çapında search | PM scoped + admin-controlled permissions (Q2.4) |
| **Theme** | Sabit indigo + dark mode | 6 preset palette + custom brand color + localStorage |
| **Brand** | Indigo primary | Terracotta (Claude-inspired warm) |
| **Project Creation** | Methodology + columns | Methodology + edit/blank canvas choice (lifecycle + status) |
| **Notification Templates** | Hardcoded | Admin-editable with variables |
| **Audit Log** | `tasks/activity` only | Generalized `/admin/audit` (all entities) |
| **Org Templates** | Yok | Admin-manageable workflow template library |
