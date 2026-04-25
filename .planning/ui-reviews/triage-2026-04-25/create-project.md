# Create Project (Proje Oluşturma) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-create-project
**Prototip kaynak:**
- `New_Frontend/src/pages/create-project.jsx`
- Bağımlılıklar: `New_Frontend/src/primitives.jsx` (Card, Button, Badge, SegmentedControl, Toggle, Avatar, Input), `New_Frontend/src/icons.jsx`, `New_Frontend/src/data.jsx` (DEFAULT_LIFECYCLES, EXTRA_LIFECYCLES, USERS), `New_Frontend/src/pages/workflow-editor.jsx` (WorkflowCanvas, ValidationItem), `New_Frontend/src/pages/create-task-modal.jsx` (ModalField helper)

**Implementasyon kaynak:**
- `Frontend2/app/(shell)/projects/new/page.tsx`
- `Frontend2/hooks/use-projects.ts` (`useCreateProject`, `useProcessTemplates`)
- `Frontend2/services/project-service.ts` (`projectService.create`, `projectService.getProcessTemplates`)
- `Frontend2/components/primitives/index.ts` (Card, Button, SegmentedControl, Toggle, Avatar, AvatarStack, Badge, Input mevcut ama burada kullanılmıyor)

**Bilinen intentional extras:** Yok

---

## TL;DR Özet
- Eksik elementler: **18**
- Layout/şekil farkı: **9**
- Bilinmeyen extras: **5**
- Bilinen extras: **0**
- Hatalı kod: **11**
- **EN KRİTİK 3 MADDE:**
  1. **Step 3 (Yaşam Döngüsü) komple başka bir ekran:** Prototipte `WorkflowCanvas` ile interaktif düğüm/edge canvas + sağ panelde Akış Modu (`SegmentedControl`), seçim editörü (faz adı/açıklama/renk), `ValidationItem` listesi ve canvas alt bar (Faz Ekle/Bağlantı/Grup/Sil) bulunuyor; implementasyon ise **read-only "ok→ok" pill listesi** rendere indirilmiş — "fluent workflow designer preview" tamamen kayıp.
  2. **Step 1'de Proje Yöneticisi (Project Lead) seçimi yok:** Prototipte `<select>` ile Admin/PM rollerinden seçim yapılırken (`leadId` state), implementasyonda alan, state ve backend'e iletim **tamamen kaldırılmış** — kritik domain alanı eksik.
  3. **Step 4 (Yapılandırma) %75 oranında eksik:** Prototipteki Görev Alanları (9 adet `Toggle`), Davranış Kuralları (4 adet `Toggle`), Üye Davet (`Input` + listeden ekle/kaldır chip-row) kart blokları implementasyonda **yok**; sadece "Board Kolonları" mevcut + üstüne "Ek yapılandırma Settings'den" placeholder kartı eklenmiş.

---

## 1. EKSİK ELEMENTLER

### 1.1 Step 1 — Proje Anahtarı için "next-to-input help" yerleşimi
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:116-121`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:273-297`
- **Görsel/davranış:** Prototipte input + `<span>` yardım metni **tek satırda yan yana** flex; key input genişliği `120px` ile sınırlı, `letterSpacing: 1`, `className="mono"`. Implementasyon yardım metnini input'un **altına** `marginTop: 4` ile yerleştirmiş ve key input'un **maxLength**'ini 6'dan 8'e çıkarmış.
- **Prototip kod alıntısı:**
  ```jsx
  <ModalField label={T("Proje Anahtarı", "Project Key")} required>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input value={key} onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 6))}
        placeholder="KEY" maxLength={6} className="mono"
        style={{ ...wizInputStyle, width: 120, letterSpacing: 1 }}/>
      <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>
        {T("Görev anahtarları için kullanılır (ör. KEY-1, KEY-2)", "Used for task keys (e.g. KEY-1, KEY-2)")}
      </span>
    </div>
  </ModalField>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Input + help span'i `display:flex; gap:10` içine al, `maxLength`'i 6'ya geri çek (backend de tutarlı), `className="mono"` ekle (mono font için), input genişliğini `120px`'e sabitle.

### 1.2 Step 1 — Proje Yöneticisi (Project Lead) `<select>` alanı
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:136-142`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:343` (Dates grid'inden sonra)
- **Görsel/davranış:** Prototipte `wizSelectStyle` (özel chevron arka plan SVG'si ile select), Admin/PM rolündeki kullanıcılar `name — role` formatında listeleniyor; state `leadId` (varsayılan `CURRENT_USER.id`).
- **Prototip kod alıntısı:**
  ```jsx
  const [leadId, setLeadId] = React.useState(window.SPMSData.CURRENT_USER.id);
  ...
  <ModalField label={T("Proje Yöneticisi", "Project Lead")}>
    <select value={leadId} onChange={(e) => setLeadId(e.target.value)} style={wizSelectStyle}>
      {window.SPMSData.USERS.filter(u => u.role !== "Member").map(u => (
        <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
      ))}
    </select>
  </ModalField>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `useUsers()` (yoksa eklenmeli) ile Admin/PM filtreleme yap, `wizSelectStyle` portla, `leadId` state'i ekle ve `CreateProjectDTO`'ya `manager_id` field ile yolla (`projectService.create` zaten `manager_id` accept ediyor olabilir; backend kontratı doğrula).

### 1.3 `wizSelectStyle` (özel select görünümü)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:384-391`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:23-33` (mevcut `wizInputStyle` ile birlikte)
- **Görsel/davranış:** SVG chevron-down (data URI), `appearance: none`, `paddingRight: 28`, `backgroundPosition: right 8px center`. Implementasyonda hiç tanımlanmamış çünkü select alanı da yok.
- **Prototip kod alıntısı:**
  ```js
  const wizSelectStyle = {
    ...wizInputStyle,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    paddingRight: 28,
  };
  ```
- **Öncelik:** High (1.2 ile birlikte)
- **Düzeltme önerisi:** `wizInputStyle` yanına `wizSelectStyle` constant'ını ekle.

