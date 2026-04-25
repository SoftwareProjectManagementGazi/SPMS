# Teams (Ekipler) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-teams
**Prototip kaynak:**
- New_Frontend/src/app.jsx — `TEAMS_SEED` (lines 200-209), `FOLDERS_SEED` (lines 211-216), `TeamsPage` (lines 218-434), `FolderNavItem` (lines 436-456), `TeamCard` (lines 458-516)
- New_Frontend/src/primitives.jsx — `Card` (lines 121-142), `Avatar`/`AvatarStack` (lines 6-43), `Badge` (lines 46-70), `Input` (lines 216-233), `Button` (lines 73-118)
- New_Frontend/src/icons.jsx — `Folder`, `Workflow`, `Sparkle`, `Chart`, `Shield`, `ChevronRight`, `Plus`, `MoreH`, `Edit`, `X`, `Search`, `Check`, `Dashboard`
- New_Frontend/src/data.jsx — `USERS`, `TASKS`, `getUser` (lines 3-14, 64-97, 207)
- New_Frontend/src/i18n.jsx — `nav.teams = { tr: "Takımlar", en: "Teams" }` (line 7)

**Implementasyon kaynak:**
- Frontend2/app/(shell)/teams/page.tsx (TAMAMI 12 satır — placeholder stub)
- Frontend2/services/led-teams-service.ts (sadece `/users/me/led-teams` çağrısı; bu sayfa için kullanılmıyor)
- Frontend2/hooks/use-led-teams.ts (sadece `useLedTeams` hook'u; bu sayfa için kullanılmıyor)
- Frontend2/lib/i18n.ts (line 20: `teams: { tr: "Takımlar", en: "Teams" }` — sadece sidebar için)
- Frontend2/components/sidebar.tsx (lines 317-321 — `/teams` rotası ve `<Users>` ikonu mevcut)

**Bilinen intentional extras:** Yok.

## TL;DR Özet
- Eksik elementler: 22
- Layout/şekil farkı: 0 (zaten hiçbir şey implement edilmemiş)
- Bilinmeyen extras: 1
- Bilinen extras: 0
- Hatalı kod: 5
- **EN KRİTİK 3 MADDE:**
  1. **Teams sayfasının %100'ü yok** — `Frontend2/app/(shell)/teams/page.tsx` 12 satırlık placeholder ("Teams page will be implemented in a later phase."). Prototipteki ~217 satırlık `TeamsPage` (sağ sidebar kategori ağacı + ana panel klasör/grid görünümü + arama + view-switcher + "Yeni takım" butonu + 8 takım kartı + lead/üye/görev sayıları + Kategori Ekle/Yeniden Adlandır/Sil + "Kategoriye Taşı" pop-up menü + Özet paneli) tamamen eksik.
  2. **i18n / TR-EN dil duyarlılığı yok** — Implementasyon hard-coded İngilizce başlık (`<h1>Teams</h1>` ve "Teams page will be implemented in a later phase."); `useApp().language` veya `t("nav.teams", lang)` kullanılmıyor. Tüm sayfa bilingualize edilmeli.
  3. **`localStorage` persistans katmanı, `TEAMS_SEED`/`FOLDERS_SEED` mock veri ve domain modeli yok** — Prototipteki `spms.teams`, `spms.teamFolders`, `spms.teamFoldersOpen`, `spms.teamsView` keylerinin Frontend2 karşılığı bulunmuyor. Backend (Phase 9 D-17) sadece `/users/me/led-teams` döndürüyor; tam Team listesi/folder modeli/üye ilişkisi/move-to-folder mutasyonu için ne servis ne hook var — yapı baştan kurulmalı.

## 1. EKSİK ELEMENTLER

### 1.1 Tüm sayfa içeriği (sayfa stub)
- **Prototipte:** `New_Frontend/src/app.jsx:218-434` (`TeamsPage` bileşeninin tamamı)
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** Prototip iki kolonlu grid (`gridTemplateColumns: "1fr 240px"`) — sol ana panel + sağ 240px sticky sidebar. Implementasyon sadece "Teams page will be implemented in a later phase." metnini gösteriyor.
- **Prototip kod alıntısı:**
  ```jsx
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 24, height: "100%" }}>
      {/* Main: teams display */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        ...header + view + grid...
      </div>
      {/* Sidebar: folder tree (right) */}
      <Card padding={16} style={{ height: "fit-content", position: "sticky", top: 70 }}>
        ...
      </Card>
    </div>
  );
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Prototipteki `TeamsPage` bileşeninin tamamını TypeScript + Next.js client component olarak yeniden yazın. `"use client"` direktifi gerekli (state, effect, localStorage kullanımı var). Tüm aşağıdaki maddeler bu rebuild'in alt parçaları.

### 1.2 Sağ kategori sidebar'ı (`Card padding={16}`, 240px, sticky)
- **Prototipte:** `New_Frontend/src/app.jsx:376-431`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** 240px genişlik, `top: 70` sticky, `Card padding={16}`. İçinde "Kategoriler" / "Categories" başlığı + sağında `Plus` ikonu (kategori ekle), `FolderNavItem` listesi (Tüm Takımlar + dinamik klasörler + Kategorisiz) ve altında "Özet" mini-paneli.
- **Prototip kod alıntısı:**
  ```jsx
  <Card padding={16} style={{ height: "fit-content", position: "sticky", top: 70 }}>
    <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>
        {lang === "tr" ? "Kategoriler" : "Categories"}
      </div>
      <div style={{ flex: 1 }}/>
      <button onClick={() => setEditingFolder("new")} title={lang === "tr" ? "Kategori ekle" : "Add category"}
        style={{ color: "var(--fg-muted)", padding: 4, borderRadius: 6 }}>
        <Icons.Plus size={14}/>
      </button>
    </div>
    ...
  </Card>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `Card` primitive'ini `padding={16}` ile sarın, `position: "sticky"` ve `top: 70` Header altına oturtun.

### 1.3 `FolderNavItem` bileşeni (kategori satırı)
- **Prototipte:** `New_Frontend/src/app.jsx:436-456`
- **Olması gereken implementasyon yeri:** Yeni dosya: `Frontend2/components/teams/folder-nav-item.tsx`
- **Görsel/davranış:** 6/8 px padding'li satır; `active=true` ise `var(--accent)` arka plan + `fontWeight: 600`; hover'da `var(--surface-2)`. İkon (sol) + label + sayı (mono, 10.5px) + hover'da görünen Edit/Delete butonları (`opacity: 0` → `1`). `editNode` prop'u verildiğinde label yerine inline `<input>` rendere edilir. `muted=true` durumunda gri renk.
- **Prototip kod alıntısı:**
  ```jsx
  const FolderNavItem = ({ active, onClick, icon, label, count, muted, onEdit, onDelete, editNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 6, fontSize: 13, background: active ? "var(--accent)" : "transparent", color: active ? "var(--fg)" : (muted ? "var(--fg-muted)" : "var(--fg)"), fontWeight: active ? 600 : 500, cursor: "pointer", group: 1 }}
      className="folder-nav-item"
      onClick={onClick}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; const btns = e.currentTarget.querySelector(".folder-actions"); if (btns) btns.style.opacity = "1"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; const btns = e.currentTarget.querySelector(".folder-actions"); if (btns) btns.style.opacity = "0"; }}>
      ...
      <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>{count}</span>
      {(onEdit || onDelete) && (
        <div className="folder-actions" style={{ display: "flex", gap: 2, opacity: 0, transition: "opacity 0.1s" }}>
          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} ...><Icons.Edit size={11}/></button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete category?")) onDelete(); }} ...><Icons.X size={11}/></button>}
        </div>
      )}
    </div>
  );
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Imperative `onMouseEnter/Leave` yerine CSS hover (`hover-row` benzeri sidebar.tsx'teki yaklaşım) kullanın. `confirm()` yerine UI-SPEC §158 ContextMenu deseninde bir AlertDialog primitive ile değiştirilmeli. Edit `lucide-react` `Pencil` veya `Edit2`, X `lucide-react` `X` ile.

### 1.4 `TeamCard` bileşeni (takım kartı)
- **Prototipte:** `New_Frontend/src/app.jsx:458-516`
- **Olması gereken implementasyon yeri:** Yeni dosya: `Frontend2/components/teams/team-card.tsx`
- **Görsel/davranış:** `Card padding={16}` + üstte 38×38 renkli baş harfli kare (`borderRadius: 9`, `color-mix(in oklch, ${team.color} 18%, transparent)`), takım adı (14px, fontWeight 600), lead avatar+adı (11.5px). Sağ üstte `MoreH` ikonu — dropdown "Kategoriye taşı" menüsü. İçinde mevcut klasör pill'i (`border + fontSize 10.5`). Altta border-top + AvatarStack + "X üye" + sağda "Y görev" mono.
- **Prototip kod alıntısı:**
  ```jsx
  const TeamCard = ({ team, lang, T, folders, onMove, moveMenuFor, setMoveMenuFor, totalTasks }) => {
    const lead = window.SPMSData.getUser(team.lead);
    const members = team.members.map(window.SPMSData.getUser);
    const currentFolder = folders.find(f => f.id === team.folder);
    return (
      <Card padding={16} style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: `color-mix(in oklch, ${team.color} 18%, transparent)`, color: team.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{T(team.name)[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, ... }}>{T(team.name)}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <Avatar user={lead} size={14}/>
              <span>{lead?.name}</span>
            </div>
          </div>
          ...
        </div>
        ...
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <AvatarStack users={members} size={22}/>
          <span style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>{members.length} {lang === "tr" ? "üye" : "members"}</span>
          <div style={{ flex: 1 }}/>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{totalTasks} {lang === "tr" ? "görev" : "tasks"}</span>
        </div>
      </Card>
    );
  };
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Mevcut `Card`/`Avatar`/`AvatarStack` primitive'leri kullanılabilir. `team.color` (örn. `var(--primary)`, `var(--status-progress)`, `oklch(...)`) için `color-mix` izlenmeli — color/bg iki ayrı varsayım.

### 1.5 Move-to-folder dropdown menü (`TeamCard` içi)
- **Prototipte:** `New_Frontend/src/app.jsx:473-500`
- **Olması gereken implementasyon yeri:** `Frontend2/components/teams/team-card.tsx` (`<MoveMenu>` alt bileşeni)
- **Görsel/davranış:** `MoreH` butonuna tıklayınca açılır; `position: absolute, top: 100%, right: 0`, 180px min-width, üstte küçük "MOVE TO" başlığı; klasör butonları (mevcut klasör `var(--accent)` arka planlı + sağ tarafta `Check` ikonu), divider, "Kategoriden çıkar" satırı (`X` ikonu).
- **Prototip kod alıntısı:**
  ```jsx
  {moveMenuFor === team.id && (
    <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "var(--surface)", boxShadow: "0 8px 20px oklch(0 0 0 / 0.15), inset 0 0 0 1px var(--border)", borderRadius: 8, padding: 4, minWidth: 180, zIndex: 20 }}
      onMouseLeave={() => setMoveMenuFor(null)}>
      <div style={{ padding: "6px 10px", fontSize: 10.5, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {lang === "tr" ? "Kategoriye taşı" : "Move to"}
      </div>
      {folders.map(f => (
        <button key={f.id} onClick={() => onMove(team.id, f.id)}
          style={{ ..., background: team.folder === f.id ? "var(--accent)" : "transparent", ... }}>
          <Icons.Folder size={12} style={{ color: "var(--fg-subtle)" }}/>
          <span>{T(f.name)}</span>
          {team.folder === f.id && <Icons.Check size={11} style={{ marginLeft: "auto", color: "var(--primary)" }}/>}
        </button>
      ))}
      <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }}/>
      <button onClick={() => onMove(team.id, "_uncat")} ...>
        <Icons.X size={12}/><span>{lang === "tr" ? "Kategoriden çıkar" : "Remove from category"}</span>
      </button>
    </div>
  )}
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `onMouseLeave` ile dismiss yetersiz (a11y problemi) — click-outside (sidebar.tsx:176-183 deseni) + Esc tuşu desteği eklenmeli. shadcn-DropdownMenu yasak; özel bir Popover yazın.

### 1.6 Üst başlık (selected folder name + alt başlık)
- **Prototipte:** `New_Frontend/src/app.jsx:299-309`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** 22px / 600 / -0.4 letter-spacing dinamik başlık ("Takımlar" / "Kategorisiz" / klasör adı) + 13px alt başlık ("Üyeler birden fazla takımda ve projede yer alabilir.").
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>
    {selectedFolder === "all" ? (lang === "tr" ? "Takımlar" : "Teams") :
     selectedFolder === "_uncat" ? (lang === "tr" ? "Kategorisiz" : "Uncategorized") :
     T(folders.find(f => f.id === selectedFolder)?.name || { tr: "", en: "" })}
  </div>
  <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>
    {lang === "tr" ? "Üyeler birden fazla takımda ve projede yer alabilir." : "Members can belong to multiple teams & projects."}
  </div>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Implementasyondaki `<h1 style={{ fontSize: 16 ... }}>Teams</h1>` (4. satır) tamamen yanlış (16 → olmalı 22, semantik h1 değil; prototip plain `<div>` kullanıyor — ama bunlar da örtüşmemeli; semantik için h1 kalabilir, ama font-size 22 olmalı).

### 1.7 Search input (sağ tarafa yapışık, 200px, sm size)
- **Prototipte:** `New_Frontend/src/app.jsx:311-312`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** Sağ üst — `Search` ikonu (13px) + "Takım ara…" placeholder + 200px sabit genişlik + sm size.
- **Prototip kod alıntısı:**
  ```jsx
  <Input icon={<Icons.Search size={13}/>} placeholder={lang === "tr" ? "Takım ara…" : "Search teams…"}
    value={search} onChange={(e) => setSearch(e.target.value)} size="sm" style={{ width: 200 }}/>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Mevcut `Input` primitive ile direkt portlanabilir.

### 1.8 View switcher (Folders / Grid segmented control)
- **Prototipte:** `New_Frontend/src/app.jsx:313-318`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** İki butonlu inline segmented control — `var(--surface-2)` arka planlı, 2px padding, 6px radius, inset border. Aktif buton `var(--surface)` + `var(--fg)`; pasif `transparent` + `var(--fg-muted)`. İkonlar: `Folder` (size 13) ve `Dashboard` (size 13).
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
    <button onClick={() => setView("folders")} title={lang === "tr" ? "Klasör" : "Folders"}
      style={{ padding: "5px 8px", borderRadius: 4, background: view === "folders" ? "var(--surface)" : "transparent", color: view === "folders" ? "var(--fg)" : "var(--fg-muted)" }}><Icons.Folder size={13}/></button>
    <button onClick={() => setView("grid")} title={lang === "tr" ? "Izgara" : "Grid"}
      style={{ padding: "5px 8px", borderRadius: 4, background: view === "grid" ? "var(--surface)" : "transparent", color: view === "grid" ? "var(--fg)" : "var(--fg-muted)" }}><Icons.Dashboard size={13}/></button>
  </div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Mevcut `SegmentedControl` primitive (Frontend2/components/primitives/segmented-control.tsx) iki opsiyon ile kullanılabilir; ya da bu ikon-only varyant için özel inline blok. SegmentedControl en az "label" zorunlu kıldığı için icon-only varyant gerekirse genişletilmeli.

### 1.9 "Yeni takım" / "New team" butonu
- **Prototipte:** `New_Frontend/src/app.jsx:319`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx` (header sağda)
- **Görsel/davranış:** `Button variant="primary" size="sm"` + `Plus` ikonu (13px) + label.
- **Prototip kod alıntısı:**
  ```jsx
  <Button variant="primary" size="sm" icon={<Icons.Plus size={13}/>}>
    {lang === "tr" ? "Yeni takım" : "New team"}
  </Button>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Mevcut `Button` primitive direkt kullanılabilir; `lucide-react` `Plus` size=13 verilmeli. Ancak prototipteki gibi onClick handler boş — backend yokken modal/toast bağlanmalı.

### 1.10 Folders view — collapsible folder grouping
- **Prototipte:** `New_Frontend/src/app.jsx:329-371`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** Klasör başlık satırı tıklanınca açılır/kapanır (`expanded[f.id]`), `ChevronRight` 90 derece dönüşü, klasör ikonu (`Workflow`/`Sparkle`/`Chart`/`Shield`/`Folder`), klasör adı, `Badge size="xs" tone="neutral">{count}` ve sağda mono "X üye" sayısı. Açıkken 26px sol margin'li 2-kolon grid içinde TeamCard'lar; takım yoksa dashed empty placeholder.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    {visibleFolders.map(f => {
      const ts = teamsByFolder[f.id] || [];
      ...
      const isOpen = expanded[f.id] !== false;
      return (
        <div key={f.id}>
          <div onClick={() => setExpanded({ ...expanded, [f.id]: !isOpen })} ...>
            <Icons.ChevronRight size={14} style={{ ..., transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.12s" }}/>
            <span style={{ color: f.muted ? "var(--fg-subtle)" : "var(--primary)", display: "inline-flex" }}>{folderIconFor(f.icon)}</span>
            <span style={{ fontSize: 14, fontWeight: 600, ... }}>{T(f.name)}</span>
            <Badge size="xs" tone="neutral">{ts.length}</Badge>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)" }} className="mono">
              {new Set(ts.flatMap(t => t.members)).size} {lang === "tr" ? "üye" : "members"}
            </span>
          </div>
          {isOpen && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 8, marginLeft: 26 }}>
              ...
            </div>
          )}
        </div>
      );
    })}
  </div>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Folder'ın açık/kapalı state'i `localStorage("spms.teamFoldersOpen")` üzerinden persist edilmeli (prototip `load("teamFoldersOpen", ...)`).

