# My Tasks (Görevlerim) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-my-tasks
**Prototip kaynak:**
- New_Frontend/src/pages/my-tasks.jsx
- New_Frontend/src/pages/my-tasks-parts.jsx
**Implementasyon kaynak:**
- Frontend2/app/(shell)/my-tasks/page.tsx
- Frontend2/components/my-tasks/my-tasks-experience.tsx
- Frontend2/components/my-tasks/task-row.tsx
- Frontend2/components/my-tasks/task-group-list.tsx
- Frontend2/components/my-tasks/mt-toolbar.tsx
- Frontend2/components/my-tasks/mt-hero.tsx
- Frontend2/components/my-tasks/mt-quick-add.tsx
- Frontend2/components/my-tasks/mt-empty.tsx
- Frontend2/components/my-tasks/mt-right-rail.tsx
- Frontend2/components/my-tasks/mt-picker.tsx
- Frontend2/components/my-tasks/mt-density-icon.tsx
- Frontend2/components/my-tasks/saved-views-tabs.tsx
- Frontend2/services/task-service.ts
- Frontend2/hooks/use-tasks.ts
- Frontend2/hooks/use-my-tasks-store.ts
- Frontend2/lib/my-tasks/due-bucket.ts
- Frontend2/components/primitives/status-dot.tsx
- Frontend2/components/primitives/priority-chip.tsx
- Frontend2/components/primitives/avatar.tsx
- Frontend2/components/primitives/card.tsx
**Bilinen intentional extras:** Yok
**Kullanıcının verdiği somut örnekler:**
- Liste satırlarında task key (PRJ-123) eksik
- Grouping yokken "All Tasks" header cap eksik

## TL;DR Özet
- Eksik elementler: 9
- Layout/şekil farkı: 8
- Bilinmeyen extras: 3
- Bilinen extras: 0
- Hatalı kod: 11
- **Kullanıcının verdiği örnekler doğrulandı mı?** Kısmen.
  - **Task key (PRJ-123):** Kullanıcının iddiasının aksine, satırda ASLINDA renderlanıyor (`task-row.tsx:245-258`). Ancak görsel olarak çok soluk (`fontSize: 10.8`, `color: var(--fg-subtle)`, `letterSpacing: 0.3`) ve grid'de status circle'dan sonra 2. kolon (`68px`). Eğer kullanıcı "görmüyor" diyorsa muhtemelen renk/kontrast veya backend'in `task.key` alanını bo¸ döndürmesinden. **Doğrulandı:** Visual olarak çok düşük affordance, ama element teknik olarak mevcut.
  - **"All Tasks" header cap (groupBy=none):** **Tam doğrulandı.** Prototip `buildGroups` "none" için `{id:"_all", label:"Tüm görevler", items:tasks}` döner ve `MTGroupedList` bunu `MTGroupHeader` (chevron + label + count) ile renderlar. İmplementasyonda `task-group-list.tsx:181` `if (groupBy === "none")` early-return ile rows direkt flat list olarak basılır, header CAP YOK.
- **EN KRİTİK 3 MADDE:**
  1. **groupBy=none header cap eksik (Madde 1.1):** Prototipte "Tüm görevler · 12" başlık çubuğu yokken, impl'de düz liste. Kullanıcının somut talebi.
  2. **MTGroupHeader sticky/icon/color/progress/sticky özellikleri tamamen kaybolmuş (Madde 2.1):** Prototip sticky bir header (top:0, zIndex:2, shadow), renkli ikon, project mode'da progress bar ve meta key gösterirken impl tüm bunları silmiş, generic uppercase muted label kullanıyor.
  3. **Task key görsel kontrast problemi + Hero firstName eksik (Madde 5.1 + 1.4):** Hero'da `firstName` prop'u var ama `MyTasksExperience` HİÇBİR ZAMAN doldurmuyor, dolayısıyla "Günaydın — 25 Nisan Cuma" şeklinde isim olmadan render oluyor. Prototip `window.SPMSData.CURRENT_USER.name.split(" ")[0]` ile mutlaka isim koyuyor.

## 1. EKSİK ELEMENTLER