### 1.4 Step 1 — `ModalField` form helper (label tipografisi)
- **Prototipte:** `New_Frontend/src/pages/create-task-modal.jsx:248-255`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx` her form alanında inline label yerine
- **Görsel/davranış:** Prototip `<label>` semantiği kullanıyor (input ile bağlı), `fontSize: 11.5`, `fontWeight: 600`, `color: "var(--fg-muted)"`. Implementasyon `<div><label>` yapısı ile **`<label>` for/htmlFor binding'i yok** ve `fontSize: 12.5`, `color: "var(--fg)"` (default). Sonuç: tipografi tonu ve a11y bağlantısı tutarsız.
- **Prototip kod alıntısı:**
  ```jsx
  const ModalField = ({ label, required, children }) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg-muted)" }}>
        {label}{required && <span style={{ color: "var(--priority-critical)", marginLeft: 2 }}>*</span>}
      </span>
      {children}
    </label>
  );
  ```
- **Öncelik:** High (a11y + token tutarlılığı)
- **Düzeltme önerisi:** Yeniden kullanılabilir `<ModalField>` (veya `<WizField>`) component'i çıkar; `<label>` element'i kullan; `font: 11.5/600/--fg-muted`; required işareti `marginLeft: 2`.

### 1.5 Step 1 — `<input autoFocus>` verifikasyonu
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:113`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:269` — `autoFocus` mevcut, OK. **(Atlanıyor)**
- **Öncelik:** —

### 1.6 Step 2 — Custom Templates ("Özel Şablonlar") section
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:163-176`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:431` (templates grid'inden sonra)
- **Görsel/davranış:** Prototipte `EXTRA_LIFECYCLES` (`v-model`, `spiral`) içinden ana 6 şablonda olmayanlar **ayrı bir grid** olarak gösteriliyor; üstünde "ÖZEL ŞABLONLAR / CUSTOM TEMPLATES" overline başlığı (`fontSize: 11`, `fontWeight: 600`, `color: --fg-subtle`, `textTransform: uppercase`, `letterSpacing: 0.5`).
- **Prototip kod alıntısı:**
  ```jsx
  {window.SPMSData.EXTRA_LIFECYCLES && Object.keys(...).filter(...).length > 0 && (
    <>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20, marginBottom: 10 }}>
        {T("Özel Şablonlar", "Custom Templates")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {Object.entries(...).map(([k, v]) => (
          <Card key={k} interactive padding={14} onClick={() => setMethodology(k)} ...>
        ))}
      </div>
    </>
  )}
  ```
- **Öncelik:** Medium (backend templates endpoint zaten her şeyi flat dönderiyor olabilir; bu durumda ayrım UI'da yok)
- **Düzeltme önerisi:** `useProcessTemplates` cevabında `is_custom` veya benzeri flag varsa overline'lı grid ile ayır; yoksa ürün kararı al.

### 1.7 Step 2 — `modeBadge()` (mode-tone mapping)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:70-79`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:401-413` (template mode badge)
- **Görsel/davranış:** Prototip `Badge` primitive'i kullanıyor; mod → tone eşlemesi:
  - `flexible` → neutral, "Esnek"
  - `sequential-locked` → warning, "Sıralı Kilitli"
  - `sequential-flexible` → primary, "Sıralı+"
  - `continuous` → info, "Sürekli"
- Implementasyon: Düz `<span>` ile **renk yok** (`background: var(--surface-2)`, `color: var(--fg-muted)`) ve mod string'i **çeviri yapılmadan** raw render (`flexible`, `sequential-locked` İngilizce literal).
- **Prototip kod alıntısı:**
  ```jsx
  const modeBadge = (m) => {
    const map = {
      "flexible": { label: T("Esnek", "Flexible"), tone: "neutral" },
      "sequential-locked": { label: T("Sıralı Kilitli", "Seq. Locked"), tone: "warning" },
      "sequential-flexible": { label: T("Sıralı+", "Seq. Flex"), tone: "primary" },
      "continuous": { label: T("Sürekli", "Continuous"), tone: "info" },
    };
    const v = map[m] || map.flexible;
    return <Badge size="xs" tone={v.tone}>{v.label}</Badge>;
  };
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `Badge` primitive'i import et, `modeBadge` helper'ı ekle, raw `<span>` blokunu kaldır.

### 1.8 Step 2 — Templates fixed-row grouping (6 sabit + extra)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:152-161`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:380-432`
- **Görsel/davranış:** Prototipte 2 ayrı 3-kolon grid (row 1: scrum/kanban/waterfall, row 2: v-model/spiral/incremental). Implementasyon tek grid içinde dinamik `templates` array map ediyor. Backend dönüş sırası deterministik olmadığı sürece "incremental" ile "scrum" arasında karışıklık olabilir.
- **Prototip kod alıntısı:**
  ```jsx
  const templates = [
    { id: "scrum", row: 1 }, { id: "kanban", row: 1 }, { id: "waterfall", row: 1 },
    { id: "v-model", row: 2 }, { id: "spiral", row: 2 }, { id: "incremental", row: 2 },
  ];
  templates.filter(t => t.row === 1).map(...)
  templates.filter(t => t.row === 2).map(...)
  ```
- **Öncelik:** Low (görsel olarak grid akışı 3-3 dağılımı koruyorsa fark yok)
- **Düzeltme önerisi:** Backend `display_order` dönerse onu uygula; yoksa client-side bilinen 6 ID için sıralı eşleme yap.

