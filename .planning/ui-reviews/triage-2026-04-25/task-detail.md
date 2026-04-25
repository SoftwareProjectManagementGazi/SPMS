# Task Detail (Görev Detayı) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-task-detail
**Prototip kaynak:**
- `New_Frontend/src/pages/task-detail.jsx`
- `New_Frontend/src/pages/create-task-modal.jsx` (referans)
- `New_Frontend/src/primitives.jsx`, `icons.jsx`, `data.jsx`, `i18n.jsx` (referans)

**Implementasyon kaynak:**
- `Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx`
- `Frontend2/components/task-detail/parent-task-link.tsx`
- `Frontend2/components/task-detail/watcher-toggle.tsx`
- `Frontend2/components/task-detail/properties-sidebar.tsx`
- `Frontend2/components/task-detail/sub-tasks-list.tsx`
- `Frontend2/components/task-detail/activity-section.tsx`
- `Frontend2/components/task-detail/comments-section.tsx`
- `Frontend2/components/task-detail/history-section.tsx`
- `Frontend2/components/task-detail/dependencies-section.tsx`
- `Frontend2/components/task-detail/attachments-section.tsx`
- `Frontend2/components/task-detail/description-editor.tsx`
- `Frontend2/components/task-detail/description-editor-rich.tsx`
- `Frontend2/components/task-detail/description-toolbar.tsx`
- `Frontend2/components/task-detail/inline-edit.tsx`
- `Frontend2/components/task-detail/phase-stepper.tsx`
- `Frontend2/components/task-modal/task-create-modal.tsx`
- `Frontend2/components/task-modal/task-modal-provider.tsx`
- `Frontend2/services/comment-service.ts`, `task-service.ts`, `attachment-service.ts`
- `Frontend2/hooks/use-task-detail.ts`, `use-tasks.ts`, `use-watchers.ts`
- `Frontend2/lib/audit-formatter.ts`, `lib/methodology-matrix.ts`
- `Frontend2/components/primitives/*` (Avatar, Badge, Button, Card, PriorityChip, Section, Tabs, StatusDot)

**Bilinen intentional extras (uyarı, hata değil):**
- Attachments / Ekler bölümü (Section 4.1)
- Rich text editor (açıklama TipTap; yorum sanitizasyonu yarım ama yorumlarda HTML enjekte edilebiliyor — Section 4.2 + 5.7)

## TL;DR Özet
- Eksik elementler: **15**
- Layout/şekil farkı: **9**
- Bilinmeyen extras: **5**
- Bilinen extras (uyarı): **2**
- Hatalı kod: **12**

- **EN KRİTİK 3 MADDE:**
  1. **Header tamamen yanlış sırada** (1.1, 2.1) — Prototip: breadcrumb ÜSTTE → bug-icon + büyük başlık → Watch/Link/Branch + MoreH aksiyon barı. Implementasyon: parent-link breadcrumb → başlık → "key · type" satırı → SADECE Watch (Link/Branch/MoreH yok). Watch ek olarak yanlış yerde — başlık altındaki aksiyon satırının içinde değil ayrı satırda. Sıralama, ayraçlar, kbd ve aksiyon eksiklikleri ciddi.
  2. **Sidebar 4 row + 1 section EKSİK** (1.2, 1.5, 1.6, 1.10) — `Bildiren / Reporter`, `Sprint`, `Etiketler değer chips`, `Bağımlılıklar (sidebar içinde)` prototipte sidebar'da listeleniyor; Frontend2 sidebar'ı bunları tamamen kaybetmiş. Bağımlılıklar ana kolona taşınmış (intentional gibi göstermiş ama prototip sidebar içinde tutuyor). Reporter satırı tamamen yok.
  3. **Sub-tasks satır şekli ve durum gösterimi prototipten saptı** (1.4, 2.5) — Prototip checkbox + Badge tone success/info/neutral + AVATAR sağda + grid `80px 20px 1fr 90px 22px`. Implementasyon checkbox YOK, StatusDot var, Badge var ama tone hep "neutral" (renk semantiği kayıp), arada due date column eklenmiş, grid `80px 1fr auto 90px 22px` (farklı). Prototipte due-date sütunu YOK.

## 1. EKSİK ELEMENTLER

