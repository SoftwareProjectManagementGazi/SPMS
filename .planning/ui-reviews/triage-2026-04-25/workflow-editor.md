# Workflow Editor (İş Akışı Editörü) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-workflow-editor
**Prototip kaynak:**
- `New_Frontend/src/pages/workflow-editor.jsx` (314 satır, tek dosya)

**Implementasyon kaynak:**
- `Frontend2/app/(shell)/workflow-editor/page.tsx`
- `Frontend2/components/workflow-editor/editor-page.tsx` (1387 satır — ana orkestratör)
- `Frontend2/components/workflow-editor/workflow-canvas.tsx` (dynamic import wrapper)
- `Frontend2/components/workflow-editor/workflow-canvas-inner.tsx` (React Flow + helpers)
- `Frontend2/components/workflow-editor/right-panel.tsx`
- `Frontend2/components/workflow-editor/flow-rules.tsx`
- `Frontend2/components/workflow-editor/selection-panel.tsx`
- `Frontend2/components/workflow-editor/validation-panel.tsx`
- `Frontend2/components/workflow-editor/shortcuts-panel.tsx`
- `Frontend2/components/workflow-editor/mode-banner.tsx`
- `Frontend2/components/workflow-editor/minimap-wrapper.tsx`
- `Frontend2/components/workflow-editor/bottom-toolbar.tsx`
- `Frontend2/components/workflow-editor/phase-node.tsx`
- `Frontend2/components/workflow-editor/phase-edge.tsx`
- `Frontend2/components/workflow-editor/group-cloud-node.tsx`
- `Frontend2/components/workflow-editor/preset-menu.tsx`
- `Frontend2/components/workflow-editor/context-menu.tsx`
- `Frontend2/components/workflow-editor/dirty-save-dialog.tsx`
- `Frontend2/components/workflow-editor/canvas-skeleton.tsx`
- `Frontend2/components/workflow-editor/all-gate-pill.tsx`
- `Frontend2/components/workflow-editor/cycle-counter-badge.tsx`
- `Frontend2/components/workflow-editor/color-swatch.tsx`
- `Frontend2/components/workflow-editor/tooltip.tsx`
- `Frontend2/components/lifecycle/viewport-fallback.tsx`
- `Frontend2/services/lifecycle-service.ts`

**Bilinen intentional extras:** Yok preset (Jira referans görseli `workflow design and preview_jira.jpeg` repo root'ta mevcut; bazı extras Jira'dan ilham alınmış görünüyor).

## TL;DR Özet
- Eksik elementler: 11
- Layout/şekil farkı: 9
- Bilinmeyen extras: 13
- Bilinen extras: 0
- Hatalı kod: 11
- **EN KRİTİK 3 MADDE:**
  1. **EditorMode (Lifecycle vs Status) toggle yok.** Prototipte üst toolbar'da "Yaşam Döngüsü / Görev Durumları" segmented switch var (`workflow-editor.jsx:135-141`); implementasyonda da SegmentedControl mevcut (`editor-page.tsx:1236-1241`) ama gerçekten ayrı bir `statusWf` state'i tutulmuyor — `mode` URL parametresi yazılıyor sadece, hiçbir görsel/davranışsal etkisi yok. Status flow modu seçildiğinde aynı `workflow` gösteriliyor, prototipteki gibi `DEFAULT_STATUS_FLOWS` yüklenmiyor.
  2. **Sol kanvasta "Sıralı kilitli" mod uyarı banner'ının kritik tasarımı kaybolmuş.** Prototipte `priority-critical` tonlu özel kutu + `Lock` ikonu + uzun açıklama metni (`workflow-editor.jsx:172-176`) var. Implementasyonda yerine 4 mod için ortak `Badge` rendered (`mode-banner.tsx:42-61`) — kritik uyarı niteliği kayboldu, sadece kısa "Sıralı kilitli" yazısı kaldı.
  3. **Lifecycle modundaki "active phase" görsel state'i kaybolmuş.** Prototipte `activePhase` prop'u ile aktif fazın 2px primary ring'i (`workflow-editor.jsx:73-74`) ve geçmiş fazların kilit ikonu + opacity 0.55 (`workflow-editor.jsx:89`) var. Implementasyon `computeNodeStates` ile state hesaplıyor (`editor-page.tsx:186-197`) ama `phaseTransitions: []` boş geçildiği için pratikte hiçbir node "active/past" gösterilmiyor — bütün BFS sadece structural state veriyor.

## 1. EKSİK ELEMENTLER

### 1.1 Editor Mode toggle (Lifecycle / Görev Durumları) — gerçek state ayrımı yok
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:104-117, 134-141`
- **Olması gereken implementasyon yeri:** `Frontend2/components/workflow-editor/editor-page.tsx:147, 199-209`
- **Görsel/davranış:** Prototip iki ayrı state objesi tutar (`wf` ve `statusWf`); `setEditorMode` çağrıldığında current pointer farklı state'e geçer ve canvas yeniden render olur. Implementasyon yalnızca `?mode=…` URL parametresini günceller; `workflow` state'i değişmez, `DEFAULT_STATUS_FLOWS` benzeri seed data hiç yüklenmez.
- **Prototip kod alıntısı:**
  ```jsx
  const [editorMode, setEditorMode] = useState("lifecycle");
  const [wf, setWf] = useState(() => JSON.parse(JSON.stringify(window.SPMSData.DEFAULT_LIFECYCLES[project.methodology])));
  const [statusWf, setStatusWf] = useState(() => JSON.parse(JSON.stringify(window.SPMSData.DEFAULT_STATUS_FLOWS[project.methodology])));
  const current = editorMode === "lifecycle" ? wf : statusWf;
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `useState` ile iki ayrı `WorkflowConfig` tut ya da `processConfig.workflow` + `processConfig.statusWorkflow` şeklinde iki alan oku/yaz, mode değişiminde aktifi swap et.