### 1.9 Step 3 — `WorkflowCanvas` (interaktif düğüm/edge görselleyici)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:185-206` (`WorkflowCanvas` import'u `New_Frontend/src/pages/workflow-editor.jsx:3-98`'de)
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:449-482`
- **Görsel/davranış:** Prototipte:
  - SVG canvas + dotted background grid (radial-gradient)
  - Bezier edge'ler arrow marker ile
  - Düğüm kartları (140×60, status-color dot, title, description, isInitial/isFinal badge)
  - `selected` state: tıklayınca primary border halkası
  - 420px sabit yükseklik, scroll
  - Sağ alt: minimap, alt: floating toolbar
- Implementasyonda ise sadece sıralı pill liste:
  ```tsx
  {nodes.map(...) → <div style={{ padding: "6px 12px", ...}}>{node.label}</div> + "→" separator}
  ```
- **Prototip kod alıntısı:**
  ```jsx
  <Card padding={0} style={{ overflow: "hidden" }}>
    <div style={{ height: 420 }}>
      {wf ? (
        <WorkflowCanvas workflow={{ ...wf, mode: wfMode }} readOnly={false}
          onNodeClick={(n) => setSelectedNode(n.id === selectedNode ? null : n.id)}
          selected={selectedNode ? { type: "node", id: selectedNode } : null}/>
      ) : ( <div>... Önce metodoloji seçin ...</div> )}
    </div>
    <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 6 }}>
      <Button size="xs" variant="ghost" icon={<Icons.Plus size={11}/>}>Faz Ekle</Button>
      <Button size="xs" variant="ghost" icon={<Icons.Flow size={11}/>}>Bağlantı</Button>
      <Button size="xs" variant="ghost" icon={<Icons.Grid size={11}/>}>Grup</Button>
      <div style={{ width: 1, height: 20, background: "var(--border)" }}/>
      <Button size="xs" variant="ghost" icon={<Icons.Trash size={11}/>} disabled={!selectedNode}>Sil</Button>
    </div>
  </Card>
  ```
- **Öncelik:** **Critical**
- **Düzeltme önerisi:** Frontend2'da zaten `Frontend2/components/workflow-editor/workflow-canvas.tsx` mevcut — Step 3'te bunu mount et (`readOnly={false}`); aksi halde bu adım amacını kaybediyor.

### 1.10 Step 3 — Sağ panel: Akış Modu (`SegmentedControl`) + dinamik açıklama
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:209-224`
- **Olması gereken implementasyon yeri:** Step 3 sağ panel (yeni grid kolonu)
- **Görsel/davranış:** Sağ kolonda 280px width Card, içinde 4 modlu segmented control (Esnek/Sıralı/Sıralı+/Sürekli) + seçim altında 1 satır açıklama (`flexible`: "Her düğüm arası geçiş tanımlanabilir.", `sequential-locked`: "Sıralı, geri dönüş yok.", vs.)
- **Prototip kod alıntısı:**
  ```jsx
  <SegmentedControl value={wfMode} onChange={setWfMode} size="xs" options={[
    { id: "flexible", label: T("Esnek", "Flex") },
    { id: "sequential-locked", label: T("Sıralı", "Seq") },
    { id: "sequential-flexible", label: T("Sıralı+", "Seq+") },
    { id: "continuous", label: T("Sürekli", "Cont") },
  ]}/>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `SegmentedControl` import et, `wfMode` state ekle (`useEffect` ile metodoloji değişiminde reset).

### 1.11 Step 3 — Sağ panel: Selection editör (faz adı/açıklama/renk)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:226-243`
- **Olması gereken implementasyon yeri:** Step 3 sağ panel (Selection bölümü)
- **Görsel/davranış:** `selectedNode` ile bir faz seçili ise: 2 input (Faz adı, Açıklama) + 6 renk swatch'ı (`status-todo`, `status-progress`, `status-review`, `status-done`, `status-blocked`, `primary`) tıklanır. Seçili değilse: "Bir faz, bağlantı veya grup seçin." mesajı.
- **Prototip kod alıntısı:**
  ```jsx
  <input defaultValue={n.name} placeholder={T("Faz adı", "Phase name")} style={wizInputStyle}/>
  <input defaultValue={n.description || ""} placeholder={T("Açıklama", "Description")} style={wizInputStyle}/>
  <div style={{ display: "flex", gap: 4 }}>
    {["status-todo","status-progress","status-review","status-done","status-blocked","primary"].map(c => (
      <div style={{ width: 18, height: 18, borderRadius: 4, background: `var(--${c})`, ... }}/>
    ))}
  </div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Step 3'te seçim destek state'i ekle (`selectedNode`); WorkflowCanvas mount'undan node-click event al.

### 1.12 Step 3 — Sağ panel: Doğrulama listesi (`ValidationItem`)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:245-250` (`ValidationItem` tanımı `New_Frontend/src/pages/workflow-editor.jsx:304-311`)
- **Olması gereken implementasyon yeri:** Step 3 sağ panel (Validation bölümü)
- **Görsel/davranış:** 3 satır check-mark icon + label: "Başlangıç düğümü mevcut", "Bitiş düğümü mevcut", "Erişilebilirlik kontrolü". `ok` status için `var(--status-done)`, `warning` için `var(--status-review)`, fail için `var(--priority-critical)`.
- **Prototip kod alıntısı:**
  ```jsx
  const ValidationItem = ({ ok, warning, label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 0" }}>
      <span style={{ color: ok ? "var(--status-done)" : warning ? "var(--status-review)" : "var(--priority-critical)" }}>
        {ok ? <Icons.CircleCheck size={13}/> : <Icons.Alert size={13}/>}
      </span>
      <span style={{ color: "var(--fg-muted)" }}>{label}</span>
    </div>
  );
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** `Frontend2/components/workflow-editor/validation-panel.tsx` muhtemelen reuse edilebilir; aksi halde mini ValidationItem helper yaz.

### 1.13 Step 3 — Canvas footer toolbar (Faz Ekle / Bağlantı / Grup / Sil)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:199-205`
- **Olması gereken implementasyon yeri:** Step 3 canvas card'ın altında bir border-top'lu satır
- **Görsel/davranış:** 4 ghost button (Plus/Flow/Grid/Trash icon) + "Sil" disabled iken (`!selectedNode`).
- **Öncelik:** High (Step 3 amacının parçası)
- **Düzeltme önerisi:** Canvas component'i ile birlikte mount et.

