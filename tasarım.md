# SPMS — Eksik Sayfalar UI Tasarım Planı (v3 — Lego Mimari)

Bu doküman, EKSIK-SAYFALAR.md'deki 18 eksikliği frontend_2'nin mevcut yapısıyla karşılaştırır. Üç UI uzmanının (UX Flow, Visual Design, Information Architecture) raporlarıyla revize edilmiştir.

frontend_2 mimarisi: JSX bileşenler, custom hash router (`useRouter().go(page, params)`), `window.SPMSData` mock data, inline style, CSS variable tokenleri (--primary, --surface, --border vb.), `useApp().language` ile TR/EN, primitives.jsx'ten Card/Badge/Button/Tabs/Input/Avatar bileşenleri.

---

## Ön Gereksinim: Yeni Primitive Bileşenler

Uzman incelemesi sonucunda, planın uygulanabilmesi için önce primitives.jsx'e eklenmesi gereken bileşenler tespit edildi. Bu bileşenler yeni maddelerden önce implemente edilmelidir.

### P1. ProgressBar

7+ yerde tekrarlanan inline progress bar implementasyonu var. Ortak bileşen olarak çıkarılmalı.

```jsx
const ProgressBar = ({ value = 0, max = 100, height = 4, color = "var(--primary)", bg = "var(--surface-2)", style }) => (
  <div style={{ height, background: bg, borderRadius: height, overflow: "hidden", ...style }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: height, transition: "width 0.2s" }}/>
  </div>
);
```

Kullanım noktaları: faz detay kartı, faz özeti satırları, milestone kartları, artefakt özeti, proje kartları, faz geçmişi, kullanıcı profili.

### P2. SegmentedControl

4+ yerde inline olarak tekrarlanan segmented button pattern'i. AdminUsers rol filtresi, Board compact/rich toggle, Dashboard manager/member toggle, proje durum filtresi ve raporlar tarih aralığı hep aynı yapı.

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

### P3. Collapsible

Faz tamamlanma kriterleri, faz geçmişi detay expand, iterasyon karşılaştırma satır expand için gerekli.

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

### P4. AlertBanner

Arşivlenmiş proje uyarısı, WIP ihlali, sequential-locked faz geçişi uyarısı, Phase Gate kriter uyarıları hep aynı pattern.

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

### P5. Tema Token Eklemeleri (theme.jsx)

`--status-todo` ve `--status-blocked` tokenleri theme.jsx preset'lerinde tanımlı değil. StatusDot ve CFD grafiklerinde kullanılıyor. Her preset'e eklenmeli:

```
default preset: "status-todo": "oklch(0.65 0.01 250)", "status-blocked": "oklch(0.58 0.18 25)"
ocean preset: "status-todo": "oklch(0.60 0.02 220)", "status-blocked": "oklch(0.55 0.16 20)"
(diğer preset'ler benzer şekilde)
```

---

## Mevcut Durum Matrisi

Tamamen karşılanan, plana dahil edilmeyen maddeler:

- Madde 11 (Admin Audit Log): frontend_2'de AdminAudit bileşeni tam implemente. Plana dahil edilmedi.
- Madde 16-eski (Lifecycle Tab temel): frontend_2'de LifecycleTab + WorkflowCanvas mevcut. Plana dahil edilmedi.
- Madde 18 (Hybrid/Flex Lifecycle): frontend_2'de WorkflowEditorPage + AdminWorkflows tam implemente. Plana dahil edilmedi.
- Madde 15-eski (WIP badge): frontend_2'de overLimit → danger badge mevcut. Plana dahil edilmedi.

---

## Kısmen Karşılanan — Düzeltme ve Ekleme Gereken Maddeler

### Madde 1. Lifecycle Tab — Alt-Sekme Sistemi + Faz Detayları

**Mevcut durum:** LifecycleTab sadece WorkflowCanvas'ı read-only gösteriyor. Node tıklamada detay yok.

**Uzman bulgusu:** Tek sekmeye 5-6 bölüm yığmak 2000px+ scroll yaratıyor (3/3 uzman KRİTİK). Alt-sekmeler şart.

**Ekleme planı:**

LifecycleTab'ın mevcut yapısı kökten değişir. Canvas'ın üstüne bir özet strip eklenir, Canvas'ın altına alt-sekmeler (sub-tabs) eklenir.