### 1.11 Grid view (2-kolon flat grid)
- **Prototipte:** `New_Frontend/src/app.jsx:323-328`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** `gridTemplateColumns: "repeat(2, 1fr)"`, 12px gap, klasör grouping olmadan tüm `filteredTeams` doğrudan listelenir.
- **Prototip kod alıntısı:**
  ```jsx
  {view === "grid" ? (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
      {(selectedFolder === "all" ? filteredTeams : filteredTeams.filter(t => (selectedFolder === "_uncat" ? !t.folder : t.folder === selectedFolder))).map(t => (
        <TeamCard ... />
      ))}
    </div>
  ) : ...}
  ```
- **Öncelik:** High

### 1.12 Sol-sidebar "Tüm Takımlar" entry + ayraç
- **Prototipte:** `New_Frontend/src/app.jsx:386-388`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx` sağ sidebar
- **Görsel/davranış:** `FolderNavItem active={selectedFolder === "all"}`, `Folder` (14px), label "Tüm Takımlar" / "All Teams", count = `teams.length`. Altında 8px boşluk.
- **Prototip kod alıntısı:**
  ```jsx
  <FolderNavItem active={selectedFolder === "all"} onClick={() => setSelectedFolder("all")}
    icon={<Icons.Folder size={14}/>} label={lang === "tr" ? "Tüm Takımlar" : "All Teams"} count={teams.length}/>
  <div style={{ height: 8 }}/>
  ```
- **Öncelik:** Critical

### 1.13 Sidebar — dinamik klasör listesi + edit/delete handler bağlama
- **Prototipte:** `New_Frontend/src/app.jsx:389-407`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx` sağ sidebar
- **Görsel/davranış:** `folders.map(f => <FolderNavItem onEdit onDelete editNode .../>)` — inline rename input (`autoFocus`, onBlur ve Enter ile rename).
- **Prototip kod alıntısı:**
  ```jsx
  {folders.map(f => (
    <div key={f.id}>
      <FolderNavItem
        active={selectedFolder === f.id}
        onClick={() => setSelectedFolder(f.id)}
        icon={folderIconFor(f.icon)}
        label={editingFolder === f.id ? null : T(f.name)}
        count={teamsByFolder[f.id]?.length || 0}
        onEdit={() => setEditingFolder(f.id)}
        onDelete={() => deleteFolder(f.id)}
        editNode={editingFolder === f.id && (
          <input autoFocus defaultValue={T(f.name)}
            onBlur={(e) => renameFolder(f.id, e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && renameFolder(f.id, e.target.value)}
            ... />
        )}
      />
    </div>
  ))}
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Inline edit input için `onBlur` + Enter pattern aynen taşınabilir. Esc ile cancel desteği eklenmeli (prototip ayrıca yok).

### 1.14 Sidebar — "Kategorisiz" entry (koşullu)
- **Prototipte:** `New_Frontend/src/app.jsx:408-411`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** Sadece `teamsByFolder["_uncat"]?.length > 0` ise rendere edilir; `muted` flag, `Folder` 14px ikonu.
- **Prototip kod alıntısı:**
  ```jsx
  {teamsByFolder["_uncat"]?.length > 0 && (
    <FolderNavItem active={selectedFolder === "_uncat"} onClick={() => setSelectedFolder("_uncat")}
      icon={<Icons.Folder size={14}/>} label={lang === "tr" ? "Kategorisiz" : "Uncategorized"} count={teamsByFolder["_uncat"].length} muted/>
  )}
  ```
- **Öncelik:** High

### 1.15 Sidebar — "Yeni kategori" inline input (kategori ekle akışı)
- **Prototipte:** `New_Frontend/src/app.jsx:412-421`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** `editingFolder === "new"` iken `Folder` ikonu + inline `<input>` (`autoFocus`, "Kategori adı" placeholder), onBlur boşsa cancel, dolu ise `addFolder()`; Enter ile commit.
- **Prototip kod alıntısı:**
  ```jsx
  {editingFolder === "new" && (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", marginTop: 4 }}>
      <Icons.Folder size={14} style={{ color: "var(--fg-subtle)" }}/>
      <input autoFocus placeholder={lang === "tr" ? "Kategori adı" : "Category name"}
        value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
        onBlur={() => newFolderName ? addFolder() : setEditingFolder(null)}
        onKeyDown={(e) => e.key === "Enter" && addFolder()}
        style={{ flex: 1, height: 22, padding: "0 6px", fontSize: 13, background: "var(--surface)", borderRadius: 4, boxShadow: "inset 0 0 0 1px var(--primary)" }}/>
    </div>
  )}
  ```
- **Öncelik:** High

### 1.16 Sidebar — "Özet" mini-paneli (Kategori / Takım / Üye sayıları)
- **Prototipte:** `New_Frontend/src/app.jsx:423-430`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** `Card` içinde alt panel, `var(--surface-2)` arka plan, 8px radius, başlık `OZET` / `SUMMARY` (uppercase, 11px, letter-spacing 0.5). 3 satır flex justify-between: Kategori, Takım, Üye sayıları (mono, 12px, fontWeight 600).
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ marginTop: 16, padding: 12, background: "var(--surface-2)", borderRadius: 8, boxShadow: "var(--shadow-sm), var(--inset-card)" }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
      {lang === "tr" ? "Özet" : "Summary"}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "var(--fg-muted)" }}>{lang === "tr" ? "Kategori" : "Categories"}</span>
        <span className="mono" style={{ fontWeight: 600 }}>{folders.length}</span>
      </div>
      <div ...>{lang === "tr" ? "Takım" : "Teams"} - {teams.length}</div>
      <div ...>{lang === "tr" ? "Üye" : "Members"} - {new Set(teams.flatMap(t => t.members)).size}</div>
    </div>
  </div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Üye sayısı `Set` ile distinct.

### 1.17 Empty states
- **Prototipte:** `New_Frontend/src/app.jsx:355-359` (klasör içinde takım yok) ve 365-369 (genel "Sonuç yok").
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** Klasör boşsa "Bu kategoride takım yok" / "No teams in this category" — dashed border, 16px padding, 12px text. Genel "Sonuç yok" / "No results" — 40px padding, 13px text.
- **Prototip kod alıntısı:**
  ```jsx
  {ts.length === 0 && (
    <div style={{ gridColumn: "1 / -1", padding: 16, textAlign: "center", fontSize: 12, color: "var(--fg-subtle)", border: "1px dashed var(--border-strong)", borderRadius: 8 }}>
      {lang === "tr" ? "Bu kategoride takım yok" : "No teams in this category"}
    </div>
  )}
  ...
  {visibleFolders.length === 0 && (
    <div style={{ padding: 40, textAlign: "center", color: "var(--fg-muted)", fontSize: 13 }}>
      {lang === "tr" ? "Sonuç yok" : "No results"}
    </div>
  )}
  ```
- **Öncelik:** Medium

### 1.18 Mock veri seed'leri (`TEAMS_SEED`, `FOLDERS_SEED`)
- **Prototipte:** `New_Frontend/src/app.jsx:200-216`
- **Olması gereken implementasyon yeri:** Yeni: `Frontend2/lib/teams/seed.ts` veya `Frontend2/services/team-service.ts` (mock fallback)
- **Görsel/davranış:** 8 takım (Mobil/Backend/Platform & DevOps/Veri & Analitik/Ürün Yönetimi/Tasarım/Müşteri Başarı/Güvenlik & Uyum), her birinin lead/members/color/folder bilgisi. 4 klasör (eng/product/data/ops) + Kategorisiz.
- **Prototip kod alıntısı:**
  ```jsx
  const TEAMS_SEED = [
    { id: "t1", name: { tr: "Mobil", en: "Mobile" }, lead: "u3", members: ["u3","u5","u6"], color: "var(--primary)", folder: "eng" },
    { id: "t2", name: { tr: "Backend", en: "Backend" }, lead: "u2", members: ["u2","u4","u8"], color: "var(--status-progress)", folder: "eng" },
    ...
  ];
  const FOLDERS_SEED = [
    { id: "eng", name: { tr: "Mühendislik", en: "Engineering" }, icon: "code" },
    { id: "product", name: { tr: "Ürün & Tasarım", en: "Product & Design" }, icon: "sparkle" },
    ...
  ];
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Backend (Phase 9 D-17) sadece `/users/me/led-teams` döndürüyor — tüm takımları + klasörü olan endpoint yok. Backend hazır olana kadar mock seed kullanılmalı (mevcut `services/led-teams-service.ts` desenini izleyip mock fallback ekleyin) ya da bu sayfa için Phase X bekletilmeli. Karar `.planning/UI-REVIEW.md`'de dokümente edilmeli.

