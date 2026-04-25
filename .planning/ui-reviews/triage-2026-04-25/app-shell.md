# App Shell (Sidebar + Header + Layout) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-app-shell
**Prototip kaynak:**
- `New_Frontend/src/shell.jsx` (8-241)
- `New_Frontend/src/app.jsx` (PageRouter + auth gating, 134-198)
- `New_Frontend/src/i18n.jsx` (nav copy)
- `New_Frontend/src/icons.jsx` (sidebar/header ikonları)
- `New_Frontend/src/primitives.jsx` (Avatar, Badge, Button, Input, Kbd)
- `New_Frontend/src/data.jsx` (CURRENT_USER, NOTIFICATIONS)

**Implementasyon kaynak:**
- `Frontend2/app/(shell)/layout.tsx`
- `Frontend2/components/app-shell.tsx`
- `Frontend2/components/sidebar.tsx`
- `Frontend2/components/header.tsx`
- `Frontend2/components/header/create-button.tsx`
- `Frontend2/components/header/search-autocomplete.tsx`
- `Frontend2/components/breadcrumb.tsx`
- `Frontend2/components/logo-mark.tsx` (kullanılmıyor — ölü dosya)
- `Frontend2/components/toast/index.tsx`
- `Frontend2/context/app-context.tsx`
- `Frontend2/context/auth-context.tsx`
- `Frontend2/context/task-modal-context.tsx`
- `Frontend2/app/layout.tsx` (root + theme-init script + AppProvider/AuthProvider)
- `Frontend2/middleware.ts` (auth gate)

**Bilinen intentional extras:** Yok

---

## TL;DR Özet
- **Eksik elementler:** 11
- **Layout/şekil farkı:** 8
- **Bilinmeyen extras:** 3
- **Bilinen extras:** 0
- **Hatalı kod:** 9

### EN KRİTİK 3 MADDE
1. **Header'da Notification Bell + okunmamış badge tamamen eksik** (prototip `shell.jsx:180-189`). Ayrıca Help (`?`) ikonu da yok. Prototipin sağ üst köşesi: Search → Create → Bell(badge) → Help → LANG. Implementasyon: Search → Create → Mode → LANG. Bu, kullanıcının bildirim akışına erişiminin shell'den koparılması demek.
2. **Sidebar'da kullanıcı verisi sahte (`PLACEHOLDER_USER`)** — `sidebar.tsx:152` ve 211/231'de gerçek auth kullanıcısı yerine "User"/"Member" yazılı. `useAuth()` import edilmiş ama sadece `logout` için kullanılıyor; gerçek `user.name`, `user.role`, avatar inisiyalleri hiç bağlanmamış. Üstelik admin nav item her kullanıcıya açık (prototipte `isAdmin` koşulu var, `shell.jsx:55,83`).
3. **Sidebar collapse butonu prototipe göre çift kaynaktan kontrol ediliyor (yorum yanlış) ve prototip Sidebar üstündeki `PanelLeft` toggle aslında Header'da** — fakat prototipte tam tersi: Header zaten `PanelLeft` ile sidebar'ı kapatır (`shell.jsx:170-173`). Implementasyon doğru yere koymuş ancak Sidebar koddaki yorum (`sidebar.tsx:5-7`) "single source" diyor; gerçekte AppContext'in localStorage senkronu hidrasyonda fark yaratıyor (bkz. 5.1).

---

## 1. EKSİK ELEMENTLER

### 1.A — Sidebar

#### 1.A.1 Sidebar logo ikincil satırı `acme.co` workspace ipucu eksik
- **Prototipte:** `New_Frontend/src/shell.jsx:20`
- **Olması gereken implementasyon yeri:** `Frontend2/components/sidebar.tsx:75` (SidebarLogo)
- **Görsel/davranış:** Prototipte `v2.4 · acme.co` yazıyor, implementasyonda sadece `v2.4` var. Workspace adı (multi-tenant cue) düşmüş.
- **Prototip kod alıntısı:**
  ```jsx
  <div className="mono" style={{ fontSize: 9.5, color: "var(--fg-subtle)", marginTop: 2 }}>v2.4 · acme.co</div>
  ```
- **Öncelik:** Low
- **Düzeltme önerisi:** Aynı satıra workspace string'i ekle veya eksikse `acme.co` literal'ini koy. (Implementasyonda `fontSize: 10.5` yazılmış, prototipte `9.5`; bunu da düzelt — bkz. 2.A.1).

#### 1.A.2 Admin nav item için `isAdmin` koşulu eksik (sadece Admin'lere gösterilmeli)
- **Prototipte:** `New_Frontend/src/shell.jsx:55,83-90`
- **Olması gereken implementasyon yeri:** `Frontend2/components/sidebar.tsx:404-415`
- **Görsel/davranış:** Prototipte `isAdmin = window.SPMSData.CURRENT_USER.role === "Admin"` ve sadece bu doğruysa "YÖNETİM" başlığı + Shield ikonlu Admin nav item render ediliyor. Implementasyonda bu kontrol yok; **HER kullanıcıya** Admin Paneli görünüyor.
- **Prototip kod alıntısı:**
  ```jsx
  const isAdmin = window.SPMSData.CURRENT_USER.role === "Admin";
  // ...
  {isAdmin && (<>...<NavItem icon={<Icons.Shield/>} label={t("nav.admin")} ...
  ```