**Özet strip (Canvas'ın üstü, sticky):**

Faz dashboard metriklerinin sıkıştırılmış versiyonu. Canvas ile aynı Card içinde, üst border'ın hemen altında:
```
style: padding "10px 16px", borderBottom "1px solid var(--border)", display flex, alignItems center, gap 16, fontSize 12.5
```
- Mevcut faz adı ve sırası: `<Badge tone="primary">3/5 — Yürütme</Badge>`
- İlerleme: `<ProgressBar value={72} max={100} style={{ width: 120 }}/> <span className="mono">%72</span>`
- Kalan görev: `<span style={{ color: "var(--fg-muted)" }}>8 kalan</span>`
- Sonraki milestone: `<span style={{ color: "var(--fg-muted)" }}><Icons.Target size={12}/> Demo — 12 gün</span>`
- Sağ taraf: **"Sonraki Faza Geç"** kısayol butonu (Button size sm variant primary). Bu buton Phase Gate akışını 4 seviyeden 1 seviyeye düşürür.

**Aktif Faz Kısayol Butonu:** Sadece aktif faz varken ve kullanıcı proje yöneticisi/admin ise gösterilir. Kanban projelerinde gizlenir.

**Canvas (mevcut haliyle):** WorkflowCanvas bileşeni. Ek olarak `onNodeClick` prop'u eklenir (readOnly modda bile). Seçili node primary ring ile vurgulanır.

**Alt-sekmeler (Canvas'ın altı):**

Mevcut SettingsTab'daki alt-sekme pattern'i kullanılır (Tabs size="sm"):
```jsx
<Tabs size="sm" active={lifecycleSub} onChange={setLifecycleSub} tabs={[
  { id: "overview", label: T("Genel Bakış","Overview"), icon: <Icons.Chart size={12}/> },
  { id: "milestones", label: T("Kilometre Taşları","Milestones"), icon: <Icons.Target size={12}/> },
  { id: "history", label: T("Geçmiş","History"), icon: <Icons.Clock size={12}/>, badge: closedPhaseCount },
  { id: "artifacts", label: T("Artefaktlar","Artifacts"), icon: <Icons.Doc size={12}/>, badge: `${doneCount}/${totalCount}` },
]}/>
```

Bu yapıyla Artifacts bağımsız bir ana sekme olmak yerine Lifecycle'ın alt-sekmesi olur. Ana sekme sayısı 7'den 8'e çıkmak yerine 8'de kalır (Board, List, Timeline, Calendar, Activity, Lifecycle, Members, Settings).

**Alt-sekme: Genel Bakış**

Canvas'ta bir node seçiliyse faz detay kartı gösterilir. Seçili değilse aktif fazın kartı varsayılan gösterilir.

Faz detay kartı (Card padding 14):
- Üst satır: faz adı (bold 14px) + durum badge'i (Tamamlandı/Aktif/Bekliyor)
- Metrik satırı (grid cols-4): "Toplam" (sayı 18px bold), "Tamamlanan" (18px bold, status-done renk), "Devam Eden" (18px bold, status-progress renk), "İlerleme" (yüzde, 18px bold mono)
- ProgressBar (height 4)
- Eğer bu aktif fazsa: "Faza Geçiş Yap" butonu (Button size sm variant secondary, sağ alt). Bu buton Phase Gate inline expand'i tetikler.

Detay kartının altında iki sütunlu grid (responsive: 800px altında tek sütun):

Sol: "Faz Özeti" başlıklı Section. Her board kolonu (faz) için bir satır:
- StatusDot + kolon adı (12.5px) + ProgressBar (flex 1, height 4) + yüzde (mono 11px) + görev sayısı Badge
- Aktif faz satırı `background: var(--accent)` ile vurgulanır

Sağ: "Yaklaşan Teslimler" başlıklı Section. Due date'i 7 gün içinde veya geçmiş olan görevler, en fazla 5:
- Görev key (mono 10.5px) + başlık (tıklanabilir) + Avatar (size 18) + kalan gün
- Gecikmiş: `color: var(--priority-critical)` ve Icons.Alert

**Empty state kuralları (0 görevli faz):**
- Metrikler: tüm sayılar "0", ilerleme "%0" yerine "—"
- Phase Gate otomatik kriterleri: "Uygulanamaz" olarak gri gösterilir, zorunlu sayılmaz
- Detay kartında bilgi mesajı: "Bu fazda henüz görev bulunmuyor."
- Dashboard metriklerinde "Görev yok" bilgi metni

**Alt-sekme: Kilometre Taşları** → Madde 7'de detaylandırılır

**Alt-sekme: Geçmiş** → Madde 5'te detaylandırılır

**Alt-sekme: Artefaktlar** → Madde 8'de detaylandırılır (eski bağımsız sekme yerine buraya taşındı)

**Metodolojiye göre Lifecycle Tab davranışı:**

Waterfall/Iterative: Tüm alt-sekmeler ve özet strip aktif. Phase Gate zorunlu (sequential-locked).

Scrum: Tüm alt-sekmeler aktif. Phase Gate önerilen ama atlanabilir.

Kanban: Lifecycle Tab başlığı "Akış Metrikleri" olarak değişir. Canvas yerine Kanban'a özgü içerik gösterilir:
- Özet strip: ortalama tamamlanma süresi + WIP ortalaması + throughput
- Alt-sekme "Genel Bakış": CFD mini chart (son 30 gün) + Lead/Cycle Time özet kartları
- Alt-sekme "Kilometre Taşları": mevcut (milestone tüm metodolojilerde geçerli)
- Alt-sekme "Geçmiş": gizlenir (Kanban'da faz geçişi yok)
- Alt-sekme "Artefaktlar": gizlenir (Kanban'da tek "WIP Policies" artefaktı anlamlı değil, bu artefakt Settings'te korunabilir)

### Madde 2. Faz Bazlı İlerleme Dashboard'u

**Uzman bulgusu:** Dashboard ayrı bir scroll bölümü yerine Lifecycle Tab Genel Bakış alt-sekmesine entegre edildi (Madde 1'de). Ayrıca özet strip Canvas üstüne taşındı.

Bu madde artık Madde 1 içinde çözüldü. Ayrı bir bölüm olarak uygulanmaz.

### Madde 6. Proje Durumu ve Arşivi — Kısmen Eksik

**Mevcut durum:** Statik "Aktif" badge. Filtre ve arşiv mekanizması yok.

**Ekleme planı — Proje Listesi (projects.jsx):**

Toolbar'a SegmentedControl eklenir (yeni P2 primitive):
```jsx
<SegmentedControl value={statusFilter} onChange={setStatusFilter} options={[
  { id: "all", label: T("Tümü","All") },
  { id: "active", label: T("Aktif","Active") },
  { id: "completed", label: T("Bitti","Done") },
  { id: "archived", label: T("Arşiv","Archive") },
]}/>
```

Proje kartlarına durum badge'i: active→success, completed→info, on_hold→warning, archived→neutral. Arşivlenmiş projeler opacity 0.6.

**Ekleme planı — Proje Detay Header:**

Statik badge yerine dinamik durum badge'i. MoreH dropdown'a: "Projeyi Tamamla", "Askıya Al", "Arşivle" aksiyonları.

Arşivlenmiş proje banner'ı (yeni P4 AlertBanner primitive):
```jsx
<AlertBanner tone="warning" icon={<Icons.Lock size={13}/>}
  action={<Button size="xs" variant="ghost">{T("Aktif Et","Reactivate")}</Button>}>
  {T("Bu proje arşivlenmiştir.","This project is archived.")}
</AlertBanner>
```

**Backend:** Detaylar UI-Tasarim-Backend.md §1'de.

### Madde 9. Proje Bazlı Aktivite Akışı

**Mevcut durum:** Dashboard'da genel RecentActivity var. Proje bazlı yok.

**Ekleme planı:**

Proje detay Tabs dizisine yeni sekme (Calendar ile Lifecycle arasına):
```jsx
{ id: "activity", label: T("Aktivite","Activity"), icon: <Icons.Activity size={13}/> }
```

ActivityTab bileşeni oluşturulur. İki variant destekler: `variant="full"` (filtreler + timeline + sayfalama) ve `variant="compact"` (düz liste, dashboard için). Dashboard'daki RecentActivity sonradan compact variant ile değiştirilebilir.

**Üstte filtre satırı (variant="full" ise):**
- Olay türü: SegmentedControl (Tümü, Oluşturma, Durum, Atama, Yorum)
- Kullanıcı filtresi: proje üyelerinin avatar dizisi, tıklanabilir, seçili olan ring ile vurgulanır

**Timeline:** Dikey çizgi (width 2px, background border) sol kenarında. Her olay:
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

**Tarih bazlı gruplama:** "Bugün", "Dün", "Bu Hafta", "Daha Eski" başlıklarıyla bölümler.

İlk yükleme: son 30 olay. "Daha fazla yükle" butonu ile 30'arlık sayfalama.

Olay ikonları ve renkleri: görev oluşturma (Icons.Plus, status-done), durum değişikliği (Icons.ArrowRight, status-progress), atama (Icons.Users, primary), yorum (Icons.Chat, status-review), silme (Icons.Trash, priority-critical), faz geçişi (Icons.CircleCheck, status-done).

### Madde 15. WIP İhlali Uyarısı — Eksik Detay

**Mevcut durum:** Badge tone değişiyor (danger) ama kolon arka planı, uyarı mesajı ve drag engelleme yok.

**Ekleme planı:**

Kolon container'ına overLimit durumunda ek stiller:
```jsx
background: overLimit ? "color-mix(in oklch, var(--priority-critical) 6%, var(--bg-2))" : "var(--bg-2)"
```

Kolon başlığı altına AlertBanner (P4 primitive, küçültülmüş):
```jsx
{overLimit && (
  <AlertBanner tone="danger" icon={<Icons.Alert size={11}/>}>
    {T("WIP limiti aşıldı","WIP limit exceeded")}
  </AlertBanner>
)}
```

WIP limitine tam ulaşıldığında (aşılmadan): badge ton "warning", kolon arka planı `color-mix(in oklch, var(--status-review) 4%, var(--bg-2))`.

onDrop handler'ına WIP kontrolü: enforce_wip_limits aktifse ve hedef kolon >= wipLimit ise drop reddedilir.

---

## Tamamen Eksik — Sıfırdan Tasarlanacak Maddeler

### Madde 3. Faz Geçişi (Phase Gate) Mekanizması

**Uzman bulgusu:** Sheet panel frontend_2'de hiç yok (3/3 uzman KRİTİK). Mevcut mimari inline Card expand kullanıyor. Phase Gate inline expand olarak tasarlanmalı.

**Konum:** Lifecycle Tab → Genel Bakış alt-sekmesindeki faz detay kartının altında inline olarak genişler. Ayrıca özet strip'teki "Sonraki Faza Geç" kısayol butonu da aynı expand'i tetikler.

**Tasarım:**

"Faza Geçiş Yap" butonuna tıklandığında detay kartının altında yeni bir Card expand olur (Collapsible pattern'inin özel versiyonu). Canvas ve üst bölümler görünür kalır, kullanıcı bağlamını kaybetmez.

Expand Card yapısı (padding 16, background surface, border, borderRadius, marginTop 8):

Başlık satırı: "Faz Geçişi: {fazAdı} → {sonrakiFazAdı}" (fontSize 14, fontWeight 600) + kapatma butonu (Icons.X, sağ üst).

Bölüm 1 — "Tamamlanma Durumu" (Section primitive):
```
Toplam: 24 görev    Tamamlanan: 20    Açık kalan: 4
```
Üç değer flex row ile yan yana. Açık kalan > 0 ise turuncu renk ve Icons.Alert.

Bölüm 2 — "Geçiş Kriterleri" (Section primitive):

Otomatik kriterler (read-only, hesaplanan):
- Her satırda: durum ikonu (Icons.CircleCheck yeşil veya Icons.Alert kırmızı) + kriter metni + durum etiketi
- "Tüm görevler tamamlandı" — done/total oranına bakılır
- "Kritik görev kalmadı" — priority=critical ve status!=done sayısı
- "Blocker bağımlılık kalmadı" — (varsa)
- **0 görevli fazda:** otomatik kriterler gri gösterilir, etiket "Uygulanamaz", zorunlu sayılmaz

Manuel kriterler (tıklanabilir checkbox):
- "Faz çıktıları gözden geçirildi"
- "Paydaş onayı alındı"
- (Settings > Lifecycle'da tanımlanan ek kriterler varsa onlar da listelenir)

Alt bilgi satırı: "Kriterleri düzenle →" linki (tıklandığında Settings > Lifecycle alt sekmesine yönlendirir)

Bölüm 3 — "Açık Görevlerin Akıbeti":
SegmentedControl ile: "Sonraki faza taşı" / "Backlog'a taşı" / "Bu fazda bırak"

Bölüm 4 — "Not" (opsiyonel):
Textarea (rows 2, placeholder "Faz geçişi notu...")

Alt buton satırı:

sequential-locked modda tüm otomatik kriterler karşılanmamışsa:
```jsx
<AlertBanner tone="danger" icon={<Icons.Lock size={12}/>}>
  {T("Tüm kriterler karşılanmadan geçiş yapılamaz.","All criteria must be met.")}
</AlertBanner>
<Button variant="primary" disabled style={{ width: "100%", marginTop: 8 }}>{T("Faza Geçişi Onayla","Confirm Transition")}</Button>
```

Scrum/Iterative'de kriterler karşılanmamışsa:
```jsx
<AlertBanner tone="warning" icon={<Icons.Alert size={12}/>}>
  {T("Bazı kriterler karşılanmadı. Yine de geçebilirsiniz.","Some criteria unmet. You may still proceed.")}
</AlertBanner>
<Button variant="primary" style={{ width: "100%", marginTop: 8 }}>{T("Faza Geçişi Onayla","Confirm Transition")}</Button>
```

**Canvas entegrasyonu:** Phase gate olan fazlar arası edge'lerin üzerinde küçük bir gate ikonu (Icons.Lock, 10px) gösterilir. Gate durumu: bekliyor (neutral), onaylandı (success). Bu görsel gösterge WorkflowCanvas'a eklenir.

### Madde 4. Faz Tamamlanma Kriterleri Tanımlama

**Konum:** Settings > Lifecycle alt sekmesi. Mevcut placeholder metin kaldırılır.

**Tasarım:**

Üstte açıklama: "Her faz için geçiş kriterlerini tanımlayın. Bu kriterler faz geçişi sırasında kontrol edilir." (fontSize 12.5, muted)

Her workflow node'u (faz) için bir Collapsible (P3 primitive). Kapalıyken: faz adı + tanımlı kriter sayısı badge'i. Açıldığında:

"Otomatik Kriterler" başlığı (Section):
Toggle satırları (mevcut AdminPermissions toggle yapısıyla aynı):
- "Tüm görevler tamamlanmalı" — toggle
- "Kritik görev kalmamalı" — toggle
- "Blocker bağımlılık kalmamalı" — toggle

"Manuel Kriterler" başlığı (Section):
Dinamik liste. Her satırda: Input (flex 1, placeholder "Kriter açıklaması...") + silme butonu (Icons.X, ghost, priority-critical). Altında: "+ Kriter Ekle" butonu (Icons.Plus, ghost).

Kaydet butonu (Button size sm variant primary).

Phase Gate'teki "Kriterleri düzenle →" linki buraya yönlendirir.

### Madde 5. Faz Geçmişi / Arşiv Görünümü

**Konum:** Lifecycle Tab → "Geçmiş" alt-sekmesi.

**Tasarım:**

Kapatılmış fazların listesi. Varsayılan olarak son 5 faz gösterilir. 5'ten fazla varsa "Tümünü göster" butonu.

Her kapatılmış faz bir Card (padding 14):

Üst satır (flex, space-between): Faz adı (bold 13px) + kapatılma tarihi (mono 11px muted) + süre badge (Badge size xs neutral, "12 gün").

Metrik satırı (grid cols-4, gap 8): Dört MiniStatCard (18px bold değer, 10.5px muted etiket, padding "8px 10px", background surface-2, borderRadius radius-sm):
- "Toplam" — sayı
- "Tamamlanan" — sayı, status-done renk
- "Taşınan" — sayı, status-review renk
- "Başarı" — yüzde

Faz notu (varsa): italik muted metin (padding 8, background surface-2, borderRadius 4).

Her kartın altında Collapsible (P3 primitive): "Görev Detayları" başlığı ile o fazın görevlerini listeler. MTTaskRow compact kullanılır.

Her kartın sağ üstünde "Rapor" butonu → Madde 17 Değerlendirme Raporu'nu tetikler.

### Madde 7. Milestone / Kilometre Taşı

**Konum:** Lifecycle Tab → "Kilometre Taşları" alt-sekmesi.

**Tasarım:**

Üstte: "Kilometre Taşları" Section başlığı + sağda "+ Ekle" butonu (Button size sm variant secondary, Icons.Plus).

Varsayılan olarak en fazla 5 milestone gösterilir. Daha fazlası varsa "Tümünü göster" butonu.

Her milestone bir Card (padding 14):
```jsx
style: borderLeft: isOverdue ? "3px solid var(--priority-critical)" : "3px solid var(--primary)"
```

Üst satır (flex, space-between): Milestone adı (bold 14px) + hedef tarih ve kalan gün (mono 11px). Gecikmiş ise kırmızı: "3 gün gecikti".

Durum badge'i: "Bekliyor" (neutral), "Devam Ediyor" (info), "Tamamlandı" (success), "Gecikmiş" (danger).

Bağlı fazlar: küçük badge dizisi (Badge size xs, faz isimleri).

ProgressBar (height 4) + yüzde (mono 11px sağda).

"+ Ekle" tıklandığında listenin üstünde inline form Card açılır: Input (ad) + tarih input + açıklama Textarea + "Kaydet"/"İptal" butonları.

**Timeline entegrasyonu:** TimelineTab'daki Gantt chart'ta milestone'lar tarih çizgisi üzerinde elmas (◆) işareti olarak gösterilir. Elmas'ın üzerine hover'da tooltip ile milestone adı.

### Madde 8. Döküman / Artefakt Takibi

**Konum:** Lifecycle Tab → "Artefaktlar" alt-sekmesi (eski plandaki bağımsız ana sekme yerine).

**Uzman bulgusu:** Artifacts'i Lifecycle alt-sekmesi yapmak ana sekme sayısını 8'de tutar ve "faz çıktıları" ile doğal bağını korur. Kanban projelerinde bu alt-sekme gizlenir.

**Tasarım:**

Üstte özet satırı: "3/5 artefakt tamamlandı" (13px) + ProgressBar (width 200, height 4) + sağda "+ Özel Ekle" butonu.

Artefakt listesi Card içinde. Metodolojiye göre beklenen artefaktlar:
- scrum: Product Backlog, Sprint Backlog, Increment
- waterfall: SRS, SDD, STD, Release Notes
- iterative: İterasyon Planı, Değerlendirme Raporu
- kanban: bu alt-sekme gizli

Her artefakt satırı (grid cols: "2fr 120px 150px 100px 40px"):
- Icons.Doc + artefakt adı (13px, fontWeight 500)
- Durum dot'u: gri (Oluşturulmadı), sarı (Taslak), yeşil (Tamamlandı). Tıklanabilir, sonraki duruma geçirir.
- Son güncelleme (mono 11px muted): "2 gün önce" veya "—"
- Sorumlu: Avatar (size 20) veya "—"
- Aksiyon: Icons.MoreH

MoreH tıklandığında satırın altında inline detay expand açılır (mevcut mimariyle uyumlu, Sheet yerine):
- Artefakt adı (Input)
- Durum seçici: SegmentedControl (Oluşturulmadı / Taslak / Tamamlandı)
- Sorumlu kişi seçimi (avatar + isim dropdown)
- İlişkili faz (workflow node seçimi)
- Not alanı (Textarea rows 2)
- Dosya bölümü: "Dosya ekle" butonu + mevcut dosya listesi
- Kaydet butonu

### Madde 10. Kullanıcı Profil Sayfası

**Konum:** Yeni route: `user-profile`. Sidebar'da yer almaz.

**Erişim noktaları:** MembersTab üye isimleri, BoardTab KanbanCard avatar'ları, ActivityTab kullanıcı avatar'ları, AdminUsers kullanıcı satırları. Ayrıca Header'daki avatar dropdown'ına "Profilim" seçeneği eklenir.

**Header avatar dropdown (yeni):** Mevcut logout butonu yerine tıklandığında küçük bir menü açılır:
```
- Profilim (router.go("user-profile", { userId: currentUser.id }))
- Ayarlar (router.go("settings"))
- Çıkış Yap (router.go("login"))
```

**Profil sayfası tasarımı:**

Üstte profil header (flex, gap 16):
- Avatar (size 64, ring)
- Kullanıcı adı (fontSize 22, fontWeight 600)
- Rol badge'i (Badge tone: Admin→danger, PM→info, Member→neutral)
- Email (fontSize 13, muted)
- Kendi profilinde: "Profili Düzenle" kısayol butonu (Icons.Settings, ghost) → Settings sayfasına yönlendirir

Üç StatCard (grid cols-3, mevcut dashboard StatCard yapısıyla):
- "Atanan Görevler" — aktif görev sayısı, Icons.CheckSquare, primary
- "Tamamlanan" — son 30 gün, Icons.CircleCheck, success
- "Projeler" — üyelik sayısı, Icons.Folder, info

Tabs: "Görevler", "Projeler", "Aktivite"

Görevler: MTTaskRow (showProject=true), projeye göre gruplandırılmış (MTGroupHeader). Durum filtresi: SegmentedControl (Tümü / Aktif / Tamamlanan).

Projeler: ProjectCard grid'i (projects.jsx yapısı). Her kartta proje adı, key, metodoloji badge, görev sayısı.

Aktivite: ActivityTimeline variant="full" ama kullanıcı filtresi gizli (sadece bu kullanıcının olayları).

**Router:** app.jsx PageRouter'a `case "user-profile": return <UserProfilePage/>` eklenir.

### Madde 12. Backlog Yönetimi

**Uzman bulgusu:** Backlog sadece Board Tab'dan değil, tüm görünüm sekmelerinden erişilebilir olmalı. Dar ekranlarda overlay modunda açılmalı.

**Konum:** Proje detay sayfasının sol kenarına (tüm sekmelerden erişilebilir) global toggle paneli olarak eklenir. Board Tab'a özgü değil, proje seviyesinde.

**Tasarım:**

Proje detay sayfasının content area'sının sol kenarında dar bir dikey buton:
```jsx
<button onClick={() => setBacklogOpen(!backlogOpen)}
  style={{ writingMode: "vertical-rl", padding: "12px 4px", fontSize: 11, fontWeight: 600,
    color: "var(--fg-muted)", background: "var(--surface-2)",
    borderRight: "1px solid var(--border)", borderRadius: "var(--radius) 0 0 var(--radius)" }}>
  Backlog <Badge size="xs" style={{ writingMode: "horizontal-tb" }}>{backlogCount}</Badge>
</button>
```

Tıklandığında sol taraftan panel açılır. **Responsive davranış:**
- 900px+ content area: panel 300px genişlikte açılır, içerik sağa kayar
- 900px altı: panel 300px overlay olarak açılır, arka plan `oklch(0 0 0 / 0.2)` karartılır, içerik kaymaaz

Panel başlığı: "Backlog" (bold 13px) + görev sayısı badge + kapatma butonu.
Altında: Input (arama) + SegmentedControl (Öncelik: Tümü / Kritik / Yüksek / Orta / Düşük) + sıralama Select (Akıllı / Tarih / Öncelik).

Görev listesi (ilk 30 görev gösterilir, "Daha fazla yükle" ile sayfalama):
```
style: padding "8px 10px", display flex, alignItems center, gap 8, borderBottom "1px solid var(--border)", cursor "grab", fontSize 12
```
- StatusDot (14px)
- Görev key (mono 10px muted)
- Görev başlığı (flex 1, overflow ellipsis)
- PriorityChip (withLabel false)
- "Taşı" butonu (Icons.ArrowRight size 12): Tıklandığında kolon listesi popover. Seçimde görev o kolona taşınır.

Board Tab'dayken görevler drag-drop ile de taşınabilir. DnD altyapısı genişletilir: `dragged` state'i `{ task, source: "board" | "backlog" }` formatında olur.

Panel altında "Toplu İşlem" toggle. Aktifken checkbox'lar + yapışkan aksiyon çubuğu: "Seçili: N" + "Faza Taşı" + "Sil".

### Madde 13. Cumulative Flow Diagram

**Konum:** ReportsPage'e eklenir. Kanban projeleri seçildiğinde burndown chart yerine gösterilir.

**Tasarım:**

"Kümülatif Akış Diyagramı" Section. Üstte tarih aralığı: SegmentedControl ("7 gün", "30 gün", "90 gün").

SVG stacked area chart (viewBox "0 0 600 200"). Her kolon bir alan, alta doğru yığılmış:
```
fill="color-mix(in oklch, var(--status-done) 40%, transparent)"
fill="color-mix(in oklch, var(--status-review) 40%, transparent)"
fill="color-mix(in oklch, var(--status-progress) 40%, transparent)"
fill="color-mix(in oklch, var(--status-todo) 40%, transparent)"
```

Sağ üstte legend (renkli kareler + etiketler). Chart altında iki mini metrik: "Ort. WIP" + "Ort. Tamamlanma" (18px bold + 11px muted etiket).

**Kanban Lifecycle Tab entegrasyonu:** CFD'nin mini versiyonu (son 30 gün, sadeleştirilmiş) Lifecycle Tab > Genel Bakış alt-sekmesinde de gösterilir (Kanban projelerinde Canvas yerine).

### Madde 14. Lead Time / Cycle Time Takibi

**Konum:** ReportsPage'de mevcut grafiklerin altına eklenir.

**Tasarım:**

"Akış Süreleri" Section. Grid cols-2:

Sol: "Lead Time" başlığı + büyük ortalama ("Ort: 4.2 gün", 20px bold mono). SVG histogram. Çubuklar primary renkle. Bucket'lar: "0-1d", "1-3d", "3-5d", "5-10d", "10d+".

Sağ: "Cycle Time" başlığı + büyük ortalama. Aynı histogram, info renkle.

**Percentile bilgisi (uzman önerisi):** Her histogram'ın altında küçük metin: "P50: 3.2 gün · P85: 7.1 gün · P95: 12 gün" (mono 11px, muted). Kanban topluluklarında percentile ortalamadan daha değerlidir.

Responsive: 800px altında grid tek sütuna düşer.

### Madde 16. İterasyon Karşılaştırma

**Konum:** ReportsPage'de Scrum/Iterative projelerde velocity chart yanına eklenir.

**Tasarım:**

"İterasyon Karşılaştırması" Section. SVG grouped bar chart. Her iterasyon için üç çubuk: "Planlanan" (info, yarı saydam), "Tamamlanan" (success), "Taşınan" (warning).

Legend: üç renkli kare + etiket.

Altında özet tablo. Her satır: iterasyon adı, süre, planlanan, tamamlanan, başarı % (ProgressBar + mono yüzde), taşınan. Satırlar Collapsible (P3): tıklandığında o iterasyonun görev listesi açılır.

### Madde 17. Değerlendirme Raporu

**Uzman bulgusu:** Erişim akışı sorunlu (Lifecycle > 2000px scroll > Geçmiş > Rapor). Alt-sekme yapısıyla çözüldü: artık Lifecycle > Geçmiş alt-sekmesi > Rapor butonu (2 seviye).

**Konum:** Faz geçmişi kartlarındaki "Rapor" butonu ile tetiklenir. Ayrıca Reports sayfasından da "Faz Raporları" bölümü ile erişilebilir.

**Tasarım:**

"Rapor" butonuna tıklandığında kartın altında inline genişleyen detay alanı açılır (Sheet yerine, mevcut mimariyle uyumlu):

Başlık: "Faz Değerlendirme Raporu — {fazAdı}" (fontSize 16, fontWeight 600)

Bölüm 1 "Özet" (read-only): faz adı, süre (gün), toplam/tamamlanan/taşınan metrikleri. Grid cols-4, MiniStatCard yapısıyla (Madde 5 ile aynı).

Bölüm 2 "Tamamlanan İşler": fazın done görevleri listesi. Her satırda görev key + başlık + sağda küçük not Input.

Bölüm 3 "Karşılaşılan Sorunlar": Textarea (rows 3)

Bölüm 4 "Öğrenilen Dersler": Textarea (rows 2)

Bölüm 5 "Sonraki Faz Önerileri": Textarea (rows 2)

Alt butonlar: "PDF İndir" (Icons.Download, secondary) + "Kaydet" (primary)

**Reports sayfası entegrasyonu:** Reports sayfasına "Faz Raporları" Section eklenir. Proje ve faz seçimi ile daha önce kaydedilmiş raporlara erişim sağlanır. Bu alternatif keşfedilebilirlik yolu sağlar.

---

## Yeni Route/Sekme Özeti

Yeni route:
- `user-profile` — Kullanıcı profil sayfası

Mevcut Proje Detay ana sekmeleri (8 sekme, eskiden 7):
- Board, List, Timeline, Calendar, **Activity (yeni)**, Lifecycle, Members, Settings

Lifecycle Tab alt-sekmeleri (yeni):
- Genel Bakış (faz detayı + dashboard + phase gate inline expand)
- Kilometre Taşları
- Geçmiş (faz arşivi + değerlendirme raporları)
- Artefaktlar (eski bağımsız ana sekme buraya taşındı)

Mevcut Board Tab'a eklenen:
- WIP uyarı detayları (arka plan + AlertBanner + drag engelleme)

Proje seviyesine eklenen:
- Backlog global yan paneli (tüm görünüm sekmelerinden erişilebilir)

Mevcut Settings Tab'a eklenen:
- Lifecycle alt sekmesinde faz tamamlanma kriterleri formu
- General alt sekmesinde proje durum yönetimi

Mevcut Reports sayfasına eklenen:
- CFD (Kanban)
- Lead/Cycle Time histogramları + percentile
- İterasyon karşılaştırma (Scrum/Iterative)
- Faz Raporları bölümü

Mevcut Projects sayfasına eklenen:
- Durum filtre SegmentedControl

Header'a eklenen:
- Avatar dropdown menüsü (Profilim, Ayarlar, Çıkış)

---

## Ortak Bileşenler

`PhaseMetrics` — Faz görev istatistiklerini hesaplayıp gösteren veri bileşeni. Props: tasks, columns, phaseId. Lifecycle genel bakış detay kartı, faz özeti satırları ve faz geçmişi kartları tarafından kullanılır.

`PhaseCard` — Tek fazın kartını render eden düzen bileşeni. Props: phase, metrics, variant ("detail" | "history" | "inline"). variant'a göre farklı layout:
- "detail": büyük metrik kartı (Lifecycle Genel Bakış)
- "history": orta kartlar (Geçmiş alt-sekmesi)
- "inline": satır formatı (Faz Özeti listesi)

`ActivityTimeline` — Olay listesi bileşeni. Props: events, variant ("full" | "compact"), showUserFilter, maxItems. Full variant: filtreler + timeline çizgisi + tarih grupları + sayfalama. Compact variant: düz liste (dashboard için).

`CompletionChecklist` — Phase Gate kriterleri + Settings kriter tanımlama tarafından kullanılır. Props: criteria, mode ("check" | "edit"). Check modunda: read-only otomatik + tıklanabilir manuel. Edit modunda: toggle switch + dinamik liste.

`MiniStatCard` — Küçük metrik kutusu. Props: value, label, color. 18px bold değer, 10.5px muted etiket, surface-2 arka plan. Faz detay kartı, faz geçmişi kartları, değerlendirme raporu özeti tarafından kullanılır.

---

## Metodoloji Davranış Matrisi

Bu bölüm, her bileşenin metodolojiye göre nasıl davrandığını özetler.

**Lifecycle Tab:**
- Waterfall: Tüm alt-sekmeler aktif. Canvas sequential-locked. Phase Gate zorunlu. Özet strip'te faz geçiş butonu.
- Scrum: Tüm alt-sekmeler aktif. Canvas flexible. Phase Gate önerilen ama atlanabilir.
- Iterative: Tüm alt-sekmeler aktif. Canvas flexible. Phase Gate önerilen.
- Kanban: Tab başlığı "Akış Metrikleri". Genel Bakış'ta Canvas yerine CFD + Lead/Cycle Time. Geçmiş alt-sekmesi gizli. Artefaktlar alt-sekmesi gizli. Phase Gate yok.

**Phase Gate:**
- Waterfall: Tüm otomatik kriterler zorunlu. Karşılanmadan geçiş yapılamaz.
- Scrum/Iterative: Kriterler önerilen. Uyarı gösterilir ama geçiş yapılabilir.
- Kanban: Phase Gate yok, bileşen gizli.

**Artefaktlar:**
- Waterfall: SRS, SDD, STD, Release Notes
- Scrum: Product Backlog, Sprint Backlog, Increment
- Iterative: İterasyon Planı, Değerlendirme Raporu
- Kanban: alt-sekme gizli

**Reports ek grafikler:**
- Kanban: CFD + Lead/Cycle Time
- Scrum: İterasyon Karşılaştırma + Velocity
- Iterative: İterasyon Karşılaştırma
- Waterfall: Faz ilerleme çubukları seti

**Backlog paneli:**
- Tüm metodolojilerde aynı davranış.

**Terim lokalizasyonu (i18n):**
- Scrum: "Sprint" terimi kullanılır
- Waterfall: "Faz" / "Phase" kullanılır
- Iterative: "İterasyon" / "Iteration" kullanılır
- Kanban: "Dönem" kullanılmaz, faz kavramı gösterilmez

---

## Lego Mimari: Çoklu Yaşam Döngüsü Desteği

Bu bölüm, sistemin Waterfall, Scrum, Kanban ve Iterative dışında V-Model, Spiral, Artırımlı, Evrimsel, RAD ve herhangi bir özel yaşam döngüsünü desteklemesi için gereken yapısal değişiklikleri tanımlar.

Felsefe: Sistem kullanıcıya **Lego parçaları** (building blocks) sunar. Kullanıcı bu parçaları birleştirerek kendi yaşam döngüsü modelini kurar. Sabit metodoloji kalıpları sadece başlangıç şablonu olarak sunulur, zorunlu değildir.

### Dört Bağımsız Boyut

Sistemdeki her görev dört bağımsız boyutta bir konuma sahiptir. Bu boyutlar birbirini kesmez, her biri farklı bir soruya cevap verir:

**Boyut 1 — Faz (Phase):** Görev lifecycle'da NEREDE? Lifecycle Canvas'taki node'lardan biri. Gereksinimler, Tasarım, Kodlama, Test gibi. Projenin süreç yapısını temsil eder.

**Boyut 2 — Durum (Status):** Görev ilerlemede NASIL? Board kolonları: To Do, In Progress, Review, Done. Görevin anlık iş durumunu temsil eder.

**Boyut 3 — Döngü (Cycle):** Görev zamanda NE ZAMAN? Sprint, Döngü, İterasyon, Artım, Dönem. Projenin zaman boyutunu temsil eder.

**Boyut 4 — Hiyerarşi:** Görev yapısal olarak NEREYE BAĞLI? Ana görev → Alt görevler. İş kırılım yapısını temsil eder.

### L1. Cycle Genelleştirmesi

Mevcut Sprint kavramı tüm metodolojilerde "Cycle" olarak genelleştirilir. Aynı yapı (isim, başlangıç/bitiş tarihi, aktif durumu, hedef), farklı etiket.

Metodolojiye göre Cycle etiketi (i18n):

```
scrum       → "Sprint"       / "Sprint"
waterfall   → "Faz Dönemi"   / "Phase Period"
v-model     → "Faz Dönemi"   / "Phase Period"
spiral      → "Döngü"        / "Cycle"
iterative   → "İterasyon"    / "Iteration"
incremental → "Artım"        / "Increment"
evolutionary→ "Prototip"     / "Prototype"
kanban      → "Dönem"        / "Period"
rad         → "Döngü"        / "Cycle"
```

Proje oluşturma ve sprint yönetimi sayfalarında "Sprint" kelimesi yerine metodolojiye bağlı dinamik etiket kullanılır.

Lifecycle Canvas'ta node üzerinde döngü sayacı gösterilir: bir node'un faz geçmişinde kaç kez kapatılma kaydı varsa, node'un sağ üstünde `×N` badge'i görünür. Örneğin Spiral'da "Risk Analizi" node'u üzerinde `×3` badge'i = bu fazdan 3 kez geçilmiş.

### L2. Görev-Faz Ataması ve Behavioral Toggle

Görevlere lifecycle faz ataması yapılabilmesi için yeni bir behavioral flag eklenir:

**`enable_phase_assignment`** — Settings > Lifecycle'da açılıp kapatılabilen toggle. PM veya Admin kontrol eder. Varsayılan olarak Waterfall, V-Model, Spiral, Incremental'da açık; Scrum, Kanban, Iterative'de kapalı (PM isterse açabilir).

**Backend:** Detaylar UI-Tasarim-Backend.md §3'te.

**Flag açıkken (enable_phase_assignment = true):**

Görev oluşturma/düzenleme formuna "Faz" alanı eklenir. Bu alan, projenin lifecycle Canvas'ındaki node listesinden seçim yapan bir dropdown. Node grubu (swimlane) varsa, grup başlıklarıyla gruplandırılmış dropdown gösterilir.

Board Tab'da görev kartının üstünde küçük faz badge'i gösterilir (Badge size xs, node rengiyle):
```jsx
{task.phaseId && <Badge size="xs" tone="neutral" dot style={{ fontSize: 10 }}>{phaseName}</Badge>}
```

Board Tab toolbar'ına "Faza Göre Filtrele" dropdown eklenir. Kullanıcı belirli bir faza ait görevleri filtreleyebilir.

List Tab'da "Faz" sütunu eklenir (Badge olarak gösterilir).

**Flag kapalıyken (enable_phase_assignment = false):**

Faz alanı görev formlarında gizlenir. Board'da faz badge'i yok. List'te faz sütunu yok. Sistem mevcut gibi çalışır.

**Alt görevler:** enable_phase_assignment açıkken alt görevler de kendi fazlarını alabilir. Ana görev "Mobil Login Modülü" (faz ataması yok veya genel), alt görevleri farklı fazlara atanabilir: "Login Akış Analizi" → Analiz, "Login UI Tasarımı" → Tasarım.

**Ana görev faz özeti:** Ana görevin alt görevleri farklı fazlardaysa, görev detay sayfasının sidebar'ında mini faz stepper gösterilir:
```
Analiz ✓ → Tasarım ● → Kodlama ○ → Test ○
```
Her adım, o fazdaki alt görevlerin tamamlanma durumuna göre: ✓ (tümü done), ● (aktif, bazıları in progress), ○ (henüz başlanmamış).

### L3. Edge Tipleri

WorkflowEditor'deki edge seçim paneline `type` alanı eklenir. Üç tip:

**flow (varsayılan):** Düz/kavisli çizgi + ok ucu. Normal faz geçişini temsil eder. Renk: var(--fg-subtle). Mevcut tüm edge'ler bu tiptedir.

**verification:** Kesikli çizgi + ok ucu. "Bu faz şunu doğrular" ilişkisini temsil eder. V-Model'de sol kol fazları ile sağ kol test fazları arasındaki yatay bağlantılar bu tiptedir. Renk: var(--status-progress). SVG'de `strokeDasharray="6 3"` eklenir.

**feedback:** Kavisli çizgi + ters yönde ok. Geri bildirim döngüsünü temsil eder. Scrum'daki Retro→Yürütme, Spiral'daki Planlama→Hedef, Evrimsel'deki İyileştir→Prototip bu tiptedir. Renk: var(--status-review). SVG'de çizgi rengi farklılaşır.

Sağ paneldeki edge seçim bölümüne SegmentedControl eklenir:
```jsx
<SegmentedControl value={selectedEdge.type || "flow"} onChange={...} options={[
  { id: "flow", label: T("Akış","Flow") },
  { id: "verification", label: T("Doğrulama","Verify") },
  { id: "feedback", label: T("Geri Bildirim","Feedback") },
]}/>
```

Canvas'ta edge render'ı tipe göre farklılaşır:
```jsx
const strokeStyle = e.type === "verification" ? "6 3" : e.type === "feedback" ? "8 4 2 4" : "none";
const strokeColor = e.type === "verification" ? "var(--status-progress)" : e.type === "feedback" ? "var(--status-review)" : "var(--fg-subtle)";
```

### L4. Node Gruplaması (Swimlane)

WorkflowEditor Canvas'ına grup çerçevesi (group frame) bileşeni eklenir. Toolbar'daki "Düğüm / Bağlantı" butonlarının yanına "Grup" butonu eklenir.

Grup çerçevesi: Canvas üzerinde serbest boyutlandırılabilir dikdörtgen. Position absolute, z-index node'ların altında. Arka planı hafif renkli (`color-mix(in oklch, var(--group-color) 6%, transparent)`), kesikli border, sol üstte başlık etiketi.

```jsx
<div style={{
  position: "absolute", left: group.x, top: group.y,
  width: group.width, height: group.height,
  background: `color-mix(in oklch, var(--${group.color}) 6%, transparent)`,
  border: `1.5px dashed color-mix(in oklch, var(--${group.color}) 30%, transparent)`,
  borderRadius: 12, zIndex: 0,
}}>
  <div style={{ padding: "6px 10px", fontSize: 11, fontWeight: 600, color: `var(--${group.color})`, letterSpacing: 0.3 }}>
    {group.name}
  </div>
</div>
```

Sağ panelde grup seçildiğinde: isim (Input), renk (dropdown, 6 preset renk), açıklama (Textarea). Silme butonu.

Grup mantıksal — akış kurallarını etkilemez. Node'lar grubun içine veya dışına serbest taşınabilir. Grup sadece görsel organizasyon sağlar.

**Backend:** Veri yapısı detayları UI-Tasarim-Backend.md §5'te.

### L5. Graph Traversal ile Aktif Faz Hesaplama

Mevcut sorun: WorkflowCanvas satır 49-50'de aktif faz ve geçmiş fazlar düz index karşılaştırmasıyla hesaplanıyor. Bu yalnızca yatay sıralı Waterfall grafiklerinde doğru çalışır.

Çözüm: Her node, edge bağlantıları üzerinden "active", "past", "future" veya "unreachable" durumlarından birine atanır. Verification edge'leri bu hesaplamaya dahil edilmez (sadece flow ve feedback edge'leri).

**Backend:** Algoritma detayları UI-Tasarim-Backend.md §4'te.

Canvas render'ında mevcut `isPastLocked` yerine `node.state` kullanılır:
- "active" → primary ring, tam opacity
- "past" → düşük opacity (0.55), lock ikonu (sequential-locked modda)
- "future" → tam opacity, ring yok
- "unreachable" → çok düşük opacity (0.3), kesikli border

Bu fonksiyon V-Model, Spiral ve herhangi bir dallanmalı/döngüsel grafik topolojisinde doğru çalışır.

**Paralel aktif fazlar:** enable_phase_assignment açıkken aktif fazlar görevlerden türetilir. Bir node'da (fazda) tamamlanmamış görev varsa o node "aktif" kabul edilir. Birden fazla node aynı anda aktif olabilir (Artırımlı modelde Increment 1 Test'teyken Increment 2 Tasarım'da olabilir). Canvas'ta birden fazla node'da primary ring gösterilir.

### L6. Dördüncü Akış Modu: sequential-flexible

Mevcut 3 mod:
- `flexible` → her yere gidilebilir (çok serbest)
- `sequential-locked` → sadece ileri, geri dönüş yok (çok katı)
- `continuous` → tek aktif faz (Kanban)

Yeni mod:
- `sequential-flexible` → tanımlı sırada ileri git, AMA edge olarak tanımlanmış geri dönüşlere de izin ver

Bu mod V-Model ve Modified Waterfall için kritik. V-Model'de ana akış sol koldan sağ kola sequential ama verification edge'leri üzerinden referans var. Modified Waterfall'da normalde ileri git ama belirli fazlara geri dönüş edge'i tanımlanabilir.

WorkflowEditor sağ paneldeki "Akış Kuralları" bölümüne 4. seçenek eklenir:
```jsx
{ id: "sequential-flexible", icon: <Icons.Lock size={13}/>,
  label: T("Sıralı · Esnek Geri Dönüş", "Sequential · Flex Return"),
  desc: T("Ana akış sıralı, ama tanımlı geri dönüş edge'lerine izin verir. V-Model ve Modified Waterfall için.",
           "Main flow sequential, but defined return edges allowed. For V-Model and Modified Waterfall.") }
```

Canvas'ta bu mod aktifken: flow edge'leri tek yön (sequential), feedback edge'leri ise izin verilen geri dönüşler olarak çizilir. Tanımlanmamış geri dönüşler engellenir.

### L7. Yeni Preset Template'ler

AdminWorkflows'ta ve proje oluşturma sihirbazında mevcut şablonlara ek olarak:

**V-Model:**
```jsx
{
  mode: "sequential-flexible",
  groups: [
    { id: "g1", name: "Geliştirme", x: 30, y: 50, width: 540, height: 280, color: "status-progress" },
    { id: "g2", name: "Doğrulama", x: 630, y: 50, width: 540, height: 280, color: "status-review" },
  ],
  nodes: [
    { id: "n1", name: "Gereksinimler",     x: 60,  y: 80,  color: "status-todo" },
    { id: "n2", name: "Mimari Tasarım",     x: 220, y: 160, color: "status-todo" },
    { id: "n3", name: "Detay Tasarım",      x: 380, y: 240, color: "status-todo" },
    { id: "n4", name: "Kodlama",            x: 540, y: 320, color: "status-progress" },
    { id: "n5", name: "Birim Test",         x: 700, y: 240, color: "status-review" },
    { id: "n6", name: "Entegrasyon Test",   x: 860, y: 160, color: "status-review" },
    { id: "n7", name: "Sistem Test",        x: 1020, y: 80, color: "status-review" },
    { id: "n8", name: "Kabul Test",         x: 1020, y: 80, color: "status-done" },
  ],
  edges: [
    // Sol kol akış (flow)
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    // Sağ kol akış (flow)
    { id: "e4", source: "n4", target: "n5", type: "flow" },
    { id: "e5", source: "n5", target: "n6", type: "flow" },
    { id: "e6", source: "n6", target: "n7", type: "flow" },
    { id: "e7", source: "n7", target: "n8", type: "flow" },
    // Doğrulama bağlantıları (verification)
    { id: "v1", source: "n1", target: "n8", type: "verification", label: "Doğrular" },
    { id: "v2", source: "n2", target: "n7", type: "verification", label: "Doğrular" },
    { id: "v3", source: "n3", target: "n6", type: "verification", label: "Doğrular" },
  ],
}
```

**Spiral:**
```jsx
{
  mode: "flexible",
  nodes: [
    { id: "n1", name: "Hedef Belirleme",   x: 300, y: 60,  color: "status-todo" },
    { id: "n2", name: "Risk Analizi",       x: 560, y: 180, color: "priority-high" },
    { id: "n3", name: "Geliştirme & Test",  x: 300, y: 300, color: "status-progress" },
    { id: "n4", name: "Planlama & Değerl.", x: 60,  y: 180, color: "status-review" },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n4", type: "flow" },
    { id: "e4", source: "n4", target: "n1", type: "feedback", label: "Sonraki döngü" },
  ],
}
```

**Artırımlı (Incremental):**
```jsx
{
  mode: "flexible",
  groups: [
    { id: "g1", name: "Artım 1", x: 30,  y: 50, width: 340, height: 200, color: "status-progress" },
    { id: "g2", name: "Artım 2", x: 400, y: 50, width: 340, height: 200, color: "status-progress" },
    { id: "g3", name: "Artım 3", x: 770, y: 50, width: 340, height: 200, color: "status-progress" },
  ],
  nodes: [
    // Artım 1
    { id: "a1", name: "Analiz",     x: 50,  y: 80,  color: "status-todo" },
    { id: "a2", name: "Tasarım",    x: 50,  y: 170, color: "status-todo" },
    { id: "a3", name: "Kodlama",    x: 200, y: 80,  color: "status-progress" },
    { id: "a4", name: "Test",       x: 200, y: 170, color: "status-review" },
    // Artım 2
    { id: "b1", name: "Analiz",     x: 420, y: 80,  color: "status-todo" },
    { id: "b2", name: "Tasarım",    x: 420, y: 170, color: "status-todo" },
    { id: "b3", name: "Kodlama",    x: 570, y: 80,  color: "status-progress" },
    { id: "b4", name: "Test",       x: 570, y: 170, color: "status-review" },
    // Artım 3
    { id: "c1", name: "Analiz",     x: 790, y: 80,  color: "status-todo" },
    { id: "c2", name: "Tasarım",    x: 790, y: 170, color: "status-todo" },
    { id: "c3", name: "Kodlama",    x: 940, y: 80,  color: "status-progress" },
    { id: "c4", name: "Test",       x: 940, y: 170, color: "status-review" },
  ],
  edges: [
    // Artım 1 iç akış
    { id: "e1", source: "a1", target: "a2", type: "flow" },
    { id: "e2", source: "a2", target: "a3", type: "flow" },
    { id: "e3", source: "a3", target: "a4", type: "flow" },
    // Artım 2 iç akış
    { id: "e4", source: "b1", target: "b2", type: "flow" },
    { id: "e5", source: "b2", target: "b3", type: "flow" },
    { id: "e6", source: "b3", target: "b4", type: "flow" },
    // Artım 3 iç akış
    { id: "e7", source: "c1", target: "c2", type: "flow" },
    { id: "e8", source: "c2", target: "c3", type: "flow" },
    { id: "e9", source: "c3", target: "c4", type: "flow" },
    // Artımlar arası geçiş
    { id: "e10", source: "a4", target: "b1", type: "flow", label: "Artım 2'ye" },
    { id: "e11", source: "b4", target: "c1", type: "flow", label: "Artım 3'e" },
  ],
}
```

**Evrimsel (Evolutionary Prototyping):**
```jsx
{
  mode: "flexible",
  nodes: [
    { id: "n1", name: "Prototip Oluştur",  x: 60,  y: 160, color: "status-progress" },
    { id: "n2", name: "Değerlendir",        x: 320, y: 160, color: "status-review" },
    { id: "n3", name: "İyileştir",          x: 580, y: 160, color: "status-todo" },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n1", type: "feedback", label: "Sonraki versiyon" },
  ],
}
```

**RAD (Rapid Application Development):**
```jsx
{
  mode: "flexible",
  nodes: [
    { id: "n1", name: "Gereksinim Plan.",  x: 60,  y: 160, color: "status-todo" },
    { id: "n2", name: "Kullanıcı Tasarım", x: 300, y: 160, color: "status-progress" },
    { id: "n3", name: "Yapım",             x: 540, y: 160, color: "status-progress" },
    { id: "n4", name: "Geçiş",             x: 780, y: 160, color: "status-done" },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "flow" },
    { id: "e2", source: "n2", target: "n3", type: "flow" },
    { id: "e3", source: "n3", target: "n2", type: "feedback", label: "Revizyon" },
    { id: "e4", source: "n3", target: "n4", type: "flow" },
  ],
}
```

### L8. Settings Entegrasyonu

Settings Tab > Lifecycle alt sekmesindeki mevcut behavioral flag toggle'larının (Sıralı bağımlılık, WIP limitleri, Sprint kısıtlaması) altına yeni toggle eklenir:

**"Görev-Faz Ataması"** toggle'ı (mevcut toggle'larla aynı görsel yapı):
- Açıklama: "Görevlere ve alt görevlere faz ataması yapılabilir. Artırımlı, V-Model ve faz bazlı takip gerektiren projelerde açın." (fontSize 11.5, muted)
- Toggle değiştirildiğinde onay dialog'u: "Faz atamasını açmak mevcut görevleri etkilemez. Yeni ve düzenlenen görevlerde faz alanı gösterilecektir."

### Lego Parçaları Özet Tablosu

Aşağıda her yaşam döngüsü modelinin hangi Lego parçalarını kullandığı gösterilir.

**Waterfall:** sequential-locked mod + flow edge'leri + Cycle (opsiyonel)

**V-Model:** sequential-flexible mod + flow + verification edge'leri + swimlane grupları + enable_phase_assignment

**Scrum:** flexible mod + flow + feedback edge'leri + Cycle (Sprint) + Board WIP

**Kanban:** continuous mod + flow edge'leri + Board WIP + CFD + Lead/Cycle Time

**Spiral:** flexible mod + flow + feedback edge'leri + Cycle (Döngü) + döngü sayacı (×N badge)

**Artırımlı:** flexible mod + flow edge'leri + swimlane grupları + enable_phase_assignment + paralel aktif fazlar + Cycle (Artım)

**Evrimsel:** flexible mod + flow + feedback edge'leri + Cycle (Prototip) + döngü sayacı

**Iterative:** flexible mod + flow + feedback edge'leri + Cycle (İterasyon)

**RAD:** flexible mod + flow + feedback edge'leri + Cycle (Döngü)

**Özel (Custom):** kullanıcı tüm parçaları serbestçe birleştirir. WorkflowEditor'de herhangi bir graf topolojisi, herhangi bir mod, herhangi bir edge tipi, isteğe bağlı swimlane grupları.

### İki Katmanlı Lego: Lifecycle + Task Statuses

WorkflowEditor'deki mevcut iki mod (Lifecycle / Task Statuses) iç içe fazlar sorununu doğal olarak çözer:

**Lifecycle katmanı (üst):** Projenin büyük resmi. Fazlar, geçişler, gruplar. "Bu projede hangi aşamalardan geçilecek?"

**Task Statuses katmanı (alt):** Her fazın içindeki görev akışı. "Bir görev bu fazda oluşturulunca hangi durumlardan geçecek?"

Örnek — Artırımlı model:
- Lifecycle: Artım 1 (Analiz → Tasarım → Kodlama → Test) → Artım 2 → Artım 3
- Task Statuses: To Do → In Progress → Review → Done

Bir görev "Artım 2 > Tasarım" fazında oluşturulduğunda, o görev Task Statuses akışından (To Do → In Progress → Review → Done) geçer. Faz büyük resmi belirler, status anlık durumu belirler. İki katman birbirini kesmez.

Alt görevler de aynı mantıkla çalışır: alt görev kendi fazına ve kendi statusuna sahiptir. Ana görev alt görevlerinin faz dağılımını mini stepper ile özetler.