### 1.1 Header aksiyon barı: Link, Branch, MoreH butonları
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:24-30`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx:186-200`
- **Görsel/davranış:** Prototip başlık altında 4 buton barı: `Watch / Link / Branch` (sm secondary, icon'lu) — sağda `MoreH` (ghost icon-only). Implementasyonda sadece `<WatcherToggle/>` var, diğer 3 buton + sağa yaslanan kebap menü tamamen düşmüş.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
    <Button size="sm" variant="secondary" icon={<Icons.Eye size={13}/>}>{lang === "tr" ? "Takip et" : "Watch"}</Button>
    <Button size="sm" variant="secondary" icon={<Icons.Link size={13}/>}>{lang === "tr" ? "Bağlantı" : "Link"}</Button>
    <Button size="sm" variant="secondary" icon={<Icons.GitBranch size={13}/>}>Branch</Button>
    <div style={{ flex: 1 }}/>
    <Button size="sm" variant="ghost" icon={<Icons.MoreH size={13}/>}/>
  </div>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Watcher toggle satırı kaldırılıp prototip aksiyon barı 1:1 geri konmalı. Link, Branch, MoreH butonları (mock onClick olsa bile) eklenmeli; MoreH sağ tarafa `flex: 1` aralıkla itilmeli. `WatcherToggle`'ın badge ile sarmalanmış halini bu barın ilk butonu olarak göster.

### 1.2 Sidebar: Bildiren / Reporter satırı
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:118`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/properties-sidebar.tsx:160-235` (Atanan ile Öncelik arasına)
- **Görsel/davranış:** Atanan altında ayrı satır: `Avatar + reporter.name`. Implementasyonda hiç yok; `task.reporterId` task entity'sinde mevcut (`task-service.ts:11`) ama UI'a düşmemiş.
- **Prototip kod alıntısı:**
  ```jsx
  <MetaRow label={lang === "tr" ? "Bildiren" : "Reporter"}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={reporter} size={20}/><span style={{ fontSize: 12.5 }}>{reporter?.name}</span></div></MetaRow>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** PropertiesSidebar'a Reporter MetaRow ekle (read-only ya da InlineEdit'li). reporterId mevcut, sadece UserPlaceholder mantığını assignee gibi `#${id}` ile gösterebilirsin.

### 1.3 Sidebar: Sprint badge
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:122`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/properties-sidebar.tsx:303-338` (Cycle bölgesi)
- **Görsel/davranış:** Prototip her zaman `Sprint` etiketiyle `<Badge size="xs" tone="info">Sprint 7</Badge>` gösteriyor. Implementasyon `cycle_id` boşken "—" ya da "Faz 12'de aktive edilecek" yazıyor; Sprint adı veya numarası badge olarak çıkmıyor.
- **Prototip kod alıntısı:**
  ```jsx
  <MetaRow label="Sprint"><Badge size="xs" tone="info">Sprint 7</Badge></MetaRow>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Cycle satırının display moduna `<Badge size="xs" tone="info">{cycleName}</Badge>` görsel formatı eklenmeli. Sprint adı tasarım sözleşmesinde info-tone Badge ile sunuluyor; mevcut implementasyon `#${id}` ya da plain text döndürüyor.

### 1.4 Sub-tasks: Checkbox sütunu + tone'lu Badge
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:57-66`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/sub-tasks-list.tsx:96-171`
- **Görsel/davranış:** Prototipte `<input type="checkbox" checked={st.status === "done"} readOnly/>` ikinci sütunda; Badge tone status'a göre `success/info/neutral`. Implementasyon checkbox'ı tamamen kaldırmış, StatusDot ile değiştirmiş; Badge tone hep "neutral" — renk semantiği kayıp.
- **Prototip kod alıntısı:**
  ```jsx
  <div key={st.key} style={{ display: "grid", gridTemplateColumns: "80px 20px 1fr 90px 22px", padding: "10px 14px", alignItems: "center", gap: 10, borderBottom: ..., fontSize: 12.5 }}>
    <div className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>{st.key}</div>
    <input type="checkbox" checked={st.status === "done"} readOnly/>
    <div style={{ textDecoration: st.status === "done" ? "line-through" : "none", ... }}>{st.title}</div>
    <Badge size="xs" tone={st.status === "done" ? "success" : st.status === "progress" ? "info" : "neutral"} dot>{...}</Badge>
    <Avatar user={u} size={20}/>
  </div>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Grid'i `80px 20px 1fr 90px 22px`'e geri al; ikinci sütuna readOnly checkbox koy; StatusDot'u yer almıyor — kaldır; Badge tone'unu status'a göre `success | info | neutral` map'le. (Due-date sütunu prototipte YOK — ekstra; bkz 3.4.)

### 1.5 Sidebar: Etiketler değer chips (read-only "auth", "mobile" gibi)
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:123`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/properties-sidebar.tsx:378-390`
- **Görsel/davranış:** Prototip `<Badge size="xs">auth</Badge><Badge size="xs">mobile</Badge>` — chip'lerde label TEXT'i. Implementasyon `task.labels` array'i sadece label ID'leri olduğu için `#${id}` gösteriyor. Backend label name'leri sidebar'a düşmüyor.
- **Prototip kod alıntısı:**
  ```jsx
  <MetaRow label={lang === "tr" ? "Etiketler" : "Labels"}><div style={{ display: "flex", gap: 4 }}><Badge size="xs">auth</Badge><Badge size="xs">mobile</Badge></div></MetaRow>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `useProjectLabels(projectId)` ile label master verisi çekilip `task.labels`[id]'lerle join edilmeli; chip içinde `label.name` göster. Aksi halde kullanıcılar sadece sayı görüyor.

### 1.6 Sidebar: Bağımlılıklar bölümü (sidebar'ın bir parçası olarak)
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:125-134`
- **Olması gereken implementasyon yeri:** Yok — bağımsız `dependencies-section.tsx` ana kolonda render ediliyor (`page.tsx:227`)
- **Görsel/davranış:** Prototip Bağımlılıklar başlığını ve listeyi sidebar Card içinde, Properties bloğunun ALT kısmında ayrı bir bölüm olarak gösteriyor (border-top + padding). Implementasyon ana kolona ayrı `<Section>` olarak taşımış. Visual hiyerarşi farklı.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{lang === "tr" ? "Bağımlılıklar" : "Dependencies"}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "var(--surface-2)", borderRadius: 4, fontSize: 12 }}>
        <Icons.Lock size={12} style={{ color: "var(--fg-subtle)" }}/>
        <span className="mono" style={{ color: "var(--fg-muted)" }}>MOBIL-8</span>
        <span style={{ color: "var(--fg-muted)" }}>engelliyor</span>
      </div>
    </div>
  </div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Karar 1: Bağımlılıkları sidebar'ın altına compact bir bölüm olarak ekle ve ana kolondaki büyük `DependenciesSection`'ı kaldır (prototip sadakati). Karar 2: Eğer ana kolonda büyük picker UI gerekiyorsa, sidebar'da read-only mini liste + ana kolonda detaylı yönetim göster. Şu an picker'a sahip büyük section ana kolonda, sidebar'da hiç yok — prototipten görsel olarak çok uzaklaşmış.

### 1.7 Header: Breadcrumb sırası — Folder + project + chevron + key
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:15-19`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx:127-183` (parent-task-link + key satırı yerine)
- **Görsel/davranış:** Prototipte breadcrumb HER TASK için var (sadece subtask değil): `Folder ico + project.name (clickable) + ChevronRight + task.key (mono)` — başlığın ÜSTÜNDE. Implementasyon `<ParentTaskLink>` SADECE `parentTaskId != null` ise render ediyor; normal task'ta hiç breadcrumb yok. Bunun yerine başlık altında `key · type` satırı var (prototipte YOK).
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--fg-muted)" }}>
    <Icons.Folder size={13}/><span onClick={...}>{project.name}</span>
    <Icons.ChevronRight size={11}/>
    <span className="mono">{task.key}</span>
  </div>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `<ParentTaskLink>`'i her task için breadcrumb gösterecek şekilde refactor et: parent yoksa `Folder + project.name + chevron + task.key`, parent varsa `Folder + project.name + chevron + parent.key + parent.title`. Başlık altındaki "key · type" ekstra satırını sil.