### 1.19 `localStorage` persistans (folders/teams/expanded/view)
- **Prototipte:** `New_Frontend/src/app.jsx:220-236`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/teams/page.tsx`
- **Görsel/davranış:** `spms.teams`, `spms.teamFolders`, `spms.teamFoldersOpen`, `spms.teamsView` dört key. State değişiminde useEffect ile otomatik save.
- **Prototip kod alıntısı:**
  ```jsx
  const load = (k, d) => { try { const v = localStorage.getItem("spms." + k); return v !== null ? JSON.parse(v) : d; } catch(e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem("spms." + k, JSON.stringify(v)); } catch(e) {} };
  const [folders, setFolders] = useState(() => load("teamFolders", FOLDERS_SEED));
  const [teams, setTeams] = useState(() => load("teams", TEAMS_SEED));
  const [expanded, setExpanded] = useState(() => load("teamFoldersOpen", Object.fromEntries(FOLDERS_SEED.map(f => [f.id, true]))));
  const [view, setView] = useState(() => load("teamsView", "folders"));
  useEffect(() => save("teamFolders", folders), [folders]);
  useEffect(() => save("teams", teams), [teams]);
  useEffect(() => save("teamFoldersOpen", expanded), [expanded]);
  useEffect(() => save("teamsView", view), [view]);
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Next.js'te SSR hydration mismatch riski (yakın tarihli `7e2b700` commit'inde my-tasks için aynı sorun çözüldü) — `useState` initializer içinde `localStorage.getItem` çağırmak yerine `useEffect` ile mount sonrası set edin. Frontend2/hooks dizininde benzer pattern var (use-my-tasks-store.ts). Yeni `use-teams-store.ts` hook'u oluşturulup oraya kapsüllenebilir.

