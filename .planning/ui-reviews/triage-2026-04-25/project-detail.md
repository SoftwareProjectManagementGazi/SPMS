# Project Detail (Proje Detayı — Board/Activity/Lifecycle) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-project-detail
**Prototip kaynak:**
- New_Frontend/src/pages/project-detail.jsx
- New_Frontend/src/pages/activity-tab.jsx
- New_Frontend/src/pages/lifecycle-tab.jsx
**Implementasyon kaynak:**
- Frontend2/app/(shell)/projects/[id]/page.tsx
- Frontend2/components/project-detail/ (project-detail-shell, board-tab, board-card, board-column, board-toolbar, list-tab, timeline-tab, calendar-view, activity-stub-tab, members-tab, settings-tab, settings-general-subtab, settings-columns-subtab, backlog-panel, backlog-toggle, backlog-task-row, project-detail-context)
- Frontend2/components/lifecycle/ (lifecycle-tab, summary-strip, overview-subtab, milestones-subtab, history-subtab, history-card, artifacts-subtab, artifact-inline-expand, milestone-inline-add-row, phase-gate-expand, criteria-editor-panel, evaluation-report-card, mini-metric, workflow-empty-state)
**Bilinen intentional extras:** Yok (extras task-detail sayfasında)

## TL;DR Özet
- Eksik elementler: 18
- Layout/şekil farkı: 12
- Bilinmeyen extras: 9
- Bilinen extras: 0
- Hatalı kod: 11
- **EN KRİTİK 3 MADDE:**
  1. **Page Header tamamen ayrı bir tasarımla yapılmış.** Prototip (project-detail.jsx:14-37): tek satırda key chip + büyük başlık + methodology Badge + status Badge (dotlu) + İş akışı/MoreH/Görev butonları + alt satırda tarih aralığı, üye sayısı, görev sayısı, Sprint counter ve AvatarStack. Implementasyon (page.tsx:53-70): 24px başlık + altında "key · methodology" satırı + sağda tek "Düzenle" butonu — methodology Badge yok, status Badge yok, lead/team avatarları yok, tarih aralığı yok, üye/görev/sprint metaları yok, "İş akışı" ve "Görev" butonları yok. Üst başlık tamamen yeniden tasarlanmalı.
  2. **Activity tab tamamen stub** — `ActivityStubTab` yalnızca "Bu sekme Faz 13'te aktive edilecek" AlertBanner gösteriyor. Prototype'taki tam timeline (gruplanmış olaylar, filtre SegmentedControl, kullanıcı avatar filtreleri, tipli ikon nokta + renk, durum geçiş Badge'leri, atama oku, yorum kutusu, "Daha fazla yükle", boş durum, dikey timeline çizgisi) hiç yok.
  3. **Tab seti eksik ve sırası yanlış.** Prototip 8 tab (Board, List, Timeline, Calendar, Activity, Lifecycle, Members, Settings) — fakat List tab'ı `badge: tasks.length`, Members tab'ı `badge: members.length` taşıyor; Lifecycle başlığı methodology Kanban ise "Akış Metrikleri" oluyor. Implementasyon Tab badge'lerini hiç koymadı, "Akış Metrikleri" methodology dinamizmini taşımadı (sabit "Yaşam Döngüsü"); ek olarak prototype'ta Members'a yerleşik "Bekleyen istekler" yan paneli ve gerçek üye listesi var, implementasyon yalnızca PM kart stub'ı gösteriyor.

## 1. EKSİK ELEMENTLER

### 1.A Header (Üst Başlık)

### 1.1 Project key chip
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:18`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/[id]/page.tsx:53-65`
- **Görsel/davranış:** key (örn. `WEB`) `mono`, 11px, 600 weight, `var(--surface-2)` arka plan, `3px 8px` padding, `4px` radius, başlığın solunda chip olarak.
- **Prototip kod alıntısı:**
  ```jsx
  <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", background: "var(--surface-2)", padding: "3px 8px", borderRadius: 4 }}>{project.key}</div>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Header tek satıra alınmalı; key chip + isim + methodology Badge + status Badge + butonlar + alt satırda meta + AvatarStack.

### 1.2 Methodology Badge
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:20`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/[id]/page.tsx:55-65`
- **Görsel/davranış:** scrum/kanban/waterfall'a göre `tone="info"|"primary"|"warning"`. Implementasyon yalnızca düz metin olarak yazıyor (`{project.methodology}`) — Badge primitive'i kullanılmıyor.
- **Prototip kod alıntısı:**
  ```jsx
  const methTone = project.methodology === "scrum" ? "info" : project.methodology === "kanban" ? "primary" : "warning";
  <Badge tone={methTone}>{project.methodology}</Badge>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Header satırına Badge ekle.

### 1.3 Status Badge (dotlu)
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:21-23`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/[id]/page.tsx:55-65`
- **Görsel/davranış:** active=success, completed=info, on_hold=warning, archived=neutral; `dot` prop ile başında nokta. TR/EN label.
- **Prototip kod alıntısı:**
  ```jsx
  <Badge tone={...} dot>{status === "active" ? "Aktif" : ...}</Badge>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Header'a dotlu status Badge ekle (ArchiveBanner ayrı component, Badge ondan bağımsız her durumda görünmeli).

### 1.4 İş akışı butonu
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:25`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/[id]/page.tsx:55-70`
- **Görsel/davranış:** `Button size="sm" variant="secondary" icon={<Icons.Workflow size={13}/>}` → `/workflow-editor?projectId={id}` rotasına git.
- **Prototip kod alıntısı:**
  ```jsx
  <Button size="sm" variant="secondary" icon={<Icons.Workflow size={13}/>} onClick={() => router.go("workflow-editor", { projectId: project.id })}>İş akışı</Button>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Header sağ tarafa İş akışı + MoreH + Task butonlarını sırayla yerleştir.

### 1.5 MoreH (more horizontal) butonu
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:26`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/[id]/page.tsx`
- **Görsel/davranış:** `Button size="sm" variant="secondary" icon={<Icons.MoreH size={13}/>}` ikon-only.
- **Öncelik:** Medium

