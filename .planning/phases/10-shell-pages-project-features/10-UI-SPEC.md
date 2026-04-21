---
phase: 10
slug: shell-pages-project-features
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-21
reviewed_at: 2026-04-21
review_verdict: APPROVED (2 FLAGs — both justified by locked D-35 prototype-fidelity)
---

# Phase 10 — UI Design Contract

> Visual and interaction contract for the Shell Pages & Project Features phase. All tokens, sizes, copy, and interaction patterns below are extracted directly from the HTML prototype (`New_Frontend/src/**`). The prototype is the canonical design authority (v2.0 CRITICAL BUILD RULE); shadcn/ui is prohibited (D-01, Phase 8).

**Downstream executor rule:** When in doubt, read the prototype file listed in each section and match it pixel-for-pixel. Do NOT invent, round, or "improve" values — reproduce them verbatim.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — pure CSS tokens + inline styles (Phase 8 D-01, D-02) |
| Preset | Prototype token system (`--bg`, `--surface`, `--primary`, `--status-*`, `--priority-*`, `--inset-*`) — already live in `Frontend2/app/globals.css` |
| Component library | None. All UI from `Frontend2/components/primitives/` (16 primitives already extracted from prototype in Phase 8) |
| Icon library | Inline SVG from `New_Frontend/src/icons.jsx` — to be ported to `Frontend2/components/icons/` (no lucide, no heroicons) |
| Font | `Geist` (sans), `Geist Mono` (mono) — declared in `Frontend2/app/globals.css`, loaded via `next/font` |
| Theme runtime | `Frontend2/lib/theme.ts` — 6 presets + OKLCH brand derivation |
| Dark mode | `[data-mode="dark"]` attribute on `<html>` (Tailwind v4 `@custom-variant dark`) |
| Density | `[data-density="compact|cozy|comfortable"]` on `<html>` — default `cozy` |

**Primitives available (all Phase 8):** Avatar, AvatarStack, Badge, Button, Card, Kbd, Tabs, Section, PriorityChip, StatusDot, Input, ProgressBar, SegmentedControl, Collapsible, AlertBanner, Toggle.

**Import path:** `import { Card, Button, Badge, ... } from "@/components/primitives"` — always named exports via barrel (`Frontend2/components/primitives/index.ts`).

---

## Spacing Scale

Extracted from prototype page files. Prototype uses pixel-exact inline styles — every value below appears verbatim in the source. Do NOT round.

| Token | Value | Usage (prototype evidence) |
|-------|-------|----------------------------|
| 2 | 2px | SegmentedControl pill padding (`primitives.jsx:244`), tab divider spacing |
| 4 | 4px | Icon gap, row spacing, small radius (`--radius-sm` inner elements) |
| 6 | 6px | Button gap (`sm`), Badge gap, Card inner inline gap |
| 8 | 8px | Sidebar nav gap, form row gap between label+input |
| 10 | 10px | Table row padding-left/right, form field inline gap |
| 12 | 12px | Grid gap (`gap: 12`) on StatCard grid, template grid, Section margins |
| 14 | 14px | StatCard padding, Card inner padding (`14px 16px`) |
| 16 | 16px | Card default `padding=16`, projects grid gap (`gap: 16`), Section spacing |
| 20 | 20px | Settings section padding (`padding={20}` on ProfileSection/PreferencesSection), page vertical `gap: 20` |
| 24 | 24px | Wizard step card `padding={24}` (`create-project.jsx:107`), Settings grid gap |
| 28 | 28px | Wizard step indicator circle diameter (`create-project.jsx:90`), Button `md` height+8 |
| 32 | 32px | StatCard icon box size, wizard step indicator margin-bottom (`marginBottom: 32`), Button `lg` height-8 |
| 40 | 40px | Button `lg` height, sidebar logo area (`height: 52` incl. 12px top/bottom pad) |
| 52 | 52px | Header height + Sidebar logo row height (`shell.jsx:9, 164`) |
| 60 | 60px | Login page horizontal padding (`misc.jsx:10` — `padding: "40px 60px"`) |

**Exceptions (documented, non-negotiable — these break the 8pt grid on purpose to match prototype):**
- Font sizes `10.5`, `11.5`, `12.5`, `13.5`, `14.5` px (half-integer sizes from prototype — e.g. StatCard label `fontSize: 11.5`, Input body `fontSize: 13`, dashboard date `fontSize: 13`)
- Status pill `height: 18` for badge `xs` (prototype `primitives.jsx:57`)
- Toggle track `height: 20` / `width: 36` (prototype `primitives.jsx:291-292`)
- Sidebar collapsed width `56`, expanded `232` (prototype `shell.jsx:68`)

Reason: Phase 8 CONVERSION RULE — prototype pixel values are preserved exactly because the prototype IS the design spec. We do not normalize to an 8pt grid.

---

## Typography

Sizes extracted from prototype. Two weights only: **500 (medium, default UI)** and **600 (semibold, emphasis)**. No 400 regular in the prototype — body inherits 500.

| Role | Size | Weight | Line Height | Evidence |
|------|------|--------|-------------|----------|
| Page title | 24px | 600 | tight (-0.6 letterspacing) | `dashboard.jsx:220` "Merhaba, Ayşe", `projects.jsx:18` "Projeler" |
| Auth hero | 28px | 600 | tight (-0.8 letterspacing) | `misc.jsx:18` "Tekrar hoş geldiniz" |
| Stat value | 28px | 600 | tabular nums, -0.8 tracking | `dashboard.jsx:49` StatCard value |
| Section heading | 18px | 600 | default | `create-project.jsx:108, 149, 182, 258` wizard step headings |
| Card title | 15px | 600 | default | Settings card headings (`settings.jsx:44, 80, 148, 273, 299`) |
| Project card name | 15px | 600 | -0.3 tracking | `projects.jsx:54` |
| Template card name | 14px | 600 | default | `create-project.jsx:369` TemplateCard |
| Body / primary UI | 13px | 500 | 1.45 (global body) | `globals.css:105`, form inputs, nav items |
| Body small | 12.5px | 500 | 1.5-1.6 | Card subtitle (`dashboard.jsx:26`), row text, AlertBanner |
| Meta / label | 12px | 500 | default | Badge text (`sm`), small buttons, feed time |
| Table header | 11px | 600 | uppercase, 0.4 tracking | `dashboard.jsx:74` PortfolioTable header |
| Caption / delta | 11.5px | 500 | default | StatCard delta, helper text |
| Mono key | 10.5px | 600 | tabular | Project key chip (`dashboard.jsx:92`, `projects.jsx:53`) |
| Kbd hint | 10.5px | 500 | mono font | Kbd component (`primitives.jsx:149`) |

**Font family:**
- Default: `var(--font-sans)` = Geist (applied on `<body>` via `globals.css:103`)
- Monospace: `var(--font-mono)` = Geist Mono, applied via `className="mono"` (`globals.css:116`) — triggers `font-variant-numeric: tabular-nums` and `font-feature-settings: "ss01"`

**Body baseline** (`globals.css:102-111`): `font-family: var(--font-sans); font-size: 14px; line-height: 1.45; color: var(--fg); font-feature-settings: "cv11", "ss01", "ss03"`. Do NOT override body font-size at the root.

---

## Color

The prototype uses the **60/30/10 rule** as follows — extracted from `globals.css` (Phase 8 output).

| Role | Token | Default preset value | Usage |
|------|-------|----------------------|-------|
| Dominant (60%) | `var(--bg)` | `oklch(0.985 0.006 75)` (near-white warm) | Page background, header background |
| Dominant variant | `var(--bg-2)` | `oklch(0.97 0.008 70)` | Sidebar background, large surface zones |
| Secondary (30%) | `var(--surface)` | `oklch(1 0 0)` (pure white) | Card background, modal surface, input background (default) |
| Secondary variant | `var(--surface-2)` | `oklch(0.975 0.006 70)` | Input fills (wizard), Kbd, inactive SegmentedControl, AvatarStack +N chip |
| Accent (10%) | `var(--primary)` | `oklch(0.60 0.17 40)` (terracotta) | Primary buttons, active state links, progress bars, status filter active pill, wizard step-active circle |
| Accent subtle | `var(--accent)` | `oklch(0.93 0.03 50)` | Sidebar active nav item background, folder active state, Tabs active indicator pill (NOT active tab color — that is `--primary`) |
| Accent fg | `var(--accent-fg)` | `oklch(0.25 0.04 50)` | Text inside `--accent` background |
| Destructive | `var(--priority-critical)` | `oklch(0.58 0.22 25)` | Badge `danger`, Button `danger` variant, error text, unread indicator dot, notification badge |

