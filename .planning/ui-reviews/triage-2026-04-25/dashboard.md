# Dashboard — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-dashboard
**Prototip kaynak:**
- `New_Frontend/src/pages/dashboard.jsx` (1-233)
- `New_Frontend/src/primitives.jsx` (Avatar, Badge, Button, Card, SegmentedControl, PriorityChip, StatusDot)
- `New_Frontend/src/icons.jsx` (Folder, CheckSquare, CircleCheck, Alert, Filter, Download)
- `New_Frontend/src/data.jsx` (PROJECTS, USERS, getUser)
- `New_Frontend/src/i18n.jsx`
**Implementasyon kaynak:**
- `Frontend2/app/(shell)/dashboard/page.tsx` (1-200)
- `Frontend2/components/dashboard/stat-card.tsx`
- `Frontend2/components/dashboard/portfolio-table.tsx`
- `Frontend2/components/dashboard/methodology-card.tsx`
- `Frontend2/components/dashboard/activity-feed.tsx`
- `Frontend2/components/primitives/segmented-control.tsx`, `avatar.tsx`, `card.tsx`, `badge.tsx`
- `Frontend2/hooks/use-projects.ts`, `Frontend2/services/project-service.ts`
**Bilinen intentional extras:** Yok

## TL;DR Özet
- Eksik elementler: 7
- Layout/şekil farkı: 11
- Bilinmeyen extras: 4
- Bilinen extras: 0
- Hatalı kod: 8
- **EN KRİTİK 3 MADDE:**
  1. **Header H1 fontSize 24 → 20 düşürülmüş** (`page.tsx:84`). Prototip `24px`, implementasyon `20px`. "Merhaba, {ad}" başlığı görsel hiyerarşinin tepe noktası — 4px küçültme dashboard'un ağırlık merkezini bozar. (Bkz. 2.1)
  2. **PortfolioTable satırları tıklanamaz hale gelmiş** (`portfolio-table.tsx:84-97`). Prototip `onClick={() => router.go("project-detail", { projectId: p.id })}` yapıyor, implementasyon yalnız `cursor: "pointer"` koymuş ama hiçbir onClick yok — kullanıcı satıra tıkladığında hiçbir şey olmuyor; ölü "pointer" cursor'u UX yanılgısı yaratıyor. Aynı şekilde TaskRow'un `router.go("task-detail")` davranışı MemberView'da yok (compact MyTasksExperience kendi gezinmesini yapıyor — bu kabul edilebilir). (Bkz. 5.1)
  3. **PortfolioTable header'ında Filter + CSV butonları eksik** (`page.tsx:157-175`). Prototip `Button size="xs" variant="ghost" icon={Icons.Filter}` ve `Icons.Download` ile iki ghost buton render ediyor; implementasyon header'ı sadece başlık + alt yazı içeriyor — fonksiyonel aksiyon eksik. (Bkz. 1.1)

---

## 1. EKSİK ELEMENTLER

### 1.1 PortfolioTable header'ında "Filtre" ve "CSV" ghost butonları
- **Prototipte:** `New_Frontend/src/pages/dashboard.jsx:28-31`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/dashboard/page.tsx:157-175` (Card header sağ tarafı) veya `portfolio-table.tsx` header bölümü
- **Görsel/davranış:** Header sağında 2 küçük (`size="xs"`) ghost buton: Filtre (Filter ikon + "Filtre"/"Filter" metni) ve CSV (Download ikon + "CSV" sabit metni). Şu an header sadece başlık + alt yazı; sağ taraf tamamen boş.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "flex", gap: 6 }}>
    <Button size="xs" variant="ghost" icon={<Icons.Filter size={13}/>}>{lang === "tr" ? "Filtre" : "Filter"}</Button>
    <Button size="xs" variant="ghost" icon={<Icons.Download size={13}/>}>CSV</Button>
  </div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `page.tsx`'te Card header'ının sağına `<div style={{ display: "flex", gap: 6 }}>` içine iki `<Button size="xs" variant="ghost">` ekle. Şimdilik onClick'ler `() => {}` no-op olabilir (intentional extra'ya gerek yok), ama görsel parite zorunlu.

### 1.2 PortfolioTable "Takım" (Team) sütunu (AvatarStack)
- **Prototipte:** `New_Frontend/src/pages/dashboard.jsx:78, 100` ve grid `gridTemplateColumns: "2fr 90px 120px 100px 90px 90px"` (6 sütun)
- **Olması gereken implementasyon yeri:** `Frontend2/components/dashboard/portfolio-table.tsx:36, 90` (header + row grid template)
- **Görsel/davranış:** Yönetici sütunundan sonra 100px genişliğinde "Takım"/"Team" sütunu; her satırda `<AvatarStack users={members} max={3} size={20}/>`. Implementasyon bu sütunu tamamen düşürmüş (yorumda "drop empty Team column until project member endpoint ships" diyor). Bu **bilinçli bir geçici çözüm** ama prototip ile parite yok ve "intentional extras" listesinde belirtilmemiş.
- **Prototip kod alıntısı:**
  ```jsx
  // Header
  <div>{lang === "tr" ? "Takım" : "Team"}</div>
  // Row
  <div><AvatarStack users={members} max={3} size={20}/></div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Backend `/projects` response'una `member_avatars` veya `member_users` ekleyince doldur. Geçici olarak `project.managerName` dışında üye verisi yoksa boş (placeholder) AvatarStack render edilebilir; ama sütunu **tamamen düşürmek** layout'u bozuyor (1.6fr/1fr büyük kart ile sağdaki kart arasındaki dengeyi değiştiriyor).