### 1.20 Klasör ikon mapper (`folderIconFor`)
- **Prototipte:** `New_Frontend/src/app.jsx:287-293`
- **Olması gereken implementasyon yeri:** `Frontend2/components/teams/folder-icon.tsx` veya inline yardımcı.
- **Görsel/davranış:** `code → Workflow`, `sparkle → Sparkle`, `chart → Chart`, `shield → Shield`, default → `Folder`. Tümü size 15.
- **Prototip kod alıntısı:**
  ```jsx
  const folderIconFor = (ic) => {
    if (ic === "code") return <Icons.Workflow size={15}/>;
    if (ic === "sparkle") return <Icons.Sparkle size={15}/>;
    if (ic === "chart") return <Icons.Chart size={15}/>;
    if (ic === "shield") return <Icons.Shield size={15}/>;
    return <Icons.Folder size={15}/>;
  };
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** lucide-react karşılıkları: `Workflow`, `Sparkles` (`Sparkle` lucide'da `Sparkles`), `BarChart3`, `Shield`, `Folder`. Frontend2 zaten `lucide-react` kullanıyor (sidebar.tsx).

### 1.21 i18n string anahtarları (Teams için detaylı)
- **Prototipte:** Hiçbir yerde — i18n.jsx içinde `nav.teams` dışında **hiç teams namespace'i yok**. Tüm strings inline `lang === "tr" ? "..." : "..."` olarak ifade edilmiş (TeamsPage içinde).
- **Olması gereken implementasyon yeri:** `Frontend2/lib/i18n.ts` — yeni namespace `teams: { ... }`
- **Görsel/davranış:** 14+ farklı string: page subtitle, ara, klasör/ızgara toggle title'ları, "Yeni takım", "Takımlar"/"Kategorisiz"/"Tüm Takımlar"/"Kategoriler", "Kategori ekle", "Bu kategoride takım yok", "Sonuç yok", "Özet"/"Kategori"/"Takım"/"Üye", "üye"/"görev", "Kategoriye taşı"/"Move to", "Kategoriden çıkar", "Yeni Kategori"/"Kategori adı", `confirm("Delete category?")`.
- **Öncelik:** Medium
- **Düzeltme önerisi:** Frontend2 stiline uyup `lib/i18n.ts` `STRINGS.teams` ekleyip `t("teams.subtitle", lang)` gibi sarın. (Frontend2 dashboard zaten `dashboard:` namespace'i kullanıyor.)

### 1.22 Service / hook katmanı (mock değil API)
- **Prototipte:** N/A (prototip mock data ile çalışıyor)
- **Olması gereken implementasyon yeri:** Yeni — `Frontend2/services/team-service.ts`, `Frontend2/services/team-folder-service.ts`, `Frontend2/hooks/use-teams.ts`, `Frontend2/hooks/use-team-folders.ts`
- **Görsel/davranış:** Mevcut `led-teams-service.ts` sadece `/users/me/led-teams` döndürüyor; tam takım listesi (lead/members/color/folder), folder CRUD, move-to-folder mutasyonları için endpoint **yok**.
- **Öncelik:** High (ya backend kontratı kararlaştırılmalı ya da mock-first kararı .planning'e işlenmeli)
- **Düzeltme önerisi:** D-XX karar: 
  1. Backend `/teams`, `/team-folders` endpoint'leri planlanırken bu sayfa Phase'ine bağlanmalı; veya
  2. Geçici mock seed + localStorage persistence (prototip 1:1) ile build edilip backend hazır olunca migration. CLAUDE.md DIP/repository pattern uyumlu olarak `ITeamRepository` arayüzü tanımlanmalı (FE tarafından da Mock implementasyon).

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

Implementasyondaki tek render bir başlık + kısa metinden ibaret olduğundan layout-level karşılaştırma anlamlı değil. **Her görsel öğe Bölüm 1'de "eksik" olarak listelenmiştir.** Stub'a özel:

### 2.1 (Tek bulguyu çakışmasın diye burada da kayıt)
- **Prototip:** `New_Frontend/src/app.jsx:295-433` — iki kolon grid (1fr + 240px), 24px gap, full height.
- **Implementasyon:** `Frontend2/app/(shell)/teams/page.tsx:2-11` — düz `<div>` + h1 + p; layout yok.
- **Fark:** Tüm yerleşim yok.
- **Öncelik:** Critical (zaten 1.1 altında)

## 3. BİLİNMEYEN EXTRAS

### 3.1 Stub açıklaması: "Teams page will be implemented in a later phase."
- **Konum:** `Frontend2/app/(shell)/teams/page.tsx:7-9`
- **Açıklama:** Prototipte böyle bir uyarı/duyuru yok. Implementasyon kullanıcıya "later phase" mesajı veriyor.
- **Öncelik:** N/A (yer tutucu silinince yok olacak)
- **Önerilen:** Sayfa implement edilince bu metin kaldırılmalı; phase planında "ileride yapılacak" notu .planning/ROADMAP.md'ye taşınmalı.

## 4. BİLİNEN EXTRAS (UYARI)

Yok.

## 5. HATALI / SORUNLU KOD

### 5.1 Sayfanın tamamı placeholder; client-side state hiç yok
- **Dosya:** `Frontend2/app/(shell)/teams/page.tsx:1-12`
- **Sorun türü:** Dead code / Incomplete feature
- **Açıklama:** Default export Server Component olarak rendere edilen statik metin. Sidebar'daki `/teams` linki (sidebar.tsx:317-321) bu sayfaya geliyor ve kullanıcıya "later phase" gösteriyor — production-grade SaaS deneyiminde uygunsuz.
- **Öneri:** Sayfa hazır değilken sidebar'dan `Teams` linkini gizleyin **ya da** disabled state ile koyup tooltip ile "yakında" anlatın; veya en azından doğru bir empty state (Frontend2 dashboard'da olduğu gibi) ekleyin. Bölüm 1.1 düzeltilince bu otomatik kapanır.
- **Öncelik:** Critical

### 5.2 i18n / dil duyarlılığı yok — hard-coded İngilizce
- **Dosya:** `Frontend2/app/(shell)/teams/page.tsx:5,8`
- **Sorun türü:** Style drift (i18n)
- **Açıklama:** `Teams` ve "Teams page will be implemented in a later phase." Türkçe karşılığı yok. Sidebar `t("nav.teams", lang)` ile bilingual ama page hard-coded.
- **Öneri:** Stub bile olsa `useApp().language` + `t(...)` kullanın. Diğer benzer sayfa `Frontend2/app/(shell)/reports/page.tsx` muhtemelen aynı sorunu içeriyor — ayrı triajda gözden geçirilmeli.
- **Öncelik:** High

### 5.3 Heading hiyerarşisi — `<h1>` font-size 16
- **Dosya:** `Frontend2/app/(shell)/teams/page.tsx:4-6`
- **Sorun türü:** Style drift / A11y
- **Açıklama:** `<h1>` semantik olarak doğru ama 16px tipografi (UI-SPEC §heading'a aykırı; prototip 22/600/-0.4 kullanıyor) sayfa başlığı niteliğini bozuyor. Diğer Frontend2 sayfaları (`my-tasks`, `dashboard`) muhtemelen 22 kullanıyor — tutarsızlık.
- **Öneri:** `fontSize: 22, fontWeight: 600, letterSpacing: -0.4` standardına çekin (Bölüm 1.6 ile birlikte düzeltilir).
- **Öncelik:** High

### 5.4 Prototipteki `confirm("Delete category?")` non-localized + a11y zayıf
- **Dosya:** Prototip `New_Frontend/src/app.jsx:450` — `if (confirm("Delete category?"))`. **İmplementasyon yapılırken aynı hata tekrarlanmamalı.**
- **Sorun türü:** A11y / Style drift / i18n
- **Açıklama:** Tarayıcı `confirm` hard-coded İngilizce, focus-trap yok, mobil deneyimi kötü, "Delete category?" prototipte de TR'ye çevrilmemiş — Frontend2 portunda bu hata kopyalanmamalı.
- **Öneri:** Frontend2'de bir `<ConfirmDialog />` primitive yazın (UI-SPEC §AlertDialog) ve `t("teams.confirmDeleteCategory", lang)` ile sarın.
- **Öncelik:** High (port aşamasında)

### 5.5 Prototipteki localStorage init Next.js'te hydration mismatch tetikler
- **Dosya:** Prototip `New_Frontend/src/app.jsx:223-227` — `useState(() => load(...))` ilk render'da localStorage okur. Implementasyona aynen kopyalanırsa SSR ↔ client uyuşmazlığı çıkar.
- **Sorun türü:** Hydration / Bug
- **Açıklama:** Yakın tarihli commit `7e2b700 fix(my-tasks): defer localStorage reads to useEffect to eliminate hydration mismatch` aynı problemi yaşadı; teams için de tekrar etmemek için defer pattern uygulanmalı.
- **Öneri:** Initial state olarak SEED kullanın, mount sonrası `useEffect` içinde localStorage'tan oku ve set edin; ya da bir `useLocalStorageState` hook yazın (use-my-tasks-store.ts pattern'i izleyin).
- **Öncelik:** Critical (port aşamasında)

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| #  | Öncelik  | Madde                                                                                  | Dosya                                                | Bölüm |
|----|----------|----------------------------------------------------------------------------------------|------------------------------------------------------|-------|
| 1  | Critical | Tüm sayfa içeriği eksik (TeamsPage rebuild)                                            | Frontend2/app/(shell)/teams/page.tsx                 | 1.1   |
| 2  | Critical | Sağ kategori sidebar'ı (Card 240px sticky)                                             | Frontend2/app/(shell)/teams/page.tsx                 | 1.2   |
| 3  | Critical | FolderNavItem bileşeni                                                                 | Frontend2/components/teams/folder-nav-item.tsx (yeni)| 1.3   |
| 4  | Critical | TeamCard bileşeni                                                                      | Frontend2/components/teams/team-card.tsx (yeni)      | 1.4   |
| 5  | Critical | Move-to-folder dropdown menü (TeamCard içi)                                            | Frontend2/components/teams/team-card.tsx (yeni)      | 1.5   |
| 6  | Critical | Üst başlık (selected folder name 22/600/-0.4 + alt başlık)                             | Frontend2/app/(shell)/teams/page.tsx                 | 1.6   |
| 7  | Critical | Folders view collapsible folder grouping                                               | Frontend2/app/(shell)/teams/page.tsx                 | 1.10  |
| 8  | Critical | Sol-sidebar "Tüm Takımlar" entry                                                       | Frontend2/app/(shell)/teams/page.tsx                 | 1.12  |
| 9  | Critical | Sidebar dinamik klasör listesi + edit/delete + inline rename                           | Frontend2/app/(shell)/teams/page.tsx                 | 1.13  |
| 10 | Critical | localStorage init hydration mismatch'in port aşamasında tekrarlanmaması                | Frontend2/hooks/use-teams-store.ts (yeni)            | 5.5   |
| 11 | Critical | Stub kaldırma / sayfa hazırlanması (kullanıcı deneyimi)                                | Frontend2/app/(shell)/teams/page.tsx                 | 5.1   |
| 12 | High     | Search input (Takım ara…, 200px)                                                       | Frontend2/app/(shell)/teams/page.tsx                 | 1.7   |
| 13 | High     | View switcher (Folders/Grid segmented control)                                         | Frontend2/app/(shell)/teams/page.tsx                 | 1.8   |
| 14 | High     | "Yeni takım" butonu                                                                    | Frontend2/app/(shell)/teams/page.tsx                 | 1.9   |
| 15 | High     | Grid view (2-kolon flat)                                                               | Frontend2/app/(shell)/teams/page.tsx                 | 1.11  |
| 16 | High     | Sidebar — "Kategorisiz" entry (koşullu, muted)                                         | Frontend2/app/(shell)/teams/page.tsx                 | 1.14  |
| 17 | High     | Sidebar — "Yeni kategori" inline input                                                 | Frontend2/app/(shell)/teams/page.tsx                 | 1.15  |
| 18 | High     | Sidebar — "Özet" mini-paneli                                                           | Frontend2/app/(shell)/teams/page.tsx                 | 1.16  |
| 19 | High     | Mock veri seed'leri (TEAMS_SEED, FOLDERS_SEED)                                         | Frontend2/lib/teams/seed.ts (yeni)                   | 1.18  |
| 20 | High     | localStorage persistans (folders/teams/expanded/view)                                  | Frontend2/hooks/use-teams-store.ts (yeni)            | 1.19  |
| 21 | High     | Klasör ikon mapper (folderIconFor)                                                     | Frontend2/components/teams/folder-icon.tsx (yeni)    | 1.20  |
| 22 | High     | Service/hook katmanı (mock-first vs backend kararı)                                    | Frontend2/services/team-service.ts (yeni)            | 1.22  |
| 23 | High     | i18n / dil duyarlılığı                                                                 | Frontend2/app/(shell)/teams/page.tsx + lib/i18n.ts   | 5.2   |
| 24 | High     | h1 font-size 22/600/-0.4 (heading)                                                     | Frontend2/app/(shell)/teams/page.tsx                 | 5.3   |
| 25 | High     | Confirm dialog primitive (Delete category)                                             | Frontend2/components/primitives/confirm-dialog.tsx (yeni) | 5.4 |
| 26 | Medium   | Empty states (kategori boş + sonuç yok)                                                | Frontend2/app/(shell)/teams/page.tsx                 | 1.17  |
| 27 | Medium   | i18n string anahtarları (teams namespace)                                              | Frontend2/lib/i18n.ts                                | 1.21  |
| 28 | N/A      | "Teams page will be implemented in a later phase." stub metni                          | Frontend2/app/(shell)/teams/page.tsx                 | 3.1   |

## 7. KAPSAM NOTLARI

**Okunan dosyalar:**
- New_Frontend/src/app.jsx (lines 180-518 detaylı; 199 öncesi sadece routing satırları için)
- New_Frontend/src/primitives.jsx (tüm)
- New_Frontend/src/icons.jsx (tüm)
- New_Frontend/src/data.jsx (USERS, getUser, TASKS şekli için lines 1-100)
- New_Frontend/src/i18n.jsx (tüm)
- Frontend2/app/(shell)/teams/page.tsx (tüm 12 satır)
- Frontend2/components/sidebar.tsx (Teams nav linki için lines 317-321)
- Frontend2/services/led-teams-service.ts (tüm)
- Frontend2/hooks/use-led-teams.ts (tüm)
- Frontend2/lib/i18n.ts (tüm)
- Frontend2/components/primitives/index.ts (barrel)
- Frontend2/components/primitives/avatar.tsx (snippet — `avColor`/`initials` prop şekli)
- Frontend2/components/dashboard/portfolio-table.tsx (Team kelimesi araması için snippet)

**Atlanan/eksik kalan:**
- Backend (`app/`) tarafındaki Team / Folder domain entity'lerine bakmadım — bu raporun kapsamı UI; ancak Bölüm 1.18/1.22'de "backend kararı şart" notunu bıraktım. Backend planlamada `app/domain/entities/team.py` + `app/infrastructure/database/repositories/team_repo.py` dahil tüm CRUD endpoint'lerinin var olup olmadığı **Phase 9 D-17 dışında** ayrıca incelenmeli (CLAUDE.md §6 sırasına göre Domain → Infra → Application → API).

**Belirsizlikler:**
- `team.color` prototip değerleri arasında `var(--primary)`, `var(--status-progress)`, `var(--status-review)`, `var(--priority-critical)` gibi token referansları **ve** `oklch(0.60 0.12 260)`, `oklch(0.65 0.16 330)` gibi raw OKLCH değerleri var — backend'den gelirse string olarak saklanması/safe-injection (CSS injection riski!) tasarımı yapılmalı. Bu UI sayfasının "kullanıcı klasör/takım renkleri girer" akışı yoksa sadece sabit palette enum'u önerilir.
- Implementasyon `Frontend2/services/led-teams-service.ts`'de "Phase 9 D-17" ve "Phase 12 Plan 12-01" referansları var — full Teams CRUD'in hangi phase'e atanacağı `.planning/ROADMAP.md`'de geçmiyor olabilir; takım ve karar gerektirir.
- `view === "grid"` modunda klasör seçimi `selectedFolder` filtreleme nasıl davranacağı prototipte tutarsız — `selectedFolder === "_uncat"` ise `!t.folder`, aksi halde `t.folder === selectedFolder`. Implementasyona aynen taşınmalı.
- Frontend2'de Teams için ayrı bir route group veya `[teamId]` detail page yok (`app/(shell)/teams/` içinde sadece `page.tsx`); prototipte de team detail page yok — uyumlu.