### 1.2 Üstteki "Şablon: <methodology>" pill ve mode segment ile aynı satırdaki Undo/Redo + Zoom kontrolleri
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:144-155`
- **Olması gereken implementasyon yeri:** `editor-page.tsx:1224-1293`
- **Görsel/davranış:** Prototip `Şablon: <methodology>` (chevron'lu küçük buton), `Undo`/`Redo` (size="xs" + chevron ikonları), `−` `100%` `+` zoom triplet'i, son `Maximize` (Fit) butonu yan yana sıralı. Implementasyonda Undo/Redo daha büyük ("sm" + Undo2/Redo2 ikonları), zoom triplet'inin `−` ve `+` butonları **yok** (sadece "100%" yazısı sabit), `Maximize` (Fit) butonu **yok**, "Şablon: scrum" şeklinde okunan readonly pill yerine `PresetMenu` ("Şablon Yükle" dropdown — mantıken benzer ama görsel olarak farklı).
- **Prototip kod alıntısı:**
  ```jsx
  <span style={{ fontSize: 11.5, color: "var(--fg-muted)", fontWeight: 500 }}>{lang === "tr" ? "Şablon" : "Template"}:</span>
  <Button size="xs" variant="ghost" iconRight={<Icons.ChevronDown size={11}/>}>{project.methodology}</Button>
  ...
  <Button size="xs" variant="ghost" icon={<Icons.ChevronLeft size={12}/>}>Undo</Button>
  <Button size="xs" variant="ghost" icon={<Icons.ChevronRight size={12}/>}>Redo</Button>
  ...
  <Button size="xs" variant="ghost">—</Button>
  <span className="mono" style={{ fontSize: 11, color: "var(--fg-muted)", minWidth: 40, textAlign: "center" }}>100%</span>
  <Button size="xs" variant="ghost">+</Button>
  <Button size="xs" variant="ghost" icon={<Icons.Maximize size={12}/>}/>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Üst toolbar'a `−` / `+` zoom butonları ile `Maximize` (Fit View) butonu eklenmeli; React Flow `useReactFlow().zoomIn/zoomOut/fitView` hook'larıyla bağlanmalı.

### 1.3 Sıralı-kilitli mode banner (sol-üst kritik uyarı)
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:171-176`
- **Olması gereken implementasyon yeri:** `Frontend2/components/workflow-editor/mode-banner.tsx`
- **Görsel/davranış:** Prototip yalnızca `mode === "sequential-locked"` ise gösteriyor; `priority-critical` tonlu özel chip (Lock ikonu + "Sıralı kilitli: Fazlar tek yönde, geri dönüş yok." metni). Implementasyon **her mode için** kısa Badge gösteriyor — kritik uyarı niteliği yok ve metin "Sıralı kilitli" tek kelimeye düşmüş.
- **Prototip kod alıntısı:**
  ```jsx
  {current.mode === "sequential-locked" && (
    <div style={{ position: "absolute", top: 12, left: 12, ..., background: "color-mix(in oklch, var(--priority-critical) 8%, var(--surface))", color: "var(--priority-critical)", boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--priority-critical) 25%, transparent)" }}>
      <Icons.Lock size={12}/>{lang === "tr" ? "Sıralı kilitli: Fazlar tek yönde, geri dönüş yok." : "Sequential locked: phases one-way, no reversal."}
    </div>
  )}
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `mode-banner.tsx`'i yalnızca `sequential-locked` modda render edecek, Lock ikonu + uzun açıklama metni + critical tone ile yeniden yaz.

### 1.4 Sağ panelde "Doğrulama Düğüm Atama" uyarı (warning) row'u
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:268`
- **Olması gereken implementasyon yeri:** `validation-panel.tsx`
- **Görsel/davranış:** Prototip statik 4 satır: 3 başarı (initial / final / reachability) + 1 warning ("2 düğümün atanmış görevi var"). Implementasyon farklı 5 kural çalıştırıyor (reachability gösterilmiyor; "Düğüm kimlikleri benzersiz" ve "Akış döngüsü yok" gibi farklı kurallar var) — **Reachability OK** ve **görev atanmış düğüm sayısı uyarısı** kayboldu.
- **Prototip kod alıntısı:**
  ```jsx
  <ValidationItem ok label={lang === "tr" ? "Ulaşılabilirlik kontrolü geçti" : "Reachability OK"}/>
  <ValidationItem warning label={lang === "tr" ? "2 düğümün atanmış görevi var" : "2 nodes have tasks"}/>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `validateWorkflow`'a reachability kuralı ekle; `task-counts-by-node` query ile warning row'u dinamik hesapla.