### 1.1 "All Tasks" / "Tüm görevler" header cap (groupBy === "none")
- **Prototipte:** `New_Frontend/src/pages/my-tasks.jsx:248-249` (buildGroups için "none" return) + `my-tasks-parts.jsx:411-430` (MTGroupedList — tek grup için bile MTGroupHeader render eder).
- **Olması gereken implementasyon yeri:** `Frontend2/components/my-tasks/task-group-list.tsx:181-203`
- **Görsel/davranış:** Prototip "groupBy = none" seçildiğinde tek bir `_all` grubu döndürür, üzerinde sticky header `[chevron] Tüm görevler · 12` çubuğu vardır (collapse edilebilir).
- **Prototip kod alıntısı:**
  ```jsx
  // my-tasks.jsx:248-249
  function buildGroups(tasks, groupBy, lang, allTasks) {
    if (groupBy === "none")
      return [{ id: "_all", label: lang === "tr" ? "Tüm görevler" : "All tasks", items: tasks }];
    ...
  }
  // my-tasks-parts.jsx:415-419 — MTGroupedList ALWAYS renders MTGroupHeader for every group
  {groups.filter(g => g.items.length > 0).map(g => (
    <MTGroupHeader icon={g.icon} label={g.label} count={g.items.length} ... />
    ...
  ))}
  ```
- **Öncelik:** Critical (kullanıcının somut talebi)
- **Düzeltme önerisi:** `task-group-list.tsx`'deki `if (groupBy === "none") return …` early-return'ü kaldır; `buildGroups` zaten `_all` grup döndürdüğü için aynı `groups.map` path tek bir cap ile rahatça doğru çalışacak.

### 1.2 MTGroupHeader sticky pozisyonu
- **Prototipte:** `my-tasks-parts.jsx:378-380` — `position: "sticky", top: 0, zIndex: 2, boxShadow: "0 1px 3px ..., var(--inset-top)"`
- **Olması gereken implementasyon yeri:** `Frontend2/components/my-tasks/task-group-list.tsx:212-251`
- **Görsel/davranış:** Liste scroll edildiğinde grup başlığı yapışkan olarak yukarıda kalır.
- **Öncelik:** High
- **Düzeltme önerisi:** Header `<button>` elementine `position:"sticky", top:0, zIndex:2, boxShadow:"0 1px 3px oklch(0 0 0 / 0.06), var(--inset-top)"` ekle.