### 1.8 Yorum composer: Inset surface-2 placeholder div (textarea değil)
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:79-85`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/comments-section.tsx:160-263`
- **Görsel/davranış:** Prototip composer'ı YALNIZCA bir `<div>` placeholder text içinde gösteriyor (gerçek input değil — tıklanırsa expand edileceği varsayılıyor). Implementasyon hemen 3 satırlık `<textarea>` ile composer açıyor. UX davranışı, claim "1:1" değil. Ayrıca prototipte avatar SOL kolonunda görünür şekilde rendered, yorum composer ile aynı satırda (flex gap:10) — implementasyon avatarı surface-2 box'ın DIŞINDA value göstermiyor (Box'un üstünde).
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "flex", gap: 10 }}>
    <Avatar user={window.SPMSData.CURRENT_USER} size={26}/>
    <div style={{ flex: 1, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 10, boxShadow: "inset 0 0 0 1px var(--border)" }}>
      <div style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>{lang === "tr" ? "Yorum yaz… @ ile birinden bahset" : "Write a comment… @ to mention"}</div>
      <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
        <Button size="xs" variant="ghost">{lang === "tr" ? "Vazgeç" : "Cancel"}</Button>
        <Button size="xs" variant="primary">{lang === "tr" ? "Gönder" : "Send"}</Button>
      </div>
    </div>
  </div>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** Composer'ı tıklanmadan placeholder div olarak göster; tıklayınca textarea + Vazgeç/Gönder butonları aç. (Veya prototipi mock olduğu için yumuşat: en azından textarea'yı yorum kutusunun içine yerleştir, surface-2 inset shadow ile.)

### 1.9 Yorum gönder buton metni: "Gönder" (Send), "Post" değil
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:83`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/comments-section.tsx:220`
- **Görsel/davranış:** Prototip TR: "Gönder", EN: "Send". Implementasyon TR: "Gönder", EN: **"Post"** — EN copy farklı.
- **Prototip kod alıntısı:**
  ```jsx
  <Button size="xs" variant="primary">{lang === "tr" ? "Gönder" : "Send"}</Button>
  ```
- **Öncelik:** Low
- **Düzeltme önerisi:** EN string'i "Post" → "Send" olarak güncelle.

### 1.10 Worklog tab (Activity)
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:72`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/activity-section.tsx:48-62`
- **Görsel/davranış:** Prototip Activity bölümünde 3 sub-tab: `Yorumlar / Geçmiş / Worklog`. Implementasyon sadece 2 sub-tab: Yorumlar / Geçmiş. Worklog tab YOK. (Implementasyon yorumunda "explicitly deferred" yazılı.)
- **Prototip kod alıntısı:**
  ```jsx
  {[[lang === "tr" ? "Yorumlar" : "Comments", true], [lang === "tr" ? "Geçmiş" : "History", false], [lang === "tr" ? "Worklog" : "Worklog", false]].map(([l, a]) => (...))}
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** Worklog tab'ı (placeholder + "Yakında" message ile) ekle; en azından prototip görsel paritesi sağlanır.

### 1.11 Activity sub-tab: prototip pill style → Frontend2 alt-tab Tabs primitive
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:71-75`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/activity-section.tsx:42-63`
- **Görsel/davranış:** Prototip pill-shape buton: `padding 4px 10px, borderRadius 4, background var(--accent), color var(--accent-fg)`. Implementasyon `<Tabs size="sm">` primitive (alt çizgili 2px primary border). Görsel tamamen farklı. Bottom-border tabs vs. pill chips.
- **Prototip kod alıntısı:**
  ```jsx
  <button key={l} style={{ padding: "4px 10px", fontSize: 12, fontWeight: a ? 600 : 500, borderRadius: 4, background: a ? "var(--accent)" : "transparent", color: a ? "var(--accent-fg)" : "var(--fg-muted)" }}>{l}</button>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** Activity bölümü sub-tab'larını prototip pill-button kompozisyonuna geri al — bordered tab değil. Veya prototip değişiklik kabul edildiyse, design lead onayı yaz; şu an undocumented.