### 1.5 Edge selection panelinde source→target özet kutusu
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:243-247`
- **Olması gereken implementasyon yeri:** `selection-panel.tsx` `EdgeEditor` (satır 287-392)
- **Görsel/davranış:** Prototipte edge seçili olduğunda surface-2 kutu içinde `source.name` (kalın), satır altında `→ target.name` ikon ve muted renkte gösterilir. Implementasyonda yalnızca title olarak `"X → Y"` text rendered (`selection-panel.tsx:322-326`), bilgi kutusu yok.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ fontSize: 12.5, padding: 10, background: "var(--surface-2)", borderRadius: 6 }}>
    <div style={{ fontWeight: 600 }}>{s?.name}</div>
    <div style={{ color: "var(--fg-muted)", margin: "4px 0", display: "inline-flex", alignItems: "center", gap: 4 }}><Icons.ArrowRight size={12}/> {t?.name}</div>
  </div>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** `EdgeEditor` başına source/target adlı surface-2 wrapped özet kutusu ekle.

### 1.6 Node selection panelinde "Sil" (delete) butonu
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:234`
- **Olması gereken implementasyon yeri:** `selection-panel.tsx` `NodeEditor`
- **Görsel/davranış:** Prototipte node seçilince form sonunda kırmızı (`priority-critical`) tonlu Trash ikonlu "Sil" butonu vardır. Implementasyonda yalnızca `Toggle` switch'leri var, delete butonu **yok** — kullanıcı klavye ile veya context menü ile silmek zorunda.
- **Prototip kod alıntısı:**
  ```jsx
  <Button size="xs" variant="ghost" icon={<Icons.Trash size={12}/>} style={{ alignSelf: "flex-start", color: "var(--priority-critical)" }}>{lang === "tr" ? "Sil" : "Delete"}</Button>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `NodeEditor` sonuna critical tone Trash buton ekle, `commitWorkflow` ile node + bağlı edge'leri silsin.

### 1.7 Edge selection panelinde "Bağlantıyı sil" butonu
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:256`
- **Olması gereken implementasyon yeri:** `selection-panel.tsx` `EdgeEditor`
- **Görsel/davranış:** Prototipte edge selection panelinin sonunda Trash ikonlu "Bağlantıyı sil" butonu var. Implementasyonda yok.
- **Öncelik:** High
- **Düzeltme önerisi:** `EdgeEditor` sonuna delete button ekle.

### 1.8 Group selection panelinde "Renk" alanı eksik mi? (Hayır — mevcut). Ancak prototip status modunda Initial/Final checkbox'ları
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:228-233`
- **Olması gereken implementasyon yeri:** `selection-panel.tsx:254-269`
- **Görsel/davranış:** Prototipte yalnızca `editorMode === "status"` olduğunda Initial/Final checkbox'ları **yatay** sıralı (gap=6, label+checkbox). Implementasyonda **her mode'da** + `Toggle` primitive ile, `<TOGGLE_ROW>` (justify-content: space-between) ile dikey listede gösteriliyor. Ek olarak prototipte WIP `Field` ile Renk yan yana 2-col grid (`gridTemplateColumns: "1fr 1fr"`); implementasyonda dikey, ayrı satırlar (style farkı).
- **Prototip kod alıntısı:**
  ```jsx
  {editorMode === "status" && (
    <div style={{ display: "flex", gap: 6 }}>
      <label ...><input type="checkbox" checked={!!n.isInitial} readOnly/>{lang === "tr" ? "Başlangıç" : "Initial"}</label>
      <label ...><input type="checkbox" checked={!!n.isFinal} readOnly/>{lang === "tr" ? "Bitiş" : "Final"}</label>
    </div>
  )}
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** `editor-mode === "status"` koşullamasını yeniden ekle ve görsel olarak yatay yerleşimi koru.

### 1.9 Bottom toolbar'da "Bağlantı" (Edge create) butonu (functional davranış)
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:166`
- **Olması gereken implementasyon yeri:** `bottom-toolbar.tsx:94-103`
- **Görsel/davranış:** Prototipte Plus, Flow, Grid, Sparkle ikonlu 4 buton var; implementasyon Plus, ArrowRight, Square, AlignVerticalJustifyCenter, Sparkles ikonu kullanıyor — `onAddEdge` callback prop tanımlı ama editor-page'den **bağlanmamış** (`editor-page.tsx:1337-1349` `onAddEdge` geçilmiyor) → buton `disabled` durumda.
- **Prototip kod alıntısı:**
  ```jsx
  <Button size="sm" variant="ghost" icon={<Icons.Flow size={13}/>}>{lang === "tr" ? "Bağlantı" : "Edge"}</Button>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** Edge create handler'ı yaz (örnek: kullanıcıya source/target seç dialog'u veya toolbar tıklayınca canvas'ta interaktif drag-mode'a geç).

### 1.10 Üstteki Header'da kayıt/last edited zaman bilgisi
- **Prototipte:** Eksik (prototip de göstermiyor — mantıksal "olması gereken" değil)
- **Olması gereken implementasyon yeri:** —
- **Görsel/davranış:** Prototip header sadece "İş Akışı Tasarımcısı / project.name · project.key" gösteriyor. Implementasyon aynı bilgiyi gösteriyor; **Bulunmadı.** Bu satırı eksik olarak işaretlemiyorum.
- **Öncelik:** —

### 1.11 Klavye kısayolları listesi farkı: "Tümünü seç" (⌘A) ve "Yinele" (⌘⇧Z) prototipte yok
- **Prototipte:** `New_Frontend/src/pages/workflow-editor.jsx:273-285` — yalnızca 5 satır (Save, Add node, Undo, Delete, Fit view)
- **Olması gereken implementasyon yeri:** `shortcuts-panel.tsx:50-69`
- **Görsel/davranış:** Implementasyon 8 kısayol gösteriyor (Save, Undo, Redo, Add node, Delete, Select all, Fit view, Deselect). "Redo", "Select all", "Deselect" prototipte yok — kullanıcı bekleyebilir ama prototip 1:1 değil.
- **Prototip kod alıntısı:**
  ```jsx
  {[
    [lang === "tr" ? "Kaydet" : "Save", "⌘S"],
    [lang === "tr" ? "Yeni düğüm" : "Add node", "N"],
    [lang === "tr" ? "Geri al" : "Undo", "⌘Z"],
    [lang === "tr" ? "Sil" : "Delete", "⌫"],
    [lang === "tr" ? "Tam ekran" : "Fit view", "F"],
  ].map(...)}
  ```