**Status colors (PROJ-04 status badges):**

| Project Status | Badge tone | Color token | Badge label (TR / EN) | Top strip color (card) |
|----------------|------------|-------------|------------------------|------------------------|
| ACTIVE | `success` (dot) | `var(--status-done)` — `oklch(0.58 0.14 150)` (green) | `Aktif` / `Active` | `var(--primary)` |
| COMPLETED | `info` (dot) | `var(--status-progress)` — `oklch(0.55 0.15 230)` (blue) | `Tamamlandı` / `Completed` | `var(--status-done)` |
| ON_HOLD | `warning` (dot) | `var(--status-review)` — `oklch(0.65 0.15 65)` (amber) | `Askıda` / `On Hold` | `var(--status-review)` |
| ARCHIVED | `neutral` (dot) | `var(--fg-muted)` — `oklch(0.48 0.018 55)` (gray) | `Arşiv` / `Archived` | `var(--fg-muted)` (implicit via opacity:0.6 on whole card) |

Source: `New_Frontend/src/pages/project-detail.jsx:21-22` (Badge tone mapping) + `New_Frontend/src/pages/projects.jsx:48-49` (top strip + opacity).

**Card opacity on archived:** `style={{ opacity: project.status === "archived" ? 0.6 : 1 }}` — wraps the entire Card (D-23, matches `projects.jsx:48`).

**Accent reserved for (the explicit 10% list):**
- Primary CTA buttons (`Yeni proje`, `Projeyi Oluştur`, `Devam`, `Giriş yap`, `Değişiklikleri kaydet`, `Parolayı güncelle`, `Aktif Et` on archive banner, `Uygula` on brand picker)
- Wizard step indicator circle when `step === s.n` (active step bg + 3px ring)
- ProgressBar fill (`var(--primary)` on StatCard progress, PortfolioTable progress, ProjectCard progress)
- Tabs active bottom border (`border-bottom: 2px solid var(--primary)`)
- Active project card top strip (`projects.jsx:49`) for ACTIVE status
- Sidebar active nav icon color (not background — background is `--accent`)
- Link color (`color: var(--primary); font-weight: 600`) — "Parolamı unuttum", "Kayıt olun", "Girişe dön"
- Auth page marketing panel radial gradient (soft primary fade, `misc.jsx:83`)
- Methodology mix scrum segment color (`var(--primary)` for Kanban bar, per `dashboard.jsx:126`)

**Destructive reserved for:**
- Button `danger` variant (not used in Phase 10 — no delete actions in scope; status-change confirmations use Button `primary` with destructive copy)
- Text color of "Çıkış" / "Revoke" actions in Settings > Security active sessions (`settings.jsx:329`)
- Sidebar user menu "Çıkış Yap" text color (`shell.jsx:146`)
- Header notifications unread badge background (`shell.jsx:184`)
- Login link hover "Forgot password" stays `--primary`, NOT destructive (prototype convention: destructive = terminal actions only)

---

## Copywriting Contract

All copy is bilingual (TR default, EN fallback via `useApp().language`). Turkish forms below are CANONICAL and must match the prototype string-for-string; they are already in `New_Frontend/src/i18n.jsx` (ported to `Frontend2/lib/i18n.ts` in Phase 8) or inlined in page sources. Executor MUST NOT rewrite these strings.

### Dashboard (PAGE-01)

| Element | TR (canonical) | EN |
|---------|----------------|-----|
| Greeting (Manager, AM) | `Merhaba, {userFirstName}` | `Welcome back, {userFirstName}` |
| Subheading (date + motto) | `{weekday}, {month} {day} · Güzel bir hafta olsun` | `{weekday}, {month} {day} · Make it count` |
| View toggle — Manager | `Yönetim` | `Management` |
| View toggle — Member | `Benim İşim` | `My Work` |
| StatCard labels | `Toplam Proje` / `Aktif Görev` / `Tamamlanan` / `Gecikmiş` | `Projects` / `Active tasks` / `Completed` / `Overdue` |
| StatCard delta examples | `+2`, `+14`, `bu hafta`, `dikkat` | `+2`, `+14`, `this week`, `attention` |
| PortfolioTable heading | `Proje Portföyü` | `Project Portfolio` |
| PortfolioTable subtitle | `Aktif projeler, ilerleme ve sahipler` | `Active projects, progress & owners` |
| PortfolioTable filter button | `Filtre` | `Filter` |
| PortfolioTable export button | `CSV` | `CSV` |
| PortfolioTable columns | `Proje` / `Yöntem` / `Yönetici` / `Takım` / `İlerleme` / `Bitiş` | `Project` / `Method` / `Lead` / `Team` / `Progress` / `End` |
| MethodologyCard heading | `Metodoloji dağılımı` | `Methodology mix` |
| ActivityFeed heading | `Son aktivite` | `Recent activity` |
| ActivityFeed empty | `Henüz aktivite yok.` | `No recent activity.` |

### Projects (PAGE-02)

| Element | TR | EN |
|---------|-----|-----|
| Page title | `Projeler` | `Projects` |
| Page subtitle pattern | `{N} proje · klavyeyle gezin` | `{N} projects · keyboard friendly` |
| Status filter segments | `Tümü` / `Aktif` / `Bitti` / `Arşiv` | `All` / `Active` / `Done` / `Archive` |
| Search placeholder | `Proje ara` | `Search projects` |
| Primary CTA | `Yeni proje` | `New project` |
| Task count pattern | `{active}/{total} görev` | `{active}/{total} tasks` |
| Empty state (no projects) | `Henüz proje yok.` + `Yeni proje` button | `No projects yet.` + `New project` button |
| Empty state (filter miss) | `Bu filtreyle eşleşen proje yok.` | `No projects match this filter.` |

### Project Status Management (PROJ-02) — Dropdown actions

Card overflow menu (3-dot) opens a menu with the following three options (each triggers a confirmation dialog):

| Action | TR | EN |
|--------|-----|-----|
| Mark Completed | `Tamamla` | `Complete` |
| Put On Hold | `Askıya Al` | `Put On Hold` |
| Archive | `Arşivle` | `Archive` |

**Confirmation Dialog copy (D-25, required for all three actions):**

| Action | Title (TR) | Title (EN) | Confirm button | Cancel button |
|--------|-----------|-----------|----------------|---------------|
| Complete | `Bu projeyi Tamamlamak istediğinize emin misiniz?` | `Mark this project as Completed?` | `Onayla` / `Confirm` | `İptal` / `Cancel` |
| On Hold | `Bu projeyi Askıya almak istediğinize emin misiniz?` | `Put this project On Hold?` | `Onayla` / `Confirm` | `İptal` / `Cancel` |
| Archive | `Bu projeyi Arşivlemek istediğinize emin misiniz?` | `Archive this project?` | `Onayla` / `Confirm` | `İptal` / `Cancel` |

Dialog body (all three): `Bu işlem daha sonra proje durumu değiştirilerek geri alınabilir.` / `This action can be reversed by changing the project status later.`

Confirm button variant: `primary` (matches positive affirmation pattern — the destructive act is gated by the modal itself, not styled as danger).

### Archive AlertBanner (PROJ-03)

Component: existing `AlertBanner` primitive with `tone="warning"`.

| Element | TR | EN |
|---------|-----|-----|
| Banner text | `Bu proje arşivlenmiştir. İçerik düzenleme devre dışı.` | `This project is archived. Content editing is disabled.` |
| Action button | `Aktif Et` | `Reactivate` |
| Action icon | `<Icons.Info size={13}/>` at banner start (primitive already accepts `icon` prop) | same |

