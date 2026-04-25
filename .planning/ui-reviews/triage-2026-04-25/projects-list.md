# Projects List (Projeler Listesi) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-projects-list
**Prototip kaynak:**
- New_Frontend/src/pages/projects.jsx (78 satır, tek dosya)
- New_Frontend/src/primitives.jsx (paylaşılan: AvatarStack, Badge, Card, Input, SegmentedControl, Button, ProgressBar, Kbd)
- New_Frontend/src/data.jsx (PROJECTS shape)
- New_Frontend/src/i18n.jsx (TR/EN copy)
- New_Frontend/src/icons.jsx (Search, Plus)

**Implementasyon kaynak:**
- Frontend2/app/(shell)/projects/page.tsx (130 satır)
- Frontend2/components/projects/project-card.tsx (288 satır)
- Frontend2/components/projects/confirm-dialog.tsx (39 satır)
- Frontend2/components/projects/archive-banner.tsx (85 satır — bu sayfada kullanılmıyor, başka yerde import)
- Frontend2/services/project-service.ts
- Frontend2/hooks/use-projects.ts
- Frontend2/components/primitives/* (paylaşılan)
- Frontend2/app/globals.css (.projects-grid)

**Bilinen intentional extras:** Yok

## TL;DR Özet
- Eksik elementler: 6
- Layout/şekil farkı: 9
- Bilinmeyen extras: 6
- Bilinen extras: 0
- Hatalı kod: 7
- **EN KRİTİK 3 MADDE:**
  1. **Görev sayacı (`activeCount/taskCount görev`) tamamen kayıp.** Implementasyon `görev`/`tasks` kelimesini sayı olmadan basıyor (project-card.tsx:255-257) — kullanıcıya hiçbir bilgi vermiyor. Prototip `5/12 görev` formatında gösteriyor (projects.jsx:69).
  2. **Üye avatar yığını yanlış kişiyi gösteriyor.** Prototip `project.memberIds.map(getUser)` ile tüm ekibi listeler (projects.jsx:43,68); implementasyon yalnızca tek bir manager avatarını gösterir (project-card.tsx:130-140). Backend `members` alanı dönmediği için tasarımdaki "ekip görünürlüğü" mesajı kayıp.
  3. **3-nokta overflow menüsü ve ConfirmDialog prototipte yok** ama prototip kartını "tıkla, detay sayfasına git" minimal davranışına sahipken implementasyon karta absolute-positioned bir menü, modal, status-değiştirme akışı eklemiş — undocumented extra ve hover-card ile etkileşim çakışması var (project-card.tsx:163-193).

## 1. EKSİK ELEMENTLER

### 1.1 Görev sayacı (activeCount/totalCount)
- **Prototipte:** `New_Frontend/src/pages/projects.jsx:44-45, 69`
- **Olması gereken implementasyon yeri:** `Frontend2/components/projects/project-card.tsx:255-257`
- **Görsel/davranış:** Footer sol bloğunda avatar yığınının yanında `5/12 görev` (TR) veya `5/12 tasks` (EN) — ilk sayı `status !== "done"` aktif görevler, ikincisi proje toplamı.
- **Prototip kod alıntısı:**
  ```jsx
  const taskCount = window.SPMSData.TASKS.filter(t => t.projectId === project.id).length;
  const activeCount = window.SPMSData.TASKS.filter(t => t.projectId === project.id && t.status !== "done").length;
  // ...
  <span style={{ color: "var(--fg-muted)" }}>{activeCount}/{taskCount} {lang === "tr" ? "görev" : "tasks"}</span>
  ```
- **Implementasyonda mevcut:**
  ```tsx
  <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
    {language === 'tr' ? 'görev' : 'tasks'}
  </span>
  ```
  — Sayı kısmı tamamen kaldırılmış, sadece "görev" kelimesi kalmış.
- **Öncelik:** Critical
- **Düzeltme önerisi:** Backend `Project` DTO'suna `task_count` ve `active_task_count` alanları ekle ya da `useProjects` hook'una `staleTime`'lı bir `tasks/project/{id}/count` çağrısı bağla. Frontend tarafında `project-service.ts` Project tipine `taskCount` / `activeTaskCount` ekle, kart `{activeTaskCount}/{taskCount} {label}` basacak şekilde güncellensin.

### 1.2 Tüm ekip üyelerinin avatar yığını (members)
- **Prototipte:** `New_Frontend/src/pages/projects.jsx:43, 68`
- **Olması gereken implementasyon yeri:** `Frontend2/components/projects/project-card.tsx:128-140, 254`
- **Görsel/davranış:** Prototip `project.memberIds.map(id => getUser(id))` ile 4 üyeye kadar avatar gösterir, üzeri `+N` overlap. Implementasyon yalnızca `managerName` (tek kişi) baz alıyor; lider yoksa avatar yığını boş kalıyor.
- **Prototip kod alıntısı:**
  ```jsx
  const members = project.memberIds.map(id => window.SPMSData.getUser(id));
  // ...
  <AvatarStack users={members} max={4} size={22}/>
  ```
- **Implementasyondaki mevcut:**
  ```tsx
  const managerAvatars = project.managerName
    ? [{ id: project.managerId ?? 0, initials: ..., avColor: 1 }]
    : []
  // ...
  <AvatarStack users={managerAvatars} max={4} size={22} />
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Backend `ProjectResponseDTO`'ya `members: [{id, fullName, avatarUrl}]` listesi ekle (en azından list endpoint için) ya da Project tipine `members` alanı çek. Kart `<AvatarStack users={members} max={4} size={22} />` basmalı; prototip ile bire bir uyum için fallback olarak yine boş avatar yerine `+N` overflow chip'i de korunmalı.

### 1.3 Search input içinde arama ikonu
- **Prototipte:** `New_Frontend/src/pages/projects.jsx:28`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/page.tsx:85-90`
- **Görsel/davranış:** Input bileşeni `icon={<Icons.Search size={14}/>}` ile sol tarafta küçük büyüteç. Implementasyonda `icon` prop hiç verilmemiş — input yalnız placeholder ile kalıyor.
- **Prototip kod alıntısı:**
  ```jsx
  <Input icon={<Icons.Search size={14}/>} placeholder={T("Proje ara", "Search projects")} value={filter} onChange={...} size="md" style={{ width: 220 }}/>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `import { Search } from "lucide-react"` (proje genelinde lucide kullanılıyor — `project-card.tsx:4`) ve `<Input icon={<Search size={14} />} ... size="md" />` eklenmeli.

### 1.4 Klavye gezinme ipucu (Kbd ↑↓ ↵)
- **Prototipte:** `New_Frontend/src/pages/projects.jsx:19`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/page.tsx:67-69`
- **Görsel/davranış:** Sayfa alt-başlığı `12 proje · klavyeyle gezin <Kbd>↑↓</Kbd> <Kbd>↵</Kbd>` — küçük tuş kapsülleri. Implementasyon sadece düz metin `klavyeyle gezin` basıyor, Kbd yok ve `marginLeft: 4` kapsülü yok.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ ... }}>{projects.length} {T("proje", "projects")} · {T("klavyeyle gezin", "keyboard friendly")} <Kbd style={{ marginLeft: 4 }}>↑↓</Kbd> <Kbd>↵</Kbd></div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `import { Kbd } from "@/components/primitives"` ve subtitle bloğunun sonuna `<Kbd style={{ marginLeft: 4 }}>↑↓</Kbd> <Kbd>↵</Kbd>` eklensin. Ayrıca eklenen Kbd'lerin gerçek davranış için karşılığı yok — bkz. §1.5.

### 1.5 Klavyeyle gezinme davranışı (↑↓ ↵)
- **Prototipte:** Görsel ipucu var (`projects.jsx:19`); mevcut prototipte fonksiyonel keyboard-handler kod yok ama UI bunu vaat ediyor.
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/page.tsx` (üst düzey div) ve/veya `project-card.tsx` (`tabIndex`).
- **Görsel/davranış:** Kullanıcı sayfa içinde ↑↓ ile kartlar arasında focus dolaştırabilmeli, ↵ ile detay sayfasına gitmeli. Mevcut implementasyonda kartlar `<div onClick>` — `tabIndex`/`role="button"`/`onKeyDown` yok, klavye erişilemez.
- **Öncelik:** High (a11y + 1.4 ile bağlı)
- **Düzeltme önerisi:** `Card` `interactive` modunda `tabIndex={0}` `role="button"` `onKeyDown` (Enter/Space → onClick) destekleyecek şekilde geliştirilmeli; sayfa-seviyesinde `useEffect` ile global ↑↓ tuşları aktif kart focus'u taşımalı.

### 1.6 Sayfa-altı header satırı tek satır olarak — alt satırı ayrı blok yapma kararı (UI-sweep'in eksik karşılığı)
- **Prototipte:** `New_Frontend/src/pages/projects.jsx:16` — başlık bloğu, segmented control, search ve "Yeni proje" tek `flex` satırda yan yana (`alignItems: flex-end`, `justifyContent: space-between`, `gap: 20`).
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/page.tsx:61-92`
- **Görsel/davranış:** Implementasyon header'ı iki ayrı satıra bölmüş (üstte başlık + Yeni Proje, altında segmented + search). Yorumda "UI-sweep: split into 2 rows so primary CTA stands alone" diyor ama bu prototipten sapma — prototip tek satır, üç element birlikte.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
    <div> ... title block ... </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <SegmentedControl ... />
      <Input ... />
      <Button variant="primary" icon={<Icons.Plus size={14}/>}>Yeni proje</Button>
    </div>
  </div>
  ```
- **Öncelik:** Medium (kullanıcı talimatı: "ZERO from old Frontend / ALL UI from prototype")
- **Düzeltme önerisi:** İki satırlı yapıyı kaldırıp tek `flex` satıra döndür. Eğer space sıkışırsa media-query ile breakpoint'te wrap açılabilir; ama default prototip 1:1 olmalı.

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.1 Sayfa başlığı font-size 24 → 20
- **Prototip:** `New_Frontend/src/pages/projects.jsx:18` — `fontSize: 24, fontWeight: 600, letterSpacing: -0.6`
- **Implementasyon:** `Frontend2/app/(shell)/projects/page.tsx:64` — `fontSize: 20, fontWeight: 600, letterSpacing: -0.6`
- **Fark:** 4px küçük başlık. Ana sayfa hiyerarşisini bozar.
- **Öncelik:** High

### 2.2 Sayfa kök gap 20 → 16
- **Prototip:** `projects.jsx:15` — kök div `gap: 20`
- **Implementasyon:** `page.tsx:57` — kök div `gap: 16`
- **Fark:** 4px daha sıkışık dikey boşluk.
- **Öncelik:** Medium

### 2.3 Project key chip background — eklenmiş kapsül arka planı
- **Prototip:** `projects.jsx:53` — `<div className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 6 }}>{project.key}</div>` (sadece metin, bg yok, name kartın altındaki `<div>`)
- **Implementasyon:** `project-card.tsx:204-210` — span etiket içinde `background: "var(--surface-2)", padding: "2px 6px", borderRadius: "var(--radius-sm)", marginRight: 6` (kapsül stili) ve `name` ile **aynı satırda inline span** olarak basılır.
- **Fark:** Prototipte key kart başında ayrı bir küçük caption olarak yer alır, name onun **altında** yeni satıra düşer. Implementasyon ikisini yan yana inline span olarak basıyor — tipografi hiyerarşisi tamamen değişmiş.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ minWidth: 0 }}>
    <div className="mono" style={{ fontSize: 10.5, ..., marginBottom: 6 }}>{project.key}</div>
    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>{project.name}</div>
  </div>
  ```
- **Implementasyon kod alıntısı:**
  ```tsx
  <div style={{ minWidth: 0 }}>
    <span className="mono" style={{ ..., background: "var(--surface-2)", padding: "2px 6px", borderRadius: "var(--radius-sm)", marginRight: 6 }}>{project.key}</span>
    <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>{project.name}</span>
  </div>
  ```
- **Öncelik:** Critical (bu kart anatomisinin tümüyle farklılaşmasına sebep)

### 2.4 Methodology badge tone — anlam farkı
- **Prototip:** `projects.jsx:46,56` — `methTone = scrum:"info" | kanban:"primary" | waterfall:"warning"`; tek `<Badge tone={methTone} size="xs">{project.methodology}</Badge>`
- **Implementasyon:** `project-card.tsx:216` — `<Badge size="xs" tone="neutral">{project.methodology}</Badge>` (sabit neutral)
- **Fark:** Implementasyon metodoloji-tabanlı renkli kodlamayı tamamen kaldırmış. Bütün kartlarda aynı gri badge görünüyor — kullanıcı bir bakışta scrum/kanban/waterfall ayırt edemez.
- **Öncelik:** Critical

### 2.5 Status badge — prototipte yok, implementasyonda eklenmiş
- **Prototip:** `projects.jsx:56` — sadece methodology badge var. Status sadece **kart tepesi 4px renk şeridinde** (`projects.jsx:49`).
- **Implementasyon:** `project-card.tsx:217-219` — methodology badge'inin yanına ikinci `<Badge dot tone={STATUS_BADGE_TONE[...]}>{statusLabel}</Badge>` eklenmiş.
- **Fark:** Görsel kalabalıklık + redundant bilgi (üst şerit + badge ikisi de status diyor).
- **Öncelik:** High (3.x altında detaylandırıldı)

### 2.6 Footer date format — yıl bilgisi düşmüş
- **Prototip:** `projects.jsx:71` — `{ month: "short", day: "numeric", year: "numeric" }` → `Eyl 30, 2026`
- **Implementasyon:** `project-card.tsx:262-263` — `{ month: 'short', day: 'numeric' }` → `Eyl 30` (yıl yok)
- **Fark:** Bitiş yılını okumak için kullanıcı detay sayfasına gitmek zorunda.
- **Öncelik:** Medium

### 2.7 Progress bar prototipte 4px inline, implementasyonda ProgressBar component
- **Prototip:** `projects.jsx:60-65` — inline `<div style={{ flex: 1, height: 4, ... }}><div style={{ width: "${%}", height: "100%", background: var(--primary), ... }}/></div>` ve **soldaki "İlerleme" etiketi font-size 11**
- **Implementasyon:** `project-card.tsx:235-247` — `<ProgressBar value={...*100} />` ile aynı 4px sonuç. Ancak yüzde span'ı `fontSize: 11` (prototip 11) ile uyumlu fakat **ortadaki gap "Progress | bar | %" container `gap: 6` (prototip de 6) — burası uyumlu.**
- **Fark:** Davranış aynı görünüyor; sadece "İlerleme" etiketi marginTop'a göre konumu farklı çünkü prototip `marginTop: 14` veriyor, implementasyon `marginTop: "auto", paddingTop: 14` koyuyor (flex stretch için). Kart içeriği kısaysa progress bar kart altına itiliyor — prototipte böyle bir flex hilesi yok, kartlar **content-height** ile çiziliyor.
- **Öncelik:** Medium (alt başlıkta "tüm kartlar aynı yükseklik" hedefi prototipte güdülmemişti)

### 2.8 Top status strip — `var(--fg-muted)` ARCHIVED rengi
- **Prototip:** `projects.jsx:49` — sadece `completed → var(--status-done)`, `on_hold → var(--status-review)`, diğer (active, archived) → `var(--primary)`
- **Implementasyon:** `project-card.tsx:12-17` — ARCHIVED için `var(--fg-muted)` (gri) eklenmiş
- **Fark:** Prototip ARCHIVED'i de primary yeşil/mavi gösteriyor (sade kart opacity 0.6 ile arşiv vurgulanıyor), implementasyon ek olarak şerit rengini de gri yapıyor.
- **Öncelik:** Low (görsel olarak daha doğru olabilir ama prototipten sapma)

### 2.9 Card grid — fixed `repeat(3, 1fr)` → responsive media-query
- **Prototip:** `projects.jsx:32` — `gridTemplateColumns: "repeat(3, 1fr)"` (her zaman 3 kolon, breakpoint yok)
- **Implementasyon:** `app/(shell)/projects/page.tsx:122` `<div className="projects-grid">` + `globals.css:172-183` mobile 1 / tablet 2 / desktop 3 kolonlar
- **Fark:** Implementasyon responsive — prototip değil. Prototipten sapma ama responsive davranış a11y/UX iyileştirmesi olarak savunulabilir.
- **Öncelik:** Low (tartışmalı; prototip 1:1 sözleşmesi açısından sapma)

## 3. BİLİNMEYEN EXTRAS

### 3.1 3-nokta overflow menu (MoreHorizontal)
- **Dosya:** `Frontend2/components/projects/project-card.tsx:163-193`
- **Açıklama:** Kart sağ üst köşesinde absolute-positioned `MoreHorizontal` butonu, açılan dropdown menü (Tamamla / Askıya Al / Arşivle veya Aktif Et) — prototipte HİÇ YOK. Kart `padding-right: 28` ile bu menüye yer açıyor (project-card.tsx:202).
- **Öncelik:** High — undocumented extra; kart anatomisini bozuyor (badge'ler menüden kaçmak için sıkışıyor) ve kart-tıklama ile hover-state çakışması yaratıyor.
- **Düzeltme önerisi:** Bu işlevsellik gerçekten gerekiyorsa Project Detail sayfasına taşı veya kart hover sırasında ortaya çıkan ikincil aksiyon olarak yeniden tasarlanmalı; prototip uyumu için tamamen kaldırılması doğru.

### 3.2 ConfirmDialog modal
- **Dosya:** `Frontend2/components/projects/confirm-dialog.tsx` (tüm dosya), `project-card.tsx:272-284`
- **Açıklama:** Status değişikliği için fixed-overlay modal — prototipte yok. Kullanıcı 3-nokta menüsünden bir aksiyon seçince modal açılır.
- **Öncelik:** High — 3.1 ile bağlı; menüyü kaldırırsak bu da kalkar.

### 3.3 Status badge (kart sağ üst köşede ikinci badge)
- **Dosya:** `project-card.tsx:217-219`
- **Açıklama:** Methodology badge'inin yanında dot'lı status badge (`Aktif/Tamamlandı/Askıda/Arşiv`) — prototipte yok. Status zaten kartın tepe şeridinde renkle iletiliyor.
- **Öncelik:** High — görsel kalabalıklık yaratıyor.

### 3.4 Empty-state SVG ikonu ve copy
- **Dosya:** `app/(shell)/projects/page.tsx:99-120`
- **Açıklama:** Prototipte hiç empty-state branch yok — proje yoksa sadece boş grid çıkar. Implementasyon "Bu filtreyle eşleşen proje yok / Henüz proje yok" mesajı + 3-line list ikonu + "Yeni proje" butonu eklemiş.
- **Öncelik:** Medium — extra ama UX olarak savunulabilir; en azından prototip ile uyum belgelenmeli (decisions/UI-SPEC kaydı).

### 3.5 Loading state (`Yükleniyor...`)
- **Dosya:** `app/(shell)/projects/page.tsx:96-98`
- **Açıklama:** Prototip senkron `window.SPMSData.PROJECTS` okuduğu için loading state'i yok. Implementasyon TanStack Query kullandığı için zaten gerekli, ama prototip karşılığı yok — skeleton yerine düz metin "Yükleniyor..." kullanılmış. Prototip pattern'i yok; fakat Tasks/Dashboard sayfalarında **iskelet kartlar** var (kontrol edilmesi gereken bir tutarlılık).
- **Öncelik:** Medium — düz metin yerine prototip-style skeleton kart kullanmak gerekir.

### 3.6 RBAC gating (canCreateProject)
- **Dosya:** `app/(shell)/projects/page.tsx:37-41, 71-77, 112-118`
- **Açıklama:** "Yeni proje" butonu yalnız `admin` veya `project manager` rolündeki kullanıcılara görünür. Prototipte tüm kullanıcılar butonu görür (mock veri tek kullanıcı senaryosu). Bu defansif fonksiyonel ekleme — D-08 referansı yorumda var. Prototip tarafında karşılığı bulunmadığı için "extra" sayılır ama haklı.
- **Öncelik:** Low — fonksiyonel olarak gerekli, prototip 1:1'i için intentional-extras listesine eklenmesi şart.

## 4. BİLİNEN EXTRAS (UYARI)
Yok.

## 5. HATALI / SORUNLU KOD

### 5.1 Görev sayısı kelimesi anlamsız: `görev` (sayı yok)
- **Dosya:** `Frontend2/components/projects/project-card.tsx:255-257`
- **Sorun türü:** Bug + Style drift
- **Açıklama:** Footer'da `{language === 'tr' ? 'görev' : 'tasks'}` basılıyor ama önünde sayı yok. Sadece "görev" kelimesi avatar yığınının yanına yapışmış. UX mantıksız.
  ```tsx
  <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
    {language === 'tr' ? 'görev' : 'tasks'}
  </span>
  ```
- **Öneri:** Bkz. §1.1 — task count'u backend'den çek ya da ilgili count'u hesapla, `{active}/{total} {label}` bas.
- **Öncelik:** Critical

### 5.2 `useAuth` import edildi ama yalnızca tek satırda kullanıldı (varolan); RBAC blok yorum ile kavramsal olarak şişirilmiş
- **Dosya:** `app/(shell)/projects/page.tsx:8, 27, 37-41`
- **Sorun türü:** Code smell (yorum/kod oranı + duplicate role-string check)
- **Açıklama:** `roleName === "project manager" || roleName === "project_manager"` — backend rol stringi normalize edilmiyor (boşluk vs underscore aynı şey kabul ediliyor). Backend tarafında string standardize edilmeli; frontend defansif "iki versiyon" yazısı code drift kaynağı.
- **Öneri:** `auth-service.ts`'te role.name'i `slugify` veya `lowercase + replace_space_with_underscore` ile normalize edilen tek bir alana çevir.
- **Öncelik:** Medium

### 5.3 `archive-banner.tsx` bu sayfada hiç kullanılmıyor
- **Dosya:** `Frontend2/components/projects/archive-banner.tsx` (tüm dosya)
- **Sorun türü:** Dead code (bu sayfa açısından)
- **Açıklama:** Projects List sayfası bu component'i import etmez. Detay sayfasında olabilir; eğer öyle ise dosya `components/projects/` altında ama list-card'lar ile aynı klasörde — dosya organizasyonu yanıltıcı.
- **Öneri:** Eğer detay sayfasında kullanılıyorsa `components/project-detail/` gibi bir alt klasöre taşı, değilse sil.
- **Öncelik:** Low

### 5.4 `confirm-dialog.tsx` duplicate label default değerleri TR-only
- **Dosya:** `Frontend2/components/projects/confirm-dialog.tsx:16` — `confirmLabel = "Onayla", cancelLabel = "İptal"`
- **Sorun türü:** i18n bug
- **Açıklama:** Default değerler hardcoded TR. EN dilinde label geçilmediği bir caller varsa Türkçe metin sızar. Şu anki callers her ikisini de geçiyor ama default tehlikeli.
- **Öneri:** Default'u kaldırıp `confirmLabel: string` `cancelLabel: string` zorunlu yap (TS type ile compile-time error).
- **Öncelik:** Medium

### 5.5 `project-card.tsx` overlay menu z-index ve event propagation karmaşası
- **Dosya:** `project-card.tsx:163-193`
- **Sorun türü:** Bug riski + A11y
- **Açıklama:** `<div onClick={e => e.stopPropagation()}>` ve içerideki `<button onClick>` yığını — menü açıkken `mousedown` listener'ı olduğu için **menünün dropdown butonlarına click yapan ilk mouse-down** menüyü kapatabilir (handler iki tetikleyici sırası agnostik değil). Ayrıca button'da `aria-expanded`, `aria-haspopup="menu"` yok, dropdown `role="menu"` değil; menu item'lar `role="menuitem"` ve klavye okları yok.
- **Öneri:** Menüyü tamamen sil (§3.1) veya headless-ui benzeri bir menu pattern'i implementasyona getir.
- **Öncelik:** High (a11y bug)

### 5.6 `project.endDate` opsiyonel ama prototipte zorunlu — null kontrolü değer atlama
- **Dosya:** `project-card.tsx:259-266`
- **Sorun türü:** Style drift
- **Açıklama:** Implementasyon `{project.endDate && (...)}` ile bitiş tarihi yoksa hiç bastırmıyor. Prototipte `project.end` her projede mevcut (`data.jsx:19-24`) ve her zaman basılıyor. Backend null dönerse footer asimetrik (sadece avatar yığını + "görev").
- **Öneri:** Backend'in `endDate` zorunlu döndürmesini garanti et veya placeholder "—" göster ki footer sağ blok hep dolu kalsın.
- **Öncelik:** Low

### 5.7 Filter param ile API çağrısı + ek client-side search — duplike filtreleme
- **Dosya:** `app/(shell)/projects/page.tsx:44-52`
- **Sorun türü:** Performance + Logic drift
- **Açıklama:** API çağrısı status param ile filtrelenmiş sonuç döndürüyor (`/projects?status=ACTIVE`). Ardından client-side `searchQuery` ile name + key filtreleniyor. Bu kombinasyonda count gösteriminde tuhaflık var: subtitle `{projects.length} proje · ...` yazısı **search-filter UYGULANMADAN ÖNCE** projects.length basıyor (`page.tsx:68`), yani kullanıcı 5 sonuç görse bile `12 proje` yazıyor olabilir.
  ```tsx
  {projects.length} {language === 'tr' ? 'proje · klavyeyle gezin' : 'projects · keyboard friendly'}
  ```
  Ama görüntülenen `filtered.length` adet kart. Tutarsızlık. (Prototip `projects.length` hem filter hem statusFilter sonrası `projects` değişkeni olduğu için tutarlı — `projects.jsx:8-12, 19`.)
- **Öneri:** Subtitle'da `filtered.length` kullan: `{filtered.length} {label}`.
- **Öncelik:** High

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| # | Öncelik | Madde | Dosya | Bölüm |
|---|---------|-------|-------|-------|
| 1 | Critical | Görev sayacı (active/total) tamamen kayıp | project-card.tsx:255-257 | 1.1, 5.1 |
| 2 | Critical | Tüm üye avatar yığını yerine yalnız manager gösteriliyor | project-card.tsx:128-140, 254 | 1.2 |
| 3 | Critical | Project key ayrı caption olmak yerine inline span olmuş | project-card.tsx:201-214 | 2.3 |
| 4 | Critical | Methodology badge sabit `neutral` — renk-kodlama silinmiş | project-card.tsx:216 | 2.4 |
| 5 | High | Search input'ta arama ikonu yok | page.tsx:85-90 | 1.3 |
| 6 | High | Klavye Kbd ipucu (↑↓ ↵) eksik + davranış yok | page.tsx:67-69 | 1.4, 1.5 |
| 7 | High | Status badge (sağ üst köşede ikinci badge) prototipte yok | project-card.tsx:217-219 | 2.5, 3.3 |
| 8 | High | 3-nokta overflow menüsü prototipte yok | project-card.tsx:163-193 | 3.1, 5.5 |
| 9 | High | ConfirmDialog modal prototipte yok | project-card.tsx:272-284, confirm-dialog.tsx | 3.2 |
| 10 | High | Subtitle `projects.length` filtered-count ile tutarsız | page.tsx:68 | 5.7 |
| 11 | High | Sayfa başlığı 24 → 20px küçültülmüş | page.tsx:64 | 2.1 |
| 12 | Medium | Header tek satırdan iki satıra bölünmüş | page.tsx:61-92 | 1.6 |
| 13 | Medium | Bitiş tarihinde yıl gösterimi düşmüş | project-card.tsx:262-263 | 2.6 |
| 14 | Medium | Loading state düz metin — prototip-style skeleton yok | page.tsx:95-98 | 3.5 |
| 15 | Medium | Empty state SVG + copy prototipte yok | page.tsx:99-120 | 3.4 |
| 16 | Medium | Sayfa kök gap 20 → 16 | page.tsx:57 | 2.2 |
| 17 | Medium | ConfirmDialog default labels hardcoded TR | confirm-dialog.tsx:16 | 5.4 |
| 18 | Medium | RBAC role string normalizasyon eksik | page.tsx:37-41 | 5.2 |
| 19 | Medium | Progress block `marginTop: auto` flex stretch — prototip content-height | project-card.tsx:235 | 2.7 |
| 20 | Low | Top status strip ARCHIVED için `var(--fg-muted)` extra | project-card.tsx:12-17 | 2.8 |
| 21 | Low | Grid `repeat(3, 1fr)` yerine responsive media-query | globals.css:172-183 | 2.9 |
| 22 | Low | `archive-banner.tsx` bu sayfada kullanılmıyor | archive-banner.tsx | 5.3 |
| 23 | Low | RBAC `canCreateProject` extra (haklı ama belge yok) | page.tsx:37-41, 71-77 | 3.6 |
| 24 | Low | endDate null fallback yok | project-card.tsx:259-266 | 5.6 |

## 7. KAPSAM NOTLARI

**Okunan dosyalar:**
- New_Frontend/src/pages/projects.jsx (78 satır, tam okundu)
- New_Frontend/src/primitives.jsx (relevant: AvatarStack 22-43, Badge 46-70, Button 73-118, Card 121-142, Kbd 145, Input 215-233, ProgressBar 236-240, SegmentedControl 242-256)
- New_Frontend/src/data.jsx (PROJECTS shape 18-28, getUser 207, status enum [active|completed|on_hold|archived])
- New_Frontend/src/i18n.jsx (project copy: projects, createProject, openProject, status, methodology)
- New_Frontend/src/icons.jsx (Search, Plus)
- Frontend2/app/(shell)/projects/page.tsx (130 satır, tam okundu)
- Frontend2/components/projects/project-card.tsx (288 satır, tam okundu)
- Frontend2/components/projects/confirm-dialog.tsx (39 satır, tam okundu)
- Frontend2/components/projects/archive-banner.tsx (85 satır, tam okundu — list sayfasında kullanılmadığı doğrulandı)
- Frontend2/services/project-service.ts (181 satır, tam okundu — ekstra projectService method'ları list sayfası için kapsam dışı ama ProjectResponseDTO `members`, `task_count` dönmüyor doğrulandı)
- Frontend2/hooks/use-projects.ts (106 satır, tam okundu)
- Frontend2/components/primitives/index.ts ve ilgili primitive'ler (Card, Button, Badge, AvatarStack, ProgressBar, SegmentedControl, Input)
- Frontend2/app/globals.css (.projects-grid, .hover-row, .btn-press klasları doğrulandı)

**Atlanan/eksik kalan:**
- Project Detail sayfası (`app/(shell)/projects/[id]/page.tsx`) — bu triajın kapsamı dışı.
- Project Create wizard (`app/(shell)/projects/new/page.tsx`) — bu triajın kapsamı dışı.
- `apiClient` dahili iletişim katmanı — kapsam dışı.

**Belirsizlikler:**
- Backend `Project` DTO'sunun `members` ve `task_count` alanları döndürüp döndürmediği bu triaj sırasında **swagger/OpenAPI ile teyit edilmedi**; `ProjectResponseDTO` (project-service.ts:33-50) tipinde bu alanlar yok ama backend tarafında ek alan olabilir. §1.1 ve §1.2 düzeltme önerisi backend kontrolüyle netleşmeli.
- "Klavyeyle gezin" ipucunun prototip tarafında **gerçek bir keyDown handler** karşılığı bulunmuyor — yalnızca görsel ipucu var. §1.5 bu boşluğu da işaret ediyor; karar verici "Kbd görsel — fonksiyon yok" mu yoksa "Kbd görsel + tam fonksiyon" mu olduğunu belirtmeli. Prototip kullanıcı talimatına göre "1:1" olduğundan, görselin fonksiyonel karşılığı eklenmesi tavsiye edilir.
- `ProgressBar` height/color/bg defaultları prototip ile bire bir uyumlu görünüyor ancak **kart yüksekliği `flex: 1` + `height: 100%` ile zorlanırken** prototipin **content-height** kartlarına göre alt boşluk farkı yaratır; görsel A/B karşılaştırması yapılmadı.