### 1.6 Yeni görev (Task) primer butonu
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:27`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/[id]/page.tsx`
- **Görsel/davranış:** `Button size="sm" variant="primary" icon={<Icons.Plus size={13}/>}` → "Görev" / "Task" label, modal açar (`window.__openTaskModal && window.__openTaskModal(project.id)`).
- **Prototip kod alıntısı:**
  ```jsx
  <Button size="sm" variant="primary" icon={<Icons.Plus size={13}/>} onClick={() => window.__openTaskModal && window.__openTaskModal(project.id)}>Görev</Button>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Mevcut "Düzenle" butonu yerine TaskCreate modal açan Yeni Görev butonu eklenmeli; ayrı bir Düzenle icon-only veya MoreH menüsü altına alınabilir.

### 1.7 Header meta satırı (tarih aralığı, üye sayısı, görev sayısı, sprint counter, AvatarStack)
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:29-36`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/[id]/page.tsx`
- **Görsel/davranış:** 12.5px / `--fg-muted`, `gap:20`. Sırayla: Calendar ikonu + tarih aralığı, Users ikonu + "{N} üye", CheckSquare ikonu + "{N} görev", Target ikonu + "Sprint X / Y", sağda AvatarStack max=6.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 12.5, color: "var(--fg-muted)" }}>
    <div><Icons.Calendar size={13}/> {start} → {end}</div>
    <div><Icons.Users size={13}/> {members.length} üye</div>
    <div><Icons.CheckSquare size={13}/> {tasks.length} görev</div>
    <div><Icons.Target size={13}/> Sprint 7 / 12</div>
    <div style={{ flex: 1 }}/>
    <AvatarStack users={members} max={6}/>
  </div>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Header altında meta strip mutlaka eklenmeli — bilgi mimarisinin kalbi burası.

### 1.B Tabs

### 1.8 Tab badge sayaçları
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:42, 47`
- **Olması gereken implementasyon yeri:** `Frontend2/components/project-detail/project-detail-shell.tsx:136-145`
- **Görsel/davranış:** List tab'ında `badge: tasks.length`, Members tab'ında `badge: members.length` sayacı görünür. Implementasyonda hiçbir tab'a badge konulmamış.
- **Prototip kod alıntısı:**
  ```jsx
  { id: "list", label: "Liste", icon: <Icons.List size={13}/>, badge: tasks.length },
  { id: "members", label: "Üyeler", icon: <Icons.Users size={13}/>, badge: members.length },
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Tabs primitive zaten `badge` desteklediğine göre tabs array'ine ekle.

### 1.9 Lifecycle tab dinamik label (Kanban için "Akış Metrikleri")
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:46`
- **Olması gereken implementasyon yeri:** `Frontend2/components/project-detail/project-detail-shell.tsx:142`
- **Görsel/davranış:** `project.methodology === "kanban"` ise label "Akış Metrikleri" / "Flow Metrics", aksi halde "Yaşam Döngüsü" / "Lifecycle".
- **Prototip kod alıntısı:**
  ```jsx
  { id: "lifecycle", label: project.methodology === "kanban" ? "Akış Metrikleri" : "Yaşam Döngüsü", icon: <Icons.Flow size={13}/> }
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** Tab tanımlama sırasında methodology kontrolü ekle.

### 1.C Board Tab

### 1.10 Board column "+" (Plus) butonu (kolon başlığında)
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:126`
- **Olması gereken implementasyon yeri:** `Frontend2/components/project-detail/board-column.tsx:121-125`
- **Görsel/davranış:** Kolon header'ında badge'den sonra `var(--fg-subtle)` renkli `Icons.Plus size={14}` butonu (yeni görev ekleme için).
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ flex: 1 }}/>
  <button style={{ color: "var(--fg-subtle)" }}><Icons.Plus size={14}/></button>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Kolon header sağ tarafına Plus butonu ekle, kolon-içi yeni görev modal'ını aç.

### 1.11 Board kart "points" pill (sp) etiketi
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:168`
- **Olması gereken implementasyon yeri:** `Frontend2/components/project-detail/board-card.tsx:195-209`
- **Görsel/davranış:** Prototip rich modunda `{task.points}p` (örn. `5p`) yazısı `var(--surface-2)` chip içinde. İmplementasyonda yalnızca sayı (`{task.points}`) yazılmış, "p" suffix'i yok.
- **Prototip kod alıntısı:**
  ```jsx
  <span className="mono" style={{ padding: "1px 5px", background: "var(--surface-2)", borderRadius: 3 }}>{task.points}p</span>
  ```
- **Öncelik:** Low
- **Düzeltme önerisi:** Sayı yanına "p" sonek ekle.

### 1.12 Board sağ üstündeki AvatarStack
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:88`
- **Olması gereken implementasyon yeri:** `Frontend2/components/project-detail/board-toolbar.tsx:92-225`
- **Görsel/davranış:** Toolbar'ın sağında `AvatarStack users={members} max={5} size={22}` ve sonrasında "Filtreler" Button ghost.
- **Prototip kod alıntısı:**
  ```jsx
  <AvatarStack users={project.memberIds.map(id => SPMSData.getUser(id))} max={5} size={22}/>
  <Button size="sm" variant="ghost" icon={<Icons.Filter size={13}/>}>Filtreler</Button>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** BoardToolbar'a member AvatarStack + Filtreler butonu ekle.

### 1.D Activity Tab

### 1.13 Activity tab'ın TAMAMI
- **Prototipte:** `New_Frontend/src/pages/activity-tab.jsx:1-201` (200 satır)
- **Olması gereken implementasyon yeri:** `Frontend2/components/project-detail/activity-stub-tab.tsx:11-19`
- **Görsel/davranış:** Implementasyonda yalnızca AlertBanner stub var. Eksik olan tüm parçalar:
  - SegmentedControl filter (Tümü, Oluşturma, Durum, Atama, Yorum)
  - Kullanıcı avatar filter satırı (`actor` listesi, `ring` aktifken)
  - Olay sayacı pill ("12 olay")
  - Tarih grupları (Bugün/Dün/Bu Hafta/Daha Eski) — sticky başlıklar
  - Dikey timeline çizgisi (`position:absolute, left:19, width:2`)
  - Avatar + tipli renkli badge (create=done, status=progress, assign=primary, comment=review, delete=critical, phase=done)
  - Status değişimi rozet karşılaştırma (`from → to` badge)
  - Atama olayında ok + atanan avatar
  - Yorum tipinde içerikli kutu (surface-2 + inset border)
  - "Daha fazla yükle" Button ghost
  - Boş durum mesajı
- **Prototip kod alıntısı:**
  ```jsx
  <SegmentedControl ... options={[{id:"all"}, {id:"create"}, {id:"status"}, ...]}/>
  {actors.map(u => <Avatar user={u} ring={userFilter === u.id}/>)}
  <span className="mono">{filtered.length} olay</span>
  // dikey çizgi:
  <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 2, background: "var(--border)" }}/>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Faz 13'e ertelenmiş olduğu için bu kasti gibi görünüyor — ancak prototip-implementasyon paritesi açısından sayfanın en büyük eksiği. Backend `ACTIVITY_EVENTS` endpoint'i yoksa `useMemo` ile mock veriden başlayan tam UI render edilmeli.