### 1.14 Step 4 — Görev Alanları kartı (9 toggle)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:277-300`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:551` (Board Kolonları'ndan sonra)
- **Görsel/davranış:** Card içinde "Görev Alanları" başlığı + 9 satır (Story Points, Bitiş Tarihi, Öncelik, Ciddiyet, Risk, Etiketler, Atanan Kişi, Tahmini Süre, Ekler). Her satır: sol label + alt küçük desc + sağ `Toggle` (md). Default açık olanlar: storyPoints, dueDate, priority, labels, assignee, attachments.
- **Prototip kod alıntısı:**
  ```jsx
  const [fields, setFields] = React.useState({ storyPoints: true, dueDate: true, priority: true, severity: false, risk: false, labels: true, assignee: true, estimateHours: false, attachments: true });
  ...
  {[ ...9 alan tanımı ...].map(f => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{f.label}</div>
        <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>{f.desc}</div>
      </div>
      <Toggle on={fields[f.key]} onChange={(v) => setFields({ ...fields, [f.key]: v })}/>
    </div>
  ))}
  ```
- **Öncelik:** **Critical**
- **Düzeltme önerisi:** `Toggle` primitive zaten `Frontend2/components/primitives/toggle.tsx` mevcut. Kart komple eklenmeli + `process_config.fields` olarak backend'e gönderilmeli.

### 1.15 Step 4 — Davranış Kuralları kartı (4 toggle)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:302-316`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:551` (Görev Alanları'ndan sonra)
- **Görsel/davranış:** "Davranış Kuralları" başlığı + 4 satır (Sıralı faz bağımlılığını zorla, WIP limitlerini zorla, Süresi dolan fazlara görev eklemeyi engelle, Görev-Faz Ataması). Default açık: enforceWip.
- **Prototip kod alıntısı:**
  ```jsx
  {[
    { key: "enforceSequential", label: T("Sıralı faz bağımlılığını zorla", "Enforce sequential phase dependency") },
    { key: "enforceWip", label: T("WIP limitlerini zorla", "Enforce WIP limits") },
    { key: "blockExpiredPhase", label: T("Süresi dolan fazlara görev eklemeyi engelle", "Block tasks on expired phases") },
    { key: "phaseAssignment", label: T("Görev-Faz Ataması", "Task-Phase Assignment") },
  ].map(r => (...))}
  ```
- **Öncelik:** **Critical**
- **Düzeltme önerisi:** Toggle row pattern ile tam eşle; `process_config.rules` olarak yolla.