- **Öncelik:** Low (extras kategorisinde de işliyorum — bkz. Bölüm 3)
- **Düzeltme önerisi:** Eğer yeni 3 kısayol gerçekten implement ediliyorsa kalsın; aksi halde prototipteki 5'e indir.

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.1 Sayfa root padding farkı
- **Prototip:** `New_Frontend/src/pages/workflow-editor.jsx:120` — root div `padding` yok (shell zaten padding veriyor)
- **Implementasyon:** `editor-page.tsx:1106` — `padding: 24` zorunlu eklenmiş
- **Fark:** Implementasyon 24px ekstra inset uyguluyor, canvas + body içeriği daha küçük alana sığıyor. Eğer shell zaten padding sağlıyorsa double-padding etkisi var.
- **Öncelik:** Medium

### 2.2 Body grid template fark
- **Prototip:** `workflow-editor.jsx:157` — `display: grid; gridTemplateColumns: "1fr 320px"; gap: 0; borderRadius: var(--radius); overflow: hidden; boxShadow: inset 0 0 0 1px var(--border)`
- **Implementasyon:** `editor-page.tsx:1296-1306` — `display: flex` + sağ panel `width: 320` (selection-panel.tsx fonksiyonel olarak `<aside style={{ width: 320, ... }}>`)
- **Fark:** Sonuç görsel olarak çok yakın ama prototipte left+right tek conteyner içinde ortak `inset border + radius`'a sahip. Implementasyonda body wrapper `background: var(--surface)` ek olarak veriyor (kanvasın altında ek kart efekti).
- **Öncelik:** Low