### 1.12 Açıklama içeriği: Prototip rich-style varsayılan içerik (paragraf + ul list)
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:32-45`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/description-editor.tsx`
- **Görsel/davranış:** Prototip Card padding=16 içinde markup (p + ul) gösteriyor. Implementasyon TipTap editor toggleable + plain textarea modu sunuyor. Prototip ikna edici default rendered HTML görsel taslağı — Frontend2 boş textarea ya da TipTap. Read-only/preview modu YOK.
- **Prototip kod alıntısı:**
  ```jsx
  <Card padding={16}>
    <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--fg)" }}>
      <p style={{ margin: 0 }}>{...}</p>
      <ul style={{ marginTop: 10, paddingLeft: 20, color: "var(--fg-muted)" }}>
        <li>...</li><li>...</li><li>...</li>
      </ul>
    </div>
  </Card>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Açıklamada Read-mode default göster — kullanıcı tıklayınca textarea/rich editor açılsın (prototipte edit görünmüyor; salt-okunur preview mantığı var). Ya da en azından Card padding=16 ile sarmala — şu an raw textarea.

### 1.13 i18n key kullanımı (window.SPMSi18n.t)
- **Prototipte:** `New_Frontend/src/i18n.jsx:23-31` (common.assignee, common.priority, common.status, common.description vs.)
- **Olması gereken implementasyon yeri:** `Frontend2/lib/i18n.ts` veya inline string'ler
- **Görsel/davranış:** Prototip `t("common.assignee", lang)` gibi merkezi key → string mapping kullanıyor. Implementasyon her component içinde `lang === "tr" ? "Atanan" : "Assignee"` ternary inline — `lib/i18n.ts` neredeyse hiç çağrılmıyor. Tek istisna `PriorityChip` `t('priority.X', lang)` kullanıyor. Tutarsız ve i18n key'leri kayıp.
- **Öncelik:** Medium
- **Düzeltme önerisi:** Tüm task-detail copy string'lerini `lib/i18n.ts` `t()` fonksiyonu ile değiştir. Şu anki inline ternary'ler hem maintenance kabusu hem de iki dil arasında tutarsız (örn. "Send/Post" gibi).

### 1.14 Composer placeholder string (TR/EN)
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:80`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/comments-section.tsx:177-181`
- **Görsel/davranış:** Eşleşme var. ✓ (uyumlu)
- **Öncelik:** —

### 1.15 Sidebar: Properties başlığı / uppercase
- **Prototipte:** `New_Frontend/src/pages/task-detail.jsx:114`
- **Olması gereken implementasyon yeri:** `Frontend2/components/task-detail/properties-sidebar.tsx:118-130`
- **Görsel/davranış:** Eşleşme var. ✓

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.1 Header iç sıra: title vs key satırı
- **Prototip:** `task-detail.jsx:15-30` — Üstte breadcrumb (project + chevron + key) → Bug-icon + Title → Aksiyon barı.
- **Implementasyon:** `page.tsx:124-200` — ParentTaskLink (sadece subtask için) → Title → KEY + TYPE meta line → Watcher row.
- **Fark:** Implementasyon key'i başlığın ALTINDA gösteriyor; prototip key'i breadcrumb'da ÜSTTE gösteriyor + "type" hiç gösterilmiyor. Tüm header sırası kayık. Ek olarak başlık altında "MOBIL-19 · subtask" tarzı iki dot çizgisi prototipte YOK (1.7 ile bağlantılı).
- **Öncelik:** Critical

### 2.2 Sidebar Card padding & inner section padding
- **Prototip:** `task-detail.jsx:113-135` — Card padding=0; içeride `padding: 14px 16px` header + `padding: 8px 0` row container + `padding: 6px 16px` her satır + `padding: 12px 16px` Bağımlılıklar bölümü (border-top'lı).
- **Implementasyon:** `properties-sidebar.tsx:117-396` — Card padding=0, header 14px/16px ✓, row container 8px/0 ✓, satır 6px/16px ✓ — sidebar boyut iskeletinin kendisi tamam. Ama Bağımlılıklar bölümü taşınmış, sidebar alt sınırı muğlak.
- **Fark:** Sidebar layout iskeletinin kendisi yakın. Sadece içerik sırası ve eksik satırlar (Reporter, Sprint badge, Etiket name, Bağımlılıklar) bozuyor.
- **Öncelik:** Medium

### 2.3 Watcher buton: Badge'in dışına çıkmış
- **Prototip:** `task-detail.jsx:25` — `<Button size="sm" variant="secondary" icon={<Icons.Eye size={13}/>}>Takip et</Button>` — sadece buton; watcher_count badge'i prototipte YOK.
- **Implementasyon:** `watcher-toggle.tsx:43-74` — Button + `<Badge size="xs" tone="neutral">{task.watcherCount}</Badge>` yan yana.
- **Fark:** Watcher count Badge prototipte yok ama implementasyonda eklenmiş — yararlı UX ama prototip sadakati ihlali.
- **Öncelik:** Low (ek özellik kabul edilebilir, ama 1.1 ile birlikte aksiyon barı düzelterek bu Badge'in kalıp kalmayacağına karar ver)

### 2.4 Bug ikonu kutusu: konumu farklı
- **Prototip:** `task-detail.jsx:21-23` — Bug ikonu Title'la AYNI satırda (display: flex; alignItems: center).
- **Implementasyon:** `page.tsx:128-167` — Bug ikonu `alignItems: "flex-start"` ile flex container'da; Title kendi `<h1>` tag'inde. Görsel olarak yakın ama vertical alignment subtle farkla bozuk olabilir.
- **Fark:** alignItems değeri (`center` vs `flex-start`).
- **Öncelik:** Low

### 2.5 Sub-tasks satır grid: 4 sütun vs 5 sütun + due-date sütunu eklenmiş
- **Prototip:** `task-detail.jsx:57` — `gridTemplateColumns: "80px 20px 1fr 90px 22px"` → key + checkbox + title + status badge + avatar.
- **Implementasyon:** `sub-tasks-list.tsx:111` — `gridTemplateColumns: "80px 1fr auto 90px 22px"` → key + (StatusDot + title) + statusBadge + dueDate + avatar.
- **Fark:** Checkbox sütunu kayıp; due-date sütunu eklenmiş (prototipte yok); StatusDot title'ın YANINA itilmiş (prototipte yok); status Badge yerleşim sırası kayık.
- **Öncelik:** Critical

### 2.6 Sub-tasks: title strikethrough
- **Prototip:** `task-detail.jsx:60` — `textDecoration: st.status === "done" ? "line-through" : "none"` ✓
- **Implementasyon:** `sub-tasks-list.tsx:138-139` — `textDecoration: isDone ? "line-through" : "none"` ✓
- **Fark:** Yok ✓

### 2.7 Bağımlılıklar bölümü: dış kart vs sidebar inline
- **Prototip:** Sidebar Card içi compact list — sadece tek bir mock satır gösteriyor.
- **Implementasyon:** Ana kolonda `<Section title="Bağımlılıklar"><Card padding={0}>` + picker + ConfirmDialog. Çok daha büyük UI.
- **Fark:** Mock vs prod yapı farkı kabul, ama prototipte sidebar'ın bir parçası — burada konumlanması bile farklı (1.6 ile aynı).
- **Öncelik:** High

### 2.8 Activity sub-tab Tabs vs prototip pill-button
- **Fark:** 1.11 ile aynı.
- **Öncelik:** Medium

### 2.9 Comment "Geçmiş" ve "Worklog" tab'lar
- **Prototip:** 3 tab: Yorumlar (active) / Geçmiş / Worklog.
- **Implementasyon:** 2 tab: Yorumlar / Geçmiş. Worklog yok (1.10).
- **Fark:** 3 → 2.
- **Öncelik:** Medium

## 3. BİLİNMEYEN EXTRAS

### 3.1 PhaseStepper widget (TASK-04 + UI-SPEC §10)
- **Implementasyonda:** `Frontend2/components/task-detail/phase-stepper.tsx` (PropertiesSidebar:393-395 içinde)
- **Prototipte:** Yok (task-detail.jsx'te hiç bahsi geçmiyor)
- **Açıklama:** Conditional widget — `enable_phase_assignment + sub-tasks` olunca aktif. UI-SPEC §10'a referans veriyor ama prototip task-detail sayfasında yok. İntentional spec'ten gelmiş ama prototipte desteklenmiyor — kullanıcı bilmiyor olabilir.
- **Öncelik:** Medium (intentional gibi ama prototip-vs-impl uyumsuzluğu uyarılmalı)

### 3.2 Inline-edit (click-to-edit) tüm sidebar satırlarında
- **Implementasyonda:** `Frontend2/components/task-detail/inline-edit.tsx` (PropertiesSidebar her satırda `<InlineEdit>` ile sarmalı)
- **Prototipte:** Yok — prototip sadece statik display gösteriyor (edit modu yok)
- **Açıklama:** Optimistic PATCH ile click-to-edit. Çok kullanışlı bir özellik ama prototip mock'tan çok daha karmaşık. UI-SPEC §9'a referans veriyor ama prototip sadakati noktasından uzaklaşmış.
- **Öncelik:** Low (yararlı, intentional kabul edilebilir; sadece dokümante edilmemiş)

### 3.3 Watcher count Badge
- **Implementasyonda:** `watcher-toggle.tsx:70-72`
- **Prototipte:** Yok (prototip sadece buton metnini değiştiriyor)
- **Açıklama:** Buton yanında neutral tone Badge ile watcher sayısı.
- **Öncelik:** Low

### 3.4 Sub-task satırında due-date sütunu
- **Implementasyonda:** `sub-tasks-list.tsx:157-164`
- **Prototipte:** Yok
- **Açıklama:** Sub-task listinde her satırda `due` tarihini "Apr 25" formatında gösteriyor. Prototipte sub-task grid'inde sadece key + status + title + Badge + avatar var.
- **Öncelik:** Medium (intentional iyileştirme olabilir ama prototip sadakati yok)

### 3.5 Sub-task'ın sub-task detay sayfasına navigate olması (cursor: pointer)
- **Implementasyonda:** `sub-tasks-list.tsx:101-122`
- **Prototipte:** Yok — prototip subtask satırları statik (click handler yok)
- **Açıklama:** Sub-task satırına tıklayınca `router.push(/projects/.../tasks/...)`. Faydalı UX ama prototip mock'ta yok.
- **Öncelik:** Low (faydalı extra)

## 4. BİLİNEN EXTRAS (UYARI — Kullanıcı bilerek ekledi)

### 4.1 Attachments / Ekler
- **Implementasyonda:** `Frontend2/components/task-detail/attachments-section.tsx` (page.tsx:224 içinde render)
- **Prototipte:** Yok (intentional)
- **Quality check:**
  - **İYİ:** Drag-drop, file + link upload, ConfirmDialog ile silme, `rel="noopener noreferrer"` link güvenliği eklenmiş (T-11-09-02).
  - **EKSİK / SORUNLU:**
    - **Dosya tipi (MIME) ya da boyut whitelist'i YOK** (sadece backend doğruluyor; frontend kullanıcıyı önceden uyarmıyor — 5GB MP4 yüklemeye çalışırsa upload fail oluncaya kadar bekler).
    - Dosya adında özel karakter ya da `..` path traversal kontrolü YOK.
    - `<input type="file" multiple>` kullanılmış ama `accept=...` attribute eklenmemiş — kullanıcıya ip ucu yok.
    - Upload progress yok, büyük dosya UX'i kötü.
- **Öncelik:** Medium uyarı (functional ama validation ve UX iyileştirme gerekli)

### 4.2 Rich Text Editor (TipTap) + Sanitization
- **Implementasyonda:**
  - Açıklama: `description-editor.tsx`, `description-editor-rich.tsx`, `description-toolbar.tsx`
  - Yorumlar: `comments-section.tsx:36-44, 419-431` (HTML strip)
- **Prototipte:** Yok (intentional)
- **Quality check:**
  - **AÇIKLAMA İÇİN İYİ:**
    - TipTap dynamic import + ssr:false (RESEARCH Pitfall 2 doğru çözülmüş)
    - 2s debounced save (D-36 spec uyumlu)
    - `setContent({ emitUpdate: false })` ile loop'tan kaçınma
    - localStorage ile mode persistence
    - Toolbar `onMouseDown preventDefault` ile focus kaybetmeme (PM detayı doğru)
  - **YORUMLAR İÇİN PROBLEMATİK:**
    - **Composer rich text DEĞIL** — sadece `<textarea>` + manuel `<span class="mention" data-user-id="...">@Name</span>` HTML enjeksiyonu yapıyor (`comments-section.tsx:141`).
    - **Display'de `stripHtml()` regex `s.replace(/<[^>]*>/g, "")`** — regex tabanlı sanitization; `<img onerror=...>` ya da `<svg><script>` gibi cross-context payload'lar regex çıktısına bağlı. Yorum yorum işaretleyen `<` `>` içeren legitimate text'i de yiyor (örnek: `if (a < b) {...}`).
    - **DOMPurify YOK** — hem yetersiz koruma hem de yanlış pozitif filter. Yorumda yazılı `</tag>` tipi text yenir. README'de "future upgrade path" yazıyor ama production'a hazır değil.
    - Mention token `<span class="mention" data-user-id="${m.id}">@${m.name}</span>` HTML olarak enjekte ediliyor; `m.name` özel karakter (`<`, `>`) içerse XSS vector — şu an strip yiyor ama ileride render'a düşerse risk.
    - **HENÜZ SECURITY DEBT YOK** ama "rich text in comments" claim'i doğru değil — composer plain text + mention enjeksiyonu olarak çalışıyor, render'da ise HTML strip ediliyor (rich text görüntüleme yok).
- **Öncelik:** High uyarı (security debt)

## 5. HATALI / SORUNLU KOD

### 5.1 ParentTaskLink yalnızca subtask için breadcrumb gösteriyor
- **Dosya:** `Frontend2/components/task-detail/parent-task-link.tsx:31`
- **Sorun türü:** Bug (prototip uyumsuzluğu)
- **Açıklama:** `if (parentId == null) return null` — normal task için breadcrumb hiç render etmiyor. Prototip her task için Folder + project + chevron + key breadcrumb'ını ÜSTTE göstermek istiyor (1.7).
- **Öneri:** Component'i `<TaskBreadcrumb>` olarak yeniden adlandır; parent yoksa key, varsa parent göster — ama her zaman göster.
- **Öncelik:** Critical

### 5.2 Sidebar Status Badge tone hep "neutral"
- **Dosya:** `Frontend2/components/task-detail/properties-sidebar.tsx:138-141`
- **Sorun türü:** Bug (prototip uyumsuzluğu)
- **Açıklama:**
  ```tsx
  renderDisplay={(v) => (
    <Badge size="xs" dot tone="neutral">
      {v || "—"}
    </Badge>
  )}
  ```
  Prototipte (task-detail.jsx:116): `tone={task.status === "done" ? "success" : task.status === "progress" ? "info" : task.status === "review" ? "warning" : "neutral"}`. Implementasyon her status için neutral tone kullanıyor — renk semantiği KAYIP. Status'a bakınca kullanıcı `Done` mu yoksa `Todo` mu olduğunu renkten anlayamıyor.
- **Öneri:** Tone'u status değerine göre map'le; prototip ile aynı switch.
- **Öncelik:** High

### 5.3 Sub-tasks Badge tone hep "neutral"
- **Dosya:** `Frontend2/components/task-detail/sub-tasks-list.tsx:154-156`
- **Sorun türü:** Bug (prototip uyumsuzluğu)
- **Açıklama:** Aynı bug 5.2 ile — prototip success/info/neutral'a göre tone değiştiriyor, implementasyon hep neutral.
- **Öneri:** `Badge tone={isDone ? "success" : st.status === "progress" ? "info" : "neutral"} dot` kullan.
- **Öncelik:** High

### 5.4 Sidebar Status Badge "—" fallback metni içeriyor (display'de string yorumlanır)
- **Dosya:** `Frontend2/components/task-detail/properties-sidebar.tsx:140`
- **Sorun türü:** Style drift / data normalization
- **Açıklama:** Backend status string'i geliyor (örn. "todo", "progress") ama display'de raw string render. Prototip status name'ini i18n locale ile gösteriyor (`status.name[lang]` → "Yapılacak" / "To Do"). Implementasyon "todo" gibi i18n'siz raw text gösteriyor → kullanıcıya İngilizce/lowercase görünüyor.
- **Öneri:** Status değerini `STATUS_META` (status-dot.tsx içinde mevcut) üzerinden lokalize et veya i18n key kullan.
- **Öncelik:** High

### 5.5 Sub-tasks Badge `{st.status}` raw string render
- **Dosya:** `Frontend2/components/task-detail/sub-tasks-list.tsx:154-156`
- **Sorun türü:** Style drift / no localization
- **Açıklama:** `<Badge>{st.status}</Badge>` raw "todo" ya da "progress" gösteriyor; prototip ise localized name gösteriyor (`STATUSES.find(s => s.id === st.status).name[lang]`). Kullanıcı görselinde "todo" değil "Yapılacak" görmeli.
- **Öneri:** STATUS_META lookup ile localize et.
- **Öncelik:** High

### 5.6 Comment displayName fallback `User #${id}` (TR'de bile İngilizce)
- **Dosya:** `Frontend2/components/task-detail/comments-section.tsx:324`
- **Sorun türü:** i18n bug
- **Açıklama:** `c.authorName || `User #${c.authorId}`` — TR locale'de bile "User #5" gösterir; "Kullanıcı #5" olmalı.
- **Öneri:** `lang === "tr" ? "Kullanıcı" : "User"` ile prefix değiştir.
- **Öncelik:** Low