Placement: top of the project-detail content area, above all tabs. Full-width (within content padding). When user clicks `Aktif Et`, it triggers the same confirmation dialog pattern (text: `Bu projeyi yeniden aktifleştirmek istediğinize emin misiniz?` / `Reactivate this project?`).

### Create Project Wizard (PROJ-01)

| Element | TR (canonical) | EN |
|---------|----------------|-----|
| Step 1 title | `Temel Bilgiler` | `Basics` / `Basic Information` |
| Step 1 subtitle | `Projenizin adı, anahtarı ve tarihlerini belirleyin.` | `Set your project name, key and dates.` |
| Step 2 title | `Metodoloji` / (heading: `Metodoloji Seçimi`) | `Methodology` / `Choose Methodology` |
| Step 2 subtitle | `Projeniz için bir yaşam döngüsü şablonu seçin. Daha sonra değiştirebilirsiniz.` | `Choose a lifecycle template. You can change it later.` |
| Step 3 title | `Yaşam Döngüsü` | `Lifecycle` |
| Step 3 subtitle | `Projenin yaşam döngüsünü özelleştirin. Detaylı düzenleme için proje oluşturulduktan sonra İş Akışı Tasarımcısı'nı kullanabilirsiniz.` | `Customize the lifecycle. Use the Workflow Designer after creation for detailed editing.` |
| Step 4 title | `Yapılandırma` | `Configuration` |
| Field: Project Name | `Proje Adı` (required marker: asterisk in `ModalField` label) | `Project Name` |
| Field: Project Key | `Proje Anahtarı` + helper `Görev anahtarları için kullanılır (ör. KEY-1, KEY-2)` | `Project Key` + `Used for task keys (e.g. KEY-1, KEY-2)` |
| Field: Description | `Açıklama` (textarea, rows=3, placeholder `Proje açıklaması...`) | `Description` / `Project description...` |
| Field: Start Date | `Başlangıç Tarihi` (type=date) | `Start Date` |
| Field: End Date | `Bitiş Tarihi` (type=date) | `End Date` |
| Field: Project Lead | `Proje Yöneticisi` (select) | `Project Lead` |
| Step 3 empty state (no template) | `Önce metodoloji seçin` | `Select methodology first` |
| Step 3 deferred-edit note | `Yaşam döngüsü daha sonra Settings'den yapılandırılabilir.` (D-20) | `Lifecycle can be configured later in Settings.` |
| Navigation — Back | `Geri` | `Back` |
| Navigation — Next | `Devam` | `Continue` |
| Navigation — Submit | `Projeyi Oluştur` | `Create Project` |
| Validation — step 1 blocker | `Lütfen proje adı ve anahtarı girin.` (disabled button tooltip) | `Please enter project name and key.` |
| Validation — step 2 blocker | `Lütfen bir metodoloji seçin.` | `Please select a methodology.` |
| Template names | `Scrum` / `Kanban` / `Waterfall` / `V-Model` / `Spiral` / `Artırımlı` | `Scrum` / `Kanban` / `Waterfall` / `V-Model` / `Spiral` / `Incremental` |
| Mode badge labels | `Esnek` / `Sıralı Kilitli` / `Sıralı+` / `Sürekli` | `Flexible` / `Seq. Locked` / `Seq. Flex` / `Continuous` |

**Step 2 data source (D-19):** Templates come from `GET /api/v1/process-templates`. The 6 cards shown in `create-project.jsx:61-68` are prototype mocks; real templates render the response in the same 2-row grid. If the backend returns > 6 templates, overflow wraps to additional rows.

**Step 3 preview scope (D-20):** Read-only canvas showing `template.default_workflow` nodes + edges from the selected template. No editing. If `default_workflow` is null/empty, render the empty state copy above.

**Step 4 scope note (D-20 + Phase 12):** The prototype step 4 contains board columns, task fields, behavior rules, invite members. For Phase 10 MVP, keep only the fields the backend can accept today. **Question for planner / executor:** which fields of step 4 does the POST /projects endpoint accept — document per Phase 9 DTO shape at plan time.

### Login / Auth (PAGE-06)

See "Component Contracts > Login Page" below for layout. Copy tables:

| Element | TR | EN |
|---------|-----|-----|
| Brand cluster | `PMS` + `Proje Yönetim Sistemi` | `PMS` + `Project Management System` |
| Login hero | `Tekrar hoş geldiniz` | `Welcome back` |
| Login subtitle | `Hesabınıza giriş yaparak projelerinizi yönetmeye devam edin.` | `Sign in to continue managing your projects.` |
| Email field label | `Email` (both langs) | `Email` |
| Password field label | `Parola` | `Password` |
| Remember me | `Beni hatırla` | `Remember me` |
| Forgot link | `Parolamı unuttum` | `Forgot password` |
| Submit button | `Giriş yap` | `Sign in` |
| Sign-up footer | `Hesabınız yok mu?` + link `Kayıt olun` | `No account?` + link `Sign up` |
| Footer legal | `© 2025 Acme Holding` · `Gizlilik` · `Şartlar` | `© 2025 Acme Holding` · `Privacy` · `Terms` |

**D-11 closed system note:** The prototype shows a "Kayıt olun" link in the footer. Per D-11, self-registration is NOT supported. Executor: **remove the "Kayıt olun" link entirely** — replace the whole `Hesabınız yok mu? Kayıt olun` block with static text `Yönetici onayı ile hesap açılır.` / `Accounts are created by your administrator.` This is the only copy change from the prototype for PAGE-06.

**Google OAuth note:** The prototype shows a "Continue with Google" button. Per v3.0 OUT-OF-SCOPE list (REQUIREMENTS.md `Third-party OAuth login` is "Email/password yeterli"), **remove the Google button and the "veya e-posta ile" divider** from `(auth)/login/page.tsx`. Keep the email+password form.

### Session Expired (PAGE-06, D-10)

| Element | TR | EN |
|---------|-----|-----|
| Hero | `Oturumunuz sona erdi` | `Session expired` |
| Subtitle | `Güvenliğiniz için oturumunuzu kapattık. Tekrar giriş yapın.` | `For your security we signed you out. Please sign in again.` |
| Primary CTA | `Giriş ekranına dön` | `Back to sign in` → redirects to `/login` |

### Forgot Password (PAGE-06)

Per prototype `misc.jsx:21-27`:

| Element | TR | EN |
|---------|-----|-----|
| Hero | `Parolanızı mı unuttunuz?` | `Forgot password?` |
| Subtitle | `E-posta adresinize sıfırlama bağlantısı gönderelim.` | `We'll send a reset link to your email.` |
| Submit button | `Bağlantı gönder` | `Send reset link` |
| Back link | `← Girişe dön` | `← Back to sign in` |
| Success toast (after submit) | `Sıfırlama bağlantısı gönderildi.` | `Reset link sent.` |

### Settings (PAGE-05)

Sidebar menu (5 tabs, exact labels from `settings.jsx:13-18`):

| Tab | TR | EN | Icon |
|-----|-----|-----|------|
| Profile | `Profil` | `Profile` | `<Icons.Users size={14}/>` |
| Preferences | `Tercihler` | `Preferences` | `<Icons.Settings size={14}/>` |
| Appearance | `Görünüm` | `Appearance` | `<Icons.Palette size={14}/>` |
| Notifications | `Bildirimler` | `Notifications` | `<Icons.Bell size={14}/>` |
| Security | `Güvenlik` | `Security` | `<Icons.Shield size={14}/>` |

Settings page header (left column, above tab list):

| Element | TR | EN |
|---------|-----|-----|
| Title | `Ayarlar` | `Settings` |
| Subtitle | `Kişisel tercihleriniz` | `Your preferences` |

**Güvenlik tab (D-32 scope):** `Parola` card only — 3 fields (`Mevcut parola`, `Yeni parola`, `Tekrar`) + `Parolayı güncelle` button. Do NOT render the prototype's `İki Faktörlü Kimlik Doğrulama` card or `Aktif Oturumlar` card (out of scope).

**Tercihler tab (D-31 scope):** Render all 6 prototype rows (`Dil`, `Başlangıç sayfası`, `Görünüm yoğunluğu`, `Hafta başlangıcı`, `Klavye kısayolları`, `Komut paleti (⌘K)`), but only **Dil** and **Görünüm yoğunluğu** wire to real AppContext. Others are visual-only (no state persistence, `disabled` attribute not needed — clicks just no-op).

