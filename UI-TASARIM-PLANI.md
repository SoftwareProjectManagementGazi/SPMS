# SPMS — Frontend Ekleme Planı

Frontendimize eklenecek sayfa, sekme ve bileşenler. Mevcut mimari: JSX, inline style, CSS variable tokenleri, `useRouter().go(page, params)`, `useApp().language` ile TR/EN, `window.SPMSData` mock data, primitives.jsx'ten Card/Badge/Button/Tabs/Input/Avatar.


---

## 1. primitives.jsx'e Yeni Bileşenler

### ProgressBar

```jsx
const ProgressBar = ({ value = 0, max = 100, height = 4, color = "var(--primary)", bg = "var(--surface-2)", style }) => (
  <div style={{ height, background: bg, borderRadius: height, overflow: "hidden", ...style }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: height, transition: "width 0.2s" }}/>
  </div>
);
```

### SegmentedControl

```jsx
const SegmentedControl = ({ options, value, onChange, size = "sm" }) => (
  <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
    {options.map(opt => (
      <button key={opt.id} onClick={() => onChange(opt.id)}
        style={{ padding: size === "xs" ? "3px 8px" : "4px 10px", fontSize: size === "xs" ? 11 : 11.5, fontWeight: 600, borderRadius: 4,
          background: value === opt.id ? "var(--surface)" : "transparent",
          color: value === opt.id ? "var(--fg)" : "var(--fg-muted)",
          boxShadow: value === opt.id ? "inset 0 0 0 1px var(--border)" : "none" }}>
        {opt.label}
      </button>
    ))}
  </div>
);
```

### Collapsible

```jsx
const Collapsible = ({ title, badge, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, background: "transparent" }}>
        <Icons.ChevronRight size={13} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}/>
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
        {badge && <Badge size="xs" tone="neutral">{badge}</Badge>}
      </button>
      {open && <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>{children}</div>}
    </div>
  );
};
```

### AlertBanner

```jsx
const AlertBanner = ({ tone = "warning", icon, children, action }) => {
  const colorVar = tone === "danger" ? "--priority-critical" : tone === "info" ? "--status-progress" : "--status-review";
  return (
    <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, borderRadius: "var(--radius-sm)",
      background: `color-mix(in oklch, var(${colorVar}) 10%, var(--surface))`,
      boxShadow: `inset 0 0 0 1px color-mix(in oklch, var(${colorVar}) 25%, transparent)`,
      color: `var(${colorVar})` }}>
      {icon}
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
};
```

### theme.jsx'e eksik tokenler

Her preset'e ekle:
```
"status-todo": "oklch(0.65 0.01 250)"
"status-blocked": "oklch(0.58 0.18 25)"
```

---

## 2. Proje Detay Sekmelerini Güncelle (project-detail.jsx)

Mevcut 7 sekme → 8 sekme. "Activity" eklenir:

```jsx
<Tabs active={tab} onChange={setTab} tabs={[
  { id: "board",     label: T("Pano","Board"),              icon: <Icons.Grid size={13}/> },
  { id: "list",      label: T("Liste","List"),              icon: <Icons.List size={13}/>, badge: tasks.length },
  { id: "timeline",  label: T("Zaman Çizelgesi","Timeline"),icon: <Icons.Chart size={13}/> },
  { id: "calendar",  label: T("Takvim","Calendar"),         icon: <Icons.Calendar size={13}/> },
  { id: "activity",  label: T("Aktivite","Activity"),       icon: <Icons.Activity size={13}/> },   // YENİ
  { id: "lifecycle", label: T("Yaşam Döngüsü","Lifecycle"), icon: <Icons.Flow size={13}/> },
  { id: "members",   label: T("Üyeler","Members"),          icon: <Icons.Users size={13}/>, badge: members.length },
  { id: "settings",  label: T("Ayarlar","Settings"),        icon: <Icons.Settings size={13}/> },
]}/>
```

Kanban projelerinde `lifecycle` sekmesinin label'ı `T("Akış Metrikleri","Flow Metrics")` olur.

---

## 3. LifecycleTab — Yeniden Yapılandır

Mevcut LifecycleTab'ı (sadece WorkflowCanvas gösteren) tamamen değiştir. Yeni yapı:

### Özet strip (Canvas'ın üstünde, Card'ın içinde ilk satır)