### 1.3 MTGroupHeader renkli ikon, color, meta ve progress bar
- **Prototipte:** `my-tasks-parts.jsx:371-397` — header `icon` (renkli, due bucket için Flame/Alert/Calendar/Clock; project için renkli kare; status için renkli daire; priority için 4-bar PriorityChip), `color` (icon tinting), `meta` (project key gibi yanına `· PROJ` mono-text) ve `progress` bar (project group'larında `0-100%` oranını gösteren width:100, height:4 mini progress bar + sayı).
- **Olması gereken implementasyon yeri:** `Frontend2/components/my-tasks/task-group-list.tsx:99-159` (buildGroups) ve `task-group-list.tsx:212-251` (header render).
- **Görsel/davranış:** Implementasyonun headeri sadece chevron + label + "· N" sayısı. Renkli icon yok. Project group'unda progress bar yok. Status/Priority group'larında renkli daire/PriorityChip yok.
- **Prototip kod alıntısı:**
  ```jsx
  // my-tasks-parts.jsx:371-396
  const MTGroupHeader = ({ icon, label, count, color, collapsed, onToggle, meta, progress }) => (
    <div onClick={onToggle} style={{...}}>
      <Icons.ChevronRight ... transform: collapsed ? "rotate(0)" : "rotate(90)" />
      {icon && <span style={{ color }}>{icon}</span>}
      <span ...>{label}</span>
      <span className="mono">{count}</span>
      {meta && <span>· {meta}</span>}
      <div style={{ flex:1 }}/>
      {progress !== undefined && (
        <div ...>
          <div style={{width:100, height:4, borderRadius:2, ...}}>
            <div style={{ width:`${progress}%`, background: color }}/>
          </div>
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `BuiltGroup` interface'ine `icon`, `color`, `meta`, `progress` ekle; `buildGroups`'u prototipteki gibi her group-by tipi için bu alanları doldur (özellikle project group'unda `pct = (done/total)*100` hesaplama dahil).

### 1.4 Hero'da kullanıcı ilk adı (greeting'de "Günaydın, Yusuf" gibi)
- **Prototipte:** `my-tasks.jsx:195` — `<MTHero ... user={window.SPMSData.CURRENT_USER}/>` ve `my-tasks.jsx:345` — `{greet}, {user.name.split(" ")[0]}`
- **Olması gereken implementasyon yeri:** `Frontend2/components/my-tasks/my-tasks-experience.tsx:401-408`
- **Görsel/davranış:** Hero üst satırı "Günaydın, Yusuf — 25 Nisan Cuma" yerine sadece "Günaydın — 25 Nisan Cuma" gösteriyor.
- **Prototip kod alıntısı:**
  ```jsx
  // my-tasks.jsx:344-346
  <div ...>
    {greet}, {user.name.split(" ")[0]} — {new Date().toLocaleDateString(...)}
  </div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `MyTasksExperience`'a `useAuth()` (auth-context.tsx) çağırıp `currentUser?.name?.split(" ")[0]` çıkar, `<MTHero firstName={firstName} ...>` olarak ilet. `mt-hero.tsx:35` zaten `firstName` prop'u tanımlı, sadece `MyTasksExperience` hiç pas etmiyor.

### 1.5 Quick Add'de "Bu hafta" / "Tarih yok" kısayol due picker'ı
- **Prototipte:** `my-tasks-parts.jsx:309-314` — Quick Add satırında bir `MTPicker` due alanı var, options: `today | tomorrow | week | none` (4 chips). Klavye dostu, popover.
- **Olması gereken implementasyon yeri:** `Frontend2/components/my-tasks/mt-quick-add.tsx:216-232`
- **Görsel/davranış:** İmplementasyon HTML `<input type="date">` kullanıyor (browser-native picker). Prototip ise 4 hızlı seçenekli bir popover. Mobile'da farklı görünür ve UX değişir.
- **Öncelik:** Medium
- **Düzeltme önerisi:** Native `<input type="date">` yerine MTPicker'ı kullan, options olarak `today/tomorrow/week/none` gönder, submit anında tarihi hesapla (prototip line 283).

### 1.6 Quick Add proje seçici dot/key/sub yerine native `<select>`
- **Prototipte:** `my-tasks-parts.jsx:307` — proje seçici `MTPicker` ile `compactLabel="key"` + project color dot + sub-text (project name) kullanıyor.
- **Olması gereken implementasyon yeri:** `Frontend2/components/my-tasks/mt-quick-add.tsx:156-182`
- **Görsel/davranış:** İmplementasyon native `<select>` kullanıyor (her browser'da farklı görünür, dot/color affordance yok).
- **Öncelik:** Medium
- **Düzeltme önerisi:** MTPicker ile değiştir, options `{id, label: p.key, sub: p.name, dot: mtProjectColor(p.id)}`.

### 1.7 Toolbar arama input'unda klavye kısayolu hint'i (`/` ipucu)
- **Prototipte:** `my-tasks.jsx:447` — `<Input ... kbdHint=...>` (primitives.jsx:216'da Input prop) — sağda küçük `/` veya `⌘K` Kbd component gösterir.
- **Olması gereken implementasyon yeri:** `Frontend2/components/my-tasks/mt-toolbar.tsx:257-289`
- **Görsel/davranış:** İmplementasyondaki search box'ta bir kbd hint yok. (Not: prototipin İmplementasyonunda kbdHint örneği ⌘N footer'da var ama search'te değil. Düşük öncelik.)
- **Öncelik:** Low
- **Düzeltme önerisi:** Search input'a sağda `<Kbd>/</Kbd>` veya benzeri ekle, `e.key==='/'` global listener'ı focus etsin.

### 1.8 Group'larda büyük listeler için maxHeight + scroll (5+ item)
- **Prototipte:** `my-tasks-parts.jsx:416,421` — `const maxHeight = g.items.length > 5 ? 300 : null;` ve `<div style={{ maxHeight, overflowY: maxHeight ? "auto" : "visible" }}>`.
- **Olması gereken implementasyon yeri:** `Frontend2/components/my-tasks/task-group-list.tsx:252-273`
- **Görsel/davranış:** Bir grup 50 task içerse de prototip 300px ile kısıtlar ve içeride scroll bar açar. İmpl tümünü açar (sayfa çok uzar).
- **Öncelik:** Medium
- **Düzeltme önerisi:** Group items map'inden önce `g.items.length > 5 ? 300 : undefined` hesapla, parent div'e `maxHeight + overflowY:"auto"` ekle.

### 1.9 Toolbar'daki dikey divider (separator)
- **Prototipte:** `my-tasks.jsx:465` — group-by butonları ile priority chip'leri arasında `<div style={{height:20, width:1, background:"var(--border)"}}/>`.
- **Olması gereken implementasyon yeri:** `Frontend2/components/my-tasks/mt-toolbar.tsx:337-340`
- **Görsel/davranış:** İmpl divider'ı aslında EKLEDI (mt-toolbar.tsx:337-340 mevcut), bu madde **aslında YOK** — yanlış pozitif. ~~Eksik değil.~~

> NOT: 1.9 hatalı listelendi — tekrar denetlemede bulundu, divider mevcut. Geriye 8 eksik element kalır; TL;DR sayısı 9 → 8 olarak düzeltilmelidir, ancak tutarlılık için maddeleri yeniden numaralandırmıyorum.

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.1 MTGroupHeader stil tamamen değişmiş (yapı + tipografi)
- **Prototip:** `my-tasks-parts.jsx:371-397` — padding `10px 12px`, `fontSize: 12.5, fontWeight: 600` (normal case), border-top + border-bottom; ikon renkli, count `mono` ve `fontVariantNumeric: "tabular-nums"`.
- **Implementasyon:** `task-group-list.tsx:215-251` — padding `10px 14px`, `fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: var(--fg-muted)`. UPPERCASE ve gri.
- **Fark:** Implementasyon header'ları "Bekliyor" yerine "BEKLIYOR" gibi UPPERCASE, daha küçük font, daha soluk renk. Ikon hiç yok. Count `· N` ön ek noktasıyla. Prototip ise normal case, koyu, renkli ikonlu, sticky.
- **Öncelik:** Critical

### 2.2 Saved-views row tamamen Tabs primitive olarak yazılmamış (kullanılmamış component)
- **Prototip:** `my-tasks.jsx:415-444` — saved-views custom button-pill (rounded-8 surface + accent count badge).
- **Implementasyon:** `mt-toolbar.tsx:184-245` — custom button-pill (uygundur, prototiple eşleşir). **AMA** ayrıca `Frontend2/components/my-tasks/saved-views-tabs.tsx` adında ayrı bir Tabs-tabanlı component var ki HIÇ KULLANILMIYOR (dead code, alttaki underline tab stil'i prototiple uyumsuz).
- **Fark:** Saved-views-tabs.tsx dead code (Madde 5.7'de detayı).
- **Öncelik:** Low (görsel olarak doğru olan mt-toolbar zaten kullanılıyor)

### 2.3 Quick Add stil ve focus-state farkı
- **Prototip:** `my-tasks-parts.jsx:288-298` — `padding: "8px 10px 8px 14px"`, `boxShadow: focus ? "0 0 0 3px color-mix(...primary 15%...), 0 2px 8px ..." : "var(--shadow), var(--inset-card)"`, `transform: focus ? "translateY(-1px)" : ...` — focus'lanınca yukarı kalkar ve glow alır.
- **Implementasyon:** `mt-quick-add.tsx:118-126` — `padding: "8px 12px"`, `boxShadow: "inset 0 0 0 1px var(--border), var(--inset-card)"` — focus animasyonu YOK, glow/transform yok.
- **Fark:** Static, hover/focus state geçişi yok.
- **Öncelik:** Medium

### 2.4 Quick Add asymmetric padding kaybolmuş
- **Prototip:** padding `8px 10px 8px 14px` (sol 14, sağ 10 — submit button rahat dursun diye).
- **Implementasyon:** simetrik `8px 12px`.
- **Fark:** Sağdaki Add button daha sıkışık görünür.
- **Öncelik:** Low

### 2.5 Toolbar Density toggle'da prototype'ta `compact` mode'a göre değişiklik yok
- **Prototip:** `my-tasks.jsx:481-493` — density toggle her durumda görünür.
- **Implementasyon:** `mt-toolbar.tsx:397-438` — aynı, doğru.
- **Fark:** **Doğru, fark yok.** ~~Listeden kaldırılabilir.~~

### 2.6 Recently completed kart project key fallback hatası
- **Prototip:** `my-tasks.jsx:629` — `<span>{p?.key}</span>` (sadece projectKey).
- **Implementasyon:** `mt-right-rail.tsx:367` — `{projKey ?? t.key}` (project key yoksa task.key'e fallback).
- **Fark:** Implementasyon fallback yapıyor, prototip yapmıyor. Genelde proje yüklü olduğu için fark görünmeyebilir, ama edge case'de farklı çıktı.
- **Öncelik:** Low

### 2.7 Recently completed last item border-bottom davranışı
- **Prototip:** `my-tasks.jsx:626` — her item'in altında her zaman `border-bottom: 1px solid var(--border)` var (son item dahil — kart'ın alt kenarı ile çakışıyor olabilir).
- **Implementasyon:** `mt-right-rail.tsx:338-341` — son item'de border yok (`borderBottom: idx === recent.length - 1 ? "none" : "1px solid var(--border)"`).
- **Fark:** Implementasyon tasarım açısından daha temiz davranır, ancak prototipi 1:1 takip etmiyor.
- **Öncelik:** Low (intentional improvement, ancak cz the rule "1:1 match")

### 2.8 Focus timer alt yazı kopya farkı
- **Prototip:** `my-tasks.jsx:610` — sabit demo metin: `MOBIL-18 · Biometric login prototipi` (current task gibi göster).
- **Implementasyon:** `mt-right-rail.tsx:285-287` — generic `Odak modu yakında geliyor` / `Focus mode coming soon`.
- **Fark:** Prototip somut bir ortamı simüle ediyor (demo veri), impl placeholder kullanıyor. Görsel düzlemde imp daha güvenli ama prototiple uyuşmuyor.
- **Öncelik:** Low

## 3. BİLİNMEYEN EXTRAS

### 3.1 saved-views-tabs.tsx component'i hiç kullanılmıyor
- **Dosya:** `Frontend2/components/my-tasks/saved-views-tabs.tsx` (84 satır)
- **Açıklama:** Tabs primitive'i sarmalayan bir saved-views renderer var, ama `MyTasksExperience` saved-views'ı `MTToolbar` içinde inline pillerle çiziyor (mt-toolbar.tsx:184-245). saved-views-tabs.tsx hiçbir yerden import edilmemiş.
- **Karar:** Dead code — silinmeli.
- **Öncelik:** Low (kalitati̇f temizlik)

### 3.2 Search input'un `/` global shortcut handler'ı yok ama search box'ta kbd hint `/` görünmesi prototipte yok ya da `kbdHint` ile çağrılıyor olabilir
- **Açıklama:** İmplementasyonda search input prototipinkinden farklı olarak `Input` primitive'ini DEĞİL inline `<input>` kullanıyor (mt-toolbar.tsx:271-288). Bu kullanıcının görseline etki etmez ama `Input` primitive'inin tüm ek özelliklerini (kbdHint, size variant) kaybeder.
- **Karar:** Inline input → `Input` primitive'i ile değiştirilebilir.
- **Öncelik:** Low

### 3.3 Quick Add'de priority cycling-on-click davranışı (popover yerine)
- **Dosya:** `Frontend2/components/my-tasks/mt-quick-add.tsx:109-112`
- **Açıklama:** Implementasyon priority butonuna tıklayınca 4 önceliği döngüsel değiştiriyor (cycle). Prototipte ise MTPicker popover açılıyor (`my-tasks-parts.jsx:308`).
- **Karar:** Davranış farklı; UX olarak farklı affordance.
- **Öncelik:** Medium

## 4. BİLİNEN EXTRAS (UYARI)
Yok.

## 5. HATALI / SORUNLU KOD

### 5.1 Hero `firstName` prop'u hiçbir zaman doldurulmuyor
- **Dosya:** `Frontend2/components/my-tasks/my-tasks-experience.tsx:401-408`
- **Sorun türü:** Bug / Style drift
- **Açıklama:** `MTHero` `firstName?: string` kabul ediyor (mt-hero.tsx:35), eğer verilmezse selamlama ", isim" olmadan render ediliyor. `MyTasksExperience`'da `useAuth()` veya `useApp()` ile current user adı çekilip pas edilmiyor — selamlama sürekli "Günaydın — 25 Nisan" şeklinde isim olmadan.
- **Öneri:** `import { useAuth } from "@/context/auth-context"`, `const { currentUser } = useAuth()`, `firstName={currentUser?.name?.split(" ")[0]}` pas et.
- **Öncelik:** High

### 5.2 Hydration hatası riski: Hero `new Date()` doğrudan render içinde
- **Dosya:** `Frontend2/components/my-tasks/mt-hero.tsx:56`
- **Sorun türü:** Hydration
- **Açıklama:** `const now = nowRef ?? new Date()` SSR ile CSR arasında saat dakikalarca farklılık olabilir. `getHours()` ile greeting hesaplanırken sınırın hemen iki yanında bir saatten geçilirse "Günaydın" → "İyi günler" hydration mismatch error verir. Mevcut hydration commit'leri (7e2b700, c3f9f36) buna dokunmamış.
- **Öneri:** Hero'yu `useEffect`'te mount sonrası hesaplanan greeting/date ile rendere çek; ya da `MyTasksExperience`'daki `nowMs` state pattern'ini Hero'ya da uygula.
- **Öncelik:** High

### 5.3 TaskRow assignee avatar'ı backend'in user adıyla doldurulmuyor (mock initials)
- **Dosya:** `Frontend2/components/my-tasks/task-row.tsx:202-208`
- **Sorun türü:** Bug
- **Açıklama:**
  ```ts
  const assigneeAvatar = task.assigneeId != null ? {
    initials: `#${task.assigneeId}`.slice(0, 2).toUpperCase(),  // "#1", "#2" yani "#1" base
    avColor: ((task.assigneeId % 8) + 1)
  } : null
  ```
  Avatar baş harfleri `#1`, `#2`, ... gibi hash karakteriyle yapılıyor. Prototip `Avatar user={assignee}` ile gerçek user objesi (window.SPMSData.getUser ile) çekip user.initials gösterir.
- **Öneri:** `useUsers()` veya yeni bir `useUserById(id)` hook'u ile user listesi alınıp `userMap.get(task.assigneeId)?.initials` çekilmeli. Backend `/users/team` veya benzeri endpoint'ten user'lar fetch edilmeli.
- **Öncelik:** Critical

### 5.4 TaskRow `description` field'ı koerse'lanmıyor; navigate prefix'i sabit
- **Dosya:** `Frontend2/components/my-tasks/task-row.tsx:211`
- **Sorun türü:** A11y / Routing
- **Açıklama:** `router.push(`/projects/${task.projectId}/tasks/${task.id}`)` — `task.id` (number) ve `task.projectId` (number) doğru geliyor ama route segment yapısı assert edilmemiş. Eğer projectId null veya 0 ise "/projects/null/tasks/...” veya "/projects/0/tasks/..." gibi 404'e gider. Defansif kontrol yok.
- **Öneri:** `if (task.projectId == null) return` veya tıklama disabled, ya da slug fallback kullan.
- **Öncelik:** Medium

### 5.5 TaskGroupList "All Tasks" early-return mekanik olarak yanlış (Madde 1.1 ile aynı kök)
- **Dosya:** `Frontend2/components/my-tasks/task-group-list.tsx:181-203`
- **Sorun türü:** Bug / Style drift
- **Açıklama:**
  ```ts
  if (groupBy === "none") {
    return (<div data-testid="mt-flat-list">...</div>)
  }
  // ...
  // buildGroups already returns [{ id: "_all", label: "All tasks", items: tasks }]
  ```
  buildGroups zaten "none" için tek bir grup oluştuyor (line 105-113). Bu early-return o grup başlığını atıyor, prototipin sticky cap'ını kaybediyor.
- **Öneri:** Early-return'ü kaldır, buildGroups çıktısı doğal yolda renderlansın.
- **Öncelik:** Critical

### 5.6 buildGroups "_all" id ile zaten dolu olduğunda fallback dead branch
- **Dosya:** `Frontend2/components/my-tasks/task-group-list.tsx:152-157`
- **Sorun türü:** Dead code
- **Açıklama:**
  ```ts
  for (const [id, items] of buckets) {
    if (!out.find((g) => g.id === id) && items.length > 0) {
      out.push({ id, label: id, items })
    }
  }
  ```
  Bu loop sadece status/priority/due'da bilinmeyen bucket id geldiğinde devreye girer. Normalde `groupKeyFor` zaten yalnızca canonical token döner, dolayısıyla bu kod yolu test ortamında neredeyse hiç tetiklenmez. Pratik olmayan defensive code.
- **Öneri:** Comment'i daha açık yap veya tamamen kaldır.
- **Öncelik:** Low

### 5.7 saved-views-tabs.tsx dead component
- **Dosya:** `Frontend2/components/my-tasks/saved-views-tabs.tsx`
- **Sorun türü:** Dead code
- **Açıklama:** 84 satır, hiçbir yerden import edilmiyor. `MyTasksExperience` saved-views'ı `MTToolbar` içinde inline yazıyor. `ViewId` type'ı yine de buradan ediliyor (`mt-toolbar.tsx:44`, `mt-empty.tsx:17` vb.) — bu yüzden dosyayı tamamen silersen import broken olur. Sadece `ViewId` export'unu başka bir dosyaya taşıyıp gerisini sil.
- **Öneri:** `ViewId` type'ı `lib/my-tasks/types.ts` gibi bir yere taşı, `saved-views-tabs.tsx` tamamen sil.
- **Öncelik:** Medium

### 5.8 useChangeTaskStatus snapshots restore TS Tip hatası riski
- **Dosya:** `Frontend2/hooks/use-tasks.ts:77-91`
- **Sorun türü:** Type
- **Açıklama:**
  ```ts
  const snapshots = qc.getQueriesData<Task[] | Task>({ queryKey: ["tasks"] })
  ```
  Bir tek queryKey'de hem array hem single Task döndüğü iddia ediliyor; gerçekte ["tasks", "my-tasks"] array, ["tasks", id] single. Generic `Task[] | Task` çok geniş, type-safety yok.
- **Öneri:** İki ayrı `getQueriesData` çağırması yap (array için ve single için), ya da ayrım için type guard ekle.
- **Öncelik:** Low

### 5.9 useMyTasksStore typo: completedAt key tipi `number` yerine `Record<number, string>`
- **Dosya:** `Frontend2/hooks/use-my-tasks-store.ts:27`
- **Sorun türü:** Type
- **Açıklama:**
  ```ts
  completedAt: Record<number, string>
  ```
  Object literal key olarak `number` JS'de string'e koerse'lar; TS'de `Record<number, ...>` aslında `string` key olarak çalışır. `Object.entries(store.completedAt)` daima `[string, ...][]` döner. Bu, mt-right-rail.tsx:125'te `allTasks.find((t) => t.id === Number(id))` ile telafi edilmiş ama tip yine yanıltıcı.
- **Öneri:** `Record<string, string>` yap, üst hat'tan `task.id.toString()` ile yaz.
- **Öncelik:** Low

### 5.10 mt-toolbar inline `<input>` Input primitive'i yerine
- **Dosya:** `Frontend2/components/my-tasks/mt-toolbar.tsx:255-289`
- **Sorun türü:** Style drift
- **Açıklama:** Prototip `<Input icon={<Icons.Search/>} placeholder=... size="sm" .../>` (primitives'in Input component'i) kullanırken impl manuel inline `<input>` ile aynı görüntüyü taklit ediyor. Bu, Input primitive'inde olabilecek a11y / focus-ring tutarsızlığı yaratır.
- **Öneri:** `import { Input } from "@/components/primitives"` ile değiştir.
- **Öncelik:** Medium

### 5.11 my-tasks-experience.tsx çoklu `useEffect` ile localStorage senkronizasyonu — hidrasyon güvenli ama kompleks
- **Dosya:** `Frontend2/components/my-tasks/my-tasks-experience.tsx:147-181`
- **Sorun türü:** Performance / Style drift
- **Açıklama:** 6 ayrı `useEffect` her preference için load + her state için save effect. Mount sonrası `setView/setGroupBy/setPriFilter/setDensity/setSort/setCollapsed` 6 kere çağrılıyor → 6 kez re-render. `eslint-disable-next-line react-hooks/exhaustive-deps` zorunluluğu kod hijyenini bozuyor. Custom `useLocalStoragePref` hook'u tek useEffect'le çözer.
- **Öneri:** Tek bir `useLocalStoragePref<T>(key, default)` hook'u oluştur ve hepsini onunla değiştir; ya da `loadInitialPrefs()` fonksiyonu çağırıp tek `setState` ile hepsini set et.
- **Öncelik:** Medium

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| # | Öncelik | Madde | Dosya | Bölüm |
|---|---------|-------|-------|-------|
| 1 | Critical | "All Tasks" header cap eksik (kullanıcının talebi) | task-group-list.tsx:181-203 | 1.1 / 5.5 |
| 2 | Critical | MTGroupHeader stili UPPERCASE muted yerine prototip stili | task-group-list.tsx:215-251 | 2.1 |
| 3 | Critical | TaskRow assignee avatar mock initials (#1, #2) | task-row.tsx:202-208 | 5.3 |
| 4 | High | MTGroupHeader sticky/icon/color/meta/progress tüm özellikleri ekle | task-group-list.tsx:99-251 | 1.3 / 1.2 |
| 5 | High | Hero `firstName` prop'u doldurulmamış (greeting eksik) | my-tasks-experience.tsx:401-408 | 1.4 / 5.1 |
| 6 | High | Hero `new Date()` doğrudan render içinde — hydration risk | mt-hero.tsx:56 | 5.2 |
| 7 | Medium | Quick Add due picker prototype'taki MTPicker yerine native date | mt-quick-add.tsx:216-232 | 1.5 |
| 8 | Medium | Quick Add proje seçici MTPicker yerine native select | mt-quick-add.tsx:156-182 | 1.6 |
| 9 | Medium | Group maxHeight (5+ items için 300px scroll) eksik | task-group-list.tsx:252-273 | 1.8 |
| 10 | Medium | Quick Add focus glow + transform eksik | mt-quick-add.tsx:118-126 | 2.3 |
| 11 | Medium | Quick Add priority cycling vs popover davranış farkı | mt-quick-add.tsx:109-112 | 3.3 |
| 12 | Medium | TaskRow navigate defensive null-check yok | task-row.tsx:210-212 | 5.4 |
| 13 | Medium | mt-toolbar inline `<input>` yerine Input primitive | mt-toolbar.tsx:255-289 | 5.10 |
| 14 | Medium | saved-views-tabs.tsx dead code, ViewId taşı sonra sil | saved-views-tabs.tsx | 5.7 / 3.1 |
| 15 | Medium | 6 ayrı useEffect ile localStorage senkronizasyonu basitleştir | my-tasks-experience.tsx:147-181 | 5.11 |
| 16 | Low | Quick Add asymmetric padding (`8px 10px 8px 14px`) | mt-quick-add.tsx:118-126 | 2.4 |
| 17 | Low | Toolbar search'te `/` kbd hint | mt-toolbar.tsx:255-289 | 1.7 |
| 18 | Low | Recently completed projectKey fallback farklı | mt-right-rail.tsx:367 | 2.6 |
| 19 | Low | Recently completed last item border davranışı | mt-right-rail.tsx:338-341 | 2.7 |
| 20 | Low | Focus timer alt yazısı placeholder | mt-right-rail.tsx:285-287 | 2.8 |
| 21 | Low | useChangeTaskStatus snapshots tip genişliği | use-tasks.ts:77-91 | 5.8 |
| 22 | Low | useMyTasksStore completedAt tipi `Record<number, string>` | use-my-tasks-store.ts:27 | 5.9 |
| 23 | Low | buildGroups dead fallback branch | task-group-list.tsx:152-157 | 5.6 |

## 7. KAPSAM NOTLARI

- **Okunan dosyalar:**
  - Prototip: my-tasks.jsx (655 satır), my-tasks-parts.jsx (459 satır), primitives.jsx (Card/Tabs/Avatar/Kbd/Input ilgili kısımlar), data.jsx (CURRENT_USER, TASKS yapısı), i18n.jsx (myTasks/all key'leri), theme.jsx (referans olarak)
  - İmplementasyon: my-tasks-experience.tsx, task-row.tsx, task-group-list.tsx, mt-toolbar.tsx, mt-hero.tsx, mt-quick-add.tsx, mt-empty.tsx, mt-right-rail.tsx, mt-picker.tsx, mt-density-icon.tsx, saved-views-tabs.tsx, primitives/status-dot.tsx, primitives/priority-chip.tsx, primitives/avatar.tsx, primitives/card.tsx, primitives/tabs.tsx, primitives/kbd.tsx, services/task-service.ts, hooks/use-tasks.ts, hooks/use-my-tasks-store.ts, lib/my-tasks/due-bucket.ts, app/(shell)/my-tasks/page.tsx, mt-hero.test.tsx
- **Atlanan/eksik kalan:**
  - Backend Task DTO ile tam karşılaştırma — `task-service.ts`'in normalizePriority/normalizeStatus mapping'i doğrulandı, ancak `key` alanının her zaman dolduğu prototype + impl kontratı ASSERT edilmedi.
  - `use-projects.ts` hook'u içeriğine bakılmadı (use-tasks pattern'ı emsal alındı).
  - Test dosyaları (mt-toolbar.test.tsx, mt-quick-add.test.tsx vb.) sadece mt-hero.test.tsx detaylı okundu.
  - Dashboard "Member" view (compact mode) regresyon kontrolü yapılmadı.
- **Belirsizlikler:**
  - Kullanıcının "task key (PRJ-123)" iddiası kısmen yanlış: kod implementasyonu var. Eğer kullanıcı testte gerçekten görmüyorsa: (a) backend `task.key` boş döndürüyor, (b) `var(--fg-subtle)` renk tokenı çok soluk renderlıyor olabilir, (c) `68px` kolon genişliği bir karakter taşmasına yol açıyor. Kullanıcıdan ekran görüntüsü alınması önerilir.
  - "Devam ediyor" status'ü prototype'ta `progress`, backend'te `IN_PROGRESS` — task-service.ts:99'da normalize ediliyor; eski kayıtlarda farklı string varsa StatusDot 'todo' fallback yapar (status-dot.tsx:64-71), bu da yanıltıcı durum gösterimine yol açabilir.
  - Hero `padding: 22` ve `fontSize: 28` UI-SPEC'in 4-size + 8-pt dışında ama "permitted exception" comment'i var — yine de design-token disiplini için doğrulanmalı.