### 5.7 Comment XSS sanitization tek başına regex
- **Dosya:** `Frontend2/components/task-detail/comments-section.tsx:36-44`
- **Sorun türü:** Security
- **Açıklama:**
  ```ts
  function stripHtml(s: string | null | undefined): string {
    if (s == null) return ""
    return String(s).replace(/<[^>]*>/g, "")
  }
  ```
  - Çok primitif. Karmaşık HTML (multi-line tag, attribute içinde `>` karakteri) bypass edilebilir.
  - Lekitimate user text: `"a < b > c"` → `"a  c"` olarak yenir (false positive).
  - Server'dan gelen body'de `<script>alert(1)</script>` yenir AMA `<svg/onload=alert(1)>` regex açısından da yenir; ancak `<<script>>script>` gibi nested şu anki regex ile yetersiz olabilir.
  - DOMPurify kullanılmıyor; `dangerouslySetInnerHTML` da kullanılmıyor (text content olarak set ediliyor) — şu an directly XSS vektörü YOK ama "rich text comment" iddiası yok ki, tüm display plain text.
- **Öneri:** Mevcut `whiteSpace: "pre-wrap"` ile zaten plain text render ediyor. Regex tamamen kaldırılıp DOMPurify entegre edilebilir, ya da backend'in zaten body'yi escape ettiği garanti altına alınmalı. README'deki "future upgrade path" notu YETERSİZ — production-ready değil.
- **Öncelik:** Medium (mevcut kullanım güvenli ama design fragile)