### 1.16 Step 4 — Üye Davet kartı (search input + chip list + add row)
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:318-348`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:551` (Davranış Kuralları'ndan sonra)
- **Görsel/davranış:**
  - Üst: `Input` primitive (icon=Search, placeholder "Kullanıcı ara…", size sm)
  - Orta: davet edilen üyeler chip-row (Avatar 18px + isim + X button)
  - Boş durum: "Henüz üye eklenmedi"
  - Alt: leadId hariç, ilk 5 user için satır (Avatar 22px + isim + role + "Ekle" buton)
- **Prototip kod alıntısı:**
  ```jsx
  <Card padding={16}>
    <div>{T("Üye Davet", "Invite Members")}</div>
    <Input icon={<Icons.Search size={13}/>} placeholder={T("Kullanıcı ara…", "Search users…")} size="sm" style={{ flex: 1 }}/>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {invitedMembers.map(uid => (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "var(--surface-2)", borderRadius: 99, ... }}>
          <Avatar user={u} size={18}/><span>{u?.name}</span>
          <button onClick={() => setInvitedMembers(invitedMembers.filter(x => x !== uid))}><Icons.X size={10}/></button>
        </div>
      ))}
    </div>
    {/* search results */}
  </Card>
  ```
- **Öncelik:** **Critical**
- **Düzeltme önerisi:** `Avatar`, `Input` primitive'leri import et; user listesi için yeni hook (`useUsers`); davet sonucunda submit'te `member_ids` array'i yolla.

### 1.17 Step 4 — Board Kolonları: WIP placeholder `∞` + drag handle gerçek davranışı
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:264-273`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/projects/new/page.tsx:494-551`
- **Görsel/davranış:**
  - WIP input placeholder prototipte `"∞"` (sonsuzluk işareti), implementasyonda `"WIP"` literal. Bu boş kolonun "limitsiz" olduğunu belirtmek için **anlamlı bir görsel kuraldı**.
  - Default columns prototipte 4 ("Yapılacak", "Devam Ediyor", "İncelemede", "Tamamlandı"); implementasyonda 3 ("Yapılacak", "Devam Ediyor", "Bitti") — **"İncelemede" eksik**, "Tamamlandı" yerine "Bitti" yazılmış.
  - Drag handle (`⠿`) prototipte `cursor: grab` var ama **drag işlevi sürekli statiktir**; tutarlı (sorun yok).
  - Add Column buton: prototipte `<Button size="xs" variant="ghost" icon={<Icons.Plus size={11}/>}>` + boş kolon eklenir (`""`); implementasyonda native `<button>` + "Yeni Kolon" placeholder ile eklenir, `Icons.Plus` yerine "+" karakteri kullanılmış.
- **Prototip kod alıntısı:**
  ```jsx
  const [columns, setColumns] = React.useState(["Yapılacak", "Devam Ediyor", "İncelemede", "Tamamlandı"]);
  ...
  <input type="number" placeholder="∞" min="0" className="mono" style={{ ...wizInputStyle, width: 60 }}/>
  ...
  <Button size="xs" variant="ghost" icon={<Icons.Plus size={11}/>} onClick={() => setColumns([...columns, ""])} style={{ alignSelf: "flex-start" }}>{T("Kolon Ekle", "Add Column")}</Button>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Default 4 kolon ("İncelemede" geri ekle, "Bitti" → "Tamamlandı"), WIP placeholder `∞` yap, `Button` primitive ile + icon kullan, yeni kolon `""` olarak başlatılsın (kullanıcının yazmasını bekle).

### 1.18 Step 4 — Başlık tipografisi + boş satır separator yaklaşımı
- **Prototipte:** `New_Frontend/src/pages/create-project.jsx:262, 278, 304, 320`
- **Olması gereken implementasyon yeri:** Step 4 her kart başlığı
- **Görsel/davranış:** Prototip kart-başlığı `fontSize: 13, fontWeight: 600, marginBottom: 12`. Implementasyon `fontSize: 14, fontWeight: 600, marginBottom: 14` — küçük ama tutarlı bir farkı.
- **Öncelik:** Low

---

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.1 Step indicator: label yerleşimi yatay → dikey
- **Prototip:** `New_Frontend/src/pages/create-project.jsx:88-99` — Daire **yanına** label (`gap: 8`, hepsi tek satırda).
- **Implementasyon:** `Frontend2/app/(shell)/projects/new/page.tsx:65-103` — `flexDirection: "column"` ile daire **altına** label.
- **Fark:** Prototipte adım dairesi + adı yatay (yan yana); implementasyon dikey hizalama, label dairenin altında. Bu hem boyut/padding hem visuel akış değiştiriyor.
- **Öncelik:** **Critical** (en görünür sapma)

### 2.2 Step indicator: tamamlanmış adımda check icon kaynağı
- **Prototip:** `New_Frontend/src/pages/create-project.jsx:97` — `<Icons.Check size={13}/>` (Lucide-style 1.75 stroke).
- **Implementasyon:** `Frontend2/app/(shell)/projects/new/page.tsx:90-92` — Inline SVG `strokeWidth="2.5"` ile elle yazılmış polyline.
- **Fark:** Stroke kalınlığı (1.75 vs 2.5) ve icon kaynağı tutarsız; tema değişikliklerinde renk/kalınlık koordineli güncellenmez.
- **Öncelik:** Medium
- **Düzeltme önerisi:** Frontend2'da merkezi `Icons.Check` icon'u (Lucide veya kendi inline icon set'i) kullan.

### 2.3 Step 3 layout: 2 kolon grid kayıp
- **Prototip:** `New_Frontend/src/pages/create-project.jsx:185` — `gridTemplateColumns: "1fr 280px", gap: 16` (sol canvas, sağ panel)
- **Implementasyon:** `Frontend2/app/(shell)/projects/new/page.tsx:450-482` — Tek kolonlu Card, sağ panel hiç yok.
- **Fark:** Step 3'ün tüm sağ paneli (Akış Modu, Selection, Validation) eksik; layout grid'i daha bahsetmeden çökmüş.
- **Öncelik:** **Critical**

### 2.4 Step 4: kart sıralaması + sayısı
- **Prototip:** Board Kolonları → Görev Alanları → Davranış Kuralları → Üye Davet (4 kart).
- **Implementasyon:** Board Kolonları → "Ek yapılandırma Settings'den" placeholder kartı (2 kart).
- **Fark:** 2/4 kart eksik (1.14, 1.15, 1.16'ya bakın).
- **Öncelik:** **Critical**

### 2.5 Step 1: input height token tutarlılığı
- **Prototip:** `wizInputStyle.height: 36`. Implementasyon: aynı (36). **(Tutarlı)**
- **Öncelik:** —

### 2.6 Step 1: Açıklama (textarea) yüksekliği
- **Prototip:** `New_Frontend/src/pages/create-project.jsx:124` — `rows={3}` + `height: "auto"` (override) → ~3 satır.
- **Implementasyon:** `Frontend2/app/(shell)/projects/new/page.tsx:307` — sabit `height: 80`.
- **Fark:** Prototip rows attribute ile satır sayısı bazlı; implementasyon piksel sabit. Genişleme davranışı (`resize: vertical`) ikisinde de aynı.
- **Öncelik:** Low

### 2.7 Step 1: Tarih grid, etiket konumu farkı
- **Prototip:** Etiketler `ModalField` ile **tek tip** (`fontSize: 11.5`, `--fg-muted`).
- **Implementasyon:** Inline `<label>` `fontSize: 12.5`, **default fg color** (--fg). 1.4'te yakalandı.

### 2.8 Step 2: template kart `cursor: pointer` çift sarmalanmış
- **Prototip:** `Card` primitive'in `interactive` prop'una verilen `onClick` zaten cursor'u set ediyor.
- **Implementasyon:** `Frontend2/app/(shell)/projects/new/page.tsx:384-391` — Dışta `<div onClick=... style={{ cursor: "pointer" }}>` + içte `Card interactive` — çift event handler (Card'ın kendisi de tıklayan element).
- **Fark:** Wrapper `<div>` gereksiz; Card primitive zaten click ve cursor handling yapıyor.
- **Öncelik:** Medium
- **Düzeltme önerisi:** `<Card interactive onClick={...}>` direkt kullan.

### 2.9 Step 2: template kart mode badge → düz `<span>` (inline-styled)
- 1.7'de detaylandı.

### 2.10 Footer button satırı: dikey margin
- **Prototip:** `marginTop: 24, justifyContent: "flex-end"` + `<div style={{ flex: 1 }}/>`.
- **Implementasyon:** `marginTop: 24` + `<div style={{ flex: 1 }} />` ama **`justifyContent` yok** — Geri/Devam/Oluştur düzgün hizalanıyor mu?
- **Fark:** Aslında `flex: 1` divider ile aynı sonuç çıkıyor; küçük: prototip semantik olarak daha açık.
- **Öncelik:** Low

---

## 3. BİLİNMEYEN EXTRAS

### 3.1 sessionStorage draft auto-save
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:10, 12-21, 136-172`
- **Açıklama:** `WIZARD_DRAFT_KEY = 'spms_wizard_draft'` ile her field değişimde `sessionStorage`'a yazılıyor; mount'ta restore ediliyor; submit success'te temizleniyor. Prototipte böyle bir feature yok.
- **Risk:** UX iyi olsa da:
  - Birden fazla wizard sekmesi açıkken state çakışması.
  - `JSON.parse` corrupt veride sessize alınıyor (catch boş) — debug zorlaşır.
- **Öneri:** Eğer ürün kararıysa kalsın; aksi halde kaldırılabilir veya **per-user/per-tab namespacing** uygulansın.

### 3.2 URL-based step state (`?step=`)
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:112, 119, 181, 185-187`
- **Açıklama:** Step state `useSearchParams` ile URL'de tutuluyor (`Math.min(4, Math.max(1, ...))`); back/forward navigation kullanılabilir, deep link mümkün. Prototipte tek `useState(1)` var.
- **Risk:** Pozitif; ama:
  - Direct URL (`/projects/new?step=4`) ile validasyon bypass edilebilir (1.4'te kontrol değil!).
  - Geri butonu Step 1'de `/projects`'e yönlendiriyor (prototipte sadece Geri buton hidden).
- **Öneri:** Bypass için: ileri adıma geçilebilirken önceki adımların validation flag'i tutulmalı (`hasVisitedStep` veya draft validation).

### 3.3 React Query (`useCreateProject`, `useProcessTemplates`)
- **Dosya:** `Frontend2/hooks/use-projects.ts:38-46, 90-96`
- **Açıklama:** Backend entegrasyonu için TanStack Query mutation/query'ler. Prototip mock router (`router.go(...)`) kullanıyor.
- **Risk:** Beklenen ve doğru. (Prototip backend bağlama yapmıyor; bu **gerekli** extra.)
- **Öneri:** Tutulmalı.

### 3.4 Toast bildirimleri (`showToast`)
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:8, 218-237`
- **Açıklama:** Submit başarı/hata için toast tetikleniyor. Prototipte yok (prototip toast altyapısı henüz çağırmıyor bu sayfada).
- **Risk:** Pozitif; tutulmalı.

### 3.5 `Suspense` boundary + fallback "Yükleniyor..."
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:590-602`
- **Açıklama:** `useSearchParams` Next.js prerendering kuralı için zorunlu. Yorum: "REQUIRED: useSearchParams() MUST be inside a Suspense boundary."
- **Risk:** Doğru ve gerekli; tutulmalı. Ama fallback metni İngilizce/Türkçe karışık değil — sadece TR ("Yükleniyor...").
- **Öneri:** Fallback metnini de language'e göre ver (kullanıcı EN ise "Loading...").

---

## 4. BİLİNEN EXTRAS (UYARI)
Yok.

---

## 5. HATALI / SORUNLU KOD

### 5.1 `methodologyMap` magic mapping — i18n çeviri yapılmış template ismiyle çakışıyor
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:194-202`
- **Sorun türü:** Bug
- **Açıklama:** `selectedTemplate?.name` lowercase'e çevrilip `{ scrum, kanban, waterfall }` map'ine bakıyor. Eğer backend template adı **"Artırımlı"** (TR) veya **"V-Model"** dönerse `methodologyMap[templateNameLower]` undefined olur ve fallback `'SCRUM'` seçilir — **kullanıcı V-Model seçmiş olsa bile backend SCRUM kaydeder**. Sessiz veri kaybı.
- **Öneri:** Backend template'inin **ID veya methodology kanonik enum field'ı** üstünden mapleme yap. Örn. `selectedTemplate.methodology` field'ı varsa onu kullan; yoksa template ID + lookup tablosu.
- **Öncelik:** **Critical**

### 5.2 `createProject({ start_date: startDate || new Date().toISOString() })` — boş tarih için backend'e yanlış format
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:208`
- **Sorun türü:** Bug
- **Açıklama:** Date input boşsa `new Date().toISOString()` (full ISO datetime, örn. `"2026-04-25T14:30:00.000Z"`) gönderiliyor; doluysa input'tan gelen `YYYY-MM-DD` string'i (örn. `"2026-04-25"`) gönderiliyor. Backend iki farklı format alıyor — schema validasyonu yapıyorsa biri reject olabilir.
- **Öneri:** `startDate || new Date().toISOString().slice(0, 10)` (sadece tarih kısmı).
- **Öncelik:** High

### 5.3 Step 3'te `selectedTemplate` lookup `useProcessTemplates` data yenilenirse stale
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:191`
- **Sorun türü:** Bug (race condition) / Type
- **Açıklama:** `(templates as any[]).find((t: any) => t.id === selectedTemplateId)` her render'da çalışıyor. Templates query `staleTime: 5 * 60 * 1000` ile 5 dakika cache'leniyor; refetch sonrası ID'lerin değişmediği varsayımı doğru ama **`as any` 2 kere kullanılmış** ve her template'in shape'i (default_workflow vb.) tip-güvensiz.
- **Öneri:** `Template` interface tanımla (`{ id, name, description, default_workflow?: { mode, nodes: Array<{label?: string; name?: string}>, edges } }`); `useProcessTemplates`'ten generic dönüş tipi.
- **Öncelik:** Medium

### 5.4 Form alanlarında `aria-invalid` / error association yok
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:262-291` (Project Name & Key inputs)
- **Sorun türü:** A11y
- **Açıklama:** `name.trim().length > 0` ve `key.trim().length > 0` validation yapılıyor ama:
  - Hiçbir hata mesajı render edilmiyor (input boş kalırsa Devam butonu disabled, ama kullanıcı **niye** disabled olduğunu görmüyor).
  - `aria-invalid`, `aria-describedby` yok.
  - Required `*` işareti sadece görsel.
- **Öneri:** Validation hatası göster ("Proje adı zorunludur"), `aria-invalid={!step1Valid}`, error'u `aria-describedby` ile bağla. Submit edildiğinde focus ilk hatalı alana çekilsin.
- **Öncelik:** High

### 5.5 `<label>` for/htmlFor binding yok
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:259-262, 274-277, 301-303, 321-323, 332-334`
- **Sorun türü:** A11y
- **Açıklama:** Tüm `<label>` element'leri `<input>` kardeşi olarak yazılmış ama `htmlFor` ve input'a `id` verilmemiş. Screen reader label-input bağlantısını kuramaz.
- **Öneri:** Her input için `id` ata, label'a `htmlFor` ver. Veya prototipteki gibi `<label>` etrafında sarmala (prototip pattern, daha basit).
- **Öncelik:** High

### 5.6 `(templates as any[])` — type drift
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:191, 373, 381`
- **Sorun türü:** Type
- **Açıklama:** 3 farklı yerde `as any[]` cast'i. Hooks katmanında zaten `useProcessTemplates` tipsiz dönüyor (`projectService.getProcessTemplates` `Promise<any>`). Bu, tüm wizard akışında tip güvenliğini siliyor.
- **Öneri:** `services/project-service.ts:150-153`'e `Template` interface ve dönüş tipi ekle, hook ve component'te cast kalksın.
- **Öncelik:** Medium

### 5.7 `key` prop olarak `i` (index) — kolon değişiminde React reconciliation hatası
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:500`
- **Sorun türü:** Bug (React anti-pattern)
- **Açıklama:** `columns.map((col, i) => <div key={i}>...)` — kullanıcı kolonu silerse veya yer değiştirirse, input state'i (focus, caret position) yanlış kolona yapışabilir. Prototip de aynı problemi yapıyor (`key={i}` line 264) ama implementasyonun dikkat etmesi beklenirdi.
- **Öneri:** Kolonları `{ id: nanoid(), name: '...' }` shape'ine çek, `key={col.id}` kullan.
- **Öncelik:** Medium

### 5.8 Template mode raw render (i18n yok)
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:411`
- **Sorun türü:** Style drift / i18n
- **Açıklama:** `template.default_workflow?.mode ?? 'flexible'` raw string olarak gösteriliyor. TR dil seçili olsa bile "sequential-locked" English literal görünüyor. Prototipte `modeBadge()` Badge primitive ile + i18n çeviri.
- **Öneri:** 1.7'deki `modeBadge` helper'ı portla.
- **Öncelik:** High

### 5.9 Submit butonu loading state'inde icon kayıp
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:577-582`
- **Sorun türü:** Style drift
- **Açıklama:** Prototipte create button: `<Button variant="primary" icon={<Icons.Check size={13}/>}>Projeyi Oluştur</Button>` (check icon ile). Implementasyonda **icon hiç yok** + loading state'inde `"Oluşturuluyor..."` ile değişiyor (spinner yok).
- **Öneri:** Icon ekle, loading'de `<Icons.Spinner size={13}/>` veya `aria-busy="true"`.
- **Öncelik:** Medium

### 5.10 `step2Valid = selectedTemplateId !== null || selectedMethodology !== ''` — `||` bug
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:176`
- **Sorun türü:** Bug
- **Açıklama:** Template seçilince hem `selectedTemplateId` hem `selectedMethodology` set ediliyor (`389-390`). Bu `||` ifadesi her zaman `true` döner ama `setSelectedMethodology('')` durumu (template seçilip sonra cleared) için yanlış: `selectedTemplateId !== null && selectedMethodology !== ''` mu yoksa `selectedTemplateId !== null` mı amaç belirsiz. Aslında `selectedMethodology` hiç UI'da bağımsız set edilemiyor (kullanıcı sadece template seçer); bu satır dead code semantiği taşıyor.
- **Öneri:** `selectedTemplateId !== null` yeterli; ikinci koşul kaldırılsın.
- **Öncelik:** Low

### 5.11 `e.preventDefault` ve form submit semantiği yok
- **Dosya:** `Frontend2/app/(shell)/projects/new/page.tsx:240-585`
- **Sorun türü:** A11y / Bug
- **Açıklama:** Form `<form onSubmit>` element'i içinde değil; tüm input'lar Enter tuşuna basıldığında form submit etmiyor (autoFocus'lu Project Name'de Enter hiçbir şey yapmıyor). Prototipte de aynı, ama klavye kullanıcısı için "Devam" mouse-only bir aksiyon. Step 1'de Enter'a `advanceStep` çağırması beklenir.
- **Öneri:** `<form onSubmit={(e) => { e.preventDefault(); advanceStep(); }}>` ile sarmala (her step için), submit button `type="submit"`.
- **Öncelik:** Medium

---

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| # | Öncelik | Madde | Dosya | Bölüm |
|---|---------|-------|-------|-------|
| 1 | **Critical** | Step 3'te `WorkflowCanvas` + sağ panel (Akış Modu/Selection/Validation) ve canvas footer toolbar mount edilmeli | `Frontend2/app/(shell)/projects/new/page.tsx:438-484` | 1.9, 1.10, 1.11, 1.12, 1.13, 2.3 |
| 2 | **Critical** | Step 4: Görev Alanları kartı (9 toggle) eklenmeli | `Frontend2/app/(shell)/projects/new/page.tsx:551` | 1.14 |
| 3 | **Critical** | Step 4: Davranış Kuralları kartı (4 toggle) eklenmeli | `Frontend2/app/(shell)/projects/new/page.tsx:551` | 1.15 |
| 4 | **Critical** | Step 4: Üye Davet kartı eklenmeli + member_ids submit'e dahil | `Frontend2/app/(shell)/projects/new/page.tsx:551` | 1.16 |
| 5 | **Critical** | Step 1: Proje Yöneticisi (Project Lead) `<select>` alanı eklenmeli + manager_id submit | `Frontend2/app/(shell)/projects/new/page.tsx:343` | 1.2, 1.3 |
| 6 | **Critical** | Step indicator: label'ı dairenin yanına yatay yerleştir | `Frontend2/app/(shell)/projects/new/page.tsx:65` | 2.1 |
| 7 | **Critical** | `methodologyMap` lookup template name yerine kanonik field üstünden olmalı | `Frontend2/app/(shell)/projects/new/page.tsx:196-202` | 5.1 |
| 8 | High | Step 2: Mode badge `Badge` primitive + `modeBadge` helper + i18n | `Frontend2/app/(shell)/projects/new/page.tsx:401-413` | 1.7, 5.8 |
| 9 | High | Step 1: Proje Anahtarı yardım metni input ile yan yana, maxLength 6 | `Frontend2/app/(shell)/projects/new/page.tsx:273-297` | 1.1 |
| 10 | High | Step 4: Default columns 4 olmalı ("İncelemede" geri ekle, "Bitti" → "Tamamlandı"), WIP placeholder `∞`, `Button` primitive | `Frontend2/app/(shell)/projects/new/page.tsx:133, 511-514, 534-550` | 1.17 |
| 11 | High | `ModalField` reusable component (label `<label>` + `--fg-muted`) | `Frontend2/app/(shell)/projects/new/page.tsx` (her form alanı) | 1.4, 5.5 |
| 12 | High | `aria-invalid` / error message rendering | `Frontend2/app/(shell)/projects/new/page.tsx:262-297` | 5.4 |
| 13 | High | `start_date` boş tarih için ISO format tutarsızlığı | `Frontend2/app/(shell)/projects/new/page.tsx:208` | 5.2 |
| 14 | Medium | Step 2: "Özel Şablonlar" overline grid (EXTRA_LIFECYCLES için) | `Frontend2/app/(shell)/projects/new/page.tsx:431` | 1.6 |
| 15 | Medium | Step indicator: `Icons.Check` central icon kullan | `Frontend2/app/(shell)/projects/new/page.tsx:90-92` | 2.2 |
| 16 | Medium | Step 2: Card wrapper `<div onClick>` çift event handler — Card primitive direkt onClick alsın | `Frontend2/app/(shell)/projects/new/page.tsx:384-391` | 2.8 |
| 17 | Medium | `Template` interface, `as any[]` cast'leri kaldır | `Frontend2/services/project-service.ts:150`, `Frontend2/app/(shell)/projects/new/page.tsx:191, 373, 381` | 5.3, 5.6 |
| 18 | Medium | Kolonlar `{id, name}` shape, `key={col.id}` | `Frontend2/app/(shell)/projects/new/page.tsx:133, 500` | 5.7 |
| 19 | Medium | Submit butonu icon ve loading spinner ekle | `Frontend2/app/(shell)/projects/new/page.tsx:577-582` | 5.9 |
| 20 | Medium | `<form onSubmit>` ile sarmala, Enter ile advanceStep | `Frontend2/app/(shell)/projects/new/page.tsx:240-585` | 5.11 |
| 21 | Low | `step2Valid` `||` ifadesi sadeleştir | `Frontend2/app/(shell)/projects/new/page.tsx:176` | 5.10 |
| 22 | Low | Footer button satırı `justifyContent: flex-end` ekle (semantic) | `Frontend2/app/(shell)/projects/new/page.tsx:565` | 2.10 |
| 23 | Low | Suspense fallback i18n | `Frontend2/app/(shell)/projects/new/page.tsx:594` | 3.5 |
| 24 | Low | Step 4 kart başlığı tipografi `fontSize: 13` (14 değil) | `Frontend2/app/(shell)/projects/new/page.tsx:495, 555` | 1.18 |
| 25 | Low | Açıklama textarea `rows={3}` ile | `Frontend2/app/(shell)/projects/new/page.tsx:307` | 2.6 |

---

## 7. KAPSAM NOTLARI

### Okunan dosyalar
- `New_Frontend/src/pages/create-project.jsx` (393 satır — tam)
- `New_Frontend/src/pages/create-task-modal.jsx:240-273` (`ModalField` ve `inputStyle` referansı)
- `New_Frontend/src/pages/workflow-editor.jsx:1-313` (`WorkflowCanvas` ve `ValidationItem` referansı)
- `New_Frontend/src/data.jsx:1-200, 270-319` (`USERS`, `DEFAULT_LIFECYCLES`, `EXTRA_LIFECYCLES`)
- `New_Frontend/src/icons.jsx:1-150`
- `New_Frontend/src/primitives.jsx:240-307` (SegmentedControl, Toggle)
- `Frontend2/app/(shell)/projects/new/page.tsx` (603 satır — tam)
- `Frontend2/hooks/use-projects.ts` (106 satır — tam)
- `Frontend2/services/project-service.ts` (181 satır — tam)
- `Frontend2/components/primitives/index.ts`
- `Frontend2/components/primitives/segmented-control.tsx`
- `Frontend2/components/primitives/badge.tsx`

### Atlanan/eksik kalan
- `New_Frontend/src/i18n.jsx` aranmasında "create-project" key'i bulunamadı; prototip i18n string'lerini direct page içinde `T(tr, en)` helper ile inline tanımlıyor — buradan ek copy çıkmıyor.
- `Frontend2/components/workflow-editor/workflow-canvas.tsx` reuse potansiyeli için detaylı şema okunmadı; sadece var olduğu doğrulandı (Glob).
- Backend `POST /projects` ve `GET /process-templates` shape'leri doğrulanmadı; `methodology` enum, `manager_id`, `member_ids`, `process_config.fields/rules` field kontratı varsayım üzerinden konuşuldu.
- Frontend2'da `useUsers` hook'unun var olup olmadığı kontrol edilmedi (1.2 ve 1.16 için gerekli).

### Belirsizlikler
- **Backend-driven mı, prototip mock'u eşleyecek miyiz?** Prototip Step 4'teki tüm `fields`/`rules`/`columns`/`invitedMembers` state'leri **backend'e iletilen şey** mi yoksa sadece UI sketch mi belli değil. Eğer backend'in `process_config` schema'sı bu field'ları desteklemiyorsa, eklemeden önce backend uzantısı gerekli.
- **`process-templates` endpoint dönüş şekli:** `default_workflow.mode`, `default_workflow.nodes` field'ları implementasyonda kullanılıyor (411, 463) ama tip kontratı yok. Eğer backend `mode` yerine `workflow_mode` döndürüyorsa silent fail.
- **Step 1'de Lead ID'nin backend kontratı:** `CreateProjectDTO`'da `manager_id` field'ı var mı belirsiz; eğer backend'de `lead_id` ise refactor gerekli.
- **`EXTRA_LIFECYCLES` (v-model, spiral) ana template grid'i içinde mi yoksa "Custom" altında mı dönüyor?** Prototipte 6 template'in 3'ü row 1, 3'ü row 2 (incremental row 2 ama EXTRA_LIFECYCLES'te yok); v-model ve spiral hem row 2'de hem custom altında dolaylı görünüyor — prototip kendi içinde tutarsız (1.6 ve 1.8 buradan kaynaklı).