- **Öncelik:** Critical (güvenlik / RBAC görünürlük sızıntısı)
- **Düzeltme önerisi:** `useAuth()`'tan `user`'ı al; `const isAdmin = user?.role === "Admin"` ile gate'le. Aynı şekilde "YÖNETİM" başlığı ve dikey separator de koşula bağlansın.

#### 1.A.3 SidebarUserMenu açılır panelde "My Profile" link kırık + Admin shortcut eksik
- **Prototipte:** `New_Frontend/src/shell.jsx:124-143`
- **Olması gereken implementasyon yeri:** `Frontend2/components/sidebar.tsx:256-283`
- **Görsel/davranış:** Prototipte 3 link var: My Profile (`router.go("user-profile", { userId: user.id })`), Settings, **Admin Panel (sadece Admin için)**. Implementasyonda My Profile `<button>` hiçbir yere yönlendirmiyor (sadece `setOpen(false)`), Admin shortcut hiç yok.
- **Prototip kod alıntısı:**
  ```jsx
  <button onClick={() => { router.go("user-profile", { userId: user.id }); setOpen(false); }} ...>
    <Icons.Users size={13} .../>{lang === "tr" ? "Profilim" : "My Profile"}
  </button>
  ...
  {user.role === "Admin" && (
    <button onClick={() => { router.go("admin"); setOpen(false); }} ...>
      <Icons.Shield size={13} .../>{lang === "tr" ? "Yönetim Paneli" : "Admin Panel"}
    </button>
  )}
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Profil linkini kullanıcının ID'sine bağla (`/users/{id}` ya da mevcut profile route). Admin item'ı `isAdmin && <Link href="/admin">…` olarak ekle. Menü item'larında ikonlar (Users, Settings, Shield, LogOut) prototipte var, implementasyonda sadece LogOut var; diğer 3'ü de ekle.

#### 1.A.4 Sidebar collapsed modda Admin separator hiçbir zaman çıkmıyor (admin gate hatası bağlantılı)
- **Prototipte:** `New_Frontend/src/shell.jsx:86`
- **Olması gereken implementasyon yeri:** `Frontend2/components/sidebar.tsx:404-408`
- **Görsel/davranış:** Implementasyonda separator var ama Admin koşulundan bağımsız her zaman çiziliyor; prototipte `isAdmin && collapsed` koşullu.
- **Prototip kod alıntısı:**
  ```jsx
  {isAdmin && (<>
    {!collapsed && <div ...>YÖNETİM</div>}
    {collapsed && <div style={{ height: 1, background: "var(--border)", margin: "8px 8px" }}/>}
    <NavItem ... />
  </>)}
  ```
- **Öncelik:** High (1.A.2 ile birlikte düzeltilmeli)
- **Düzeltme önerisi:** Tüm admin bloğunu `isAdmin && (<>…</>)` içine al.

### 1.B — Header

#### 1.B.1 Notification Bell + okunmamış mesaj badge'i eksik
- **Prototipte:** `New_Frontend/src/shell.jsx:180-189` (`unread` sayısı `SPMSData.NOTIFICATIONS.filter(n => n.unread).length`)
- **Olması gereken implementasyon yeri:** `Frontend2/components/header.tsx` (102-113 satırları arası, theme toggle'dan önce)
- **Görsel/davranış:** Prototipte sağ üstte `<Icons.Bell/>` ikonu ve okunmamış sayı `--priority-critical` zeminli yuvarlak rozet ile (`bg`'ye karşı 2px box-shadow ile yüzeyden ayrılmış). İmplementasyonda bell + badge tamamen yok.
- **Prototip kod alıntısı:**
  ```jsx
  <button style={{ position: "relative", color: "var(--fg-muted)", padding: 6, borderRadius: 6 }}>
    <Icons.Bell/>
    {unread > 0 && <span style={{
      position: "absolute", top: 3, right: 3,
      background: "var(--priority-critical)", color: "#fff",
      fontSize: 9, fontWeight: 700, minWidth: 14, height: 14, padding: "0 3px",
      borderRadius: 7, ...
      boxShadow: "0 0 0 2px var(--bg)",
    }}>{unread}</span>}
  </button>
  ```
- **Öncelik:** Critical (kullanıcının bildirim akışına shell'den erişimi yok)
- **Düzeltme önerisi:** Bildirim servisi bağlanana kadar mock count ile bile bell'i geri koy. Tıklayınca `/notifications` veya `/inbox`'a gitsin.

#### 1.B.2 Help ikonu eksik
- **Prototipte:** `New_Frontend/src/shell.jsx:190`
- **Olması gereken implementasyon yeri:** `Frontend2/components/header.tsx` (Bell'den sonra, mode toggle'dan önce)
- **Görsel/davranış:** Yardım sembolü (`Icons.Help`, lucide `HelpCircle` muadili). Tooltip TR: "Yardım", EN: "Help".
- **Prototip kod alıntısı:**
  ```jsx
  <button style={{ color: "var(--fg-muted)", padding: 6, borderRadius: 6 }} title={lang === "tr" ? "Yardım" : "Help"}>
    <Icons.Help/>
  </button>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** lucide `HelpCircle` ile aynı `iconButtonStyle`'ı kullanan buton ekle. Şu an handler'sız da olabilir (prototipte de boş).