### 5.8 Mention insertion as raw HTML in textarea value
- **Dosya:** `Frontend2/components/task-detail/comments-section.tsx:141-145`
- **Sorun türü:** Security / UX bug
- **Açıklama:**
  ```ts
  const token = `<span class="mention" data-user-id="${m.id}">@${m.name}</span> `
  ```
  - `m.name` özel karakter içerirse (örn. `<script>`) HTML kırılır. Backend mention parsing süreci buna bağlı bir vector.
  - User textarea içinde `<span ...>@Name</span>` görsel olarak görünüyor — UX kötü, mention bir badge gibi görünmüyor, raw HTML olarak yazılı.
  - Sonra `stripHtml()` ile silinir — yani `@Name` text'i kaybolur ve mention bilgisi.
- **Öneri:** Mention'ları contentEditable + ProseMirror gibi structured kullan ya da textarea üstüne overlay popover (renderable token) yap. Şu anki yaklaşım hem güvensiz hem UX kötü.
- **Öncelik:** Medium

### 5.9 Page-level localStorage persistence not used (mode reset on tab switch)
- **Dosya:** `Frontend2/components/task-detail/description-editor.tsx:36-67`
- **Sorun türü:** Hydration risk / minor UX
- **Açıklama:** `useEffect` ile localStorage'tan oku → ilk render plain mode, sonra rich'e geçer (eğer kullanıcı son seçim rich ise). Visible flicker olabilir. Acceptable trade-off (no SSR mismatch). Note: hydration mismatch'i önlemek için doğru implement edilmiş.
- **Öneri:** Acceptable as-is, ama ilk render `null` placeholder gösterilirse UX daha iyi.
- **Öncelik:** Low