### 1.3 PortfolioTable satır tıklama → proje detayına navigasyon
- **Prototipte:** `New_Frontend/src/pages/dashboard.jsx:87` — `onClick={() => router.go("project-detail", { projectId: p.id })}`
- **Olması gereken implementasyon yeri:** `Frontend2/components/dashboard/portfolio-table.tsx:84` (row `<div>` veya `Link` wrapper)
- **Görsel/davranış:** Satıra tıklayınca `/projects/{id}` (veya equivalent) sayfasına gitmeli. Şu an satır `cursor: "pointer"` görünüyor ama onClick handler yok — kullanıcı yanıltılıyor.
- **Prototip kod alıntısı:**
  ```jsx
  <div key={p.id} onClick={() => router.go("project-detail", { projectId: p.id })}
    style={{ ..., cursor: "pointer", transition: "background 0.1s" }}
    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `useRouter` import et, satıra `onClick={() => router.push(\`/projects/\${project.id}\`)}` ekle. Veya satırı `<Link href={\`/projects/\${project.id}\`}>` ile sar (a11y için tercih edilir, focus + Enter/Space klavyesi destekli olur).

### 1.4 Header altyazısında "·" (interpunct) ayraç
- **Prototipte:** `New_Frontend/src/pages/dashboard.jsx:221` — `{date} · {lang === "tr" ? "Güzel bir hafta olsun" : "Make it count"}`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/dashboard/page.tsx:88` — Şu an `&middot;` HTML entity (rendered: `·`). **Aslında doğru karaktere render ediliyor**, false positive değil; ancak prototipte UTF-8 `·` direkt yazılı, implementasyonda `&middot;` kaçış kullanılmış. Render eşit olduğu için kritik değil; ama tutarlılık için düz karakter tercih edilmeli.
- **Öncelik:** Low
- **Düzeltme önerisi:** `&middot;` → `·` (UTF-8). Tek satır kozmetik temizlik.

### 1.5 4. StatCard ikonu ve semantiği farklı
- **Prototipte:** `New_Frontend/src/pages/dashboard.jsx:18` — "Gecikmiş"/"Overdue" StatCard, value = `overdueCount` (tamamlanmamış ve `due < now` olan task sayısı), tone="danger", icon=`<Icons.Alert/>` (üçgen uyarı), delta="dikkat"/"attention".
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/dashboard/page.tsx:135-151`
- **Görsel/davranış:** Implementasyon bu kartı "Açık Görevler"/"Open Tasks" olarak yeniden anlamlandırmış — `taskStats.open + taskStats.in_progress` toplamı, delta'da "{done} tamamlandı" yazıyor. **Bu prototipten farklı bir metrik**: prototip "gecikmiş" gösteriyor (overdue), implementasyon "açık" gösteriyor (open + in_progress). User overdue ile open arasındaki farkı görmüyor; yöneticinin "gecikmiş kaç tane?" sorusu cevapsız kalıyor.
- **Prototip kod alıntısı:**
  ```jsx
  const overdueCount = tasks.filter(t => t.status !== "done" && new Date(t.due) < new Date()).length;
  <StatCard label={lang === "tr" ? "Gecikmiş" : "Overdue"} value={overdueCount} delta={lang === "tr" ? "dikkat" : "attention"} tone="danger" icon={<Icons.Alert/>}/>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Ya backend'e `GET /tasks/my-tasks?include_overdue=true` veya `/dashboard/stats` endpoint'i ekle ve overdue sayısını göster, ya da frontend'te `useMyTasks()` çağrısı yapıp `tasks.filter(t => t.status !== "DONE" && new Date(t.due) < new Date()).length` hesapla. İkon `<AlertTriangle>` zaten doğru (Lucide'da `Icons.Alert`'in karşılığı). Label "Gecikmiş"/"Overdue", delta "dikkat"/"attention" olmalı.

### 1.6 1. StatCard'da delta "+2" ve diğer kartlardaki trend metinleri
- **Prototipte:** `New_Frontend/src/pages/dashboard.jsx:15-18` — Sırasıyla `delta="+2"`, `delta="+14"`, `delta="bu hafta"`, `delta="dikkat"/"attention"`. Kartlar trend bilgisi (artış miktarı, "bu hafta" vs.) gösteriyor.
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/dashboard/page.tsx:113-151`
- **Görsel/davranış:** Implementasyon delta'ları daha düz: `"toplam"/"total"`, `"aktif"/"active"`, `"bu dönem"/"this period"`, ve 4. kartta `"X tamamlandı"`. Prototipin trend göstergesi (artı işaretli sayı) tamamen kaybolmuş — dashboard'un dinamizm hissi azalmış.
- **Prototip kod alıntısı:**
  ```jsx
  <StatCard label="..." value={projects.length} delta="+2" tone="primary" icon={...}/>
  <StatCard label="..." value={totalActive} delta="+14" tone="info" icon={...}/>
  <StatCard label="..." value={totalDone} delta="bu hafta" tone="success" icon={...}/>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** Backend trend API'si yoksa şimdilik prototip ile aynı statik string'leri kullan ("+2", "+14", "bu hafta"/"this week", "dikkat"/"attention") ya da `delta` prop'unu opsiyonel bırak ve sayı yoksa hiç render etme. Şu anki "toplam"/"total" gibi tekrarlayan etiketler bilgi yoğunluğunu düşürüyor.

### 1.7 2. StatCard'ın label'ı "Aktif Görev" → "Aktif Proje" değiştirilmiş
- **Prototipte:** `New_Frontend/src/pages/dashboard.jsx:16` — `label="Aktif Görev" / "Active tasks"`, `value={totalActive}` (todo+progress+review task sayısı), `tone="info"`, `icon={<Icons.CheckSquare/>}`.
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/dashboard/page.tsx:120-126`
- **Görsel/davranış:** Implementasyon "Aktif Proje"/"Active" gösteriyor (`activeProjects.length`). Prototip ise **görev** sayısı gösteriyordu. Hem semantik hem rakamsal olarak tamamen farklı bir metric — yönetici "kaç aktif görev var?" sorusunun cevabını kaybediyor.
- **Prototip kod alıntısı:**
  ```jsx
  const totalActive = tasks.filter(t => t.status !== "done").length;
  <StatCard label={lang === "tr" ? "Aktif Görev" : "Active tasks"} value={totalActive} delta="+14" tone="info" icon={<Icons.CheckSquare/>}/>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `useTaskStats` zaten 4. kart için var; `taskStats.open + taskStats.in_progress + taskStats.in_review (varsa)` kullanarak 2. kartı "Aktif Görev" yap. Sonra 4. kartı (1.5'te belirtildiği gibi) "Gecikmiş" olarak düzelt. Yani 2 kartın semantiği eşzamanlı düzelmeli.

---

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.1 Header H1 fontSize: 24 → 20
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:220` — `fontSize: 24, fontWeight: 600, letterSpacing: -0.6`
- **Implementasyon:** `Frontend2/app/(shell)/dashboard/page.tsx:84` — `fontSize: 20, fontWeight: 600, letterSpacing: -0.6`
- **Fark:** 4px küçük (24 → 20). letterSpacing ve fontWeight aynı. Diğer dashboard'larda H1 24px, burada 20px → tutarsızlık.
- **Öncelik:** High

### 2.2 SegmentedControl boyutu çok küçük
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:223-226` — outer `padding: 3, borderRadius: var(--radius-sm), gap: 2`; iç button `padding: "5px 12px", fontSize: 12.5, fontWeight: 600`; active `boxShadow: "0 1px 2px oklch(0 0 0 / 0.05), inset 0 0 0 1px var(--border)"`.
- **Implementasyon:** `Frontend2/components/primitives/segmented-control.tsx:38-46, 54-67` (size="sm" defaults) — outer `padding: 2, borderRadius: 6, gap yok`; iç button `padding: "4px 10px", fontSize: 11.5, fontWeight: 600`; active `boxShadow: "var(--shadow-sm), var(--inset-top)"`.
- **Fark:** Prototip pill **belirgin biçimde daha geniş** (padding 5px 12px vs 4px 10px) ve **daha kalın font** (12.5 vs 11.5). Active state shadow'u da farklı: prototip yumuşak alt + iç border, implementasyon `--shadow-sm` + `--inset-top` (daha derin gölge). Header sağında küçük kalmış, görsel ağırlığı yetersiz.
- **Öncelik:** High
- **Not:** SegmentedControl primitive'i tüm sayfalarda kullanılıyor — bu yüzden burada page-level override yapılmalı (prop olarak `size` yetmiyor; padding/font hard-coded). Çözüm: Dashboard için ya `size="md"` varyantı ekle, ya da inline `style` ile override yap. **VEYA** prototipi referans alıp `size="sm"` defaults'unu prototip değerlerine yaklaştır (12.5 font, 5px 12px padding) — bu sistem geneline yansır.

### 2.3 SegmentedControl active boxShadow tutarsız
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:224-225` — `boxShadow: "0 1px 2px oklch(0 0 0 / 0.05), inset 0 0 0 1px var(--border)"`
- **Implementasyon:** `Frontend2/components/primitives/segmented-control.tsx:62` — `"var(--shadow-sm), var(--inset-top)"`
- **Fark:** Token'a sarmalanmış ama prototipin border'lı look'u kayıp. Pill aktif buton border'ı yerine soft top inset gösteriyor.
- **Öncelik:** Medium

### 2.4 StatCard ikon boyutu 15 → 14
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:15-18` — `<Icons.Folder/>` (Icon defaults: `size=15` from `New_Frontend/src/icons.jsx`)
- **Implementasyon:** `Frontend2/app/(shell)/dashboard/page.tsx:118, 125, 132, 150` — `<Folder size={14} />` (lucide)
- **Fark:** 1px küçük. Ikon kutusu 32x32 olduğu için ufak farkla görsel boşluk hissi artar.
- **Öncelik:** Low

### 2.5 StatCard ikon kutusu borderRadius 8 → var(--radius)
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:52` — `borderRadius: 8`
- **Implementasyon:** `Frontend2/components/dashboard/stat-card.tsx:57` — `borderRadius: "var(--radius)"`
- **Fark:** `--radius` token tanımına bağlı; eğer 8'e eşit değilse köşe yumuşaklığı farklı. (`--radius` çoğunlukla 10-12 arası — bu durumda ikon kutusu daha yuvarlak görünür.)
- **Öncelik:** Low — tema token'ı bağımlı

### 2.6 StatCard label letterSpacing 0.4 → 0.5
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:48` — `letterSpacing: 0.4`
- **Implementasyon:** `Frontend2/components/dashboard/stat-card.tsx:38` — `letterSpacing: 0.5`
- **Fark:** UPPERCASE etiketin harf aralığı 0.1 fazla. Görsel olarak biraz daha "geniş" hissi verir.
- **Öncelik:** Low

### 2.7 StatCard değer fontSize 28 → 20
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:49` — `fontSize: 28, fontWeight: 600, letterSpacing: -0.8`
- **Implementasyon:** `Frontend2/components/dashboard/stat-card.tsx:44` — `fontSize: 20, fontWeight: 600, letterSpacing: -0.8`
- **Fark:** **8px küçültülmüş**, çok belirgin. Prototip dashboard'un en bariz vizüel öğelerinden biri olan büyük rakamların etkisi yok olmuş. (4 kart üst üste dizildiğinde ana hiyerarşi rakamlar.) Bu **tek başına en kritik UI bug'lardan biri**.
- **Öncelik:** Critical

### 2.8 PortfolioTable header altyazı fontSize 12 → 12.5
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:26` — `fontSize: 12`
- **Implementasyon:** `Frontend2/app/(shell)/dashboard/page.tsx:169` — `fontSize: 12.5`
- **Fark:** 0.5 büyük (subtitle "Aktif projeler, ilerleme ve sahipler"). Çok minor.
- **Öncelik:** Low

### 2.9 PortfolioTable header letterSpacing 0.4 → 0.5
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:74` — sütun başlık satırı `letterSpacing: 0.4`
- **Implementasyon:** `Frontend2/components/dashboard/portfolio-table.tsx:40` — `letterSpacing: 0.5`
- **Fark:** Tüm uppercase sütun başlıklarının harf aralığı 0.1 fazla — yorum satırında "UI-sweep: standardize letterSpacing 0.4 -> 0.5" diye gerekçelendirilmiş ama prototip kararı 0.4. Bu **bilinçli drift** ama prototip referansının dışında.
- **Öncelik:** Low

### 2.10 PortfolioTable row padding 11px → 10px
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:88` — `padding: "11px 16px"`
- **Implementasyon:** `Frontend2/components/dashboard/portfolio-table.tsx:92` — `padding: "10px 16px"` (yorumda "row pad 11px -> 10px to match header")
- **Fark:** 1px küçük; prototip header (10px) ile row (11px) arasında bilerek ufak fark koymuş ama implementasyon eşitlemiş. Görsel etki minimal ama tablo yüksekliği kümülatif olarak değişiyor (10 satırda 10px daha az dikey alan).
- **Öncelik:** Low

### 2.11 PortfolioTable progress mono fontVariantNumeric eksik
- **Prototip:** `New_Frontend/src/pages/dashboard.jsx:105` — `<span className="mono" style={{ fontSize: 11, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>{Math.round(p.progress * 100)}%</span>`
- **Implementasyon:** `Frontend2/components/dashboard/portfolio-table.tsx:151-159` — `fontVariantNumeric: "tabular-nums"` **eksik** (mono className var ama tabular-nums style yok).
- **Fark:** Yüzdeler farklı genişlikte rakamlar (0%, 18%, 100%) içerdiğinde sütunda "zıplama" olur. `mono` className zaten font-feature-settings: "tnum" içeriyor olabilir ama bu CSS'e bağlı; explicit yazılması daha güvenli.
- **Öncelik:** Low

---

## 3. BİLİNMEYEN EXTRAS

### 3.1 ActivityFeed `maxHeight: 360` + scroll
- **Implementasyon:** `Frontend2/components/dashboard/activity-feed.tsx:84-90`
- **Prototipte:** Yok. Prototipin ActivityFeed'i fixed 5 item gösteriyor, scroll yok.
- **Açıklama:** Backend'den 20 item gelebileceği için scroll eklenmiş. **Mantıklı bir karar** ama prototipten sapma olduğu için "intentional extras" listesinde belirtilmesi gerek.

### 3.2 ActivityFeed boş state mesajı ("Henüz aktivite yok")
- **Implementasyon:** `Frontend2/components/dashboard/activity-feed.tsx:74-82`
- **Prototipte:** Yok (her zaman 5 hard-coded item).
- **Açıklama:** Empty state göstermek doğru pattern. Sorun değil ama prototipte yok.

### 3.3 ManagerView/MemberView role-based default
- **Implementasyon:** `Frontend2/app/(shell)/dashboard/page.tsx:20-26` — `isManagerRole` kontrolü → Admin/Manager/Project Manager ise default `manager`, değilse `member`.
- **Prototipte:** Always default `manager` (`useState_d("manager")`).
- **Açıklama:** Daha akıllı bir UX kararı — kullanıcı role'üne göre varsayılan görünüm. Sorun değil ama prototip dışı davranış.

### 3.4 useGlobalActivity admin gating + 403 swallow
- **Implementasyon:** `Frontend2/hooks/use-projects.ts:57-84`
- **Prototipte:** Activity feed direkt mock data'dan render ediliyor, izin kontrolü yok.
- **Açıklama:** Backend authz kısıtlamasına çözüm. Sorun değil; ancak Member kullanıcıların ActivityFeed'i hep boş — prototipteki "5 item her zaman görünür" UX kaybı. (Member için ActivityFeed kartını render etmeyi de düşünebilirsin.)

---

## 4. BİLİNEN EXTRAS (UYARI)
Yok.

---

## 5. HATALI / SORUNLU KOD

### 5.1 PortfolioTable satırı `cursor: pointer` ama onClick yok
- **Dosya:** `Frontend2/components/dashboard/portfolio-table.tsx:96-97`
- **Sorun türü:** Bug + A11y
- **Açıklama:** Satır `cursor: "pointer"` ile interaktif görünüyor, `hover-row` className'iyle hover background değişiyor — kullanıcı tıklanabilir sanıyor. Ama hiçbir handler yok. Klavye kullanıcısı için de `tabIndex`, `role="button"`, `onKeyDown` yok. (Bkz. 1.3 — fonksiyonalite eklendiğinde a11y de düzeltilmeli.)
- **Öneri:** `<Link href={\`/projects/\${project.id}\`}>` ile sar — Next.js Link tab/Enter klavyesi ve focus styling'i veriyor, semantik doğru. Veya div'e `onClick`, `onKeyDown` (Enter+Space), `role="button"`, `tabIndex={0}` ekle.
- **Öncelik:** Critical

### 5.2 MemberView prop drift: `defaultGroupBy="project"` kayıp
- **Dosya:** `Frontend2/app/(shell)/dashboard/page.tsx:190-196`
- **Sorun türü:** Prop drift / Behavior parity
- **Açıklama:** Prototip MemberView (`dashboard.jsx:177-189`) `MyTasksExperience`'a şu prop'ları geçiyor: `compact, defaultGroupBy="project", defaultView="all", hideQuickAdd, hideRightRail, hideHeader`. Implementasyon ise `defaultView="today"` (compact mode'da zaten "all"a force ediliyor — etkisiz) geçiyor ve `defaultGroupBy="project"` eksik (default "due" kalıyor). Kullanıcı "Yönetim/Benim İşim" toggle'ında prototip "Proje bazlı grupla" davranışı görür, implementasyon "Bitiş tarihine göre grupla" gösterir.
- **Öneri:** `defaultGroupBy="project"` ekle, `defaultView="today"` → `defaultView="all"` yap (ya da kaldır; compact zaten "all"a force eder).
- **Öncelik:** High

### 5.3 PortfolioTable `activeProjects` kullanıyor — prototip tüm projeleri gösterir
- **Dosya:** `Frontend2/app/(shell)/dashboard/page.tsx:29, 176`
- **Sorun türü:** Bug / Data scope
- **Açıklama:** Prototip `window.SPMSData.PROJECTS` kullanır — tüm projeler (status filtresi yok). Implementasyon `useProjects("ACTIVE")` ile sadece aktif projeleri gösterir. Tamamlanan, on-hold, archive projeler portföy tablosunda görünmüyor — yöneticinin "tüm proje portföyüm" görünümü kayıp.
- **Öneri:** `useProjects()` (status param'sız) sonucu — yani `allProjects` — `PortfolioTable`'a geç. Ya da en azından "Active + On Hold" göster.
- **Öncelik:** Medium

### 5.4 1. StatCard "Toplam Proje" değeri `allProjects.length` ama 4 kart "Aktif" `activeProjects.length` — dual fetch
- **Dosya:** `Frontend2/app/(shell)/dashboard/page.tsx:29-31`
- **Sorun türü:** Performance / Redundant fetch
- **Açıklama:** İki ayrı `useProjects` query yapılıyor: biri `status=ACTIVE`, biri tüm projeler. Backend'e iki API call. Tek call ile her ikisini de hesaplayabilir: `useProjects()` sonucu üzerinde client-side filter (`projects.filter(p => p.status === "ACTIVE")`).
- **Öneri:** Tek `useProjects()` çağrısı yap, `activeProjects = data.filter(p => p.status === "ACTIVE")` ile client-side türet. React Query cache'ini ayrı tutmaya gerek yok — proje listesi büyük değil (genelde <100).
- **Öncelik:** Medium

### 5.5 Avatar `color: var(--primary-fg)` — prototip `color: "#fff"`
- **Dosya:** `Frontend2/components/primitives/avatar.tsx:38`
- **Sorun türü:** Style drift
- **Açıklama:** Prototip Avatar text rengi sabit beyaz. Implementasyon `var(--primary-fg)` token'ı kullanıyor — bu çoğu temada beyaz olabilir ama theme override'larda farklı renge dönebilir. Avatar arka planı her zaman `--av-N` color (renkli), ön plan rengi sabit beyaz olmalı kontrast için.
- **Öneri:** `color: "#fff"` (veya `color: "white"`) ile prototipe uyumla. Ya da `--av-fg: #fff` token'ı tanımla ve onu kullan.
- **Öncelik:** Low — şu an default tema beyaz veriyor olmalı, ama "tema değişiminde kontrast bozulabilir" risk.

### 5.6 `Object.assign(window, { DashboardPage })` — prototip pattern, implementasyon doğru export ama yorumda hala referans yok
- **Dosya:** `Frontend2/app/(shell)/dashboard/page.tsx` (genel)
- **Sorun türü:** Dead code (yok aslında — bu bir non-issue, sadece prototip pattern'e atıf)
- **Açıklama:** Implementasyon zaten `export default function DashboardPage()` kullanıyor, sorun yok.
- **Öncelik:** N/A — false positive, eklemiyorum.

### 5.7 `String(allProjects.length)` ve `value: string | number` mixed
- **Dosya:** `Frontend2/app/(shell)/dashboard/page.tsx:115, 122, 129, 138-141`
- **Sorun türü:** Type smell / unnecessary stringification
- **Açıklama:** StatCard `value` prop'u `string | number` kabul ediyor (`stat-card.tsx:23`). Implementasyon her yerde `String(...)` ile manuel cast yapıyor. Gereksiz; sayı doğrudan geçilebilir. Loading state için `"—"` (em dash) ile karışıklık yaratmasın diye yapılmış olabilir ama `projectsLoading ? "—" : allProjects.length` ifadesi de çalışır (TypeScript widening yapar).
- **Öneri:** `String()` cast'lerini kaldır; ternary'nin iki kolu farklı tipte olduğunda TS otomatik union'a genişler.
- **Öncelik:** Low — kod temizliği.

### 5.8 `useGlobalActivity` admin-only — non-admin kullanıcılarda ActivityFeed her zaman boş + boş state metni
- **Dosya:** `Frontend2/hooks/use-projects.ts:57-84` + `Frontend2/components/dashboard/activity-feed.tsx:74-82`
- **Sorun türü:** UX / Behavior parity
- **Açıklama:** Member kullanıcı dashboard'u açtığında "Manager" view'a (extra 3.3'e göre) gitmez, ama eğer yönetici/admin değilse manager view'a manuel geçtiyse activity feed her zaman "Henüz aktivite yok" gösterir. Bu boş state, "kullanıcının yetkisi yok" durumunu "sistem boş" gibi göstererek yanıltıcı. Prototipte bu sorun yok çünkü activity mock data'dan geliyor.
- **Öneri:** ActivityFeed'i sadece admin'e göster (manager view'da bile) ya da boş state metnini "Bu görünüm için yetkiniz yok" gibi tutarlı yap. **VEYA** card'ı tamamen gizle.
- **Öncelik:** Medium

### 5.9 ActivityFeed avatar `avColor: (i % 8) + 1` — kararsız renk
- **Dosya:** `Frontend2/components/dashboard/activity-feed.tsx:94`
- **Sorun türü:** Bug / UX inconsistency
- **Açıklama:** Avatar rengi item'ın **listedeki konumuna** (i index) göre belirleniyor. Yani aynı kullanıcı (örn. "Ayşe Demir") feed sıralaması değişince farklı renk avatar alır. Prototipte `getUser(it.user)` ile USERS tablosundan sabit `avColor` çekiliyor — kullanıcının rengi sabit. Bu **avatar renk tutarlılığını kıran ciddi bir UX bug**'ı.
- **Öneri:** `user_id` veya `user_name`'in hash'inden deterministik renk üret: `const avColor = (hashStr(item.user_name) % 8) + 1`. Veya backend `user_av_color` field'ı dönsün.
- **Öncelik:** Medium

---

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| # | Öncelik | Madde | Dosya | Bölüm |
|---|---------|-------|-------|-------|
| 1 | Critical | PortfolioTable satırlarına onClick → /projects/{id} navigasyonu ekle | `Frontend2/components/dashboard/portfolio-table.tsx:84` | 1.3, 5.1 |
| 2 | Critical | StatCard değer fontSize 20 → 28 düzelt | `Frontend2/components/dashboard/stat-card.tsx:44` | 2.7 |
| 3 | High | PortfolioTable header'ına Filter + CSV ghost butonları ekle | `Frontend2/app/(shell)/dashboard/page.tsx:157-175` | 1.1 |
| 4 | High | Header H1 fontSize 20 → 24 düzelt | `Frontend2/app/(shell)/dashboard/page.tsx:84` | 2.1 |
| 5 | High | SegmentedControl prototip değerlerine yaklaştır (padding 5px 12px, font 12.5) | `Frontend2/components/primitives/segmented-control.tsx:54-60` | 2.2 |
| 6 | High | PortfolioTable'a Team/AvatarStack sütunu geri ekle (boş veri için fallback) | `Frontend2/components/dashboard/portfolio-table.tsx:36, 90` | 1.2 |
| 7 | High | 4. StatCard "Açık Görev" → "Gecikmiş" semantiğine döndür (overdue count) | `Frontend2/app/(shell)/dashboard/page.tsx:135-151` | 1.5 |
| 8 | High | 2. StatCard "Aktif Proje" → "Aktif Görev" semantiğine döndür | `Frontend2/app/(shell)/dashboard/page.tsx:120-126` | 1.7 |
| 9 | High | MemberView'da `defaultGroupBy="project"` ekle, `defaultView="all"` yap | `Frontend2/app/(shell)/dashboard/page.tsx:190-196` | 5.2 |
| 10 | Medium | StatCard delta'larını prototip trend metinlerine geri çevir ("+2", "+14", "bu hafta") | `Frontend2/app/(shell)/dashboard/page.tsx:113-151` | 1.6 |
| 11 | Medium | PortfolioTable'da `useProjects()` (tüm proje) kullan; client-side filter | `Frontend2/app/(shell)/dashboard/page.tsx:29-31, 176` | 5.3, 5.4 |
| 12 | Medium | ActivityFeed avatar renkleri deterministik hash → kullanıcı sabit renk | `Frontend2/components/dashboard/activity-feed.tsx:94` | 5.9 |
| 13 | Medium | SegmentedControl active boxShadow prototip değerine döndür | `Frontend2/components/primitives/segmented-control.tsx:62` | 2.3 |
| 14 | Medium | ActivityFeed Member için yetki bazlı gizle veya empty mesajı netleştir | `Frontend2/components/dashboard/activity-feed.tsx:74-82` | 5.8 |
| 15 | Low | StatCard ikon size 14 → 15 | `Frontend2/app/(shell)/dashboard/page.tsx:118, 125, 132, 150` | 2.4 |
| 16 | Low | StatCard ikon kutusu borderRadius `var(--radius)` → 8 | `Frontend2/components/dashboard/stat-card.tsx:57` | 2.5 |
| 17 | Low | StatCard label letterSpacing 0.5 → 0.4 | `Frontend2/components/dashboard/stat-card.tsx:38` | 2.6 |
| 18 | Low | PortfolioTable header subtitle fontSize 12.5 → 12 | `Frontend2/app/(shell)/dashboard/page.tsx:169` | 2.8 |
| 19 | Low | PortfolioTable header letterSpacing 0.5 → 0.4 | `Frontend2/components/dashboard/portfolio-table.tsx:40` | 2.9 |
| 20 | Low | PortfolioTable row padding 10px → 11px | `Frontend2/components/dashboard/portfolio-table.tsx:92` | 2.10 |
| 21 | Low | PortfolioTable progress mono yüzde için `fontVariantNumeric: "tabular-nums"` ekle | `Frontend2/components/dashboard/portfolio-table.tsx:151-159` | 2.11 |
| 22 | Low | Avatar `color: "var(--primary-fg)"` → `"#fff"` | `Frontend2/components/primitives/avatar.tsx:38` | 5.5 |
| 23 | Low | StatCard `String(...)` cast'lerini kaldır | `Frontend2/app/(shell)/dashboard/page.tsx:115, 122, 129, 138` | 5.7 |
| 24 | Low | Header altyazı `&middot;` → `·` (UTF-8 düz karakter) | `Frontend2/app/(shell)/dashboard/page.tsx:88` | 1.4 |

---

## 7. KAPSAM NOTLARI
- **Okunan dosyalar:**
  - `New_Frontend/src/pages/dashboard.jsx` (tam, 233 satır)
  - `New_Frontend/src/primitives.jsx` (1-256, dashboard'un kullandığı: Avatar, AvatarStack, Badge, Button, Card, SegmentedControl, PriorityChip, StatusDot)
  - `New_Frontend/src/icons.jsx` (Folder, CheckSquare, CircleCheck, Alert, Filter, Download)
  - `New_Frontend/src/data.jsx` (USERS, PROJECTS, getUser, ilk 100 satır)
  - `New_Frontend/src/i18n.jsx` (Yönetim/Benim İşim/Make it count anahtarları için Grep)
  - `Frontend2/app/(shell)/dashboard/page.tsx` (tam, 200 satır)
  - `Frontend2/components/dashboard/stat-card.tsx` (tam)
  - `Frontend2/components/dashboard/portfolio-table.tsx` (tam)
  - `Frontend2/components/dashboard/methodology-card.tsx` (tam)
  - `Frontend2/components/dashboard/activity-feed.tsx` (tam)
  - `Frontend2/components/primitives/segmented-control.tsx` (tam)
  - `Frontend2/components/primitives/avatar.tsx`, `card.tsx`, `badge.tsx` (tam)
  - `Frontend2/hooks/use-projects.ts` (tam)
  - `Frontend2/services/project-service.ts` (tam)
  - `Frontend2/components/my-tasks/my-tasks-experience.tsx` (1-235, MemberView prop kontratı için)
  - `Frontend2/app/globals.css` (`.hover-row` utility için Grep)

- **Atlanan/eksik kalan:**
  - `MyTasksExperience` iç davranışı tam derinlemesine değil — MemberView entegrasyonu için kontrat yeterli (compact, defaultGroupBy, defaultView, hideHeader/RightRail/QuickAdd prop'ları) ama compact mode'un içindeki rendering detayları ayrı bir my-tasks triajının konusu (bu task değil).
  - Backend `/projects` ve `/tasks/my-tasks` API kontratları okunmadı — yalnız service mapping katmanı (`project-service.ts`) okundu. PortfolioTable'da `member_avatars` field'ı backend'de var mı bilinmiyor.
  - Theme tokens (`--radius`, `--primary-fg`, `--shadow-sm`, `--inset-top`) numerik değerleri okunmadı; "8 vs var(--radius)" karşılaştırması token'ın değerine bağlı (genelde 10-12).

- **Belirsizlikler:**
  - 4. StatCard "Açık Görevler" → "Gecikmiş" değişimi backend'in overdue count desteği yoksa client-side `useMyTasks()` ile hesaplanır ama bu yöneticinin **kendi** tasklarını gösterir — ideal olan tüm projelerdeki overdue count. Backend endpoint eklenmesi gerekebilir.
  - PortfolioTable Team sütunu için backend `project.member_avatars` veya `project.members` field'ı gerekiyor; mevcut `Project` interface'inde yok. Bu nedenle 1.2 için backend değişikliği prerequisite.
  - SegmentedControl boyut değişikliği (2.2) sistem-genel impact yapar (settings sayfası SegmentedPills'i de bu primitive'e delegate ediyor) — değişiklik öncesi diğer kullanım yerlerinin görsel testi gerek.
  - Activity feed `avColor` deterministik hash (5.9) için `hashStr` helper yok — ya implement edilmeli ya da basit `name.charCodeAt(0) % 8 + 1` ile yetinilmeli.