```
style: padding "10px 16px", borderBottom "1px solid var(--border)", display flex, alignItems center, gap 16, fontSize 12.5
```
- `<Badge tone="primary">3/5 — Yürütme</Badge>`
- `<ProgressBar value={72} max={100} style={{ width: 120 }}/> <span className="mono">%72</span>`
- `<span style={{ color: "var(--fg-muted)" }}>8 kalan</span>`
- `<span style={{ color: "var(--fg-muted)" }}><Icons.Target size={12}/> Demo — 12 gün</span>`
- Sağda: `<Button size="sm" variant="primary">{T("Sonraki Faza Geç","Next Phase")}</Button>` (Kanban'da gizle, sadece PM/Admin'e göster)

### Canvas (mevcut WorkflowCanvas, readOnly)

`onNodeClick` prop'u ekle. Seçili node primary ring ile vurgulanır.

### Alt-sekmeler (Canvas'ın altında)

```jsx
<Tabs size="sm" active={lifecycleSub} onChange={setLifecycleSub} tabs={[
  { id: "overview",    label: T("Genel Bakış","Overview"),       icon: <Icons.Chart size={12}/> },
  { id: "milestones",  label: T("Kilometre Taşları","Milestones"),icon: <Icons.Target size={12}/> },
  { id: "history",     label: T("Geçmiş","History"),             icon: <Icons.Clock size={12}/>, badge: closedPhaseCount },
  { id: "artifacts",   label: T("Artefaktlar","Artifacts"),      icon: <Icons.Doc size={12}/>, badge: `${doneCount}/${totalCount}` },
]}/>
```

Kanban: "history" ve "artifacts" alt-sekmeleri gizlenir. "overview"da Canvas yerine CFD mini chart + Lead/Cycle Time kartları gösterilir.

### Alt-sekme: Genel Bakış

Seçili node'un (veya aktif fazın) detay kartı:

Card padding 14:
- Faz adı (bold 14px) + durum badge'i (Tamamlandı/Aktif/Bekliyor)
- Grid cols-4: "Toplam" (18px bold), "Tamamlanan" (18px bold, status-done), "Devam Eden" (18px bold, status-progress), "İlerleme" (18px bold mono)
- ProgressBar (height 4)
- Aktif fazda: "Faza Geçiş Yap" butonu (Button size sm variant secondary) → Phase Gate inline expand'i tetikler

İki sütunlu grid altında (800px altında tek sütun):

Sol — "Faz Özeti" Section: her faz için satır (StatusDot + ad + ProgressBar + yüzde + Badge). Aktif faz `background: var(--accent)`.

Sağ — "Yaklaşan Teslimler" Section: due 7 gün içinde olan görevler, max 5. Görev key + başlık (tıklanabilir) + Avatar + kalan gün. Gecikmiş: `color: var(--priority-critical)` + Icons.Alert.

0 görevli faz: metrikler "—", Phase Gate kriterleri "Uygulanamaz" (gri), bilgi mesajı gösterilir.

### Alt-sekme: Kilometre Taşları

Section başlığı + "+ Ekle" butonu. Max 5 gösterilir, fazlası "Tümünü göster".

Her milestone Card (padding 14, borderLeft 3px primary veya priority-critical):
- Ad (bold 14px) + tarih ve kalan gün (mono 11px). Gecikmiş: kırmızı.
- Durum badge: Bekliyor/Devam Ediyor/Tamamlandı/Gecikmiş
- Bağlı fazlar: Badge dizisi
- ProgressBar + yüzde

"+ Ekle" → listenin üstünde inline form: Input (ad) + tarih + Textarea + Kaydet/İptal.

Timeline (Gantt) entegrasyonu: milestone'lar elmas (◆) işareti olarak gösterilir, hover'da tooltip.

### Alt-sekme: Geçmiş

Kapatılmış fazlar listesi. Varsayılan son 5, fazlası "Tümünü göster".

Her faz Card (padding 14):
- Üst: faz adı (bold 13px) + kapatılma tarihi (mono 11px) + süre badge ("12 gün")
- Grid cols-4 mini metrik kutuları (18px bold değer, 10.5px etiket, surface-2 bg): Toplam, Tamamlanan (status-done), Taşınan (status-review), Başarı %
- Faz notu (varsa): italik muted
- Collapsible: "Görev Detayları" → MTTaskRow compact ile görev listesi
- Sağ üstte "Rapor" butonu → değerlendirme raporu inline expand (aşağıya bkz §11)

### Alt-sekme: Artefaktlar

Üstte: "3/5 tamamlandı" + ProgressBar (width 200) + "+ Özel Ekle" butonu.

Metodolojiye göre varsayılan artefaktlar: waterfall (SRS, SDD, STD, Release Notes), scrum (Product Backlog, Sprint Backlog, Increment), iterative (İterasyon Planı, Değerlendirme Raporu). Kanban: bu alt-sekme gizli.