### 5.10 InlineEdit edit-mode wrapper outline yerleşim
- **Dosya:** `Frontend2/components/task-detail/inline-edit.tsx:131-150`
- **Sorun türü:** A11y / Style drift
- **Açıklama:** Edit moduna geçildiğinde wrapper div'in `outline: 2px solid var(--ring)` var ama bu hem editor input'unun kendi focus ring'i ile çakışır hem de eğer kullanıcı focus'u içeride başka bir element'e taşırsa wrapper outline kalır. Native focus management eksik.
- **Öneri:** Wrapper outline'ı kaldır; editor input'un kendi `:focus-visible` ring'ine güven.
- **Öncelik:** Low

### 5.11 PropertiesSidebar `editorStyle.outline` not set inline (a11y comment yanlış)
- **Dosya:** `Frontend2/components/task-detail/properties-sidebar.tsx:35-46`
- **Sorun türü:** A11y verification needed
- **Açıklama:** Comment "outline intentionally NOT set inline so :focus-visible ring paints (a11y)" diyor — verify et: `:focus-visible` style'ı global CSS'te tanımlanmış mı? Globals.css'de `--ring` var ama `:focus-visible` selector'ı somut tanımlanmamışsa default browser ring kullanılır. UI-SPEC §a11y compliance'ı doğrulanmalı.
- **Öneri:** Globals.css'te `*:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }` benzeri bir kural olduğunu doğrula.
- **Öncelik:** Medium

### 5.12 PropertiesSidebar Phase Stepper sidebar içinde — "subtask none" durumunda boş div render ediyor
- **Dosya:** `Frontend2/components/task-detail/properties-sidebar.tsx:392-395`
- **Sorun türü:** Performance / Dead code visual
- **Açıklama:** `<PhaseStepper>` `subtasks.length === 0 || !enabled || nodes.length === 0` ise `null` döndürüyor (phase-stepper.tsx:47). Yine de wrapping `<div style={{ padding: "6px 16px" }}>` her zaman render ediliyor → invisible empty padding takes vertical space.
- **Öneri:** Wrapper div'i de conditional render et: `{phaseEnabled && subtasks.length > 0 && nodes.length > 0 && <div style={...}><PhaseStepper .../></div>}`.
- **Öncelik:** Low

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| # | Öncelik | Madde | Dosya | Bölüm |
|---|---------|-------|-------|-------|
| 1 | Critical | Header aksiyon barını (Watch/Link/Branch/MoreH) prototipten 1:1 yeniden ekle | `app/(shell)/projects/[id]/tasks/[taskId]/page.tsx:186-200` | 1.1 |
| 2 | Critical | Breadcrumb her task için göster (sadece subtask değil); başlık altındaki "key · type" satırını kaldır | `components/task-detail/parent-task-link.tsx`, `page.tsx:169-183` | 1.7, 5.1 |
| 3 | Critical | Sub-tasks grid'ini prototip 5-sütun (key + checkbox + title + statusBadge + avatar) yapısına geri al | `components/task-detail/sub-tasks-list.tsx` | 1.4, 2.5, 3.4 |
| 4 | High | Sidebar Reporter satırı ekle | `components/task-detail/properties-sidebar.tsx` | 1.2 |
| 5 | High | Sidebar Sprint satırını badge tone="info" ile göster | `components/task-detail/properties-sidebar.tsx:303-338` | 1.3 |
| 6 | High | Sidebar Etiketler chips'inde label name göster (#id değil) | `components/task-detail/properties-sidebar.tsx:378-390` | 1.5 |
| 7 | High | Bağımlılıklar bölümünü sidebar'a (compact list) taşı veya sidebar'da read-only mini liste göster | `components/task-detail/dependencies-section.tsx`, `properties-sidebar.tsx` | 1.6, 2.7 |
| 8 | High | Sidebar status Badge tone'u prototip switch ile (success/info/warning/neutral) map'le | `components/task-detail/properties-sidebar.tsx:138-141` | 5.2 |
| 9 | High | Sub-tasks status Badge tone'unu success/info/neutral map'le | `components/task-detail/sub-tasks-list.tsx:154-156` | 5.3 |
| 10 | High | Status değerlerini lokalize et (Yapılacak / In Progress vs.) | `properties-sidebar.tsx`, `sub-tasks-list.tsx` | 5.4, 5.5 |
| 11 | High | Açıklama default değerini Card padding=16 + read-mode ile sun | `components/task-detail/description-editor.tsx` | 1.12 |
| 12 | Medium | Activity sub-tab'larını prototip pill-button kompozisyonuyla değiştir | `components/task-detail/activity-section.tsx:42-63` | 1.11, 2.8 |
| 13 | Medium | Activity'ye Worklog tab'ı (placeholder yapılı) ekle | `components/task-detail/activity-section.tsx` | 1.10, 2.9 |
| 14 | Medium | Comment composer'ı prototip placeholder-div tarzına çevir | `components/task-detail/comments-section.tsx:160-263` | 1.8 |
| 15 | Medium | i18n key'leri merkezileştir (`lib/i18n.ts`'e tüm task-detail string'leri taşı) | tüm task-detail dosyaları | 1.13 |
| 16 | Medium | Comment XSS strategy'sini DOMPurify ile değiştir veya backend escape garantisini doğrula | `components/task-detail/comments-section.tsx:36-44` | 5.7 |
| 17 | Medium | Mention insertion'ı raw HTML değil structured token olarak değiştir | `components/task-detail/comments-section.tsx:141-145` | 5.8 |
| 18 | Medium | Attachments için MIME/size whitelist + accept attribute ekle | `components/task-detail/attachments-section.tsx` | 4.1 |
| 19 | Medium | `:focus-visible` global ring CSS rule'ını doğrula | `app/globals.css` | 5.11 |
| 20 | Low | Comment "Post" → "Send" EN copy düzelt | `components/task-detail/comments-section.tsx:220` | 1.9 |
| 21 | Low | Comment fallback name "Kullanıcı #N" lokalize | `components/task-detail/comments-section.tsx:324` | 5.6 |
| 22 | Low | Watcher count Badge'i değerlendir (kalsın mı, kalkmasın mı) | `components/task-detail/watcher-toggle.tsx:70-72` | 2.3, 3.3 |
| 23 | Low | PhaseStepper boş wrapper div'i conditional render et | `components/task-detail/properties-sidebar.tsx:392-395` | 5.12 |
| 24 | Low | InlineEdit edit-mode wrapper outline kaldır | `components/task-detail/inline-edit.tsx:131-150` | 5.10 |