#### 1.B.3 Header'da theme mode toggle (Moon/Sun) — implementasyonda var ama prototipte YOK
- Bu madde "BİLİNMEYEN EXTRAS" altında 3.1 olarak işleniyor.

#### 1.B.4 Create button etiketi prototipe göre hatalı / eksik
- **Prototipte:** `New_Frontend/src/shell.jsx:179` — `Görev oluştur` / `Create task` (i18n key `common.createTask`)
- **Olması gereken implementasyon yeri:** `Frontend2/components/header/create-button.tsx:29`
- **Görsel/davranış:** Prototip Create butonu **"Görev oluştur"** (Create task) yazar — tam etiket. İmplementasyon kısaltılmış **"Oluştur"** (Create) yazıyor. `lib/i18n.ts` içinde `common.createTask` zaten mevcut, fakat kullanılmamış.
- **Prototip kod alıntısı:**
  ```jsx
  <Button variant="primary" size="sm" icon={<Icons.Plus size={14}/>}
    onClick={() => window.__openTaskModal && window.__openTaskModal()}>
    {lang === "tr" ? "Görev oluştur" : "Create task"}
  </Button>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** `t("common.createTask", lang)` çağır.

#### 1.B.5 Header search input placeholder + ikon boyutu prototip ile farklı
- **Prototipte:** `New_Frontend/src/shell.jsx:178` — placeholder `"Her şeyde ara…"` / `"Search…"`, ikon `size={14}` (Search), `kbdHint="⌘K"`, primitive `Input` kullanılıyor.
- **Olması gereken implementasyon yeri:** `Frontend2/components/header/search-autocomplete.tsx:177` (placeholder), 163 (ikon)
- **Görsel/davranış:** İmplementasyonda placeholder yalnızca **"Ara…"** (TR) / "Search…" (EN). Prototip TR placeholder'ı **"Her şeyde ara…"**.
- **Öncelik:** Low
- **Düzeltme önerisi:** TR placeholder'ı "Her şeyde ara…" yap (EN aynı kalabilir).

#### 1.B.6 Breadcrumb dinamik segment isimleri eksik (proje adı, task key, vb.)
- **Prototipte:** `New_Frontend/src/shell.jsx:206-225`
- **Olması gereken implementasyon yeri:** `Frontend2/components/breadcrumb.tsx:33-52`
- **Görsel/davranış:** Prototip /project-detail için **`Projeler › <projeAdı>`**, /task-detail için **`Görevler › <taskKey>`**, /workflow-editor için **`Projeler › İş Akışı`** gösteriyor. Ayrıca admin alt-route'lar (users/roles/permissions/projects/workflows/audit/stats) Türkçe etiketlerle ayrı ayrı çıkıyor.
- **Implementasyonda:** Sadece statik `"Project"` literal yazıyor (`breadcrumb.tsx:36`). `/admin/users` gibi alt route'lar tek kelime "Yönetim" altında erir. Workflow-editor için breadcrumb bile yok (fallback ilk segmenti büyük harfe çeviriyor → "Workflow-editor" gibi göründüğüne dair test yok ama kötü görünüm garanti).
- **Prototip kod alıntısı:**
  ```jsx
  if (p === "project-detail") {
    const proj = window.SPMSData.getProject(router.params.projectId);
    return [{ label: ..., onClick: () => router.go("projects") }, { label: proj?.name }];
  }
  if (p === "task-detail") { return [{ label: ... }, { label: task?.key }]; }
  if (p === "workflow-editor") { return [{ label: "Projeler", onClick: () => router.go("projects") }, { label: "İş Akışı" }]; }
  if (p.startsWith("admin")) {
    const sub = p === "admin" ? null : p.slice(6);
    const labels = { users: "Kullanıcılar", roles: "Roller", permissions: "İzinler", projects: "Projeler", workflows: "Şablonlar", audit: "Audit", stats: "İstatistik" };
    return [{ label: "Yönetim", onClick: () => router.go("admin") }, sub && { label: labels[sub] || sub }].filter(Boolean);
  }
  ```
- **Öncelik:** High (UX kalitesi — kullanıcı hangi proje/task'te olduğunu bilemez)
- **Düzeltme önerisi:** `usePathname()`'den projectId/taskId çıkar, `useProject(id)` / `useTask(id)` çağır, dinamik label render et. `/admin/<sub>` desenini parse edip etiket map'le.

### 1.C — Overlays / Toast / Misc

#### 1.C.1 Loading bar / progress indicator (route geçişlerinde) eksik
- **Prototipte:** Yok (prototip SPA, route geçişi anlık).
- **Implementasyonda:** Next.js geçişlerinde async olarak yüklemekle birlikte top-progress yok. Bu prototipte de olmadığı için `EKSİK` olarak işaretlenmiyor — yalnızca kayıt için.
- **Öncelik:** Yok (prototip de yok)

#### 1.C.2 Mobile/responsive shell davranışı eksik
- **Prototipte:** Mobile breakpoint yok — sidebar her zaman sticky. (Tasarım sadece masaüstü hedefli.)
- **Implementasyonda:** Aynı durum; off-canvas/hamburger yok. Prototip ile uyumlu olduğu için bug değil. Ancak tablet (≤768px) için fail-safe yok; çok dar ekranda Header butonları taşar. **`workflow-editor` için viewport gate var (`<1024px` fallback)** ama shell genel için yok.
- **Öncelik:** Low (prototip ile parite)

#### 1.C.3 Sidebar nav item için `aria-current="page"` eksik
- **Prototipte:** `<button>` kullandığı için a11y yok zaten.
- **Olması gereken implementasyon yeri:** `Frontend2/components/sidebar.tsx:108-128` (`<Link>`)
- **Görsel/davranış:** Aktif `<Link>` üzerinde `aria-current="page"` yok. Ekran okuyucular hangi sayfanın aktif olduğunu kullanıcıya iletmiyor.
- **Öncelik:** Medium (a11y — implementasyon TS+Next varken iyileştirme şart)
- **Düzeltme önerisi:** `<Link aria-current={active ? "page" : undefined} ...>`.

#### 1.C.4 Skip-to-content link yok
- **Prototipte:** Yok.
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/layout.tsx` veya `app-shell.tsx` ilk child olarak.
- **Görsel/davranış:** `<a href="#main">Skip to main</a>` türü a11y kolaylığı yok. Klavye kullanıcısı her sayfada sidebar nav'ı tab'lamaya zorlanıyor.
- **Öncelik:** Low (prototip ile parite, ama a11y best practice)