Her satır (grid "2fr 120px 150px 100px 40px"): Icons.Doc + ad, durum dot (gri/sarı/yeşil, tıklanabilir), son güncelleme, Avatar, Icons.MoreH.

MoreH → satır altında inline expand: Input (ad) + SegmentedControl (Oluşturulmadı/Taslak/Tamamlandı) + sorumlu seçimi + ilişkili faz + Textarea + dosya bölümü + Kaydet.

---

## 4. Phase Gate — Inline Expand (Lifecycle > Genel Bakış)

"Faza Geçiş Yap" veya özet strip'teki "Sonraki Faza Geç" tıklandığında detay kartının altında Card expand olur:

Başlık: "Faz Geçişi: {fazAdı} → {sonrakiFaz}" (14px bold) + Icons.X kapatma.

Bölüm 1 — Tamamlanma: `Toplam: 24 · Tamamlanan: 20 · Açık: 4` (açık > 0 ise turuncu + Icons.Alert)

Bölüm 2 — Kriterler:
- Otomatik (read-only): Icons.CircleCheck (yeşil) veya Icons.Alert (kırmızı) + kriter metni. "Tüm görevler tamamlandı", "Kritik görev kalmadı", "Blocker kalmadı". 0 görevli fazda: gri, "Uygulanamaz".
- Manuel (checkbox): "Faz çıktıları gözden geçirildi", "Paydaş onayı alındı", + Settings'te tanımlanan ekler.
- "Kriterleri düzenle →" linki → Settings > Lifecycle'a yönlendirir.

Bölüm 3 — Açık görevler: SegmentedControl ("Sonraki faza taşı" / "Backlog'a taşı" / "Bu fazda bırak")

Bölüm 4 — Not: Textarea (rows 2)

Alt buton: sequential-locked + kriterler karşılanmamış → `<AlertBanner tone="danger">` + disabled Button. Scrum/Iterative → `<AlertBanner tone="warning">` + aktif Button.

Canvas entegrasyonu: edge'ler üzerinde küçük gate ikonu (Icons.Lock 10px). Bekliyor: neutral, onaylandı: success.

---

## 5. Faz Tamamlanma Kriterleri (Settings > Lifecycle alt sekmesi)

Mevcut placeholder metni kaldır. Yerine:

Açıklama (12.5px muted): "Her faz için geçiş kriterlerini tanımlayın."

Her faz için Collapsible (faz adı + kriter sayısı badge):
- Otomatik kriterler: 3 toggle (AdminPermissions toggle yapısı) — "Tüm görevler tamamlanmalı", "Kritik görev kalmamalı", "Blocker kalmamalı"
- Manuel kriterler: dinamik Input listesi + "+ Kriter Ekle" butonu + silme (Icons.X)
- Kaydet butonu

---

## 6. Proje Durumu (projects.jsx + project-detail.jsx)

### projects.jsx toolbar'a:
```jsx
<SegmentedControl value={statusFilter} onChange={setStatusFilter} options={[
  { id: "all", label: T("Tümü","All") },
  { id: "active", label: T("Aktif","Active") },
  { id: "completed", label: T("Bitti","Done") },
  { id: "archived", label: T("Arşiv","Archive") },
]}/>
```
Proje kartlarına durum badge: active→success, completed→info, on_hold→warning, archived→neutral. Arşivlenmiş: opacity 0.6.

### project-detail.jsx header:
Statik "Aktif" badge → dinamik. MoreH dropdown'a: "Projeyi Tamamla", "Askıya Al", "Arşivle".

Arşivlenmiş proje:
```jsx
<AlertBanner tone="warning" icon={<Icons.Lock size={13}/>}
  action={<Button size="xs" variant="ghost">{T("Aktif Et","Reactivate")}</Button>}>
  {T("Bu proje arşivlenmiştir.","This project is archived.")}
</AlertBanner>
```

---

## 7. Activity Tab (project-detail.jsx)

Yeni sekme bileşeni. İki variant: `variant="full"` (proje detay) ve `variant="compact"` (dashboard).

**Full variant:**

Filtre satırı: SegmentedControl (Tümü/Oluşturma/Durum/Atama/Yorum) + kullanıcı avatar dizisi (tıklanabilir, seçili → ring).