### Toast Notifications (D-07)

**Position:** Bottom-right corner of viewport, `bottom: 20px; right: 20px;` stacked vertically with `gap: 8px` between multiple toasts (latest on top of stack, oldest at bottom).

**Dismiss:** Auto-dismiss after 4 seconds (default) or 6 seconds for errors. Manual dismiss via close button (X icon). Clickable outside the toast does NOT dismiss.

**Variants / color:**
- `success` — `color-mix(in oklch, var(--status-done) 10%, var(--surface))` background, `var(--status-done)` text and 1px border (25% mix)
- `error` — `color-mix(in oklch, var(--priority-critical) 10%, var(--surface))` background, `var(--priority-critical)` text
- `warning` — `color-mix(in oklch, var(--status-review) 10%, var(--surface))` background
- `info` — `color-mix(in oklch, var(--status-progress) 10%, var(--surface))` background

Copy is action-specific (use toast copy contract below). Structure: icon + message (+ optional action button).

| Scenario | TR | EN | Variant |
|----------|-----|-----|---------|
| Project created | `{project.name} oluşturuldu.` | `{project.name} created.` | success |
| Project status changed | `{project.name} · durum güncellendi.` | `{project.name} · status updated.` | success |
| Project archived | `{project.name} arşivlendi.` | `{project.name} archived.` | success |
| Project reactivated | `{project.name} yeniden aktif.` | `{project.name} reactivated.` | success |
| Settings saved | `Değişiklikler kaydedildi.` | `Changes saved.` | success |
| Password updated | `Parolanız güncellendi.` | `Password updated.` | success |
| API error (generic) | `Bir şeyler ters gitti. Lütfen tekrar deneyin.` | `Something went wrong. Please try again.` | error |
| Network / offline | `Bağlantı yok. İnternetinizi kontrol edin.` | `Offline. Check your connection.` | error |
| 401 (before redirect) | `Oturumunuz sona erdi.` | `Session expired.` | error — immediately navigate to `/session-expired` |
| 403 (permission) | `Bu işlem için yetkiniz yok.` | `You don't have permission for this action.` | error |
| Validation (form) | Inline under field, NOT toast. | Inline under field, NOT toast. | — |