#### 1.C.5 User dropdown'da focus trap yok + Escape close yok
- **Prototipte:** Yok (sadece click-outside).
- **Olması gereken implementasyon yeri:** `Frontend2/components/sidebar.tsx:154-289`
- **Görsel/davranış:** Dropdown açıkken Tab şeritten çıkar, Esc menüyü kapatmaz.
- **Öncelik:** Low
- **Düzeltme önerisi:** `useEffect`'te `keydown`-Escape dinleyicisi ekle, ilk button'a auto-focus.

---

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.A — Sidebar

#### 2.A.1 Sidebar logo ikincil metin font boyutu farklı
- **Prototip:** `New_Frontend/src/shell.jsx:20` — `fontSize: 9.5`
- **Implementasyon:** `Frontend2/components/sidebar.tsx:73` — `fontSize: 10.5`
- **Fark:** 1px daha büyük, mono font 9.5px hedeflenmişken 10.5px kullanıyor.
- **Öncelik:** Low

#### 2.A.2 Sidebar nav item active fontWeight prototip ile uyumsuz
- **Prototip:** `New_Frontend/src/shell.jsx:35` — non-active `fontWeight: 500`
- **Implementasyon:** `Frontend2/components/sidebar.tsx:123` — non-active `fontWeight: 400`
- **Fark:** Prototip 500 (medium), implementasyon 400 (regular). Görsel ağırlık kayıp.
- **Öncelik:** Medium

#### 2.A.3 WORKSPACE / ADMIN section padding farklı
- **Prototip:** `New_Frontend/src/shell.jsx:77,85` — `padding: "8px 10px 4px"` (top), `"16px 10px 4px"` (Admin)
- **Implementasyon:** `Frontend2/components/sidebar.tsx:373,398` — `padding: "12px 10px 6px"` her ikisi için
- **Fark:** Top 4-8px, bottom 2px ofset. Admin başlığının üst boşluğu (16px → 12px) prototipte gruplama hissi daha güçlü.
- **Öncelik:** Low

#### 2.A.4 Sidebar bottom user menu konumu — prototipte `position: relative` div + dropdown'a `left: 8, right: 8` veriyor
- **Prototip:** `New_Frontend/src/shell.jsx:92,123` — outer div sticky pad 10, dropdown `left: 8, right: 8`
- **Implementasyon:** `Frontend2/components/sidebar.tsx:199,245-246` — outer div `position: relative`, dropdown `left: 0, right: 0`
- **Fark:** Prototipte dropdown sidebar'dan 8px iç boşluk bırakırken (panel sidebar genişliği – 16px), implementasyon `0/0` ile sınırlara dayanıyor. Görsel zarafet kaybı.
- **Öncelik:** Low

### 2.B — Header

#### 2.B.1 Header'daki ikon butonları padding farklı
- **Prototip:** `New_Frontend/src/shell.jsx:172,180,190,191` — `padding: 6, borderRadius: 6`
- **Implementasyon:** `Frontend2/components/header.tsx:54-61,121` — `padding: 6, borderRadius: "var(--radius-sm)"` (ki `--radius-sm: 6px`, eşit), ancak language toggle `padding: "4px 8px"`. Prototipte language toggle de `padding: 6`.
- **Fark:** Language toggle yatayda 8px padding alıyor, prototip 6px tek değer.
- **Öncelik:** Low

#### 2.B.2 Header search input — implementasyon `Input` primitive yerine ham `<input>` kullanıyor (görsel parite var ama drift riski)
- **Prototip:** `New_Frontend/src/shell.jsx:178` — `<Input ...>` primitive
- **Implementasyon:** `Frontend2/components/header/search-autocomplete.tsx:149-191` — ham `<input>` + tokenleri kopyalıyor
- **Fark:** Token isimleri eşit görünüyor ama Input primitive'i değişirse search input geride kalır. Tek bir önemli pratik fark: `outline: 0` set edilmiyor; bu doğru karar (a11y için focus-visible).
- **Öncelik:** Medium (drift kaynağı)
- **Düzeltme önerisi:** Input primitive'ini ref-forwarding + onFocus/onBlur/onKeyDown wrap'le; SearchAutocomplete artık primitive'i kullansın.