### 1.E Lifecycle Tab

### 1.14 Lifecycle "12 gün — Demo" mile-stone meta etiketi
- **Prototipte:** `New_Frontend/src/pages/lifecycle-tab.jsx:58-60`
- **Olması gereken implementasyon yeri:** `Frontend2/components/lifecycle/summary-strip.tsx:184-217`
- **Görsel/davranış:** `Icons.Target` + "Demo — 12 gün" gibi yaklaşan kilometre taşı bilgisi. Implementasyonda `nextMilestone` prop optional fakat hiçbir caller geçmiyor (lifecycle-tab.tsx:326-333) — varsayılan olarak undefined kalıyor.
- **Prototip kod alıntısı:**
  ```jsx
  <span style={{ color: "var(--fg-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
    <Icons.Target size={12}/> Demo — 12 gün
  </span>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** `LifecycleTab` içinde milestones'ten bir sonraki yaklaşan kilometre taşı hesaplanıp `<SummaryStrip nextMilestone={...}/>` ile geçilmeli.

### 1.15 Lifecycle Phase Gate "Açık Görevler — Sonraki/Backlog/Bu fazda bırak" iç dropdown UX
- **Prototipte:** `New_Frontend/src/pages/lifecycle-tab.jsx:469-477` (sadece SegmentedControl)
- **Olması gereken implementasyon yeri:** `Frontend2/components/lifecycle/phase-gate-expand.tsx:539-612`
- **Görsel/davranış:** Prototype'ta yalnızca 3'lü SegmentedControl var. İmplementasyon ek olarak Collapsible "Farklı davranış gerekli? (N görev)" + her görev için per-task `<select>` ekliyor. Bu eklemenin prototype'ta karşılığı yok — bilinmeyen extra. Ayrıca sembolik `<select>` HTML stili token ile uyumsuz.
- **Öncelik:** Low (bu maddeyi 3.3 BİLİNMEYEN EXTRAS bölümünde de gösteriyoruz; eksiklik tarafında prototype'ın sadeliği var.)

### 1.16 Lifecycle History "Faz Değerlendirme Raporu" header (TR/EN faz adı + revizyon Badge yok)
- **Prototipte:** `New_Frontend/src/pages/lifecycle-tab.jsx:306` — `Faz Değerlendirme Raporu — {ph.phaseName}` başlık.
- **Olması gereken implementasyon yeri:** `Frontend2/components/lifecycle/evaluation-report-card.tsx:266-285`
- **Görsel/davranış:** Implementasyon başlığa "rev N" Badge ekliyor (extra) ve PDF butonunu prototype'tan farklı konumda. Prototipte X kapama butonu yok, PDF + Kaydet sırası tutuyor. **Eksik:** Prototype'ta "Faz Değerlendirme Raporu" başlığı `marginBottom:12`, `fontSize:14`, `fontWeight:600` — implementasyon hizalaması farklı.
- **Öncelik:** Low

### 1.F Members Tab

### 1.17 Members tab'da gerçek üye listesi + Search + "Üye ekle" butonu
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:295-339` (Members + Pending Requests)
- **Olması gereken implementasyon yeri:** `Frontend2/components/project-detail/members-tab.tsx:27-101`
- **Görsel/davranış:**
  - Search input ("Üye ara…") — yok
  - "Üye ekle" primer button — yok
  - Üye listesi (28x28 avatar + isim "Sen" badge'i + email + role Badge'i (Admin=danger, PM=info, Member=neutral) + görev sayısı + MoreH) — yok; yalnızca PM tek kart gösteriliyor
  - Sağ kolonda "Bekleyen istekler" Card'ı (avatar + isim + not + Onayla/Reddet butonları) — tamamen yok
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
    <Card padding={0}>
      <Input icon={<Icons.Search/>} placeholder="Üye ara…"/>
      <Button variant="primary" icon={<Icons.Plus/>}>Üye ekle</Button>
      {members.map(...)}
    </Card>
    <Card padding={16}>
      <div>Bekleyen istekler</div>
      {requests.map(...)}
    </Card>
  </div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Backend `GET /projects/{id}/members` ve `pending_requests` endpoint'leri Faz 12+'a ertelenmiş notu var; ancak en azından methodology + UI iskeleti prototype'taki layout'a uydurulmalı (1fr 300px grid + sağda boş "Bekleyen istek yok" Card'ı).

### 1.G Settings Tab

### 1.18 Settings "Yaşam Döngüsü" alt tab — phase listesi Collapsible + auto/manual kriter Toggle yapısı
- **Prototipte:** `New_Frontend/src/pages/project-detail.jsx:359-396`
- **Olması gereken implementasyon yeri:** `Frontend2/components/project-detail/settings-tab.tsx:106-108` → `Frontend2/components/lifecycle/criteria-editor-panel.tsx`
- **Görsel/davranış:** Prototype'ta her phase için açılır Collapsible (`badge="3 kriter"`), içinde "Otomatik Kriterler" başlığı + 3 toggle (`Tüm görevler tamamlanmalı`, `Kritik görev kalmamalı`, `Blocker kalmamalı`) ve "Manuel Kriterler" listesi (Input + X butonu) + "Kriter Ekle" + alt "Kaydet" Button. CriteriaEditorPanel iki sütunlu (220px picker | 1fr editor) farklı bir desen kullanıyor — prototype'taki collapsible deseni yerine getirilmemiş.
- **Prototip kod alıntısı:**
  ```jsx
  {phases.map(ph => (
    <Collapsible title={ph.name} badge={`3 ${T("kriter", "criteria")}`} defaultOpen={false}>
      <div>...auto criteria toggles...</div>
      <div>...manual criteria inputs...</div>
      <Button size="xs" variant="ghost" icon={<Icons.Plus/>}>Kriter Ekle</Button>
    </Collapsible>
  ))}
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** İki desen de geçerli; ancak prototype "tek tıkla genişle" deseni mobil için daha uygun. Faz seçici sütun extra — bilinmeyen extras bölümünde 3.7'de raporladık.

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.1 Page header tek satırlık vs çok satırlık
- **Prototip:** `New_Frontend/src/pages/project-detail.jsx:14-37` — başlık, badges ve butonlar TEK SATIR; meta strip ALT SATIR
- **Implementasyon:** `Frontend2/app/(shell)/projects/[id]/page.tsx:53-70` — başlık (24px) + altta key/methodology + sağda 1 buton; sürekli "büyük başlık" tonu
- **Fark:** Implementasyon bilgi yoğunluğu çok düşük; başlık 22 → 24 px büyütülmüş, letterSpacing -0.5 yerine -0.6 kullanılmış. Header yapısı farklı paradigma — single-line densely-packed prototip vs label-block implementasyon.
- **Öncelik:** Critical

### 2.2 Tab içeriği yatay scroll wrapper
- **Prototip:** `New_Frontend/src/pages/project-detail.jsx:39-50` — tabs doğrudan `<Tabs>` primitive ile dikey yerleşim, scroll yok
- **Implementasyon:** `Frontend2/components/project-detail/project-detail-shell.tsx:271-278` — `.pd-tabs-wrap` className altında D-54 responsive yatay scroll davranışı eklenmiş (ekstra dış sarmalayıcı)
- **Fark:** Implementasyon prototype'ta olmayan responsive scroll davranışını `pd-tabs-wrap` className ile ekliyor. Bu uygun bir extra; prototipte 1024px altı için bir açıklama yok.
- **Öncelik:** Low (informasyon)

### 2.3 Backlog paneli (300px sol kolon) prototype'ta yok
- **Prototip:** Project detail sayfasında backlog konsepti yok — prototype'ta bağımsız sayfa olarak yer alıyor (görünmez).
- **Implementasyon:** `Frontend2/components/project-detail/project-detail-shell.tsx:208-313` — şel düzeyinde `BacklogPanel` + `BacklogToggle` ekleniyor.
- **Fark:** İmplementasyon prototipte hiç olmayan ek bir UI bölümü ekliyor. Bilinmeyen extra (3.1'de detay).
- **Öncelik:** Critical (3.1)

### 2.4 Board kolon WIP rengi color-mix oranları
- **Prototip:** `New_Frontend/src/pages/project-detail.jsx:114` — overLimit: `var(--priority-critical) 6%`; atLimit: `var(--status-review) 4%`
- **Implementasyon:** `Frontend2/components/project-detail/board-column.tsx:73-77` — aynı oranlar
- **Fark:** Bu eşleşiyor; sadece **boardColumn minHeight prototype:200, implementasyon:240** — sebep belgelenmemiş.
- **Öncelik:** Low

### 2.5 Board kart hover state
- **Prototip:** `New_Frontend/src/pages/project-detail.jsx:155-156` — onMouseEnter/Leave ile boxShadow değiştiriliyor (border-strong + ekstra shadow).
- **Implementasyon:** `Frontend2/components/project-detail/board-card.tsx:106-108` — sabit boxShadow, hover state yok.
- **Fark:** Hover micro-interaction yok; kart ölü hissediyor.
- **Öncelik:** Medium

### 2.6 Board kart compact mod yatay padding asimetrisi
- **Prototip:** `New_Frontend/src/pages/project-detail.jsx:151` — `padding: compact ? "8px 10px 8px 9px" : "10px 12px 10px 11px"` (sol-sağ asimetri 1px ile borderLeft 3px'lik kompanzasyonu)
- **Implementasyon:** `Frontend2/components/project-detail/board-card.tsx:104-105` — açıklayıcı yorum: "dropped per-side 9px/11px adjustment ... use symmetric padding"
- **Fark:** Implementasyon kasten asimetriyi kaldırmış; prototype optik denge bozulabilir. Yine de küçük detay.
- **Öncelik:** Low

### 2.7 Lifecycle SummaryStrip "Düzenle" Button variant
- **Prototip:** `New_Frontend/src/pages/lifecycle-tab.jsx:71-74` — `Button size="sm" variant="secondary" icon={<Icons.Workflow/>}>Düzenle`
- **Implementasyon:** `Frontend2/components/lifecycle/summary-strip.tsx:232-239` — `Button size="sm" variant="ghost" icon={<Pencil size={12}/>}>Düzenle`
- **Fark:** İkon farklı (Workflow vs Pencil), variant farklı (secondary vs ghost). "Workflow" ikonu daha açıklayıcıydı.
- **Öncelik:** Low

### 2.8 Lifecycle WorkflowCanvas yüksekliği
- **Prototip:** `New_Frontend/src/pages/lifecycle-tab.jsx:81` — Kanban: 200, diğer: 320
- **Implementasyon:** `Frontend2/components/lifecycle/lifecycle-tab.tsx:346` — sabit 480
- **Fark:** Implementasyon canvas'ı 50% daha büyük yapıyor ve Kanban için küçültmüyor. Sayfa kaydırması artıyor.
- **Öncelik:** Medium

### 2.9 Lifecycle sub-tab layout (fix vs Card altında ayrılmış)
- **Prototip:** `New_Frontend/src/pages/lifecycle-tab.jsx:88-92` — sub-tabs `Card padding={0}`'ın İÇİNDE alt çizgi ile (`borderTop: 1px solid var(--border)`)
- **Implementasyon:** `Frontend2/components/lifecycle/lifecycle-tab.tsx:323-360` — sub-tabs Card'ın DIŞINDA, `marginTop: 12` ile ayrı blok
- **Fark:** Implementasyon canvas + summary strip + sub-tabs hep tek Card içindeydi prototype'ta; implementasyon iki ayrı blok yapmış. Görsel akış kopuyor.
- **Öncelik:** Medium

### 2.10 Lifecycle "Faz Geçişi" başlığında ikon
- **Prototip:** `New_Frontend/src/pages/lifecycle-tab.jsx:427-428` — "Faz Geçişi: {current.name} → {next.name}" düz metin
- **Implementasyon:** `Frontend2/components/lifecycle/phase-gate-expand.tsx:380-383` — eşleşiyor; küçük detay yok
- **Öncelik:** Low (info)

### 2.11 Members tab grid layout
- **Prototip:** `1fr 300px` 2-kolonlu grid
- **Implementasyon:** Tek Card stub
- **Fark:** Layout paradigması farklı (3.4'te detaylandırıldı).
- **Öncelik:** High

### 2.12 Settings sub-tab 4 yerine 4 (eşit) ama sıra farkı
- **Prototip:** `New_Frontend/src/pages/project-detail.jsx:349-354` — sırasıyla: Kolonlar, İş Akışı, Yaşam Döngüsü, Genel
- **Implementasyon:** `Frontend2/components/project-detail/settings-tab.tsx:37-42` — Genel, Kolonlar, İş Akışı, Yaşam Döngüsü
- **Fark:** Prototype'ta ilk tab "Kolonlar" iken implementasyon "Genel" yapmış. Default tab da prototype:`columns`, implementasyon:`general`.
- **Öncelik:** Low

## 3. BİLİNMEYEN EXTRAS

### 3.1 Backlog Panel (300px sol kolon) — TÜM komponent
- **Dosya:** `Frontend2/components/project-detail/backlog-panel.tsx`, `backlog-toggle.tsx`, `backlog-task-row.tsx`
- **Açıklama:** Project detail sayfasının sol tarafına 300px backlog paneli + dikey toggle pill ekleniyor. Prototype'ta proje detay sayfasında böyle bir bölüm hiç yok. ProjectDetailShell:208-313 satır arasında bu için ek state, DnD provider lift, useBacklogOpenState hook, localStorage persistence (`spms.backlog.open.{projectId}`), narrow-screen handling yapılıyor.
- **Öncelik:** Critical (kullanıcı kasten istemediği büyük bir extra)
- **Not:** Bu kısım UI-SPEC §12'de planlanmış olabilir; ancak prototype'ta yok. Bu yüzden "ZERO from old Frontend/, ALL UI from prototype" kuralının ihlali.

### 3.2 ArchiveBanner üst bandı
- **Dosya:** `Frontend2/app/(shell)/projects/[id]/page.tsx:48-50`
- **Açıklama:** ARCHIVED projeler için sayfa başında ArchiveBanner gösteriyor. Prototype'ta proje arşivlenince ayrı bir banner yok — status yalnızca header Badge ile gösterilir.
- **Öncelik:** Medium (functionally faydalı; ancak prototype paritesi açısından extra)

### 3.3 PhaseGateExpand içinde "Farklı davranış gerekli?" Collapsible + per-task select
- **Dosya:** `Frontend2/components/lifecycle/phase-gate-expand.tsx:563-611`
- **Açıklama:** Açık görev için her birine ayrı `<select>` ile (Aynı/Sonraki/Backlog/Kalsın) seçim ekleniyor. Prototype'ta yalnızca 3'lü SegmentedControl var — per-task override yok.
- **Öncelik:** Low (functional faydalı, prototype dışı)

### 3.4 PhaseGateExpand "Override checkbox" + "Zorla Geç" akışı
- **Dosya:** `Frontend2/components/lifecycle/phase-gate-expand.tsx:728-783`
- **Açıklama:** Sequential-locked modunda kriterler karşılanmadığında "Kriterler karşılanmadan geçilsin" checkbox + "Zorla Geç" Button (variant="danger") eklenmiş. Prototype'ta bu yok — yalnızca disabled CTA ve AlertBanner var.
- **Öncelik:** Low

### 3.5 PhaseGateExpand karakter sayacı (note için 500 char limit + countdown UI)
- **Dosya:** `Frontend2/components/lifecycle/phase-gate-expand.tsx:614-656`
- **Açıklama:** Note textarea altında "{N}/500" sayacı, 500'ü geçince kırmızıya dönüş, 429 countdown indicator ("X saniye bekleyin"). Prototype textarea düz placeholder ile.
- **Öncelik:** Low (UX iyileştirmesi)

### 3.6 PhaseGateExpand server-error AlertBanner matrisi (lock/wrong_mode/network/unmet)
- **Dosya:** `Frontend2/components/lifecycle/phase-gate-expand.tsx:684-725`
- **Açıklama:** 5-error matrix (409/422/429/400/network) için ayrı banner'lar. Prototype yalnızca client-side validation yapıyor — server-side error UI yok.
- **Öncelik:** Low (functional, prototype scope dışı)

### 3.7 CriteriaEditorPanel 220px sol picker + sağda editor (single-phase render)
- **Dosya:** `Frontend2/components/lifecycle/criteria-editor-panel.tsx:367-630`
- **Açıklama:** Prototype'ta her phase için Collapsible. Implementasyon "phase picker (220px) + editor (1fr)" master-detail deseni. Bu UI-SPEC kararı olabilir, fakat görsel olarak farklı.
- **Öncelik:** Medium

### 3.8 WorkflowEmptyState dual-CTA (Şablon Yükle + Workflow Editörünü Aç)
- **Dosya:** `Frontend2/components/lifecycle/workflow-empty-state.tsx`
- **Açıklama:** Workflow boş olduğunda PresetMenu + editör deep-link'li dual CTA. Prototype'ta workflow her zaman var sayılmış (DEFAULT_LIFECYCLES); empty state hiç düşünülmemiş.
- **Öncelik:** Medium (functional safety net)

### 3.9 Lifecycle sub-tab badge sayaçları
- **Dosya:** `Frontend2/components/lifecycle/lifecycle-tab.tsx:362-378`
- **Açıklama:** Prototype `LifecycleTabV2` (lifecycle-tab.jsx:38-45) sub-tab'lara badge ekliyor (`milestones.length`, `closedCount`, `${doneArtifacts}/${artifacts.length}`). İmplementasyon Tabs primitive'ine badge prop'u geçirmiyor — sadece label.
- **Öncelik:** Medium (eksik bir DE — 3.x'te göstermem gerekirken extras değil eksik aslında. Aşağıda 5.x'e taşıdım.)

## 4. BİLİNEN EXTRAS (UYARI)
Yok.

## 5. HATALI / SORUNLU KOD

### 5.1 Lifecycle sub-tab `badge` desteği eksik
- **Dosya:** `Frontend2/components/lifecycle/lifecycle-tab.tsx:362-378`
- **Sorun türü:** Style drift / Eksik özellik
- **Açıklama:** Prototype `lifecycle-tab.jsx:39-45`'te sub-tab'lara badge ekleniyor (`milestones.length`, `closedCount`, `${doneArtifacts}/${artifacts.length}`). İmplementasyon Tabs'a yalnızca `id` + `label` veriyor.
- **Öneri:** `tabs` array'ine `badge` alanları eklenmeli.
- **Öncelik:** Medium

### 5.2 BoardToolbar Sprint label dile bağımlı değil (TR/EN aynı)
- **Dosya:** `Frontend2/components/project-detail/board-toolbar.tsx:134`
- **Sorun türü:** Bug (i18n)
- **Açıklama:** `<span>{language === "tr" ? "Sprint:" : "Sprint:"}</span>` — her iki dilde de aynı string. Prototype'ta sabit "Sprint:" kullanılıyor (`project-detail.jsx:85`) bu yüzden teknik olarak bug değil, ancak i18n niyeti açıkça yanlış. Eğer EN'de "Cycle:" istenirse buradan kontrol edilemez.
- **Öneri:** Ya tek string yap, ya farklılaştır (`tr: "Sprint:" / en: "Sprint:"` aynı ise dile gerek yok).
- **Öncelik:** Low

### 5.3 Board kart asignee avatar `initials` `#1` formatlaması
- **Dosya:** `Frontend2/components/project-detail/board-card.tsx:127`, `list-tab.tsx:215`, `backlog-task-row.tsx:57`, `overview-subtab.tsx:505`, `artifact-inline-expand.tsx:336`
- **Sorun türü:** Bug (UX)
- **Açıklama:** `initials: '#${task.assigneeId}'.slice(0, 2).toUpperCase()` ifadesi `#1` → "#1" → kısaltılınca "#1" gösteriyor. Prototype gerçek user objesinden initial çıkarıyor (`SPMSData.getUser(id).initials`). İmplementasyon kullanıcı verisi olmadığı için ID'yi gösteriyor — bu UX kötü görünüyor (avatar üstünde "#1", "#2"). Backend `user_name`/`avatar_initials` field'ları henüz wire değil.
- **Öneri:** Backend'den user objesi geldiğinde initials/name kullan; `initials.slice(0, 2)` yapısı `#` karakterini de avatar'a yazıyor.
- **Öncelik:** High

### 5.4 board-card.tsx hydration risk: useSortable sadece client'ta çalışır ama "use client" var
- **Dosya:** `Frontend2/components/project-detail/board-card.tsx:1, 80-84`
- **Sorun türü:** Hydration (sınırda)
- **Açıklama:** `useSortable` ve transform CSS hesaplamaları SSR'da farklı sonuç üretebilir; ancak `"use client"` direktifi olduğundan hydration mismatch ihtimali düşük. Yine de dragging state'in başlangıç değeri `false` olduğunda `opacity: isDragging ? 0.3 : 1` server/client her ikisinde 1 üretmeli — testte sorun yok.
- **Öneri:** Bilinçli bir not: kart yığınında re-render'lar drag sırasında performans riski; React.memo değerlendirilebilir.
- **Öncelik:** Low

### 5.5 Phase-id `t.phaseId` vs `t.phase_id` tutarsızlığı
- **Dosya:** Pek çok dosya
- **Sorun türü:** Type / Bug riski
- **Açıklama:** `Frontend2/components/project-detail/board-card.tsx:87-92`, `board-tab.tsx:75`, `list-tab.tsx:113`, `lifecycle-tab.tsx:228-232` `t.phase_id` (snake) kullanıyor, `overview-subtab.tsx:85, 124` `t.phaseId` (camel) kullanıyor. `Task` shape'i hangisini barındırıyor? Eğer mapper tutarsız ise filtreler sessizce başarısız olur.
- **Öneri:** Task service'in canonik form'una karar verilip her yerde aynı kullanılmalı. TypeScript type system'i `phase_id` aliasını barındıracak şekilde extension yapılabilir.
- **Öncelik:** Critical

### 5.6 LifecycleTab JSX shadowed `phaseTransitionsRaw` ve `phaseTransitions` ikilisi
- **Dosya:** `Frontend2/components/lifecycle/lifecycle-tab.tsx:199-206`
- **Sorun türü:** Dead code / Confusing
- **Açıklama:** `useQuery` ile `phaseTransitionsRaw` alındıktan sonra `phaseTransitions` adlı bir başka memo aynı veriyi farklı bir tip cast'i ile saklıyor. Hem `phaseTransitions` (BFS) hem `phaseTransitionsRaw` (HistorySubTab) ayrı tüketiliyor. Tip güvenliği zayıf — `as PhaseTransitionEntryShape[]` ve `as PhaseTransitionEntry[]` cast'leri farklı.
- **Öneri:** Tek tip kullanın; service tip vermeli, component cast etmemeli.
- **Öncelik:** Medium

### 5.7 ListTab "STATUS" hücresinde ham status string'i gösteriliyor
- **Dosya:** `Frontend2/components/project-detail/list-tab.tsx:163-181`
- **Sorun türü:** Style drift / i18n
- **Açıklama:** `<span style={{ fontSize: 12 }}>{s}</span>` — ham status string'i (örn. "progress", "todo") gösteriliyor. Prototype'ta `Badge tone={...} dot>{status.name[lang]}` ile yerelleştirilmiş etiket gösteriliyor (örn. "Devam Ediyor", "Yapılacak"). İmplementasyon localizasyonu kaybetti.
- **Öneri:** STATUS column rendering Badge + lang label'a çevrilmeli.
- **Öncelik:** High

### 5.8 ProjectDetailShell `currentTasks` ve BoardTab `tasks` aynı keyle ama farklı yerlerde fetch
- **Dosya:** `Frontend2/components/project-detail/project-detail-shell.tsx:127`, `board-tab.tsx:53`
- **Sorun türü:** Performance / dedup riski
- **Açıklama:** Aynı `useTasks(project.id)` hem shell'de hem BoardTab'ta çağrılıyor. TanStack Query cache hit ettiği için problem yok ancak 2 ayrı `useQuery` mounting var ve unmount'ta query refcounting karmaşıklaşıyor. Yorum bunu açıklıyor; yine de bir hook'a refactor edilebilir.
- **Öneri:** `useTasks` çağrısı tek noktada (Provider) yapılmalı, prop ile ya da context ile dağıtılmalı.
- **Öncelik:** Low

### 5.9 ActivityStubTab Faz 13'e ertelenmiş — ancak bu KRİTİK eksiklik
- **Dosya:** `Frontend2/components/project-detail/activity-stub-tab.tsx`
- **Sorun türü:** Dead code / Eksik özellik
- **Açıklama:** Sayfanın 8 tab'ından biri tamamen stub. Kullanıcı bu sekmeye tıkladığında "Faz 13'te aktive edilecek" yazısı görüyor — bu MVP UX olarak kabul edilemez. Eğer backend hazır değilse bile en azından prototype'taki UI iskeletini mock veriyle render etmek mümkün.
- **Öneri:** Activity tab UI'sini mock veriyle implement et; gerçek API endpoint'i hazır olduğunda swap.
- **Öncelik:** Critical

### 5.10 board-toolbar.tsx phase menu z-index 50 nesting riski
- **Dosya:** `Frontend2/components/project-detail/board-toolbar.tsx:164`
- **Sorun türü:** A11y / Stacking
- **Açıklama:** Phase dropdown `zIndex: 50`. Sayfa içinde başka modal (TaskCreate) açılırsa altında kalabilir. Prototype'ta dropdown yok, bu nedenle bilinmiyor.
- **Öneri:** Portal kullan veya merkezi z-index sistemi (var(--z-dropdown)) tanımla.
- **Öncelik:** Low

### 5.11 BacklogPanel localStorage hydration mismatch riski
- **Dosya:** `Frontend2/components/project-detail/backlog-panel.tsx:88-100`
- **Sorun türü:** Hydration
- **Açıklama:** `useState(false)` ile başlatılıp `useEffect` ile localStorage'tan hydrate ediliyor. Bu prensipte doğru pattern (`spms.board.density.${projectId}` için aynı kullanılıyor — proje genelinde tutarlı). Yine de localStorage erişimi bir use effect içine sarılmalı; burada öyle. Tehlike yok, dökümantasyon iyi.
- **Öncelik:** Low (info)

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| #  | Öncelik  | Madde                                                                  | Dosya                                                                               | Bölüm |
|----|----------|------------------------------------------------------------------------|-------------------------------------------------------------------------------------|-------|
| 1  | Critical | Page header tek satırlık dense layout + tüm meta strip                  | Frontend2/app/(shell)/projects/[id]/page.tsx                                       | 1.1, 1.2, 1.3, 1.6, 1.7, 2.1 |
| 2  | Critical | Activity tab'ı stub yerine prototype timeline ile implement et          | Frontend2/components/project-detail/activity-stub-tab.tsx                          | 1.13, 5.9 |
| 3  | Critical | Backlog panel'in extras'ı kaldır veya UI-SPEC olarak resmileştir        | Frontend2/components/project-detail/backlog-panel.tsx (+toggle, +row, +shell)      | 3.1 |
| 4  | Critical | Task `phaseId`/`phase_id` aliasing tutarsızlığını çöz                    | Multi: board-card, board-tab, list-tab, lifecycle-tab, overview-subtab            | 5.5 |
| 5  | High     | Header'a İş akışı + Yeni Görev butonları ekle                           | Frontend2/app/(shell)/projects/[id]/page.tsx                                       | 1.4, 1.6 |
| 6  | High     | Tab badge sayaçları (List, Members) + Lifecycle Kanban dinamik label    | Frontend2/components/project-detail/project-detail-shell.tsx                       | 1.8, 1.9 |
| 7  | High     | Board kolon header'ında "+" Plus butonu                                  | Frontend2/components/project-detail/board-column.tsx                               | 1.10 |
| 8  | High     | ListTab STATUS hücresine Badge + locale label                            | Frontend2/components/project-detail/list-tab.tsx                                   | 5.7 |
| 9  | High     | Members tab gerçek üye listesi + Search + Üye ekle + Bekleyen istekler  | Frontend2/components/project-detail/members-tab.tsx                                | 1.17 |
| 10 | High     | Avatar `#N` initials yerine gerçek isim/initials                         | Multi: board-card, list-tab, backlog-task-row, overview-subtab, artifact-*        | 5.3 |
| 11 | Medium   | Board kart hover state (boxShadow micro-animation)                       | Frontend2/components/project-detail/board-card.tsx                                 | 2.5 |
| 12 | Medium   | BoardToolbar AvatarStack + "Filtreler" butonu                            | Frontend2/components/project-detail/board-toolbar.tsx                              | 1.12 |
| 13 | Medium   | Lifecycle SummaryStrip nextMilestone prop'unu wire et                   | Frontend2/components/lifecycle/lifecycle-tab.tsx, summary-strip.tsx               | 1.14 |
| 14 | Medium   | Lifecycle WorkflowCanvas yüksekliğini methodology'ye göre 200/320 yap   | Frontend2/components/lifecycle/lifecycle-tab.tsx                                   | 2.8 |
| 15 | Medium   | Lifecycle sub-tabs'ı outer Card içine taşı (görsel akış)                | Frontend2/components/lifecycle/lifecycle-tab.tsx                                   | 2.9 |
| 16 | Medium   | Lifecycle sub-tab'larına badge sayaçları ekle                           | Frontend2/components/lifecycle/lifecycle-tab.tsx                                   | 5.1 |
| 17 | Medium   | Settings Yaşam Döngüsü Collapsible deseni — picker yerine               | Frontend2/components/lifecycle/criteria-editor-panel.tsx                           | 1.18, 3.7 |
| 18 | Medium   | LifecycleTab'da phaseTransitionsRaw/Shape ikilisini birleştir           | Frontend2/components/lifecycle/lifecycle-tab.tsx                                   | 5.6 |
| 19 | Medium   | ArchiveBanner extras'ını kaldır veya prototype paritesi için banner'sız | Frontend2/app/(shell)/projects/[id]/page.tsx                                       | 3.2 |
| 20 | Low      | Board kart points'e "p" suffix ekle                                      | Frontend2/components/project-detail/board-card.tsx                                 | 1.11 |
| 21 | Low      | Board kart compact mod 1px asimetri restore                              | Frontend2/components/project-detail/board-card.tsx                                 | 2.6 |
| 22 | Low      | SummaryStrip "Düzenle" Workflow ikonu + secondary variant                | Frontend2/components/lifecycle/summary-strip.tsx                                   | 2.7 |
| 23 | Low      | PhaseGateExpand "Farklı davranış" Collapsible extras kararı              | Frontend2/components/lifecycle/phase-gate-expand.tsx                               | 3.3 |
| 24 | Low      | PhaseGateExpand "Zorla Geç" override extras kararı                       | Frontend2/components/lifecycle/phase-gate-expand.tsx                               | 3.4 |
| 25 | Low      | BoardToolbar Sprint label TR/EN duplikasyonu                              | Frontend2/components/project-detail/board-toolbar.tsx                              | 5.2 |
| 26 | Low      | useTasks dedup için provider yapısı (perf)                               | Frontend2/components/project-detail/project-detail-shell.tsx, board-tab.tsx       | 5.8 |
| 27 | Low      | Phase dropdown z-index merkezi yönetim                                   | Frontend2/components/project-detail/board-toolbar.tsx                              | 5.10 |
| 28 | Low      | Settings sub-tab order ve default                                        | Frontend2/components/project-detail/settings-tab.tsx                               | 2.12 |
| 29 | Low      | Lifecycle "Faz Değerlendirme Raporu" header revisi badge konumu          | Frontend2/components/lifecycle/evaluation-report-card.tsx                          | 1.16 |

## 7. KAPSAM NOTLARI

- **Okunan dosyalar:**
  - Prototip: `New_Frontend/src/pages/project-detail.jsx`, `New_Frontend/src/pages/activity-tab.jsx`, `New_Frontend/src/pages/lifecycle-tab.jsx` (toplam ~1100 satır)
  - Implementasyon: 28 ana dosya — `app/(shell)/projects/[id]/page.tsx`, `components/project-detail/*` (16 dosya), `components/lifecycle/*` (12 dosya). Test dosyaları (`*.test.tsx`) atlandı.
  - Yardımcı: `components/lifecycle/criteria-editor-panel.tsx`, `components/lifecycle/evaluation-report-card.tsx`, `components/lifecycle/artifact-inline-expand.tsx`, `components/lifecycle/milestone-inline-add-row.tsx`, `components/lifecycle/workflow-empty-state.tsx`
  - Primitives: AvatarStack/SegmentedControl varlığı doğrulandı (`components/primitives/avatar-stack.tsx`, `components/primitives/segmented-control.tsx`).

- **Atlanan/eksik kalan:**
  - `WorkflowCanvas` iç implementasyonu (workflow-editor klasörü) — Lifecycle tab'da read-only kullanıldığı için davranış doğrulamadan parça olarak değerlendirildi.
  - Backend service tip dosyaları (`services/task-service.ts`, `services/lifecycle-service.ts`) — yalnızca tüketim noktasındaki tipler kontrol edildi.
  - DnD pipeline (`lib/dnd/board-dnd.ts`, `lib/dnd/dnd-provider.tsx`) — drag UX davranışı bu raporun kapsamında ancak iç logic detaylarına girilmedi.

- **Belirsizlikler:**
  - "Backlog panel" (3.1) UI-SPEC §12'de planlanmış olabilir — eğer `12-UI-SPEC.md` veya benzeri planlama dökümünde varsa "intentional extra" olarak yeniden sınıflandırılmalı. Bu rapor prototype'ı ground truth alarak yazılmıştır.
  - "ArchiveBanner" (3.2) prototype'ta yok ama mantıken faydalı bir UX safety net.
  - "PhaseGateExpand" 5-error matrisi + override flow + per-task exceptions (3.3-3.6) prototype'ta yok ama Phase 12 LIFE-02 acceptance criteria gereği eklenmiş olabilir.
  - "CriteriaEditorPanel master-detail" (3.7) UI-SPEC §5 kararı olabilir — Settings Lifecycle deseni Collapsible'dan picker'a geçirilmiş.
  - Kanban için lifecycle tab başlığı "Akış Metrikleri" eksik kalmış (1.9). Bu kasti bir basitleştirme mi yoksa unutulmuş mu net değil.
  - `task.phaseId` vs `task.phase_id` (5.5) — Task service tipini görmeden filtre dökümandansyonu yapılamadı; çağrı sitelerinin yarı-yarıya farklı isim kullandığı kesin.