Dikey timeline (sol kenar width 2px, background border). Her olay:
```jsx
<div style={{ display: "flex", gap: 12, padding: "12px 0" }}>
  <div style={{ position: "relative", zIndex: 1 }}>
    <Avatar user={actor} size={28}/>
    <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16,
      borderRadius: "50%", background: eventColor, display: "flex", alignItems: "center",
      justifyContent: "center", boxShadow: "0 0 0 2px var(--surface)" }}>
      <EventIcon size={9} style={{ color: "#fff" }}/>
    </div>
  </div>
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 12.5 }}>
      <span style={{ fontWeight: 600 }}>{actor.name}</span>
      <span style={{ color: "var(--fg-muted)" }}> {actionText} </span>
      <span style={{ fontWeight: 500, cursor: "pointer", color: "var(--primary)" }}>{taskKey}</span>
    </div>
    <div style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 2 }}>{relativeTime}</div>
  </div>
</div>
```

Tarih grupları: "Bugün", "Dün", "Bu Hafta", "Daha Eski". İlk 30 olay, "Daha fazla yükle" ile sayfalama.

Olay ikonları: oluşturma (Icons.Plus, status-done), durum (Icons.ArrowRight, status-progress), atama (Icons.Users, primary), yorum (Icons.Chat, status-review), silme (Icons.Trash, priority-critical), faz geçişi (Icons.CircleCheck, status-done).

---

## 8. WIP İhlali Detayları (BoardTab)

Kolon container'ına overLimit durumunda:
```jsx
background: overLimit ? "color-mix(in oklch, var(--priority-critical) 6%, var(--bg-2))" : "var(--bg-2)"
```

Kolon başlığı altına:
```jsx
{overLimit && <AlertBanner tone="danger" icon={<Icons.Alert size={11}/>}>{T("WIP limiti aşıldı","WIP limit exceeded")}</AlertBanner>}
```

WIP limitine tam ulaşıldığında: badge ton "warning", kolon bg `color-mix(in oklch, var(--status-review) 4%, var(--bg-2))`.

onDrop: enforce_wip_limits aktifse ve kolon >= wipLimit → drop reddet.

---

## 9. Backlog Paneli (project-detail.jsx, proje seviyesi)

Tüm sekmelerden erişilebilir. Content area sol kenarında dikey buton:
```jsx
<button onClick={() => setBacklogOpen(!backlogOpen)}
  style={{ writingMode: "vertical-rl", padding: "12px 4px", fontSize: 11, fontWeight: 600,
    color: "var(--fg-muted)", background: "var(--surface-2)",
    borderRight: "1px solid var(--border)", borderRadius: "var(--radius) 0 0 var(--radius)" }}>
  Backlog <Badge size="xs" style={{ writingMode: "horizontal-tb" }}>{backlogCount}</Badge>
</button>
```

Panel (width 300px). Responsive: 900px+ → içerik sağa kayar. 900px altı → overlay, arka plan `oklch(0 0 0 / 0.2)`.

Başlık + badge + kapatma. Altında: Input (arama) + SegmentedControl (öncelik filtresi) + sıralama.

Görev listesi (ilk 30, sayfalama):
- StatusDot + key (mono) + başlık + PriorityChip + "Taşı" butonu (kolon popover)
- Board'dayken drag-drop destekli. `dragged` state: `{ task, source: "board" | "backlog" }`

Toplu İşlem toggle → checkbox'lar + yapışkan aksiyon çubuğu: "Seçili: N" + "Faza Taşı" + "Sil".

---

## 10. Kullanıcı Profil Sayfası (yeni route: `user-profile`)

app.jsx PageRouter'a ekle: `case "user-profile": return <UserProfilePage/>`

Erişim: avatar/isim tıklamaları (MembersTab, BoardTab, ActivityTab, AdminUsers) + Header avatar dropdown.

### Header avatar dropdown (shell.jsx)

Mevcut logout butonu → dropdown menü:
- Profilim → `router.go("user-profile", { userId: currentUser.id })`
- Ayarlar → `router.go("settings")`
- Çıkış Yap → `router.go("login")`

### Sayfa yapısı

Profil header (flex gap 16): Avatar (size 64, ring) + ad (22px bold) + rol badge + email (13px muted). Kendi profilinde: "Düzenle" butonu → Settings.

3 StatCard (grid cols-3): "Atanan Görevler" (primary), "Tamamlanan" (success), "Projeler" (info).

Tabs: "Görevler" / "Projeler" / "Aktivite"
- Görevler: MTTaskRow (showProject=true), projeye göre gruplandırılmış. Filtre: SegmentedControl (Tümü/Aktif/Tamamlanan).
- Projeler: ProjectCard grid'i (projects.jsx yapısı).
- Aktivite: Activity bileşeni variant="full", kullanıcı filtresi gizli.

---

## 11. Değerlendirme Raporu (Lifecycle > Geçmiş kartlarına inline expand)

Faz geçmişi kartlarında "Rapor" butonu (Icons.Doc, ghost). Tıklandığında kartın altında expand:

- Başlık: "Faz Değerlendirme Raporu — {fazAdı}" (16px bold)
- Özet (read-only): grid cols-4 mini metrikler (Madde 3 geçmiş kartıyla aynı)
- Tamamlanan İşler: görev key + başlık listesi, yanlarında not Input
- Karşılaşılan Sorunlar: Textarea (rows 3)
- Öğrenilen Dersler: Textarea (rows 2)
- Sonraki Faz Önerileri: Textarea (rows 2)
- "PDF İndir" (secondary) + "Kaydet" (primary)

Reports sayfasına da "Faz Raporları" Section ekle (proje + faz seçimi ile kayıtlı raporlara erişim).

---

## 12. Reports Sayfasına Yeni Grafikler (misc.jsx ReportsPage)

### CFD (Kanban projelerde burndown yerine)

"Kümülatif Akış Diyagramı" Section. SegmentedControl ("7 gün"/"30 gün"/"90 gün"). SVG stacked area chart:
```
fill="color-mix(in oklch, var(--status-done) 40%, transparent)"
fill="color-mix(in oklch, var(--status-review) 40%, transparent)"
fill="color-mix(in oklch, var(--status-progress) 40%, transparent)"
fill="color-mix(in oklch, var(--status-todo) 40%, transparent)"
```
Legend + iki mini metrik: "Ort. WIP" + "Ort. Tamamlanma" (18px bold + 11px muted).

### Lead/Cycle Time