### 2.3 Header buton sıralaması
- **Prototip:** `workflow-editor.jsx:128-130` — `Geri dön`, `Çoğalt`, `Kaydet` yan yana
- **Implementasyon:** `editor-page.tsx:1148-1196` — `Geri`, `Çoğalt` (disabled, "yakında" tooltip'iyle), `Kaydet` aynı sırada — ama `Çoğalt` permanent disabled.
- **Fark:** Çoğalt butonu prototipte aktif görünüyor (real action olmasa da); implementasyonda explicit `disabled` + "Çoğalt — yakında" tooltip → ölü buton hissi.
- **Öncelik:** Medium

### 2.4 Mode segmented control yerleşimi
- **Prototip:** `workflow-editor.jsx:134-141` — Lifecycle/Status segmented switch **header'ın hemen altında, üst toolbar satırında, sol başta**.
- **Implementasyon:** `editor-page.tsx:1236-1241` — Aynı mantıksal konum ama görsel olarak farklı: prototip kendi inline-styled pill'i kullanıyor (background `surface-2`, padding 3, radius 8), implementasyon `SegmentedControl` primitive'iyle.
- **Fark:** Stiller benzer olabilir ama prototipteki ikonlar (`Flow`, `Workflow`) **yok** — implementasyon plain text gösteriyor.
- **Öncelik:** Low

### 2.5 Bottom toolbar pill background
- **Prototip:** `workflow-editor.jsx:164` — `background: var(--surface), padding: 5, borderRadius: 10, boxShadow: var(--shadow-lg)`
- **Implementasyon:** `bottom-toolbar.tsx:65-83` — `background: var(--surface), padding: 5, borderRadius: 999 (pill), boxShadow: var(--shadow-md), inset 0 0 0 1px var(--border)`
- **Fark:** radius **10 vs 999** — prototip yumuşak köşeli kart, implementasyon tam pill. Shadow `lg` vs `md`, ek olarak inset border.
- **Öncelik:** Medium
- **Düzeltme önerisi:** Karara bağlı: prototip 10px radius'u istiyorsanız `borderRadius: 10` olarak düzeltin; aksi halde dökümante edin.

### 2.6 Bottom toolbar AI öner buton sunumu
- **Prototip:** `workflow-editor.jsx:169` — `Sparkle` ikonu + plain "AI öner" metni; **disabled state YOK**
- **Implementasyon:** `bottom-toolbar.tsx:175-199` — `Sparkles` (lucide), permanent `disabled`, `aria-label="Yakında — bu özellik..."`, sağına `Badge tone="neutral">Yakında</Badge>` eklenmiş
- **Fark:** Prototipte buton aktif görünüyor (real action olmasa da); implementasyonda "Yakında" badge + disabled.
- **Öncelik:** Medium

### 2.7 Minimap içeriği
- **Prototip:** `workflow-editor.jsx:177-183` — Custom 180×100 SVG minimap, "MINIMAP" caption, her node 140×60 rect olarak `var(--{color})` opacity 0.5 ile.
- **Implementasyon:** `workflow-canvas-inner.tsx:162-173` — React Flow built-in `<MiniMap pannable zoomable position="bottom-left">` (sol-altta, prototipte ise sağ-altta!) ama `editor-page.tsx:1320` `showMiniMap={false}` geçiyor ⇒ **minimap hiç render edilmiyor**! `MinimapWrapper` (`minimap-wrapper.tsx`) ise width/height=0 boş slot. Sonuç: **kullanıcı minimap göremiyor.**
- **Fark:** Kritik — özellik tamamen kayboldu. Aynı zamanda prototip "MINIMAP" caption gösteriyor, React Flow MiniMap göstermiyor.
- **Öncelik:** Critical
- **Düzeltme önerisi:** `showMiniMap={true}` yap + position="bottom-right" geç + custom theming ile prototip 180×100 boyutuna yaklaştır.

### 2.8 PhaseNode geometri ve handle stilleri
- **Prototip:** `workflow-editor.jsx:60-95` — Node 140×60, 10 px radius, dot+label+description satırı, `padding: 8 10`. **Visible handles** yan tarafta — `position: absolute; left/right: -5; top: 26; width: 10; height: 10; background: surface; border: 2px solid border-strong; border-radius: 50%`
- **Implementasyon:** `phase-node.tsx:130-203` — Aynı 140×60, 10 px radius, ama **handles `visibility: hidden` (8 adet, 4 yön x source/target)**. Kullanıcı handle'ları göremiyor — sadece hover'da React Flow gösteriyor (CSS yoksa görünmez).
- **Fark:** Görsel olarak prototip handle'ları **her zaman gözüküyor** (yan taraftaki 2 daire); implementasyonda gizli — kullanıcı edge nasıl çekeceğini anlayamayabilir.
- **Öncelik:** High
- **Düzeltme önerisi:** Default state'te en az source-handle (sağ) + target-handle (sol) görünür yap, hover'da hepsi belirsin.

### 2.9 Edge label pill stilleri
- **Prototip:** `workflow-editor.jsx:39-44` — Label SVG `<rect>` olarak çizilmiş, `width: e.label.length * 7 + 12, height: 16, fill: var(--surface), stroke: var(--border)`, `<text fontSize="10">`.
- **Implementasyon:** `phase-edge.tsx:135-205` — `<EdgeLabelRenderer>` div, `padding: 1px 6px`, `borderRadius: 999`, `fontSize: 10.5`, `boxShadow: inset 0 0 0 1px var(--border)`.
- **Fark:** Görsel sonuç çok yakın; minor pixel-level farklılıklar.
- **Öncelik:** Low

## 3. BİLİNMEYEN EXTRAS

(Implementasyonda var, prototipte yok. Jira referansından ilham alınmış olabilir.)

### 3.1 PresetMenu ("Şablon Yükle" dropdown — 9 preset)
- **Konum:** `editor-page.tsx:1246-1250` + `preset-menu.tsx`
- **Açıklama:** Prototipte sadece pasif "Şablon: <methodology>" pill vardı; implementasyon 9 preset listeleyen dropdown + dirty-confirm dialog ekliyor. Jira'daki workflow şablon kütüphanesinden esinlenmiş.

### 3.2 ContextMenu (right-click + Shift+F10)
- **Konum:** `context-menu.tsx`, `editor-page.tsx:1351-1357`
- **Açıklama:** Prototipte hiç context-menu yok. Implementasyon node/edge/group/canvas için 4 farklı menü tablosu sunuyor. Jira-style.

### 3.3 DirtySaveDialog (3 buton: Vazgeç / Atıp Çık / Kaydet ve Çık)
- **Konum:** `dirty-save-dialog.tsx`, `editor-page.tsx:1368-1384`
- **Açıklama:** Prototipte sadece "Kaydedilmemiş" badge gösteriliyor; implementasyon router intercept + beforeunload ile dialog açıyor. Jira'da yok ama profesyonel UX.

### 3.4 Save error state matrix (409 / 422 / 429 / network)
- **Konum:** `editor-page.tsx:127-131, 884-958`
- **Açıklama:** AlertBanner ile concurrent edit (409) refresh promosyonu, rate-limit countdown, validation error toast'ları. Prototipte hiç yok.

### 3.5 Tooltip primitive (workflow-editor scope)
- **Konum:** `tooltip.tsx`
- **Açıklama:** AllGatePill, AI öner butonu vs için tooltip wrapping. Prototipte tooltip kullanılmamış.

### 3.6 AllGatePill ("Hepsi" badge — Jira-style)
- **Konum:** `all-gate-pill.tsx`, edge `isAllGate` flag ile aktive
- **Açıklama:** Source-agnostic edge (her aktif düğümden gidebilen). Prototipte edge tipleri yalnızca flow/verification/feedback; isAllGate kavramı yok. Jira'dan ilham.

### 3.7 CycleCounterBadge (×N)
- **Konum:** `cycle-counter-badge.tsx`, `phase-node.tsx:338`
- **Açıklama:** Spiral/iterative metodolojilerde fazın kaç kere kapatıldığını gösteren primary tone badge. Prototipte yok.

### 3.8 GroupCloudNode + group cloud morph (live drag)
- **Konum:** `group-cloud-node.tsx`, `editor-page.tsx:482-504`
- **Açıklama:** Çoklu node'ları kapsayan smooth hull (concave clouding). Prototipte sadece basit dashed rect "swimlane group" (`workflow-editor.jsx:50-58`). Hayli daha gelişmiş.

### 3.9 ColorSwatch (8-preset color picker)
- **Konum:** `color-swatch.tsx`, NodeEditor "Renk" alanı
- **Açıklama:** Prototip yalnızca readonly text input ("Renk" `value={n.color}`) gösteriyor; implementasyon 4×2 grid color picker. Daha iyi UX.

### 3.10 Toggle primitive ile Initial/Final/Archived flag'ları
- **Konum:** `selection-panel.tsx:254-279`
- **Açıklama:** Prototipte readonly checkbox; implementasyon active toggle + ek "Archived" alanı.

### 3.11 BFS-driven node states (default/active/past/future/unreachable)
- **Konum:** `phase-node.tsx:51-79`, `editor-page.tsx:186-197`
- **Açıklama:** Prototip yalnızca `activePhase` index karşılaştırması yapıyor; implementasyon graph traversal ile 5 state hesaplıyor. Çok daha gelişmiş ama veri akışı bağlanmamış (bkz. EN KRİTİK #3).

### 3.12 ViewportFallback (<1024px reject)
- **Konum:** `viewport-fallback.tsx`, `page.tsx:71`
- **Açıklama:** Prototip mobile'i kabul ediyor (responsive değil ama crash yok); implementasyon 1024px altında "Daha geniş ekran gerekli" sayfası gösteriyor + "Projeye Dön" butonu.

### 3.13 Bottom toolbar Sınıflandır (Align) dropdown — 5 align action
- **Konum:** `bottom-toolbar.tsx:113-170`
- **Açıklama:** Prototipte align/distribute toolbar'ı yok. Implementasyon distribute-h, align-top/bottom, center-v/h sunuyor. Editor-grade extra.

## 4. BİLİNEN EXTRAS (UYARI)
Yok.

## 5. HATALI / SORUNLU KOD

### 5.1 Editor mode toggle dead-state bug (kritik fonksiyonel bug)
- **Dosya:** `Frontend2/components/workflow-editor/editor-page.tsx:147, 199-209, 1236-1241`
- **Sorun türü:** Bug
- **Açıklama:** `mode = "lifecycle" | "status"` SegmentedControl URL'e yazıyor ama `workflow` state ayrımı yok — tek bir `workflow` üzerinde çalışılıyor. Status moduna geçiş hiçbir görsel etki yapmıyor. Kullanıcı için kafa karıştırıcı dead-control.
- **Öneri:** `workflow` ve `statusWorkflow` olarak iki ayrı state tut; `mode` değişiminde aktifi swap et. Save flow'u her ikisini de `processConfig.workflow` ve `processConfig.statusWorkflow` olarak persist etsin.
- **Öncelik:** Critical

### 5.2 Minimap görsel olarak hiç render edilmiyor
- **Dosya:** `editor-page.tsx:1320`, `minimap-wrapper.tsx:36-37`
- **Sorun türü:** Bug + Dead code
- **Açıklama:** `<WorkflowCanvas ... showMiniMap={false} />` geçildiği için React Flow MiniMap kapalı; `<MinimapWrapper />` ise `width: 0, height: 0` ile dolu boş slot — tam anlamıyla dead element. Prototipte özel custom minimap (sağ-alt 180×100) vardı; implementasyon hiçbir şey göstermiyor.
- **Öneri:** İki seçenek:  
  (a) `showMiniMap={true}` + `position="bottom-right"` + custom theming.  
  (b) Custom minimap'i `MinimapWrapper` içine monte et (prototipteki SVG'yi port et).
- **Öncelik:** Critical

### 5.3 BFS computeNodeStates her zaman empty `phaseTransitions` ile çağrılıyor
- **Dosya:** `editor-page.tsx:194-196`
- **Sorun türü:** Bug + Dead code
- **Açıklama:** Yorumda "Plan 12-09 may inject phase_transitions for parity" yazıyor ama hiç yapılmamış. Sonuç: tüm node'lar `default` state'inde — `active`, `past`, `future`, `unreachable` görsel state'leri pratikte hiç ortaya çıkmıyor. Plan ertelenmiş ama kullanıcı için "kayıp özellik" hissi var.
- **Öneri:** `useCycleCounters` ile beraber gelen veriyi geçir veya en azından structural BFS (initial node'dan reachable mı) ile `unreachable` state'i göster.
- **Öncelik:** High

### 5.4 onAddEdge prop'u editor-page'den hiç bağlanmıyor (dead button)
- **Dosya:** `editor-page.tsx:1337-1349`, `bottom-toolbar.tsx:94-103`
- **Sorun türü:** Dead code
- **Açıklama:** BottomToolbar `onAddEdge?: () => void` kabul ediyor ama editor-page o prop'u geçirmiyor → buton `disabled={!props.onAddEdge}` ile devre dışı. Görsel olarak prototipteki "Bağlantı" butonu var ama tıklanamaz.
- **Öneri:** Edge create akışını yaz (örn: tıklayınca canvas'a "edge çizim modu" overlay'i, source/target seçimi, onConnect tetikle).
- **Öncelik:** High

### 5.5 detectCurrentPresetId false-positive risk
- **Dosya:** `preset-menu.tsx:200-219`
- **Sorun türü:** Bug
- **Açıklama:** Heuristic yalnızca `mode + nodes.length + edges.length` karşılaştırıyor. Kullanıcı bir presetin node sayısını koruyup içeriği değiştirirse Badge yanlışlıkla "Scrum" gösterir. Yorum bunun bilerek yapıldığını söylüyor ama "exact-match" değil — kullanıcıyı yanıltır.
- **Öneri:** En azından node `id` set'lerini hash'le karşılaştır.
- **Öncelik:** Medium

### 5.6 Drag-stop drop-association rastgele 240px / 64px sihirli sayı
- **Dosya:** `editor-page.tsx:567-590`
- **Sorun türü:** Style drift + Bug riski
- **Açıklama:** Yorumda "64px from centroid" yazıyor ama kod `dist > 240` kontrolü yapıyor (yorum yanlış veya kod yanlış güncellenmiş). Ayrıca Plan 12-10 perf pass'ta point-in-polygon helper'a swap edilebileceği söylenmiş ama yapılmamış.
- **Öneri:** Yorumu kodla senkronize et + `pointInPolygon` (`workflow-canvas-inner.tsx:217-234`) helper'ını entegre et (zaten yazılmış).
- **Öncelik:** Medium

### 5.7 Cmd+A ve Cmd+G/Cmd+D shortcut'ları no-op (kayıt edilmiş ama anlamsız)
- **Dosya:** `editor-page.tsx:1043-1048, 1062-1075`
- **Sorun türü:** Dead code
- **Açıklama:**  
  - `Cmd+A`: `e.preventDefault()` çağrılıyor ama `setSelected(null)` ile yapılan tek şey **deselect**! Yorum diyor "we set selected to null since multi-select tracking is React Flow internal" — kullanıcı `Cmd+A` basınca seçimi kaybediyor (ters davranış). 
  - `Cmd+G` / `Cmd+D`: `selected?.type === "group"` ise ungroup, "node" ise tek node'lu grup oluştur — bu absürt (tek node'lu group yararsız). Prototipte hiç yok.
- **Öneri:** `Cmd+A` ya gerçekten select-all implementasyonu ekleyin ya da kısayoldan kaldırın. `Cmd+G/D` mantığını çoklu seçim varsa çalışacak şekilde yeniden yaz.
- **Öncelik:** Medium

### 5.8 Tooltip ve Dialog kapatma sırasında focus management eksikliği
- **Dosya:** `dirty-save-dialog.tsx:46-119`, `context-menu.tsx`
- **Sorun türü:** A11y
- **Açıklama:** DirtySaveDialog modal açılınca focus'u dialog içine taşımıyor (focus trap yok). ContextMenu açılınca da menüye focus geçmiyor. Klavye kullanıcısı için erişilebilirlik sorunu.
- **Öneri:** `radix` veya custom focus-trap ekle; `aria-modal="true"` zaten var ama focus management yok.
- **Öncelik:** Medium

### 5.9 PhaseNode handle'ları `visibility: hidden` — keşfedilebilirlik sıfır
- **Dosya:** `phase-node.tsx:81-85`
- **Sorun türü:** A11y + UX bug
- **Açıklama:** 8 handle her zaman `visibility: hidden`. Yorumda "the canvas reveals them via CSS" yazıyor ama global CSS'de bunu yapan bir `:hover` selector yok (onaylamak için aramadım ama PhaseNode dosyasında yok). Klavye + dokunmatik kullanıcılar edge çizemez.
- **Öneri:** En azından source-out (sağ) ve target-in (sol) handle'ları opacity 0.6 default göster, hover'da 1.
- **Öncelik:** High

### 5.10 Hydration mismatch riski: `isMac()` mount sonrası değişiyor
- **Dosya:** `shortcuts-panel.tsx:79-83`
- **Sorun türü:** Hydration
- **Açıklama:** `useState(false)` + `useEffect` ile mount sonrası `isMac()` çağrılıyor → SSR/CSR ilk render'da mac=false, sonra true. Mac kullanıcılarında shortcuts kısa süre "Ctrl+S" gösterip "⌘S"'e dönüyor (flash). Yorumda sebebi açıklanmış ama çözüm uygulanmamış.
- **Öneri:** `useSyncExternalStore` veya client-only `next/dynamic` import ile shortcut listesini lazy mount et.
- **Öncelik:** Low

### 5.11 SegmentedControl `flexWrap: "wrap"` style — overflow olması mümkün
- **Dosya:** `flow-rules.tsx:80`
- **Sorun türü:** Style drift
- **Açıklama:** Sağ panel 320px sabit; 4-mod SegmentedControl `xs` size'da bile bu darlığa sığmayabilir → wrap yapacak ve label'lar parçalanmış görünebilir. Prototipte buton-listesi (vertical) kullanılmış (`workflow-editor.jsx:191-211`); implementasyon yatay segmented control'a indirgenmiş — küçük ekran/uzun label durumunda kötü görünüm riski.
- **Öneri:** Prototipteki dikey button-listesi UX'e (label + description) geri dön; daha açıklayıcı ve responsive.
- **Öncelik:** Medium

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| #  | Öncelik  | Madde                                                                  | Dosya                                            | Bölüm |
|----|----------|------------------------------------------------------------------------|--------------------------------------------------|-------|
| 1  | Critical | Lifecycle/Status mode toggle dead-state — gerçek state ayrımı yok       | editor-page.tsx                                  | 1.1, 5.1 |
| 2  | Critical | Sıralı-kilitli mode banner critical-tone uyarısı kayboldu              | mode-banner.tsx                                  | 1.3 |
| 3  | Critical | Active phase / past phase görsel state'leri (lock+opacity) gösterilmiyor | editor-page.tsx, phase-node.tsx                 | 5.3 |
| 4  | Critical | Minimap hiç render edilmiyor                                           | editor-page.tsx, minimap-wrapper.tsx             | 2.7, 5.2 |
| 5  | High     | Üst toolbar zoom −/+ butonları + Maximize (Fit) eksik                   | editor-page.tsx                                  | 1.2 |
| 6  | High     | Validation panel — Reachability ve görev atanmış uyarısı yok          | validation-panel.tsx                             | 1.4 |
| 7  | High     | Node selection panelinde Sil butonu yok                                | selection-panel.tsx                              | 1.6 |
| 8  | High     | Edge selection panelinde Sil butonu yok                                | selection-panel.tsx                              | 1.7 |
| 9  | High     | Bottom toolbar "Bağlantı" butonu bağlanmamış (dead)                    | editor-page.tsx, bottom-toolbar.tsx              | 1.9, 5.4 |
| 10 | High     | PhaseNode handles invisible — edge çizimi keşfedilebilir değil         | phase-node.tsx                                   | 2.8, 5.9 |
| 11 | Medium   | Edge selection panel source→target özet kutusu eksik                  | selection-panel.tsx                              | 1.5 |
| 12 | Medium   | Status modunda Initial/Final yatay yerleşim farkı                       | selection-panel.tsx                              | 1.8 |
| 13 | Medium   | Sayfa root padding çift sayım riski                                    | editor-page.tsx                                  | 2.1 |
| 14 | Medium   | Çoğalt header butonu permanent disabled — ölü görünüyor                | editor-page.tsx                                  | 2.3 |
| 15 | Medium   | Bottom toolbar pill radius 999 vs prototip 10                          | bottom-toolbar.tsx                               | 2.5 |
| 16 | Medium   | AI öner buton "Yakında" badge prototipte yok                          | bottom-toolbar.tsx                               | 2.6 |
| 17 | Medium   | detectCurrentPresetId false-positive (mode+count match)                | preset-menu.tsx                                  | 5.5 |
| 18 | Medium   | Drag-stop centroid eşik 64px↔240px yorum/kod uyumsuz                  | editor-page.tsx                                  | 5.6 |
| 19 | Medium   | Cmd+A no-op + Cmd+G/Cmd+D mantıksız davranış                          | editor-page.tsx                                  | 5.7 |
| 20 | Medium   | Modal/contextmenu focus trap eksik (a11y)                              | dirty-save-dialog.tsx, context-menu.tsx          | 5.8 |
| 21 | Medium   | Sağ panel SegmentedControl wrap riski — prototipteki button list'e dön | flow-rules.tsx                                   | 5.11 |
| 22 | Low      | Kısayollar — prototipte 5, implementasyonda 8 (extras)                 | shortcuts-panel.tsx                              | 1.11 |
| 23 | Low      | Body grid template farkı (extra background var)                        | editor-page.tsx                                  | 2.2 |
| 24 | Low      | Mode segmented control ikonları (Flow/Workflow) gösterilmiyor         | editor-page.tsx                                  | 2.4 |
| 25 | Low      | Edge label pill mikro stil farkları (rect→div, fontSize 10→10.5)      | phase-edge.tsx                                   | 2.9 |
| 26 | Low      | isMac() hydration flash                                                | shortcuts-panel.tsx                              | 5.10 |

## 7. KAPSAM NOTLARI
- **Okunan dosyalar:** Prototip `workflow-editor.jsx` tamamı; data.jsx (DEFAULT_LIFECYCLES + DEFAULT_STATUS_FLOWS bölümü); icons.jsx (workflow-relevant ikonlar). Implementasyon: `app/(shell)/workflow-editor/page.tsx`, page.test.tsx (skim), tüm 24 dosya `Frontend2/components/workflow-editor/` altında, `viewport-fallback.tsx`, `services/lifecycle-service.ts` (tip ve mapper); `lib/lifecycle/*.ts` dosya listesi (içeriği skim — presets, validators, hull, traversal, align, shortcuts, node-ids).
- **Atlanan/eksik kalan:**  
  - `Frontend2/lib/lifecycle/workflow-validators.ts` — kuralların prototip karşılığını detaylı eşleyemedim (yalnızca panel tarafını okuduğum `validation-panel.tsx` üzerinden).  
  - `Frontend2/hooks/use-editor-history.ts`, `use-cycle-counters.ts`, `use-transition-authority.ts` — sadece imza üzerinden değerlendirildi, içerik açılmadı (history coalescing davranışı `editor-page.tsx` yorumlarından çıkarıldı).  
  - Test dosyaları (`*.test.tsx`) yalnızca dosya listesi üzerinden saydırıldı; assertion içerikleri taranmadı.  
  - Prototipteki `Field` ve `ValidationItem` component'leri `workflow-editor.jsx` içinde inline tanımlı — bunları okudum ama ayrı dosya yok.
- **Belirsizlikler:**  
  - "Şablon: methodology" label vs "Şablon Yükle" dropdown — ürün tarafının istediği davranış net değil; muhtemelen hem display hem dropdown istenmiş olabilir (Bölüm 1.2 ve 3.1).  
  - PhaseNode handle visibility hover'da CSS ile gösteriliyor olabilir — global CSS dosyasını taramadım. Eğer var ise 5.9 sorunu küçük bir UX iyileştirmesine indirgenir.  
  - `workflow design and preview_jira.jpeg` görselini incelemedim (multimodal okuma yapmadım); Jira ilhamlı extras'ı (3.1, 3.2, 3.6) bunlara bağladığım inference'lar koddaki yorumlardan + kavramsal benzerliklerden geldi.  
  - "Yaşam Döngüsü vs Görev Durumları" mode'u ürün tarafı muhtemelen iki ayrı `processConfig` alanı (workflow vs statusWorkflow) bekliyor olabilir — backend kontratını ayrıca doğrulamak gerekir.