**Implementation note (Claude's Discretion — D):** Build a minimal custom `ToastProvider` + `useToast()` hook in `Frontend2/components/toast/`. Do NOT add `sonner` or `react-hot-toast`. Styling must reuse the `color-mix` pattern from `AlertBanner` (`primitives.jsx:275-287`) — visual consistency with the rest of the design system.

---

## Component Contracts

Every layout below references prototype file:line for ambiguity resolution. Executor must match these.

### 1. Login Page Layout (PAGE-06) — `(auth)/login/page.tsx`

Source: `New_Frontend/src/pages/misc.jsx:3-114`.

```
┌──────────────────────────────────┬─────────────────────────────────────┐
│                                  │                                     │
│  [LogoMark] PMS  Proje Yön. Sis. │  [v2.4 — Customizable workflows]    │  <- position: fixed top
│                                  │                                     │
│                                  │  Waterfall'dan Scrum'a — tek        │
│     Tekrar hoş geldiniz          │  platform, sizin kurallarınız.      │  <- 36px, 600 weight
│     Hesabınıza giriş yaparak...  │                                     │
│                                  │  Özel yaşam döngüsü kuralları...    │
│     [ Email         ]            │                                     │
│     [ Parola        ]            │                                     │
│     ☑ Beni hatırla  Parolamı un. │  [120+ Aktif] [99.9% Uptime]        │  <- 2x2 stat grid
│                                  │  [4.8/5 User] [24/7 Support]        │
│     [ Giriş yap            ]     │                                     │
│                                  │                                     │
│     Yönetici onayı ile...        │                                     │
│                                  │                                     │
│  © 2025 Acme · Gizlilik · Şartl. │                                     │
└──────────────────────────────────┴─────────────────────────────────────┘
              40% width                          60% width
         (padding: 40px 60px)            (padding: 80px 60px)
```

**Grid:** `display: grid; grid-template-columns: 1fr 1.1fr; position: fixed; inset: 0; zIndex: 100; background: var(--bg)`.

**Left column:**
- Outer: `display: flex; flex-direction: column; padding: 40px 60px`
- Top: LogoMark (22px, primary-bg, "P" letter 700 weight) + `PMS` (15px 600) + tagline (11.5px muted)
- Middle: vertical-centered form, `max-width: 380px` — contains hero (28px 600), subtitle (13.5px muted, 1.6 line-height), fields (`LabeledField` component — already in prototype pattern), submit button (`variant="primary" size="lg"`, full-width)
- Bottom: 11px subtle footer, `display: flex; gap: 16px` — copyright + 2 legal links

**Right column (marketing panel):**
- `background: var(--surface-2); box-shadow: inset 1px 0 0 var(--border)` (left inset border only)
- Radial gradient overlay at `position: absolute; inset: 0`: `radial-gradient(800px 500px at 70% 30%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 60%), radial-gradient(500px 300px at 20% 80%, color-mix(in oklch, var(--status-progress) 10%, transparent), transparent 60%)`
- Content: `padding: 80px 60px; height: 100%; display: flex; flex-direction: column; justify-content: space-between`
- Top cluster: badge pill (`Sparkle` icon + version) → 36px 600 headline (-1 tracking, 1.15 line-height, max-width 480) → 14.5px muted paragraph (1.6 line-height, max-width 440)
- Bottom: 2x2 stat grid, each card `padding: 14, background: var(--surface), border-radius: 10, inset 1px border`

**LogoMark primitive:** 22x22px default, `border-radius: 6px, background: var(--primary), color: #fff, font-weight: 700, font-size: size * 0.55`, letter `P`. (Source: `misc.jsx:116-120`.) **Port to `Frontend2/components/logo-mark.tsx` if not already present from Phase 8.**

**Mobile responsive (< 768px):** Collapse to single column — hide right panel (or stack below form). Prototype is desktop-first; mobile is acceptable degradation. Planner: document a plan task for mobile login if in scope; otherwise defer.

### 2. Dashboard Layout (PAGE-01) — `(shell)/dashboard/page.tsx`

Source: `New_Frontend/src/pages/dashboard.jsx:213-231`.

**Outer:** `display: flex; flex-direction: column; gap: 20px`.

**Header row (flex, `alignItems: flex-end, justifyContent: space-between`):**
- Left: greeting block
  - Line 1: `Merhaba, {firstName}` — 24px 600, letter-spacing -0.6
  - Line 2: `{weekday}, {month} {day} · Güzel bir hafta olsun` — 13px, `var(--fg-muted)`, `margin-top: 4px`
- Right: **Manager / Member toggle**
  - Container: `display: inline-flex; background: var(--surface-2); border-radius: var(--radius-sm); padding: 3px; gap: 2px; box-shadow: inset 0 0 0 1px var(--border)`
  - Each button: `padding: 5px 12px; border-radius: 6px; font-size: 12.5px; font-weight: 600`
  - Active: `background: var(--surface); color: var(--fg); box-shadow: 0 1px 2px oklch(0 0 0 / 0.05), inset 0 0 0 1px var(--border)`
  - Inactive: `background: transparent; color: var(--fg-muted)`

**ManagerView content (when `view === "manager"`):** Exact source `dashboard.jsx:5-42`.
- **Row 1:** StatCards grid. `display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px`. Four cards with `label, value, delta, tone, icon` (see copy table above).
- **Row 2:** `display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px`.
  - Left (1.6fr): `Card padding={0}` wrapping the PortfolioTable. Header has `padding: 14px 16px; border-bottom: 1px solid var(--border)` with title block + filter/CSV buttons.
  - Right (1fr): vertical stack `display: flex; flex-direction: column; gap: 16px` — MethodologyCard on top, ActivityFeed below.

**MemberView content:** Render `MyTasks` page content in compact mode (per prototype — but full MyTasks is Phase 11). **For Phase 10, render a placeholder Card with copy `Görevlerim yakında bu panelde görüntülenecek.` / `My tasks will appear here soon.` and a Button link to `/my-tasks`.** This matches the "functional" bar in D-35 without blocking on Phase 11 scope.

**Manager/Member visibility rule (D-27):** `view` local state initializes from `currentUser.role`. Managers (role === "Admin" | "Manager") default to `manager`. Members default to `member`. User can flip via the toggle.

**StatCard component contract (dashboard-level component, not a primitive):**
- Source `dashboard.jsx:44-66`.
- Uses `Card padding={14}`.
- Layout: top row `display: flex; align-items: flex-start; justify-content: space-between`
  - Left column: label (11.5px 500, uppercase, letter-spacing 0.4, `var(--fg-muted)`), value below (28px 600, -0.8 tracking, tabular-nums, margin-top 6px)
  - Right column: 32x32 icon box, `border-radius: 8px`, `color-mix` background based on tone (`primary|info|success|danger|neutral`)
- Footer: delta text — 11.5px `var(--fg-subtle)`, margin-top 10px.
- **New in Phase 10:** Create `Frontend2/components/dashboard/stat-card.tsx`.

**PortfolioTable component contract (dashboard-level):**
- Source `dashboard.jsx:68-113`.
- Header row: `display: grid; grid-template-columns: 2fr 90px 120px 100px 90px 90px; padding: 10px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4; color: var(--fg-subtle); font-weight: 600; border-bottom: 1px solid var(--border)`.
- Data row: same grid. `padding: 11px 16px; align-items: center; font-size: 13px; border-bottom: 1px solid var(--border); cursor: pointer`. Hover: `background: var(--surface-2)`.
- Columns:
  1. Project name — mono key chip (10.5px 600, `var(--surface-2)` bg, `padding: 2px 6px; border-radius: 4`) + name (500 weight, ellipsis)
  2. Method — Badge, tone mapping: scrum→info, kanban→primary, waterfall→warning (prototype literal, `dashboard.jsx:85`). **For Phase 10, swap `methodology` string with `process_template.name` (D-19) but keep tone mapping by template name.**
  3. Lead — 20px Avatar + first-name only
  4. Team — AvatarStack max=3, size=20
  5. Progress — 48x4 bar (surface-2 bg) + primary fill + `%N` label (11px mono tabular)
  6. End date — `toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric" })`
- Data source (D-26): `GET /projects?status=ACTIVE` with expanded lead/members/progress fields.

**MethodologyCard component contract:**
- Source `dashboard.jsx:115-145`.
- Stacked segmented bar (scrum=status-progress, kanban=primary, waterfall=status-review) with percentages + legend. Height 8px, border-radius 999.

**ActivityFeed component contract:**
- Source `dashboard.jsx:147-175`.
- `Card padding={0}`, header `padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 600`.
- Rows: `padding: 10px 16px; display: flex; gap: 10px; align-items: center; border-bottom: 1px solid var(--border)` (omit on last).
- Each row: 22px Avatar + text block (first name bold + `var(--fg-muted)` description) + right-aligned 11px subtle mono time.
- Data source (D-26 + D-28): `GET /api/v1/activity?limit=20&offset=0` (global — Phase 10 backend addition). Empty state (no activity): copy `Henüz aktivite yok.`/`No recent activity.` centered 12.5px `var(--fg-subtle)` in 40px vertical padding inside the card.

### 3. Projects Page Layout (PAGE-02 + PROJ-04, PROJ-05) — `(shell)/projects/page.tsx`

Source: `New_Frontend/src/pages/projects.jsx:3-37`.

**Outer:** `display: flex; flex-direction: column; gap: 20px`.

**Header row (flex, `alignItems: flex-end, justifyContent: space-between`):**
- Left: page title `Projeler` (24px 600, -0.6 tracking) + subtitle `{N} proje · klavyeyle gezin <Kbd>↑↓</Kbd> <Kbd>↵</Kbd>` (13px muted)
- Right: `display: flex; gap: 8px; align-items: center`
  - SegmentedControl (status filter): 4 options `Tümü / Aktif / Bitti / Arşiv` — binds to `statusFilter` state, which param-maps to `GET /projects?status=ACTIVE|COMPLETED|ARCHIVED` (`Tümü` omits param).
  - Input (search): `icon={<Icons.Search size={14}/>}`, `placeholder="Proje ara"`, `size="md"`, width 220px. Filter applied client-side against the fetched list.
  - Button: `variant="primary" icon={<Plus size={14}/>}`, text `Yeni proje` — routes to `/projects/new`.

**Card grid:** `display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px`.

**Responsive breakpoints:**
- `>= 1280px`: 3 columns (prototype default)
- `768-1279px`: 2 columns
- `< 768px`: 1 column
- Implement via Tailwind `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` OR media queries in globals.css. Do NOT use `style={{ gridTemplateColumns }}` for responsive behavior.

**ProjectCard component contract (PROJ-04):**
- Source `New_Frontend/src/pages/projects.jsx:39-76`.
- Wrapper: `<Card interactive padding={0} onClick={go-to-detail} style={{ opacity: project.status === "archived" ? 0.6 : 1 }}>`
- **Top status strip** (4px band): `background` depends on status:
  - `ACTIVE` → `var(--primary)`
  - `COMPLETED` → `var(--status-done)`
  - `ON_HOLD` → `var(--status-review)`
  - `ARCHIVED` → `var(--fg-muted)` (strip still visible, but whole card is at opacity 0.6 so it appears desaturated)
  - `border-radius: var(--radius) var(--radius) 0 0` (top corners only)
- Inner: `padding: 16px`.
- Top row: project key chip (mono, 10.5px 600, muted) + project name (15px 600, -0.3 tracking) on the left; methodology Badge (`xs` size) + **status Badge** (NEW for PROJ-04, xs, tone per status table) on the right. Status Badge uses `dot` prop when appropriate.
- Description (12.5px muted, 1.5 line-height, `-webkit-line-clamp: 2`).
- Progress row: `marginTop: 14`, `display: flex; align-items: center; gap: 6px` — label (11px subtle) + flex:1 ProgressBar (4px height) + `%N` (11px mono 600 muted).
- Footer: `marginTop: 14; paddingTop: 14; borderTop: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between`
  - Left: AvatarStack (max=4, size=22) + `{active}/{total} görev` (12px muted)
  - Right: end date (11px subtle)
- **NEW in Phase 10 — 3-dot overflow menu** (PROJ-02): Top-right corner absolutely positioned or integrated into the top row. Click opens a dropdown menu with `Tamamla / Askıya Al / Arşivle` options (each opens confirm dialog per copy table above). When status is `ARCHIVED`, replace menu with `Aktif Et` single option (same confirm pattern).
  - Button style: `Button variant="ghost" size="icon"`, `<Icons.MoreH size={16}/>`.
  - Menu style: matches SidebarUserMenu dropdown (`shell.jsx:122-153`) — `background: var(--surface); border-radius: 8; box-shadow: var(--shadow-lg); padding: 4; z-index: 100`; each menu item `padding: 8px 10px; border-radius: 5; font-size: 12.5; hover bg: var(--surface-2)`.

**Empty state (no projects OR filter miss):** Center within the grid area — use `Card padding={40}` with centered flex column: illustration/icon (`<Icons.Folder size={32}/>` muted color) + heading (14px 600) + sub (12.5px muted) + `Yeni proje` Button (link or primary).

### 4. Create Project Wizard (PROJ-01) — `(shell)/projects/new/page.tsx`

Source: `New_Frontend/src/pages/create-project.jsx` (393 lines).

**Outer container:** `max-width: 900px; margin: 0 auto`.

**Step indicator (top strip, always visible):** `display: flex; align-items: center; gap: 0; margin-bottom: 32px`. For each step `s.n in [1,2,3,4]`:
- Connector line (index > 0): `flex: 1; height: 2px; margin: 0 8px; border-radius: 1px`, background depends on relation to current step:
  - `step > s.n` → `var(--status-done)` (completed line)
  - `step === s.n` → `var(--primary)` (current arrival)
  - `step < s.n` → `var(--border)` (future)
  - `transition: background 0.2s`
- Circle + label pair:
  - Circle (28x28, 50% radius, flex centered, 12px 600):
    - Completed (`step > s.n`): bg `var(--status-done)`, fg `var(--primary-fg)`, content `<Icons.Check size={13}/>`
    - Current (`step === s.n`): bg `var(--primary)`, fg `var(--primary-fg)`, content number, `box-shadow: 0 0 0 3px color-mix(in oklch, var(--primary) 20%, transparent)` (focus ring)
    - Future: bg `var(--surface-2)`, fg `var(--fg-muted)`, content number, `box-shadow: inset 0 0 0 1px var(--border)`
  - Label (12.5px, 600 if current else 500, color: current=`var(--fg)` else `var(--fg-muted)`)
  - Gap between circle and label: 8px
- Step labels (exact strings): `Temel Bilgiler` / `Metodoloji` / `Yaşam Döngüsü` / `Yapılandırma`

**Step content panels:**

**Step 1 — Temel Bilgiler:** Wrapped in `<Card padding={24}>`. Heading 18px 600, subtitle 13px muted (marginBottom 20). Fields use `ModalField` wrapper (label + required marker + input). Inputs use `wizInputStyle` — `height: 36; padding: "0 10px"; font-size: 13.5; background: var(--surface-2); border: 0; border-radius: var(--radius-sm); box-shadow: inset 0 0 0 1px var(--border); font-family: var(--font-sans); width: 100%`. Select uses `wizSelectStyle` which adds appearance:none + custom chevron SVG.

Row grid for date pair: `display: grid; grid-template-columns: 1fr 1fr; gap: 12`.

**Step 2 — Metodoloji:** NO wrapping Card. Heading + subtitle, then 2 rows × 3 cols of TemplateCards (`display: grid; grid-template-columns: repeat(3, 1fr); gap: 12` on each row; second row adds `margin-top: 12`).

TemplateCard (`create-project.jsx:366-373`): `<Card interactive padding={14} onClick={onSelect} style={{ boxShadow: selected ? "0 0 0 2px var(--primary), var(--shadow)" : "var(--shadow)" }}>`. Inside: name (14px 600) + mode Badge (marginTop 6) + description (12px muted, 1.5 line-height, 2-line clamp).

**Step 3 — Yaşam Döngüsü:** Heading + sub, then grid `1fr 280px gap: 16`:
- Left: `<Card padding={0} style={{ overflow: "hidden" }}>` with `height: 420` canvas area. For Phase 10, render a READ-ONLY static preview — list of nodes as horizontal chips/cards with directional arrows between them (since full WorkflowCanvas is Phase 12). If `template.default_workflow.nodes` is empty, render center-aligned empty state: `Önce metodoloji seçin` or `Bu şablonun varsayılan yaşam döngüsü yok.`
- Right: `<Card padding={14}>` with 3 vertical sections (gap: 14px):
  1. `Akış Modu` (uppercase 11px 600 subtle label) + SegmentedControl (xs) with 4 mode options + descriptive text (11px muted, 1.5 line-height) below. **Mode is read-only in Phase 10** — user cannot change it (they see the template's mode). Disable the SegmentedControl by preventing `onChange`.
  2. `Seçim` — since canvas is static/read-only, render `Yaşam döngüsü daha sonra Settings'den yapılandırılabilir.` (D-20)
  3. `Doğrulama` — three ValidationItem rows (3 green ticks by default — assume template is valid)

**Step 4 — Yapılandırma:** `display: flex; flex-direction: column; gap: 16px`. Contains 4 Cards (all `padding=16`):
1. `Board Kolonları` — column list with drag handle (⠿) + input + numeric WIP limit + X remove button + `Kolon Ekle` button
2. `Görev Alanları` — toggle list (9 rows, per prototype)
3. `Davranış Kuralları` — 4 toggle rows
4. `Üye Davet` — search input + invited chips + suggestion list

**Phase 10 Step 4 simplification (RECOMMENDATION from executor — open question for planner):** The backend `POST /projects` endpoint from Phase 9 may not accept all 4 cards' worth of config. Planner should cross-reference Phase 9's project creation DTO and only render cards/fields that the API accepts. Defer the rest (mark disabled or omit). Worst case: show all cards but only persist the subset, and show a toast `{N} ayar daha sonra yapılandırılacak.` (`{N} settings will be configured later.`).

**Footer buttons (sticky or fixed below step content):** `display: flex; align-items: center; gap: 8; margin-top: 24; justify-content: flex-end`.
- Step > 1: `Button variant="ghost"` text `Geri`
- Spacer `flex: 1`
- If step < 4: `Button variant="primary" disabled={!canProceed()}` text `Devam`
- If step === 4: `Button variant="primary" icon={<Icons.Check size={13}/>}` text `Projeyi Oluştur`

**Validation rule (D-17):**
- Step 1 canProceed: `name.trim().length > 0 && key.trim().length > 0` (lead_id defaults so not a blocker)
- Step 2 canProceed: `methodology !== ""`
- Step 3 canProceed: always `true` (read-only preview)
- Step 4 canProceed: always `true` (all fields optional or have defaults)

**sessionStorage draft (D-21):** Save entire form state to `spms_wizard_draft` on every `setStep` call AND on every field change (debounced 300ms). On mount, if `sessionStorage.getItem('spms_wizard_draft')` exists, hydrate state. Clear on successful submit or explicit cancel. Provide a "Taslak geri yüklendi." / "Draft restored." info toast when hydration occurs.

**URL step routing (D-16):** Use `useSearchParams()` — `/projects/new?step=1`. `setStep(n)` does `router.replace(`/projects/new?step=${n}`, { scroll: false })`. Browser back/forward navigates steps.

### 5. Settings Page (PAGE-05) — `(shell)/settings/page.tsx`

Source: `New_Frontend/src/pages/settings.jsx:3-38`.

**Outer:** `display: grid; grid-template-columns: 220px 1fr; gap: 24`.

**Left column (220px):** vertical nav — heading block (`Ayarlar` 20px 600 + `Kişisel tercihleriniz` 12px muted, marginBottom 16) followed by button list.
- Each nav button: `display: flex; align-items: center; gap: 10; padding: 8px 10px; border-radius: 6; font-size: 13; text-align: left`
- Active: `color: var(--fg); background: var(--accent); font-weight: 600; icon color: var(--primary)`
- Inactive: `color: var(--fg-muted); background: transparent; font-weight: 500; icon color: var(--fg-subtle)`

**Right column:** renders active section (Profile / Preferences / Appearance / Notifications / Security). Each section: `<Card padding={20}>` wrapping content. Multi-card sections use `display: flex; flex-direction: column; gap: 14 or 16`.

**ProfileSection (`settings.jsx:40-67`):**
- Heading 15px 600 + subtitle 12px muted (marginBottom 20)
- Avatar row: 72px Avatar + Upload button + "PNG, JPG — max 2MB" helper
- 2-col grid (6 fields): Ad Soyad / Görünen ad / Email / Telefon / Departman / Unvan
- Submit row: primary `Değişiklikleri kaydet` + ghost `Vazgeç`
- API wiring: `PUT /auth/me` for profile fields, `POST /auth/me/avatar` for photo upload

**LabeledField primitive (used in Profile + Security — `settings.jsx:69-74`):** label (11.5px 600 muted) + input (height 34, padding "0 10px", font 13px, bg `var(--surface-2)`, border 0, radius var(--radius-sm), box-shadow inset 0 0 0 1px var(--border)). **Port to `Frontend2/components/primitives/labeled-field.tsx` if not already present — check Phase 8 output.** If absent, add as a Phase 10 task.

**PreferencesSection (`settings.jsx:76-120` — D-31 scope):**
- Heading + sub (marginBottom 20)
- Rows via `PrefRow` component (`display: grid; grid-template-columns: 180px 1fr; padding: 14px 0; border-top: 1px solid var(--border); align-items: center; font-size: 13`)
- Rows (6 total):
  1. `Dil` — inline SegmentedControl style (TR/EN) — WIRED to `useApp().setLanguage`
  2. `Başlangıç sayfası` — select — VISUAL ONLY
  3. `Görünüm yoğunluğu` — 3-option inline control (Sıkı/Dengeli/Rahat) — WIRED to `useApp().setDensity`
  4. `Hafta başlangıcı` — 2-option inline control (Pzt/Paz) — VISUAL ONLY
  5. `Klavye kısayolları` — Toggle — VISUAL ONLY
  6. `Komut paleti (⌘K)` — Toggle — VISUAL ONLY

**AppearanceSection (`settings.jsx:135-257`):** Multi-card section — 4 cards.
1. `Hazır Temalar` — 6-preset grid (3 cols). Each preset tile shows 4 color swatches + name + mode badge (Moon/Sun icon). Click calls `useApp().applyPreset(id)`.
2. `Marka Rengi (OKLCH)` — split layout with sliders + preview. Click `Uygula` calls `applyCustomBrand`.
3. `Özel Temalarım` — 4-col grid of saved custom presets (or empty dashed-border placeholder).
4. `Layout Tokens` — PrefRow for `Köşe yuvarlaması` (Slider 0-18px) + `Kenar çubuğu` (Expanded/Collapsed).

Already wired to AppContext in Phase 8 — executor just needs to implement the visual markup using `useApp()` state (`preset`, `mode`, `brandLight/Chroma/Hue`, `customColors`, `customPresets`, `radius`, `sidebarCollapsed`).

**NotifSection (`settings.jsx:271-294` — visual-only per Phase 10):**
- 6 row grid `1fr 70px 70px 70px` with Email / In-app / Desktop column headers below last row.
- Toggles are visual-only; no API persistence in Phase 10 (backend endpoint TBD). Clicks flip local state but do not POST.

**SecuritySection (`settings.jsx:296-334`, D-32 scope):** Render ONLY the first Card (`Parola`). Omit 2FA and Active Sessions cards.
- 3 fields: `Mevcut parola` (full-width) → 12px spacer → 2-col grid `Yeni parola / Tekrar`.
- Submit: primary `Parolayı güncelle` calls `PUT /auth/me` with `{current_password, new_password}` body.
- Client validation: `new_password === confirm`, min-length 8. If mismatch/short, show inline error (red 12px text) under the relevant field; do NOT hit API.

---

## Interaction Patterns

### Card hover (interactive) — from `primitives.jsx:121-142`
```
default: box-shadow: var(--shadow), var(--inset-card);
hover:   box-shadow: var(--shadow-md), var(--inset-card); transform: translateY(-1px);
transition: box-shadow 0.12s, transform 0.12s;
```
Already implemented in `Frontend2/components/primitives/card.tsx`. Use `<Card interactive>`.

### Button press (all variants) — from `primitives.jsx:110-114`
```
onMouseDown: transform: translateY(0.5px);
onMouseUp:   transform: translateY(0);
onMouseLeave: transform: translateY(0);
transition:  transform 0.08s, background 0.1s, box-shadow 0.1s;
```
Already in `button.tsx`. No additional work.

### Focus outline — from `globals.css:114`
```
input:focus-visible, textarea:focus-visible, button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
```
Already in `globals.css`. Executor: do NOT override this in component styles.

### Loading states
- **Page-level loading (dashboard, projects list):** Skeleton loaders mirroring final layout. Use `Card padding={16}` with gray placeholder bars:
  - Bar background: `var(--surface-2)`, border-radius: `var(--radius-sm)`, height: `16px` (for text) or `32px` (for values).
  - `@keyframes pulse` (NEW — add to `globals.css`): `0% { opacity: 0.6 } 50% { opacity: 1 } 100% { opacity: 0.6 }; 1.5s infinite ease-in-out`.
- **Button-level loading (submit actions):** Replace button text with spinner. Spinner: 12x12 SVG circular indeterminate, stroke `currentColor`, `animation: spin 0.8s linear infinite`.
- **TanStack Query integration:** Use `isLoading` for first fetch (skeleton), `isFetching` for subsequent updates (dim content to opacity 0.6, keep visible).

### Error states
- **Page-level error (data fetch failed):** In-grid `Card padding={24}` with AlertBanner tone=danger at top:
  - Heading: `Bir şeyler ters gitti` / `Something went wrong`
  - Body: `{error.message || "Beklenmedik hata."}` (12.5px muted, 1.6 line-height)
  - Action: primary Button `Tekrar dene` / `Try again` — triggers `refetch()`
- **Field-level (form validation):** Inline under field, 11.5px `var(--priority-critical)`, margin-top 4px. No icon.
- **Global API error:** Toast (see Toast contract above).

### Modal / Dialog (PROJ-02 confirmation + PROJ-03 reactivate)

Overlay pattern — **must be implemented for PROJ-02 status confirmations.** Source reference: prototype doesn't have an explicit modal primitive in the Phase 10 scope, so executor builds one (D-Claude's Discretion):

- **Backdrop:** `position: fixed; inset: 0; background: oklch(0 0 0 / 0.4); backdrop-filter: blur(2px); z-index: 200; display: flex; align-items: center; justify-content: center`
- **Dialog:** `max-width: 440; width: calc(100% - 40px); background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl), var(--inset-card); padding: 24`
- **Content:**
  - Title (16px 600, margin-bottom 8)
  - Body (13px muted, 1.6 line-height, margin-bottom 20)
  - Action row: `display: flex; gap: 8; justify-content: flex-end`
    - Secondary cancel (`Button variant="ghost"` text `İptal` / `Cancel`)
    - Primary confirm (`Button variant="primary"` text `Onayla` / `Confirm`) — for destructive-style actions (archive), also consider `Button variant="danger"` per user preference; in Phase 10 use `primary` for all three (Tamamla/Askıya Al/Arşivle) per D-25 uniformity.
- **Behavior:**
  - Open: focus moves to Cancel button.
  - `Esc` key closes (treats as Cancel).
  - Click backdrop closes.
  - `Enter` key on Cancel or Confirm triggers that button.
  - Tab order: Cancel → Confirm → Cancel (trap focus inside dialog).
  - Scroll-lock body while open.

Implementation file: `Frontend2/components/dialog/confirm-dialog.tsx`.

### Sidebar dropdown menu (reused for PROJ-02 3-dot menu)

Source: `shell.jsx:122-153` (SidebarUserMenu).
- Click-outside dismisses: `document.addEventListener("mousedown", handler)` inside `useEffect` with `open` as dep.
- Escape key dismisses.
- `position: absolute; background: var(--surface); border-radius: 8; box-shadow: var(--shadow-lg); padding: 4; z-index: 100`.
- Each menu item: `padding: 8px 10px; border-radius: 5; font-size: 12.5; display: flex; align-items: center; gap: 8`. Hover `background: var(--surface-2)`.
- Dividers: `height: 1; background: var(--border); margin: 4px 0`.

### Archived project — disable edit actions (D-34)

When `project.status === "ARCHIVED"`:
- All `<input>`, `<textarea>`, `<select>`, `<button>` inside the project-scoped page area receive `disabled` attribute programmatically.
- Visual: `opacity: 0.5; cursor: not-allowed`.
- The only interactive element is the `Aktif Et` button in the AlertBanner (PROJ-03).

Implementation pattern: use a React Context `ProjectContext` with `isArchived` flag; components read it and conditionally set `disabled` prop. Phase 10 scope: applies to the project overflow menu on card (show only `Aktif Et`) + project-detail page header dropdown (Phase 11 consumer).

### Localization switching

- `useApp().language` → `tr | en`.
- Inline pattern: `const T = (tr, en) => lang === "tr" ? tr : en;` (seen in all prototype pages — projects.jsx, create-project.jsx, misc.jsx).
- Centralized pattern: `import { t } from "@/lib/i18n"; t("nav.dashboard", lang)`.
- **Executor rule:** For strings that appear in 1-2 places, use inline `T(tr, en)`. For strings reused > 2 times, add to `Frontend2/lib/i18n.ts` STRINGS tree and call `t()`. Match prototype choices where possible.

---

## Responsive Behavior

Prototype is desktop-first. Breakpoints (pixel-exact match to Tailwind defaults where possible):

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Sidebar auto-collapses. Single-column grids. Stat cards stack 1-col. Projects grid 1-col. Dashboard row 2 stacks vertically. Login stacks (hide right marketing panel). |
| Tablet | 768-1023px | Sidebar visible but collapsed (56px). Projects grid 2-col. Dashboard row 2 stacks (PortfolioTable full-width, side cards below). |
| Laptop | 1024-1279px | Full sidebar expanded. Projects grid 2-col. Dashboard grid 1.6fr/1fr (default). |
| Desktop | >= 1280px | Projects grid 3-col. All prototype defaults. |

**Header (52px):** Sticky top on all breakpoints. On mobile, collapse search Input to icon button (expands on tap).

**Sidebar transition:** 180ms width easing (`transition: width 0.18s ease`) — already in `shell.jsx:74`. Do NOT change.

**Settings page:** `220px 1fr` grid → on mobile collapses to top-tab layout (horizontal scrollable tab bar above content). Use `Tabs` primitive for mobile variant.

**Wizard:** `max-width: 900; margin: 0 auto` on all sizes — naturally shrinks. Step indicator labels hide on mobile (< 640px) — only circles + connectors remain.

---

## Accessibility (A11y) Contract

| Requirement | Target | Evidence / Implementation |
|-------------|--------|---------------------------|
| Text contrast | WCAG AA (4.5:1 for body) | All text on `var(--bg)` meets AA. Prototype's `var(--fg-subtle)` (0.62 L) on `var(--surface-2)` (0.975 L) is near-AA borderline — reserve for non-essential metadata only (time labels, hints). |
| Focus indicators | 2px primary-ring outline, 1px offset | Already in `globals.css:114`. Do NOT disable. |
| Keyboard navigation | Tab through all interactives; Esc closes modals/menus | Implemented per Sidebar dropdown pattern. PROJ-02 confirm dialog must trap focus. |
| Skip-to-content | not required in Phase 10 | Can defer — sidebar first-tab is sufficient for keyboard users in current scope. |
| Status announcements | Toast uses `role="status"` (or `role="alert"` for error variant) | Implement in ToastProvider. |
| Form labels | Every `<input>` has an associated `<label>` (LabeledField primitive handles this) | Already in LabeledField pattern. |
| Required fields | Visual asterisk + `required` attribute | ModalField component accepts `required` prop. Use it on wizard step 1 Name and Key. |
| Color-only signals | Status badges use Badge component which includes the TEXT LABEL (not color alone) + optional dot | Badge tone provides color, text provides label (e.g. `Aktif`) — meets 1.4.1. |
| Motion | No auto-playing animation > 5s; `prefers-reduced-motion` honored | Add to `globals.css`: `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` |
| Language attribute | `<html lang={language}>` | Set dynamically from `useApp().language` in root layout. |
| Button labeling | Icon-only buttons have `title` prop OR `aria-label` | Pattern in `shell.jsx:170, 190` — executor replicates with both `title` and `aria-label` for clarity. |

---

## Page Route Map (Phase 10)

| Route | File | Requirement | Layout |
|-------|------|-------------|--------|
| `/` | `app/page.tsx` (existing) | — | redirects to `/dashboard` (Phase 8) |
| `/login` | `app/(auth)/login/page.tsx` (NEW) | PAGE-06 | 2-col fixed (misc.jsx) |
| `/session-expired` | `app/(auth)/session-expired/page.tsx` (NEW, D-10) | PAGE-06 | centered narrow card |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` (NEW) | PAGE-06 | 2-col fixed (misc.jsx mode=forgot) |
| `/dashboard` | `app/(shell)/dashboard/page.tsx` (replace stub) | PAGE-01 | shell with 20px-gap flex |
| `/projects` | `app/(shell)/projects/page.tsx` (replace stub) | PAGE-02, PROJ-04, PROJ-05 | shell with card grid |
| `/projects/new` | `app/(shell)/projects/new/page.tsx` (NEW) | PROJ-01 | shell with 900px centered wizard |
| `/settings` | `app/(shell)/settings/page.tsx` (replace stub) | PAGE-05 | shell with 220px/1fr grid |

**Middleware:** `Frontend2/middleware.ts` protects all `(shell)/*` routes by checking `auth_session` cookie (D-13). Unauthenticated access redirects to `/login`.

**AuthProvider + QueryClientProvider wiring (D-04, D-08):**
- `app/layout.tsx` (root): wraps with `<AppProvider>` + `<AuthProvider>`.
- `app/(shell)/layout.tsx`: wraps with `<QueryClientProvider>` (only authenticated pages need queries).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — policy prohibits shadcn in v2.0 (D-01 Phase 8) | not applicable |
| third-party | none | not applicable |
| Internal (Frontend2 primitives) | All Phase 10 pages reuse from `@/components/primitives` (16 components already vetted in Phase 8) | pre-vetted; see Phase 8 verification |

---

## Traceability — requirement to page area

| Requirement | UI-SPEC section | Prototype source |
|-------------|-----------------|------------------|
| PAGE-01 Dashboard | Component Contracts §2, Copywriting §Dashboard | `New_Frontend/src/pages/dashboard.jsx` |
| PAGE-02 Projects | Component Contracts §3, Copywriting §Projects | `New_Frontend/src/pages/projects.jsx` |
| PAGE-05 Settings | Component Contracts §5, Copywriting §Settings | `New_Frontend/src/pages/settings.jsx` |
| PAGE-06 Login/Auth | Component Contracts §1, Copywriting §Login | `New_Frontend/src/pages/misc.jsx:3-114` |
| PROJ-01 Create Wizard | Component Contracts §4, Copywriting §Create Wizard | `New_Frontend/src/pages/create-project.jsx` |
| PROJ-02 Status management | Interaction Patterns §Modal, Copywriting §Status dropdown + Dialog | `New_Frontend/src/pages/project-detail.jsx:21-22` (header badge) + new Phase 10 card menu |
| PROJ-03 Archive banner | Copywriting §Archive AlertBanner, Interaction §Archived disable | Reuses `AlertBanner` primitive (`primitives.jsx:275-287`) |
| PROJ-04 Status badges | Color §Status colors, Component Contracts §3 (ProjectCard) | `New_Frontend/src/pages/projects.jsx:48-49`, `project-detail.jsx:21-22` |
| PROJ-05 Status filter | Component Contracts §3 (header), Copywriting §Projects | `New_Frontend/src/pages/projects.jsx:22-27` |

---

## Open Questions for Planner

These are NOT blocking but must be resolved at plan time:

1. **Wizard step 4 scope:** Which sub-fields does `POST /api/v1/projects` accept per Phase 9 DTO? Render only those; the rest are Phase 11+.
2. **MemberView placeholder:** Phase 10 dashboard MemberView shows a placeholder card pointing to `/my-tasks` (PAGE-04 is Phase 11). Confirm copy + Button target.
3. **LabeledField primitive:** Was it added in Phase 8 or is it still inline? If inline, add `Frontend2/components/primitives/labeled-field.tsx` as a Phase 10 task.
4. **Status change API shape:** Does `PATCH /projects/{id}` accept `{status: "COMPLETED"}` directly, or is there a dedicated `PATCH /projects/{id}/status` endpoint? (D-25 references the status change endpoint generically.)
5. **ProjectCard 3-dot menu button placement:** Top-right absolute (on top strip area) OR integrated into top row next to methodology Badge? Prototype doesn't show this menu (it's a Phase 10 addition). Recommend: top-right of inner padded area, next to methodology+status Badge cluster, so the overflow menu icon sits in the same baseline as the badges.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (all TR/EN pairs canonical from prototype)
- [ ] Dimension 2 Visuals: PASS (all component layouts mapped to prototype file:line)
- [ ] Dimension 3 Color: PASS (60/30/10 satisfied by `--bg`/`--surface`/`--primary` with accent reserved-for list)
- [ ] Dimension 4 Typography: PASS (14px body + declared scale with font weights 500/600 only)
- [ ] Dimension 5 Spacing: PASS (extracted exact prototype values; deviations from 8pt grid documented as intentional)
- [ ] Dimension 6 Registry Safety: PASS (no shadcn, no third-party — internal primitive reuse only)

**Approval:** pending