"Akış Süreleri" Section. Grid cols-2 (800px altında tek sütun):
- Sol: "Lead Time" + ortalama (20px bold mono) + SVG histogram (bucket'lar: 0-1d, 1-3d, 3-5d, 5-10d, 10d+, primary renk)
- Sağ: "Cycle Time" + ortalama + aynı histogram (info renk)
- Her birinin altında: "P50: 3.2 gün · P85: 7.1 gün · P95: 12 gün" (mono 11px muted)

### İterasyon Karşılaştırma (Scrum/Iterative)

SVG grouped bar chart: Planlanan (info), Tamamlanan (success), Taşınan (warning). Legend.
Altında özet tablo: iterasyon adı, süre, planlanan, tamamlanan, başarı % (ProgressBar), taşınan. Satırlar Collapsible → görev listesi.

---

## 13. Workflow Editor Genişletmeleri (workflow-editor.jsx)

### Edge tipleri

Edge seçim paneline SegmentedControl:
```jsx
<SegmentedControl value={edge.type || "flow"} onChange={...} options={[
  { id: "flow", label: T("Akış","Flow") },
  { id: "verification", label: T("Doğrulama","Verify") },
  { id: "feedback", label: T("Geri Bildirim","Feedback") },
]}/>
```

Canvas render:
```jsx
const strokeDash = e.type === "verification" ? "6 3" : e.type === "feedback" ? "8 4 2 4" : "none";
const strokeColor = e.type === "verification" ? "var(--status-progress)" : e.type === "feedback" ? "var(--status-review)" : "var(--fg-subtle)";
```

### Node gruplaması (Swimlane)

Toolbar'a "Grup" butonu. Canvas'ta grup çerçevesi (z-index node'ların altında):
```jsx
<div style={{
  position: "absolute", left: group.x, top: group.y, width: group.width, height: group.height,
  background: `color-mix(in oklch, var(--${group.color}) 6%, transparent)`,
  border: `1.5px dashed color-mix(in oklch, var(--${group.color}) 30%, transparent)`,
  borderRadius: 12, zIndex: 0 }}>
  <div style={{ padding: "6px 10px", fontSize: 11, fontWeight: 600, color: `var(--${group.color})` }}>{group.name}</div>
</div>
```
Sağ panelde grup seçildiğinde: isim, renk, açıklama, silme.

### 4. akış modu: sequential-flexible

Akış Kuralları'na 4. seçenek:
```jsx
{ id: "sequential-flexible", icon: <Icons.Lock size={13}/>,
  label: T("Sıralı · Esnek Geri Dönüş","Sequential · Flex Return"),
  desc: T("Sıralı ilerle, tanımlı geri dönüşlere izin ver. V-Model ve Modified Waterfall için.",
           "Sequential flow, defined returns allowed. For V-Model and Modified Waterfall.") }
```

### Aktif faz görseli düzeltmesi

Mevcut `isPastLocked` (düz index) → `node.state` (graph traversal ile hesaplanan):
- "active" → primary ring, tam opacity
- "past" → opacity 0.55, lock ikonu (locked modlarda)
- "future" → tam opacity, ring yok
- "unreachable" → opacity 0.3, kesikli border

Paralel aktif fazlar: tamamlanmamış görevi olan her node "active" ring alır.

Node üzerinde döngü sayacı: aynı faz birden fazla kez kapatılmışsa `×N` badge'i (sağ üst, Badge size xs).

### Yeni preset template'ler (data.jsx + AdminWorkflows)

V-Model, Spiral, Artırımlı, Evrimsel, RAD template'leri ekle. Her birinin node/edge/group/mode tanımları UI-TASARIM-PLANI.md v3'teki L7 bölümünden alınır. AdminWorkflows kartlarına bu template'ler eklenir.

---

## 14. Görev-Faz Ataması

### Settings > Lifecycle'a yeni toggle

Mevcut flag toggle'larının altına "Görev-Faz Ataması" toggle'ı (aynı görsel yapı):
- Açıklama: "Görevlere ve alt görevlere faz ataması yapılabilir." (11.5px muted)
- Değiştirildiğinde onay dialog'u.

### Toggle açıkken UI değişiklikleri

Görev oluşturma/düzenleme formuna "Faz" dropdown'ı (lifecycle node listesinden seçim, swimlane varsa gruplandırılmış).

Board Tab görev kartında faz badge:
```jsx
{task.phaseId && <Badge size="xs" tone="neutral" dot style={{ fontSize: 10 }}>{phaseName}</Badge>}
```

Board toolbar'a "Faza Göre Filtrele" dropdown. List Tab'a "Faz" sütunu.

Alt görevler de faz alabilir. Ana görev sidebar'ında mini faz stepper:
```
Analiz ✓ → Tasarım ● → Kodlama ○ → Test ○
```
✓ = tümü done, ● = bazıları in progress, ○ = başlanmamış.

Toggle kapalıyken: tüm faz UI'ları gizli.

---

## 15. Cycle Genelleştirmesi (i18n)

Sprint yönetimi sayfalarında "Sprint" kelimesi yerine metodolojiye bağlı etiket:

```
scrum → "Sprint"         waterfall → "Faz Dönemi"      v-model → "Faz Dönemi"
spiral → "Döngü"         iterative → "İterasyon"        incremental → "Artım"
evolutionary → "Prototip" kanban → "Dönem"              rad → "Döngü"
```

---

## 16. Görev Oluştur Modalı

Header'daki "Görev oluştur" butonu ve proje detaydaki "Görev" butonu tıklandığında açılır. Overlay modal (position fixed, inset 0, z-index 50, arka plan `oklch(0 0 0 / 0.3)`). Ortada Card (width 540px, maxHeight 85vh, overflowY auto).

### Modal yapısı

Başlık satırı: "Görev Oluştur" (16px bold) + Icons.X kapatma butonu (sağ üst).

Form alanları (dikey, gap 14):

**Proje** (zorunlu): Dropdown. Proje key + isim gösterilir. Eğer modal proje detaydan açıldıysa otomatik seçili ve disabled.

**Görev Türü**: SegmentedControl — "Görev" / "Alt Görev" / "Bug". Varsayılan: "Görev".
- "Alt Görev" seçildiğinde: "Ana Görev" dropdown'ı görünür (seçili projenin görevlerinden seçim, key + başlık).
- "Bug" seçildiğinde: görsel olarak Bug ikonu (Icons.Bug, priority-critical renk) başlık input'unun solunda belirir. Öncelik kullanıcıya bırakılır, varsayılan Medium kalır.

**Başlık** (zorunlu): Input (placeholder "Görev başlığı..."). fontSize 14.

**Açıklama**: Textarea (rows 3, placeholder "Açıklama ekleyin...").

İki sütunlu grid (gridTemplateColumns "1fr 1fr", gap 12):

Sol sütun:
- **Öncelik**: Dropdown. Her seçenekte PriorityChip: Critical (kırmızı), High (turuncu), Medium (sarı), Low (gri). Varsayılan: Medium.
- **Atanan Kişi**: Dropdown. Avatar (size 18) + isim. Projenin üye listesinden. Varsayılan: "Atanmamış".
- **Puan**: Input type number (placeholder "SP", min 0, max 100, className mono).

Sağ sütun:
- **Bitiş Tarihi**: Input type date.
- **Cycle**: Dropdown. Projenin aktif cycle'larından seçim. Label metodolojiye göre dinamik (Sprint/Döngü/İterasyon/Artım). Cycle yoksa "Cycle yok" muted metin.
- **Faz** (sadece `enable_phase_assignment` açıksa görünür): Dropdown. Projenin lifecycle Canvas node listesi. Swimlane varsa gruplandırılmış (grup adı optgroup başlığı olarak). Kapalıysa bu alan tamamen gizli.

**Etiketler**: Input (placeholder "Etiket ekle...", Enter ile ekle). Eklenen etiketler Badge (size xs) olarak sıralanır, yanlarında Icons.X silme.

**Tekrarlayan Görev** (Collapsible, varsayılan kapalı):
- "Tekrarlayan görev" toggle. Açılınca:
  - Tekrar sıklığı: SegmentedControl ("Günlük" / "Haftalık" / "Aylık")
  - Bitiş: SegmentedControl ("Hiçbir zaman" / "Tarihte" / "Sayıda"). "Tarihte" → tarih input. "Sayıda" → number input.

Alt buton satırı: "Vazgeç" (ghost) + "Oluştur" (primary, disabled başlık boşken). `⌘ + Enter` kısayol ile de gönderilebilir, butonun yanında `<Kbd>⌘↵</Kbd>` ipucu.

---

## 17. Proje Oluştur Sayfası (Wizard)

Yeni route: `create-project`. app.jsx PageRouter'a ekle: `case "create-project": return <CreateProjectPage/>`

Projects sayfasındaki "Yeni proje" butonu → `router.go("create-project")`. Tam sayfa, AppShell içinde (sidebar + header korunur). İçerik alanı `max-w-4xl mx-auto`. Multi-step wizard — 4 adım, üstte step indicator.

### Step indicator

4 adımlı yatay stepper (flex, gap, adımlar arası çizgi):
```
(1) Temel Bilgiler  ——  (2) Metodoloji  ——  (3) Yaşam Döngüsü  ——  (4) Yapılandırma
```
Aktif adım: primary renk, bold. Tamamlanan: status-done + Icons.Check. Gelecek: muted.

### Adım 1 — Temel Bilgiler

**Proje Adı** (zorunlu): Input (placeholder "Proje adı"). fontSize 14.

**Proje Anahtarı** (zorunlu): Input (placeholder "KEY", maxLength 6). Otomatik uppercase. mono font. Yanında küçük açıklama: "Görev anahtarları için kullanılır (ör. KEY-1, KEY-2)" (11px muted).

**Açıklama**: Textarea (rows 3, placeholder "Proje açıklaması...").

İki sütunlu grid:
- **Başlangıç Tarihi**: Input type date. Varsayılan: bugün.
- **Bitiş Tarihi**: Input type date. Opsiyonel.

**Proje Yöneticisi**: Dropdown. Avatar + isim. Kullanıcı listesinden seçim.

Alt butonlar: "Vazgeç" (ghost) + "Devam" (primary, disabled ad veya key boşken).

### Adım 2 — Metodoloji

Açıklama (13px muted): "Projeniz için bir yaşam döngüsü şablonu seçin. Daha sonra değiştirebilirsiniz."

Şablon kartları grid (gridTemplateColumns "repeat(3, 1fr)", gap 12). Her kart (Card interactive, padding 14):
- Şablon adı (bold 14px)
- Mod badge: Flexible (neutral) / Sequential Locked (warning) / Continuous (info) / Sequential Flex (primary)
- Açıklama (12px muted, 2 satır)
- Seçiliyse: primary border (boxShadow "0 0 0 2px var(--primary)")

Yerleşik şablonlar (ilk satır): Scrum, Kanban, Waterfall

Yerleşik şablonlar (ikinci satır): V-Model, Spiral, Artırımlı

Daha fazlası varsa (AdminWorkflows'tan custom template'ler): üçüncü satırda "Özel" başlığı altında listelenir (Evrimsel, RAD, ISO Audit, Lean vb.).

Alt butonlar: "Geri" (ghost) + "Devam" (primary, disabled seçim yapılmadıysa).

### Adım 3 — Yaşam Döngüsü

Seçilen şablonun lifecycle Canvas'ını gösterir ve düzenleme imkanı sunar.

Tam sayfa olduğu için Canvas geniş alan kullanabilir. Layout: grid `1fr 280px` (canvas + sağ panel).

**Sol — Canvas alanı (height 420px, Card içinde):** WorkflowCanvas bileşeni, seçilen template'in node/edge/group verileriyle render edilir. readOnly=false — kullanıcı node'ları sürükleyebilir, yeniden konumlandırabilir. Minimap sağ alt köşede gösterilir.

Canvas altında toolbar (flex row, gap 8):
- "+ Faz Ekle" butonu (Button size sm ghost, Icons.Plus): Canvas'a yeni node ekler (otomatik konumlandırılır).
- "+ Bağlantı" butonu (Button size sm ghost, Icons.Flow): İki node arasına edge ekler (sırayla iki node'a tıkla).
- "+ Grup" butonu (Button size sm ghost, Icons.Grid): Swimlane çerçevesi ekler.
- Ayraç (height 20, width 1, border)
- "Faz Sil" butonu (Button size sm ghost, Icons.Trash): Seçili node/edge/grubu siler. Seçim yoksa disabled.

Canvas üstünde bilgi satırı (12px muted): "Projenin yaşam döngüsünü özelleştirin. Detaylı düzenleme için proje oluşturulduktan sonra İş Akışı Tasarımcısı'nı kullanabilirsiniz."

**Sağ — Özellikler paneli (280px, Card içinde):**

Üst bölüm — "Akış Modu":
```jsx
<SegmentedControl value={mode} onChange={setMode} size="xs" options={[
  { id: "flexible", label: "Esnek" },
  { id: "sequential-locked", label: "Sıralı" },
  { id: "sequential-flexible", label: "Sıralı+" },
  { id: "continuous", label: "Sürekli" },
]}/>
```
Seçili modun altında kısa açıklama (11px muted).

Orta bölüm — "Seçim" (node/edge/grup seçiliyse):
- Node seçili: Faz adı (Input), WIP limiti (Input number), renk (6 preset dot), açıklama (Input).
- Edge seçili: Tip (SegmentedControl: Akış/Doğrulama/Geri Bildirim), etiket (Input), çift yönlü (checkbox).
- Grup seçili: Grup adı (Input), renk (6 preset dot).
- Hiçbiri seçili değilse: "Bir faz, bağlantı veya grup seçin." (12px muted).

Alt bölüm — "Doğrulama" (mevcut WorkflowEditor'deki validation yapısı): Başlangıç node mevcut ✓/✗, Bitiş node mevcut ✓/✗, Erişilebilirlik ✓/✗.

Alt butonlar: "Geri" (ghost) + "Devam" (primary).

### Adım 4 — Yapılandırma

Seçilen şablona göre otomatik doldurulan ama düzenlenebilir alanlar:

**Board Kolonları**: Sıralı liste. Her satırda: sıralama handle (⠿), kolon adı (Input), WIP limiti (Input number, placeholder "∞"), silme (Icons.X). Altında: "+ Kolon Ekle" butonu. Drag-drop ile sıralama.

**Görev Alanları**: Checklist. Her alan bir toggle satırı:
- Alan adı + açıklama (12px muted) + toggle switch (açık/kapalı)
- Alanlar şablondan gelir: Story Point, Due Date, Priority, Severity, Risk, Labels, Assignee, Estimate Hours, Attachments
- Varsayılan açık/kapalı durumları şablona göre farklı

**Davranış Kuralları**: Toggle'lar (mevcut Settings toggle yapısı):
- "Sıralı faz bağımlılığını zorla" — şablona göre varsayılan
- "WIP limitlerini zorla" — şablona göre varsayılan
- "Süresi dolan fazlara görev eklemeyi engelle" — şablona göre varsayılan
- "Görev-Faz Ataması" — şablona göre varsayılan

**Üye Davet** (opsiyonel): Kullanıcı arama Input + sonuç listesi (Avatar + isim + "Ekle" butonu). Eklenen üyeler Avatar dizisi olarak gösterilir, yanlarında Icons.X.

Alt butonlar: "Geri" (ghost) + "Projeyi Oluştur" (primary).

Oluşturulunca: `router.go("project-detail", { projectId: newProject.id })` ile proje detaya yönlendirilir.

---

## Metodoloji Davranış Özeti

**Waterfall:** Tüm Lifecycle alt-sekmeleri aktif. Phase Gate zorunlu. sequential-locked Canvas.

**Scrum:** Tüm alt-sekmeler aktif. Phase Gate opsiyonel. flexible Canvas.

**Kanban:** Lifecycle → "Akış Metrikleri". Overview'da CFD + Lead/Cycle Time. Geçmiş ve Artefaktlar gizli. Phase Gate yok.

**Iterative:** Tüm alt-sekmeler aktif. Phase Gate opsiyonel. flexible Canvas.

**V-Model:** sequential-flexible Canvas + verification edge'leri + swimlane. Phase Gate zorunlu. enable_phase_assignment açık.

**Spiral:** flexible Canvas + feedback edge'leri + döngü sayacı. Phase Gate opsiyonel.

**Artırımlı:** flexible Canvas + swimlane + paralel aktif fazlar. enable_phase_assignment açık.

**Evrimsel:** flexible Canvas + feedback edge'leri + döngü sayacı.

**RAD:** flexible Canvas + feedback edge'leri.