## 7. KAPSAM NOTLARI

### Okunan dosyalar
- **Prototip:**
  - `New_Frontend/src/pages/task-detail.jsx` (148 satır, tam okundu)
  - `New_Frontend/src/pages/create-task-modal.jsx` (276 satır, tam okundu)
  - `New_Frontend/src/primitives.jsx` (307 satır, tam okundu — Avatar/Badge/Button/Card/Section/PriorityChip/StatusDot/Tabs incelendi)
  - `New_Frontend/src/icons.jsx` (ilk 80 satır okundu)
  - `New_Frontend/src/i18n.jsx` (tam okundu — 95 satır)
  - `New_Frontend/src/data.jsx` (ilk 100 satır okundu — task / status / project shape)
- **Implementasyon:**
  - `Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx` (240 satır, tam okundu)
  - `Frontend2/components/task-detail/*` — 15 dosyanın tamamı tam okundu (parent-task-link, watcher-toggle, properties-sidebar, sub-tasks-list, activity-section, comments-section, history-section, dependencies-section, attachments-section, description-editor, description-editor-rich, description-toolbar, inline-edit, phase-stepper, inline-edit.test, sub-tasks-list)
  - `Frontend2/components/task-modal/task-create-modal.tsx` (792 satır, tam okundu)
  - `Frontend2/components/task-modal/task-modal-provider.tsx` (24 satır, tam okundu)
  - `Frontend2/components/task-modal/task-create-modal.test.tsx` (212 satır, tam okundu)
  - `Frontend2/services/comment-service.ts`, `task-service.ts`, `attachment-service.ts`, `project-service.ts` (tam okundu)
  - `Frontend2/hooks/use-task-detail.ts`, `use-tasks.ts`, `use-watchers.ts` (tam okundu)
  - `Frontend2/lib/audit-formatter.ts` (133 satır, tam okundu)
  - `Frontend2/lib/methodology-matrix.ts` (110 satır, tam okundu)
  - `Frontend2/components/primitives/index.ts`, `section.tsx`, `badge.tsx`, `priority-chip.tsx`, `status-dot.tsx`, `tabs.tsx`, `avatar.tsx`, `button.tsx` (tam okundu)

### Atlanan / Eksik kalan
- `New_Frontend/src/icons.jsx` — sadece ilk 80 satır okundu (~250+ satır var); incelenen icon'lar: Folder, ChevronRight, Bug, Eye, Link, GitBranch, MoreH, Plus, X, Lock — task-detail için yeterli.
- `New_Frontend/src/data.jsx` — sadece ilk 100 satır (task/status/project shape için yeterli).
- `Frontend2/services/label-service.ts`, `Frontend2/hooks/use-labels.ts` — taranmadı (sidebar Etiketler bug'ı için yeterli context vardı).
- `Frontend2/lib/i18n.ts` — incelenmedi (i18n.tsx prototipi referans alındı; Frontend2 tarafında inline ternary kullanımı zaten görünür).
- `app/globals.css` — `:focus-visible` rule'ı için doğrulama yapılmadı (5.11 madde olarak yazıldı).
- Backend `/comments`, `/attachments`, `/tasks/{id}/dependencies`, `/tasks/{id}/history` endpoint dökümantasyonu — service dosyalarındaki shape bilgisi ile yetinildi.

### Belirsizlikler
- **PhaseStepper UI-SPEC §10 referansı:** Spec dosyalarına bakılmadı; spec gerçekten task-detail page'inde PhaseStepper olmalı diyorsa ekstra değil. Ben prototip-vs-implementation karşılaştırması yaptığım için prototip kaynağını ground truth aldım.
- **InlineEdit (click-to-edit) UI-SPEC §9:** Aynı şekilde — spec gerektiriyorsa intentional, prototipte yok.
- **Watcher count Badge:** UX iyileştirmesi olabilir — design lead onayı gerekli.
- **Bağımlılıklar bölümünün ana kolona taşınması:** Phase 11 plan'ı bunu mu istiyor, yoksa ekstra mi — plan dosyasına bakılmadı.
- **"Rich text in comments" claim'i:** Implementasyonda yorum composer'ı sadece textarea + manual mention HTML enjeksiyonu; gerçek rich text editor (TipTap) yorumlarda kullanılmıyor. Prompt "rich text editor (description + comments) intentional" dediği için 4.2'de uyarı olarak tutuldu ama implementasyon claim ile uyumsuz.
- **`MetaRow` prototipte 6px 16px padding ama implementasyonda 6px 16px ✓** — eşleşme tamam.