#### 2.B.3 Sağ taraftaki sıralama prototipten farklı
- **Prototip:** Search → Create → Bell → Help → LANG (`shell.jsx:178-194`)
- **Implementasyon:** Search → Create → ThemeMode(Moon/Sun) → LANG (`header.tsx:97-131`)
- **Fark:** Bell (kritik), Help (orta) eksik; ThemeMode (Moon/Sun) ekstra (prototipte yok). Prototip teması TweaksPanel (sağ-alt floating) üzerinden değişiyor.
- **Öncelik:** Critical (1.B.1, 1.B.2 ve 3.1 ile birlikte ele alınmalı)

#### 2.B.4 Header sticky ortak `top: 0` — fakat AppShell'in main `padding: 24` ve Toast `top: 72`
- **Prototip:** `New_Frontend/src/app.jsx:166` `main` `padding: 24`. `shell.jsx:168` Header `top: 0, zIndex: 30`.
- **Implementasyon:** `Frontend2/components/app-shell.tsx:85` `main padding: 24` ✓, `Frontend2/components/toast/index.tsx:57` Toast `top: 72`.
- **Fark:** Eşit. Yalnızca toast 72 = 52 (header) + 20 marj — doğru. **Bilgi notu**, fark değil.

### 2.C — Overlays

#### 2.C.1 Toast container prototip ile karşılaştırma
- **Prototip:** Toast yok (prototipte sadece TweaksPanel var, `tweaks.jsx` global).
- **Implementasyon:** `Frontend2/components/toast/index.tsx` 4 variant + auto-close. Prototip ile karşılaştırma anlamsız → bu, gerçek API entegrasyonu için ekstra (3.2'de değerlendiriliyor).

---

## 3. BİLİNMEYEN EXTRAS

### 3.1 Header'da Moon/Sun (theme mode toggle) butonu
- **Dosya:** `Frontend2/components/header.tsx:102-113`
- **Sorun:** Prototipte (`shell.jsx:157-197`) Header'da theme mode değiştirmek için **HİÇ** buton yok. Tema değiştirme prototipte sağ-alt köşede yüzen `TweaksPanel` (`tweaks.jsx`) üzerinden yapılıyor. Implementasyon Header'a Moon/Sun ikon butonu eklemiş.
- **Risk:** Prototiple sapma, kullanıcının iki ayrı yerden tema değişmesine yol açıyor (Settings sayfasında da olabiliyor).
- **Öneri:** Ürün kararı: ya Header butonunu kaldırıp TweaksPanel benzeri bir floating panel ekle, ya da Header butonunu intentional extra olarak `.planning/`'de logla. Şu hâliyle "ekstra" durumda.
- **Öncelik:** High (prototip referansı net şekilde aksini söylüyor)

### 3.2 Toast sistem (4-variant: success/error/warning/info)
- **Dosya:** `Frontend2/components/toast/index.tsx`
- **Sorun:** Prototipte toast/snackbar yok. API entegrasyonlu uygulamanın hata/başarı mesajları için zorunlu olduğu söylenebilir, ama prototip baseline'da yer almadığı için **bilinmeyen extras** kategorisinde.
- **Öneri:** Bilinmeyen extras değil, intentional extras olarak `.planning/decisions/`'de belgelendir; ya da tasarım baselen'ı bu yönde güncelle.
- **Öncelik:** Medium (UX için gerekli ama dokümante edilmemiş)

### 3.3 ReactQueryDevtools panel
- **Dosya:** `Frontend2/app/(shell)/layout.tsx:24-26`
- **Sorun:** `process.env.NODE_ENV === "development"` koşullu mount. Prototip stack'inde TanStack Query yok. Production build'de mount olmasa da geliştirme görüntüsü prototip ile farklı.
- **Öneri:** Geliştirme aracı; intentional kabul ama ürün tasarım baseline'ında değil. Notla bırak.
- **Öncelik:** Low

---

## 4. BİLİNEN EXTRAS (UYARI)
Yok.

---

## 5. HATALI / SORUNLU KOD

### 5.1 Hidrasyon mismatch riski — `sidebar.tsx` localStorage'tan render anında okuyor
- **Dosya:** `Frontend2/components/sidebar.tsx:294,342,365,390,404`
- **Sorun türü:** Hydration
- **Açıklama:** `useApp()` SSR'de `sidebarCollapsed` için varsayılanı (`false`) döner; CSR'de `localStorage`'tan `true` okunabilir. Sidebar `width`, "WORKSPACE" başlık görünürlüğü, separator, vs. doğrudan bu state'e bağlı. SSR HTML ↔ ilk CSR HTML arasında genişlik farkı (`56px ↔ 232px`) ve metin farkı (boş ↔ "WORKSPACE") oluşur. `app/layout.tsx`'deki `THEME_INIT_SCRIPT` sadece tema/density/radius'u erkenden uyguluyor; **`sidebarCollapsed` ve `language` için aynı tedbir yok**. `header.tsx:36-40` mode için `mounted` guard'ı uygulamış ama sidebar/breadcrumb dile bağlı bütün dize üretimini bu guard olmadan yapıyor. Recent commit `7e2b700` benzer bir düzeltmeyi `my-tasks` için yapmış — buradaki çözüm shell'e taşınmamış.
- **Öneri:** AppContext'e `mounted` flag ekle; sidebarCollapsed/language SSR'de varsayılan olarak ver, mount sonrası güncelle. Veya inline `THEME_INIT_SCRIPT` içine `sidebarCollapsed` + `language` ekle (DOM data attr olarak yaz), Sidebar/Header bu DOM attr'dan oku.
- **Öncelik:** Critical (1M kullanıcılı senaryoda görünür flicker + React hydration warning)

### 5.2 Sidebar'da auth user bilgisi bağlanmamış (placeholder)
- **Dosya:** `Frontend2/components/sidebar.tsx:152, 211, 231`
- **Sorun türü:** Bug + Dead code (daha kötü: prod'da görünür bug)
- **Açıklama:** `PLACEHOLDER_USER = { name: "User", initials: "U", avColor: 1 }`. `useAuth()` import edilmiş ama yalnızca `logout` için kullanılıyor. Gerçek `user.name`, `user.role`, `user.id` shell hiçbir yerde gösterilmiyor.
- **Öneri:** `const { user, logout } = useAuth()`; `user`'ı Avatar/menü adına bağla. `user?.role === "Admin"` ile admin nav'ı gate'le (1.A.2 ile aynı düzeltme).
- **Öncelik:** Critical

### 5.3 `LogoMark` ölü dosya
- **Dosya:** `Frontend2/components/logo-mark.tsx`
- **Sorun türü:** Dead code
- **Açıklama:** Sidebar inline kendi logo bloğunu çizdiğinden `LogoMark` hiçbir yerde import edilmiyor. Hatta `borderRadius: "var(--radius-sm)"` (6px) ve harf `P` kullanıyor — sidebar logosu `7px` ve `SP` kullanıyor (uyumsuz).
- **Öneri:** Sil, ya da SidebarLogo'yu LogoMark'a refactor et (tek kaynak).
- **Öncelik:** Low

### 5.4 Auth gate sadece cookie varlığına bakıyor — token doğrulaması yok
- **Dosya:** `Frontend2/middleware.ts:4-10`
- **Sorun türü:** Security
- **Açıklama:** `auth_session` cookie'si herhangi bir değerle (`auth_session=1`, `auth_session=foo`) middleware'i geçer. Kullanıcı `document.cookie = "auth_session=1; path=/"` yazarak shell'e girebilir; sayfa render olur, sonra ilk API çağrısı 401 dönene kadar UI'da kullanıcının verisi yokmuşcasına davranır. AuthContext bu durumda `user=null` ve `token=null`'la kalır → `useAuth()` kullanan tüm shell child'ları kırılır.
- **Öneri:** Cookie'yi JWT/HMAC imzalı tut; middleware'de imza doğrula. En azından `auth_session` cookie'sini ServerSession'dan gelen short-lived signed token yap.
- **Öncelik:** Critical (auth bypass)

### 5.5 `app-shell.tsx` PROJ-02 status badge için projects listesini fetch ediyor — proje detayını ayrıca fetch etmiyor
- **Dosya:** `Frontend2/components/app-shell.tsx:55-78`
- **Sorun türü:** Performance
- **Açıklama:** `/projects/{id}` route'ta sadece o projenin status badge'i için **bütün projeler listesini** çekiyor (`projectService.getAll()`), array'den `.find()`'la o projeyi seçiyor. Projeler 1000+ olduğunda bu pahalı. `useProject(id)` zaten var (workflow-editor'de kullanılmış); aynı hook'u burada da kullan.
- **Öneri:** `useProject(projectRouteId)` çağır. `getAll()` cache'i komşu sayfada zaten reuse edilecekse, proje detayı sayfası yine de single-project endpoint'i kullanmalı.
- **Öncelik:** Medium

### 5.6 Theme toggle button text drift — `themeToggleLabel` sadece title/aria için kullanılıyor, ikon mounted olmadan Moon
- **Dosya:** `Frontend2/components/header.tsx:42-52, 108-112`
- **Sorun türü:** Style drift / minor a11y
- **Açıklama:** SSR'de ikon her zaman Moon (light asumption), CSR mode=dark olursa Sun'a flip ediyor. `mounted` guard ikon için doğru ama `themeToggleLabel` yine `mounted` olmayan ilk render'da default'a düşüyor — title/aria de default. Bu kısmen düzeltilmiş olsa da, iyi bir pratik header'da prototip uyumu için **mode toggle BUTONU'nu tamamen kaldırmak** olur (3.1).
- **Öneri:** Ya tamamen kaldır (3.1), ya da `app/layout.tsx`'in init scriptinde DOM'a `data-mode` set ediliyor zaten — ikonu `[data-mode='light']` selector'ü ile CSS-only render et, hidrasyon hiç olmasın.
- **Öncelik:** Medium

### 5.7 Click-outside dropdown handler `useEffect` deps eksik
- **Dosya:** `Frontend2/components/sidebar.tsx:176-183`
- **Sorun türü:** Dead code / minor
- **Açıklama:** `useEffect`'in deps `[open]`. `if (!open) return` early-exit doğru, ama listener add/remove yaratan effect deps olarak `setOpen` eksik (stable, sorun değil). Daha kritiği: dropdown'un `bottom: 100%` pozisyonu, sidebar collapse'a göre `left/right` tükenmiyor (collapse'da menü çok dar — `width: 36px` civarı, içerik kesilir).
- **Öneri:** Collapsed için ayrı dropdown layoutu (örn. `left: 100%` flyout panel).
- **Öncelik:** Low

### 5.8 Breadcrumb fallback `pathname` ilk segmentini büyük harfe çeviriyor — `/workflow-editor` için `Workflow-editor` görünüyor
- **Dosya:** `Frontend2/components/breadcrumb.tsx:54-62`
- **Sorun türü:** Bug
- **Açıklama:** `/workflow-editor`, `/notifications`, `/inbox`, `/calendar`, `/search`, `/docs`, `/users/[id]` gibi prototipte var olan ama Frontend2 breadcrumb'ında handle edilmemiş tüm route'lar fallback'e düşer ve "Workflow-editor" gibi ham, çirkin etiket çıkar.
- **Öneri:** Prototipteki tüm route mapping'i (1.B.6) port et. Yokluğunda çirkin metin yerine boş bırak.
- **Öncelik:** High

### 5.9 `Avatar` primitive `color: "var(--primary-fg)"` kullanıyor — prototip `color: "#fff"`
- **Dosya:** `Frontend2/components/primitives/avatar.tsx:39`
- **Sorun türü:** Style drift
- **Açıklama:** Prototipte `color: "#fff"` (her zaman beyaz harf). Implementasyonda `var(--primary-fg)` — light tema için açık (≈ beyaz), dark tema için **koyu** olabiliyor (`oklch(0.15 0.02 280)`). Yani avatar arka planı ve harfi aynı koyulukta olabiliyor → harfler okunamıyor.
- **Öneri:** Prototipe sadık kal: `color: "#fff"`. Veya beyaz alternatif: `color: "oklch(0.99 0 0)"`.
- **Öncelik:** High (dark mode görünürlük bug'u)

---

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| #  | Öncelik  | Madde                                                            | Dosya                                                      | Bölüm |
|----|----------|------------------------------------------------------------------|------------------------------------------------------------|-------|
| 1  | Critical | Sidebar Admin nav'ı `isAdmin` ile gate'le                         | `Frontend2/components/sidebar.tsx`                         | 1.A.2 |
| 2  | Critical | Header Notification Bell + okunmamış badge ekle                   | `Frontend2/components/header.tsx`                          | 1.B.1 |
| 3  | Critical | Sidebar `PLACEHOLDER_USER` yerine gerçek `useAuth().user` bağla   | `Frontend2/components/sidebar.tsx`                         | 5.2   |
| 4  | Critical | Auth middleware cookie imzalı doğrula (auth bypass)               | `Frontend2/middleware.ts`                                  | 5.4   |
| 5  | Critical | Sidebar/Language hidrasyon — init script'e ekle veya mount guard  | `Frontend2/components/sidebar.tsx`, `app/layout.tsx`       | 5.1   |
| 6  | High     | Header Mode toggle butonu prototipte yok — kaldır veya logla      | `Frontend2/components/header.tsx`                          | 3.1   |
| 7  | High     | SidebarUserMenu Profilim/Admin Panel linkleri ekle + ikonlar      | `Frontend2/components/sidebar.tsx`                         | 1.A.3 |
| 8  | High     | Breadcrumb dinamik proje/task/workflow/admin segmentlerini port   | `Frontend2/components/breadcrumb.tsx`                      | 1.B.6 |
| 9  | High     | Breadcrumb fallback çirkin literal — prototip eşleşmesini tamamla | `Frontend2/components/breadcrumb.tsx`                      | 5.8   |
| 10 | High     | Avatar `color: "#fff"` — dark modda harfler okunmuyor             | `Frontend2/components/primitives/avatar.tsx`               | 5.9   |
| 11 | High     | Sidebar collapsed admin separator gate'i                          | `Frontend2/components/sidebar.tsx`                         | 1.A.4 |
| 12 | Medium   | Help ikonu Header'a ekle                                          | `Frontend2/components/header.tsx`                          | 1.B.2 |
| 13 | Medium   | Create button etiketi "Görev oluştur" yap                         | `Frontend2/components/header/create-button.tsx`            | 1.B.4 |
| 14 | Medium   | Search input primitive'i ref-forward + reuse                       | `Frontend2/components/primitives/input.tsx`, search comp.  | 2.B.2 |
| 15 | Medium   | Sidebar nav `aria-current="page"`                                  | `Frontend2/components/sidebar.tsx`                         | 1.C.3 |
| 16 | Medium   | Theme toggle CSS-only render (hidrasyondan kurtul)                | `Frontend2/components/header.tsx`                          | 5.6   |
| 17 | Medium   | AppShell `useProject(id)` kullan — listenin tamamını çekme        | `Frontend2/components/app-shell.tsx`                       | 5.5   |
| 18 | Medium   | Toast sistemi intentional extra olarak belgelendir                 | `.planning/decisions/`                                     | 3.2   |
| 19 | Medium   | Sidebar nav non-active fontWeight 500                              | `Frontend2/components/sidebar.tsx`                         | 2.A.2 |
| 20 | Low      | SidebarLogo `v2.4 · acme.co` workspace satırı                     | `Frontend2/components/sidebar.tsx`                         | 1.A.1 |
| 21 | Low      | SidebarLogo mono fontSize 9.5                                     | `Frontend2/components/sidebar.tsx`                         | 2.A.1 |
| 22 | Low      | Header search placeholder TR "Her şeyde ara…"                     | `Frontend2/components/header/search-autocomplete.tsx`      | 1.B.5 |
| 23 | Low      | Section padding 8/16-10-4 prototip değerlerine eşitle              | `Frontend2/components/sidebar.tsx`                         | 2.A.3 |
| 24 | Low      | Sidebar dropdown left:8/right:8                                    | `Frontend2/components/sidebar.tsx`                         | 2.A.4 |
| 25 | Low      | Header LANG butonu padding: 6                                      | `Frontend2/components/header.tsx`                          | 2.B.1 |
| 26 | Low      | LogoMark dead file — sil veya birleştir                            | `Frontend2/components/logo-mark.tsx`                       | 5.3   |
| 27 | Low      | UserMenu Esc-close + focus trap                                    | `Frontend2/components/sidebar.tsx`                         | 1.C.5 |
| 28 | Low      | Skip-to-content link                                               | `Frontend2/app/(shell)/layout.tsx`                         | 1.C.4 |
| 29 | Low      | Collapsed sidebar dropdown collide handling                        | `Frontend2/components/sidebar.tsx`                         | 5.7   |
| 30 | Low      | ReactQueryDevtools intentional extra olarak logla                  | `.planning/decisions/`                                     | 3.3   |

---

## 7. KAPSAM NOTLARI

### Okunan dosyalar
**Prototip:**
- `New_Frontend/src/shell.jsx` (tamamı, 1-241)
- `New_Frontend/src/app.jsx` (tamamı, 1-523 — sadece 1-198 shell ile ilgili, geri kalanı TeamsPage/seed data)
- `New_Frontend/src/i18n.jsx` (tamamı)
- `New_Frontend/src/icons.jsx` (tamamı)
- `New_Frontend/src/primitives.jsx` (tamamı)
- `New_Frontend/src/data.jsx` (kısmi: `NOTIFICATIONS`, `CURRENT_USER`, `SPMSData` exports)

**Implementasyon:**
- `Frontend2/app/(shell)/layout.tsx`
- `Frontend2/app/layout.tsx`
- `Frontend2/app/page.tsx`
- `Frontend2/app/globals.css`
- `Frontend2/components/app-shell.tsx`
- `Frontend2/components/sidebar.tsx`
- `Frontend2/components/header.tsx`
- `Frontend2/components/header/create-button.tsx` + test
- `Frontend2/components/header/search-autocomplete.tsx`
- `Frontend2/components/breadcrumb.tsx`
- `Frontend2/components/logo-mark.tsx`
- `Frontend2/components/toast/index.tsx`
- `Frontend2/components/task-modal/task-modal-provider.tsx`
- `Frontend2/components/primitives/avatar.tsx`, `badge.tsx`, `input.tsx`, `kbd.tsx`, `index.ts`
- `Frontend2/context/app-context.tsx`
- `Frontend2/context/auth-context.tsx`
- `Frontend2/context/task-modal-context.tsx`
- `Frontend2/lib/i18n.ts`
- `Frontend2/middleware.ts`

### Atlanan / eksik kalan
- `Frontend2/components/task-modal/task-create-modal.tsx` (modal içeriği shell'in dışı; create butonunun sadece çağrı tarafı incelendi)
- `New_Frontend/src/theme.jsx` (token sistemi shell rendering'i etkilemez; primitives'den sınıflandırma yeterli oldu)
- `New_Frontend/src/tweaks.jsx` (referans olarak biliniyor — header'da theme-mode butonu yokluğunun gerekçesi)
- Frontend2 admin sayfaları (3.1'in kapsamı dışı — yalnızca sidebar gate'i incelendi)
- Frontend2 auth sayfaları (`(auth)/login`, `forgot-password`, `session-expired`) — auth.md ayrı ajan tarafından kapsanıyor
- Frontend2 page route içerikleri (her biri ayrı ajan)

### Belirsizlikler
1. **Toast sistemi intentional extras mı?** `.planning/decisions/` klasöründe açıkça onaylanmış bir karar göremedim; kullanıcıdan teyit gerekiyor. Eğer onaylanırsa "BİLİNEN EXTRAS"'a taşınır.
2. **Header'daki Moon/Sun toggle ne için?** Tasarım kararı olarak prototip'ten saparak eklenmiş gibi; Settings sayfasında theme yönetimi de varsa bu ikinci giriş noktası kafa karışıklığı yaratır. Yine de prototip referansında YOK.
3. **`/users/[id]` profile route'u mevcut mu?** Sidebar profilim linkini bağlamak için route gerekli. Şu anda Frontend2 `/dashboard /projects /my-tasks /reports /settings /teams /workflow-editor` var; `users/[id]` yok. Profil eklemek için route shell içinde de tanımlanmalı.
4. **Workflow Editor sidebar nav item gerekiyor mu?** Prototip sidebar'ında yoktu — projelerin alt sayfası. İmplementasyonda da nav'da yok ama route var; bu doğru karar. Yalnız breadcrumb ve fallback için (5.8) önemli.
5. **Notification API hazır mı?** Bell badge için backend endpoint yoksa, count'u zaman geçici olarak `0` veya cache'den alıp UI shell'i tamamlamak gerek.
