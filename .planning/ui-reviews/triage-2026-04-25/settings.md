# Settings (Ayarlar) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-settings
**Prototip kaynak:**
- New_Frontend/src/pages/settings.jsx
- New_Frontend/src/pages/admin.jsx (cross-reference)
- New_Frontend/src/pages/user-profile.jsx (cross-reference)
- New_Frontend/src/tweaks.jsx (cross-reference)
- New_Frontend/src/primitives.jsx
- New_Frontend/src/theme.jsx
- New_Frontend/src/icons.jsx
**Implementasyon kaynak:**
- Frontend2/app/(shell)/settings/page.tsx
- Frontend2/context/app-context.tsx
- Frontend2/lib/theme.ts
- Frontend2/components/primitives/* (Card, Button, Toggle, SegmentedControl, Input, Avatar)
- Frontend2/components/sidebar.tsx (sidebar `/admin` linki kontrolü)
- Frontend2/services/auth-service.ts
- Frontend2/components/toast/index.tsx
**Bilinen intentional extras:** Yok
**Cross-reference notu:** Prototipte `admin.jsx` (8 alt sekmeli kapsamlı bir Yönetim Konsolu — Overview, Users, Roles, Permissions, Projects, Templates, Audit, Stats) ve `user-profile.jsx` (3 sekmeli profil sayfası — Tasks/Projects/Activity) ayrı sayfalar olarak vardır. Frontend2'de **hiçbiri yoktur**: `Frontend2/app/(shell)/admin/` ve `Frontend2/app/(shell)/profile/` dizinleri yok, settings içine de dahil edilmemişler. `Frontend2/components/sidebar.tsx:409-415` `/admin` linkini render ediyor ama route mevcut değil → 404'e yönlendiriyor (Critical). Sidebar user menüsündeki "Profilim" butonu (line 256-261) `onClick`'te yalnızca menüyü kapatıyor, hiçbir yere navigasyon yapmıyor (dead button).

## TL;DR Özet
- Eksik elementler: 14
- Layout/şekil farkı: 7
- Bilinmeyen extras: 2
- Bilinen extras: 0
- Hatalı kod: 6
- **Admin & user-profile içerikleri Frontend2'de var mı?** **Hayır — ikisi de tamamen yok.** Admin sayfası prototipte 8 alt sekme + ~480 satırlık kapsamlı bir konsol; Frontend2'de hiç yok. User Profile prototipte 3 sekmeli profil görünümü (Tasks/Projects/Activity); Frontend2'de hiç yok. Settings içine de eklenmemiş. Sidebar `/admin` linki kırık (404). User menüsündeki "Profilim" butonu dead.
- **EN KRİTİK 3 MADDE:**
  1. **Admin Console (admin.jsx) tamamen yok** — Prototipte ~480 satır, 8 alt sekme (Overview, Users, Roles, Permissions, Projects, Templates, Audit, Stats), kullanıcı yönetimi, rol yönetimi, izin matrisi, audit log, denetim raporları, vb. Frontend2'de bu sayfa hiç implemente edilmemiş, sidebar'daki link kırık.
  2. **User Profile (user-profile.jsx) tamamen yok** — Prototipte 3 sekmeli kapsamlı profil görünümü (Görevler/Projeler/Aktivite), grouped tasks by project, profile header. Frontend2'de hiç yok; sidebar user menüsündeki "Profilim" butonu da dead/no-op.
  3. **Security sekmesinde 2FA kartı ve Active Sessions kartı tamamen yok** — Prototipte Password (mevcut) + 2FA card with Active badge & Reconfigure button (yok) + Active Sessions card with current device + revoke (yok). Sadece Password kartı korunmuş. Profile sekmesinde de 6 alandan 4'ü silinmiş (Görünen ad, Telefon, Departman, Unvan).

## 1. EKSİK ELEMENTLER

### 1.1 Admin Console sayfası tamamen yok
- **Prototipte:** `New_Frontend/src/pages/admin.jsx:1-482` (AdminPage + 8 alt sekme component'i)
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/admin/page.tsx` (yok), `Frontend2/components/admin/` (yok)
- **Görsel/davranış:** Yönetim Konsolu başlığı, Export/Audit log butonları, 8 sekmeli tab nav (Overview/Users/Roles/Permissions/Projects/Templates/Audit/Stats). Overview alt sekmesinde 5 StatCard (Users, Active projects, Pending, Templates, Storage) + Pending Project Join Requests listesi + Role distribution + Recent admin events kartı. Users alt sekmesinde filtre + role filter + CSV/Bulk invite/Add user butonları + tablo. Roles alt sekmesinde 4 rol kartı + Create new role kartı. Permissions alt sekmesinde rol bazında izin matrisi (sticky header). Projects, Templates, Audit, Stats alt sekmeleri.
- **Prototip kod alıntısı:**
  ```jsx
  // admin.jsx:3-47
  const AdminPage = () => {
    const router = useRouter();
    const lang = useApp().language;
    const sub = router.page === "admin" ? "overview" : router.page.slice(6);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icons.Shield size={18} style={{ color: "var(--primary)" }}/>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{lang === "tr" ? "Yönetim Konsolu" : "Admin Console"}</div>
            </div>
            ...
          </div>
        </div>
        <Tabs active={sub} onChange={...} tabs={[
          { id: "overview", label: ..., icon: <Icons.Dashboard size={13}/> },
          { id: "users",    label: ..., icon: <Icons.Users size={13}/>, badge: window.SPMSData.USERS.length },
          { id: "roles",    label: ..., icon: <Icons.Shield size={13}/> },
          { id: "permissions", ... },
          { id: "projects", ... },
          { id: "workflows", ... },
          { id: "audit",    ... },
          { id: "stats",    ... },
        ]}/>
        ...
      </div>
    );
  };
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `Frontend2/app/(shell)/admin/page.tsx` (overview default), `Frontend2/app/(shell)/admin/users/page.tsx`, `.../roles/page.tsx`, `.../permissions/page.tsx`, `.../projects/page.tsx`, `.../templates/page.tsx`, `.../audit/page.tsx`, `.../stats/page.tsx` route yapısı oluştur. Veya tek `/admin` sayfasında lokal `Tabs` ile iç sekme. Tabs primitive (Frontend2/components/primitives/tabs.tsx) zaten var; StatCard (Frontend2/components/dashboard/stat-card.tsx) zaten var. Sayfa için role-gating: `useAuth()` + `user?.role?.name === "Admin"`.

### 1.2 User Profile sayfası tamamen yok
- **Prototipte:** `New_Frontend/src/pages/user-profile.jsx:1-122`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/profile/page.tsx` veya `Frontend2/app/(shell)/users/[id]/page.tsx` (yok)
- **Görsel/davranış:** Card header (avatar size 64 + name + role badge + "Sen"/"You" badge for self + email + 3 stat counters: projects/tasks/completed) + Edit button (sadece self için). 3 StatCard (Atanan Görevler / Tamamlanan / Projeler). 3 sekme: Görevler (proje grupları + filter Active/Done/All) / Projeler (3-col grid ProjectCard) / Aktivite (ActivityTab full).
- **Prototip kod alıntısı:**
  ```jsx
  // user-profile.jsx:3-9
  const UserProfilePage = () => {
    const router = useRouter();
    const lang = useApp().language;
    const T = (tr, en) => lang === "tr" ? tr : en;
    const userId = router.params.userId || window.SPMSData.CURRENT_USER.id;
    const user = window.SPMSData.getUser(userId);
    const isSelf = userId === window.SPMSData.CURRENT_USER.id;
    ...
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `Frontend2/app/(shell)/profile/page.tsx` (current user) ve `Frontend2/app/(shell)/users/[id]/page.tsx` (başka kullanıcılar). Sidebar user menüsündeki "Profilim" butonunu (`Frontend2/components/sidebar.tsx:256-261`) `<Link href="/profile">` haline getir.

### 1.3 Profil bölümünde "Görünen ad" alanı yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:55` — `<LabeledField label={lang === "tr" ? "Görünen ad" : "Display name"} defaultValue="Ayşe"/>`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:269-281` (ProfileSection grid'i)
- **Görsel/davranış:** İkinci sütunda "Görünen ad / Display name" input alanı.
- **Prototip kod alıntısı:**
  ```jsx
  <LabeledField label={lang === "tr" ? "Görünen ad" : "Display name"} defaultValue="Ayşe"/>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Profile section grid'ine ekle (backend'de `display_name` alanı var mı kontrol et; yoksa şimdilik visual-only state).

### 1.4 Profil bölümünde "Telefon" alanı yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:57` — `<LabeledField label={lang === "tr" ? "Telefon" : "Phone"} defaultValue="+90 532 *** **89"/>`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:269-281` (ProfileSection grid)
- **Öncelik:** High
- **Düzeltme önerisi:** "Telefon / Phone" input alanı ekle. Mask format opsiyonel.

### 1.5 Profil bölümünde "Departman" alanı yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:58` — `<LabeledField label={lang === "tr" ? "Departman" : "Department"} defaultValue="Ürün · Teknoloji"/>`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:269-281`
- **Öncelik:** Medium
- **Düzeltme önerisi:** "Departman / Department" alanı ekle.

### 1.6 Profil bölümünde "Unvan" alanı yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:59` — `<LabeledField label={lang === "tr" ? "Unvan" : "Title"} defaultValue="Head of Engineering"/>`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:269-281`
- **Öncelik:** Medium
- **Düzeltme önerisi:** "Unvan / Title" alanı ekle.

### 1.7 Profil avatar'ı: Avatar primitive yerine inline div, prototip avatar size 72 yerine 64
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:47` — `<Avatar user={u} size={72} style={{ fontSize: 24 }}/>` (renkli av-color background, gerçek user initials)
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:230-243`
- **Görsel/davranış:** Prototipte 72px'lik renkli (av-color tabanlı) Avatar primitive kullanılıyor; impl 64px'lik flat `var(--accent)` arka planlı manuel div.
- **Prototip kod alıntısı:**
  ```jsx
  <Avatar user={u} size={72} style={{ fontSize: 24 }}/>
  ```
- **Öncelik:** Medium
- **Düzeltme önerisi:** `Avatar` primitive'ini import et (`@/components/primitives`), `size={72}` ile kullan. `AuthUser` tipine `initials` ve `avColor` ekle veya hesapla.

### 1.8 Appearance: "Marka Rengi" kartında "Custom active" badge yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:177` — `{app.customColors && <Badge tone="primary" dot>{lang === "tr" ? "Özel aktif" : "Custom active"}</Badge>}`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:604-612` (Marka Rengi başlık satırı)
- **Görsel/davranış:** Custom color uygulandığında başlığın yanında "Özel aktif" dot badge görünür.
- **Öncelik:** Medium
- **Düzeltme önerisi:** Header satırını flex justify-between yap, sağa Badge ekle: `{customColors && <Badge tone="primary" dot>{language === "tr" ? "Özel aktif" : "Custom active"}</Badge>}`.

### 1.9 Appearance: "Marka Rengi" kartında 2-kolon layout + WCAG/Önizleme swatch yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:180-218` — sliders sol kolonda, sağ kolonda büyük preview kart (WCAG estimate, ΔL, mono ColorString, light scale ribbon).
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:613-687`
- **Görsel/davranış:** Prototipte slidlar (1.2fr) ile preview (1fr) yan yana. Preview'da: küçük "Önizleme" başlığı, oklch(L C H) swatch, 5 light scale strip, "WCAG uyum tahmini" başlığı + AA/Check badge + ΔL göstergesi. Implementasyonda preview swatch tek kolonda altta yatay duruyor; light scale ve WCAG estimate yok.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Slider label={`L · ${...}`} ... />
      <Slider label={`C · ${...}`} ... />
      <Slider label={`H · ${...}`} ... />
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" onClick={applyCustom}>Uygula</Button>
        <Button variant="secondary" onClick={() => app.saveCustomPreset(...)}>Yeni tema olarak kaydet</Button>
        <Button variant="ghost" onClick={() => app.applyPreset("default")}>Sıfırla</Button>
      </div>
    </div>
    <div>
      <div style={{ padding: 16, background: "var(--surface-2)", borderRadius: 10, ... }}>
        <div>ÖNİZLEME</div>
        <div style={{ background: `oklch(...)` }}>...</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[0.3, 0.45, 0.6, 0.75, 0.9].map(l => <div ...background: oklch(${l} ...)/>)}
        </div>
        <div>WCAG uyum tahmini</div>
        <Badge size="xs" tone={...}>{... "AA ok" : "Check"}</Badge>
        <span className="mono">ΔL≈{...}</span>
      </div>
    </div>
  </div>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Bu blokta tam 2-kolon grid, 5-step light scale ve WCAG kontrast tahmini Badge ekle. Sayfanın tek "Marka Rengi" kartı yeniden inşa edilmeli.

### 1.10 Appearance: "Yeni tema olarak kaydet" butonu yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:187` — `<Button variant="secondary" onClick={() => app.saveCustomPreset({...})}>Yeni tema olarak kaydet</Button>`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:678-685` (Marka Rengi action satırı)
- **Görsel/davranış:** Apply/Reset arasında "Yeni tema olarak kaydet" / "Save as new theme" butonu. `customPresets` listesine yeni preset push'lar.
- **Öncelik:** High
- **Düzeltme önerisi:** `app-context.tsx`'e `saveCustomPreset(brand)` action'ı ekle (id `custom-${ts}`, name TR/EN, mode mevcut, tokens deriveFromBrand'den), `customPresets` artık `useState` ile setter de export etsin. Settings sayfasında bu butonu Apply'in yanına koy.

### 1.11 Appearance: "Özel Temalarım" / Custom Themes kartı yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:221-241` — Bağımsız `Card padding={20}`, başlık + açıklama + grid (4-col) içinde özel preset kartları VEYA empty state ("Henüz özel temanız yok…").
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:687` ile `689` arası (Marka Rengi'nden sonra)
- **Görsel/davranış:** `customPresets.length === 0` durumunda dashed border'lı, ortalanmış empty state mesajı; doluysa 4-col preset kartları (active highlight + 3 swatch).
- **Prototip kod alıntısı:**
  ```jsx
  <Card padding={20}>
    <div>{lang === "tr" ? "Özel Temalarım" : "My Custom Themes"}</div>
    <div>...</div>
    {app.customPresets.length === 0 ? (
      <div style={{ padding: 30, ..., border: "1px dashed var(--border-strong)" }}>
        {lang === "tr" ? "Henüz özel temanız yok. 'Yeni tema olarak kaydet' ile başlayın." : "..."}
      </div>
    ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {app.customPresets.map(p => (...))}
      </div>
    )}
  </Card>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Marka Rengi kartından sonra bu kartı ekle. `customPresets` zaten context'te var, sadece UI eksik.

### 1.12 Appearance: Bağımsız "Layout Tokens" kartı yok (radius + sidebar prototipte ayrı kartta)
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:243-254` — Bağımsız "Layout Tokens" başlıklı `Card padding={20}` içinde radius slider + sidebar segmented control.
- **Olması gereken implementasyon yeri:** Şu an `Frontend2/app/(shell)/settings/page.tsx:559-601`'de "Görünüm Modu" kartı içine karıştırılmış (impl'da Dark mode, radius, sidebar tek kartta).
- **Görsel/davranış:** Prototipte ayrı bir "Layout Tokens" kartı var; impl'da bu yok, içeriği "Görünüm Modu" kartına gömülmüş.
- **Öncelik:** Medium
- **Düzeltme önerisi:** Yeni `Card` ekle başlık `Layout Tokens` ile; mevcut "Görünüm Modu" kartı sadece dark mode toggle'ı içersin (zaten impl'a eklenmiş bilinmeyen extra — bkz. 3.1).

### 1.13 Security: "İki Faktörlü Kimlik Doğrulama" kartı yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:308-317` — Bağımsız Card: 2FA başlık + açıklama + "Etkin / Active" success badge + "Yeniden yapılandır / Reconfigure" secondary buton.
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:430-477` (SecuritySection)
- **Görsel/davranış:** Password kartından sonra ayrı kart: TOTP açıklaması, durum badge'i, reconfigure butonu.
- **Prototip kod alıntısı:**
  ```jsx
  <Card padding={20}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div>{lang === "tr" ? "İki Faktörlü Kimlik Doğrulama" : "Two-Factor Auth"}</div>
        <div>{lang === "tr" ? "TOTP ile hesabınızı koruyun..." : "Protect your account with TOTP."}</div>
      </div>
      <Badge tone="success" dot>{lang === "tr" ? "Etkin" : "Active"}</Badge>
    </div>
    <Button variant="secondary" style={{ marginTop: 12 }}>{lang === "tr" ? "Yeniden yapılandır" : "Reconfigure"}</Button>
  </Card>
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** Password kartından sonra 2FA kartı ekle. Backend MFA endpoint'i yoksa visual-only state — prototipi 1:1 takip et.

### 1.14 Security: "Aktif Oturumlar" kartı yok
- **Prototipte:** `New_Frontend/src/pages/settings.jsx:318-333` — Bağımsız Card: 2 örnek session (Macbook Pro Chrome - "Şu an" - Current; iPhone 15 Pro Safari - 2 saat önce - Revoke butonu).
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/settings/page.tsx:430-477`
- **Görsel/davranış:** Cihaz adı, lokasyon, son aktif zaman, "Bu cihaz" badge'i (şu anki için), "Çıkış / Revoke" butonu (kritik renk).
- **Öncelik:** High
- **Düzeltme önerisi:** 2FA kartından sonra Active Sessions kartı ekle. Backend session listesi yoksa mock/visual-only.

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.1 Sol nav buton padding farklı
- **Prototip:** `New_Frontend/src/pages/settings.jsx:21` — `padding: "8px 10px"`
- **Implementasyon:** `Frontend2/app/(shell)/settings/page.tsx:824` — `padding: "6px 10px"`
- **Fark:** Prototipte dikey padding 8px (toplam height ~32px), impl'de 6px (height ~28px). Buton yüksekliği 4px daha sıkı.
- **Öncelik:** Low

### 2.2 Preferences açıklama satırı margin yanlış
- **Prototip:** `New_Frontend/src/pages/settings.jsx:81` — `marginBottom: 20` (açıklama ile ilk satır arasında 20px boşluk)
- **Implementasyon:** `Frontend2/app/(shell)/settings/page.tsx:334` — `marginBottom: 4`
- **Fark:** Açıklama metni ile ilk PrefRow arasındaki boşluk prototipte 20px, impl'de 4px. PrefRow zaten `borderTop` ile başlıyor; impl'de açıklama satırı PrefRow'un border-top'una neredeyse yapışık duruyor.
- **Öncelik:** Medium
- **Düzeltme önerisi:** `marginBottom: 4` → `marginBottom: 20` yap.

### 2.3 Notifications kolon başlıkları (Email/In-app/Desktop) yer değiştirmiş
- **Prototip:** `New_Frontend/src/pages/settings.jsx:290-292` — Kolon başlıkları **EN ALTTA**, `borderTop: "1px solid var(--border)"` ile. Görseldeki sıra: 6 satır → ayraç çizgi → "Email | In-app | Desktop" küçük etiketler.
- **Implementasyon:** `Frontend2/app/(shell)/settings/page.tsx:749-760` — Kolon başlıkları **EN ÜSTTE**, `borderBottom`. Görsel sıra: "Email | In-app | Desktop" → 6 satır.
- **Fark:** Prototip "footer" başlıkları kullanırken implementasyon "header" başlıkları kullanmış. Görsel düzen tamamen farklı.
- **Öncelik:** High
- **Düzeltme önerisi:** Header bloğunu altına taşı, `borderTop` yap.

### 2.4 Notifications: ilk satırın borderTop davranışı drift
- **Prototip:** `New_Frontend/src/pages/settings.jsx:283` — `borderTop: i === 0 ? "0" : "1px solid var(--border)"` (ilk satırın üstü açık çünkü header'ı yok)
- **Implementasyon:** `Frontend2/app/(shell)/settings/page.tsx:768` — `borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none"` (son satırda border yok)
- **Fark:** Border yön ve mantığı tamamen ters çevrilmiş; bu kolon başlıklarının yer değişimiyle (2.3) bağlantılı.
- **Öncelik:** Medium

### 2.5 Appearance Preset Card'da mode ikonu (Sun/Moon) yok
- **Prototip:** `New_Frontend/src/pages/settings.jsx:163` — `{p.mode === "dark" ? <Icons.Moon size={10}/> : <Icons.Sun size={10}/>} {p.mode === "dark" ? "Koyu" : "Light"}`
- **Implementasyon:** `Frontend2/app/(shell)/settings/page.tsx:548-552` — Sadece text, ikon yok.
- **Fark:** Preset kartlarının altındaki mode etiketinde küçük güneş/ay ikonu eksik (light/dark görsel ipucu).
- **Öncelik:** Low

### 2.6 LabeledField input height ve padding farkı
- **Prototip:** `New_Frontend/src/pages/settings.jsx:72` — `height: 34, padding: "0 10px"`
- **Implementasyon:** `Frontend2/app/(shell)/settings/page.tsx:104` — `height: 32, padding: "0 8px"` (yorum: "standardized to Input primitive baseline")
- **Fark:** Prototip 34px, impl 32px (2px daha kısa). Comment "standardize" diyor ama prototip ile uyumsuz.
- **Öncelik:** Low (prototype 1:1 ilkesi gereği reportlanmalı, ama ufak)

### 2.7 Appearance preset kartı border-radius drift
- **Prototip:** `New_Frontend/src/pages/settings.jsx:155` — `borderRadius: 10` (sabit)
- **Implementasyon:** `Frontend2/app/(shell)/settings/page.tsx:528` — `borderRadius: "var(--radius-lg)"` (tema radius'una bağlı, default 12px ama kullanıcı 0-22 arasında değiştirebilir)
- **Fark:** Prototipte sabit 10px; impl'de dinamik token. Marka Rengi preview swatch'inde de aynı drift (line 665).
- **Öncelik:** Low

## 3. BİLİNMEYEN EXTRAS

### 3.1 "Görünüm Modu" başlıklı dark mode toggle kartı (prototipte ayrı yok)
- **Implementasyon:** `Frontend2/app/(shell)/settings/page.tsx:559-601`
- **Açıklama:** Impl, "Hazır Temalar" kartından sonra ayrı bir "Görünüm Modu / Display Mode" kartı eklemiş (Toggle on/off). Prototipte böyle ayrı bir kart YOK; mode yalnızca preset üzerinden değişir (light preset → light, dark preset → dark). Bu kart aynı zamanda Layout Tokens (radius + sidebar) için ayrı kart olması gereken içeriği de gömmüş.
- **Önerilen aksiyon:** Üç senaryo:
  - (A) Tamamen kaldır, mode'u preset değişiminin yan ürünü olarak bırak (prototip davranışı). Tweaks panelinde mode toggle'ı zaten var (`tweaks.jsx:73-80`). Önerilen: A.
  - (B) Korumak gerekiyorsa, prototipin tweaks panelindeki "Mod" SegmentedControl'ünü Settings'e taşı ve "Layout Tokens" kartını ayır.

### 3.2 `applyMode()` mode toggle handler'ında manuel çağrı (gereksiz)
- **Implementasyon:** `Frontend2/app/(shell)/settings/page.tsx:566-571`:
  ```tsx
  <Toggle
    on={mode === "dark"}
    onChange={v => {
      setMode(v ? "dark" : "light")
      applyMode(v ? "dark" : "light")  // <-- redundant
    }}
  />
  ```
- **Açıklama:** `app-context.tsx` zaten `useEffect` içinde `applyMode(m)` çağırıyor (line 117-127). Burada manuel çağrı dead code; ayrıca `applyMode` impor edildiği için extra import yükü. Prototipte yok.

## 4. BİLİNEN EXTRAS (UYARI)
Yok.

## 5. HATALI / SORUNLU KOD

### 5.1 Sidebar `/admin` linki kırık (404'e yönlendiriyor)
- **Dosya:** `Frontend2/components/sidebar.tsx:409-415`
- **Sorun türü:** Bug | Dead route
- **Açıklama:** Sidebar her zaman "Yönetim Paneli / Admin Panel" NavItem'ını render ediyor (`href="/admin"`), ama `Frontend2/app/(shell)/admin/page.tsx` mevcut değil. Tıklayan kullanıcı 404 görür.
- **Öneri:** Ya `/admin` route'unu oluştur (1.1 ile birlikte), ya da role-gating ekleyip admin olmayanlara hiç gösterme. Şu anki durum hem PM/Member için yanıltıcı hem de Admin için kırık. Aynı zamanda role-gating yok: Member kullanıcı bile Admin Panel linkini görüyor.
- **Öncelik:** Critical

### 5.2 Sidebar user menüsündeki "Profilim" butonu dead (no-op)
- **Dosya:** `Frontend2/components/sidebar.tsx:256-262`:
  ```tsx
  <button
    onClick={() => setOpen(false)}
    className="hover-row"
    style={menuItemStyle}
  >
    {lang === "tr" ? "Profilim" : "My Profile"}
  </button>
  ```
- **Sorun türü:** Bug | Dead button
- **Açıklama:** Buton menüyü kapatıyor ama hiçbir yere navigate etmiyor; profil sayfası yok (1.2). Prototipte (`user-profile.jsx`) ve `app-shell` user menüsünden navigation beklenir.
- **Öneri:** `/profile` route'u oluştur ve `<Link href="/profile">` kullan.
- **Öncelik:** High

### 5.3 Profile section: Telefon/Departman/Unvan/Görünen ad alanları yok ama backend `auth-service.updateProfile` sadece `full_name`/`email` kabul ediyor
- **Dosya:** `Frontend2/services/auth-service.ts:64-72`, `Frontend2/app/(shell)/settings/page.tsx:198-212`
- **Sorun türü:** Spec drift / Eksik backend alanı
- **Açıklama:** `updateProfile` DTO'sunda yalnızca `full_name`, `email`, `current_password`, `new_password` var. Prototipteki Telefon/Departman/Unvan/Display Name alanları için backend desteği yok ya da kontrol edilmemiş. UI eksikliği (1.3-1.6) ile birlikte değerlendirilmeli.
- **Öneri:** Backend `UserResponseDTO` ve `UpdateProfileDTO`'yu genişlet. Şimdilik visual-only ekleyebilirsin ama backend roadmap'ine ekle.
- **Öncelik:** Medium

### 5.4 Password change: aynı PUT `/auth/me` endpoint'i hem `current_password` doğrulamasını hem profile değişikliklerini birlikte gönderiyor
- **Dosya:** `Frontend2/services/auth-service.ts:64-72` ve `Frontend2/app/(shell)/settings/page.tsx:405-407`
- **Sorun türü:** Security (kötü API tasarımı)
- **Açıklama:** Profil güncelleme ve parola değişikliği aynı endpoint'i paylaşıyor. Profile mutation'da `current_password` boş gönderiliyor, password mutation'da `full_name`/`email` boş gönderiliyor. Backend ayrımı net değilse hesap ele geçirme/yetki yükseltme riski. Ayrıca `current_password` eksikse parola güncellemesi durdurulmuyor (bu kontrol UI'da `canChangePassword` ile yapılıyor ama API doğrudan boş `current_password` gelirse kabul edebilir).
- **Öneri:** Ayrı endpoint: `PUT /auth/me` (profile) ve `POST /auth/me/password` (parola değişikliği), backend'de `current_password` ZORUNLU.
- **Öncelik:** High

### 5.5 Password change UI'da "canChangePassword" disable edilmiyor (button yine clickable)
- **Dosya:** `Frontend2/app/(shell)/settings/page.tsx:425-427` ve `465-473`
- **Sorun türü:** Bug | Dead validation
- **Açıklama:** `canChangePassword` hesaplanıyor (`currentPass.length > 0 && newPass.length >= 8 && newPass === confirmPass`) ama Button'a `disabled={!canChangePassword}` veya `onClick={canChangePassword ? mutate : noop}` uygulanmıyor. Yorum (line 425) "T-10-06-01: disable button until all fields valid" diyor ama implementasyon yok.
- **Öneri:** `<Button disabled={!canChangePassword || changePasswordMutation.isPending} ...>` ekle. Button primitive `disabled` prop'unu desteklediğinden direkt yapılabilir.
- **Öncelik:** High

### 5.6 Hafta başlangıcı + Klavye kısayolları + Komut paleti toggle'ları persist edilmeyen visual-only state (kayıp tıklama)
- **Dosya:** `Frontend2/app/(shell)/settings/page.tsx:372-388`
- **Sorun türü:** Bug | Dead UI
- **Açıklama:** Bu üç PrefRow'da `onChange={() => { /* visual only */ }}` (no-op). Toggle'a tıklayan kullanıcı state değişmediği için toggle "off" pozisyonda kalıyor (görsel feedback yok). Hafta başlangıcı için `value={"mon"}` sabit; SegmentedControl başka bir option'ı tıklayamaz görünüyor (state yok). Kullanıcı "kırık" hisseder.
- **Öneri:** Kısa vadede en azından lokal `useState` ile görsel toggle çalışsın; uzun vadede `app-context`'e ekle (`weekStartsOn`, `keyboardShortcutsEnabled`, `commandPaletteEnabled`) ve persist et. Prototipteki Toggle bile aynı şekilde `on` prop sabit; ama prototip demo olduğundan bu kabul edilebilir, impl'da ise gerçek user-facing app olduğu için bug.
- **Öncelik:** Medium

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| # | Öncelik | Madde | Dosya | Bölüm |
|---|---------|-------|-------|-------|
| 1 | Critical | Admin Console (admin.jsx) sayfası komple yok | `Frontend2/app/(shell)/admin/` (yok) | 1.1 |
| 2 | Critical | User Profile (user-profile.jsx) sayfası komple yok | `Frontend2/app/(shell)/profile/` (yok) | 1.2 |
| 3 | Critical | Sidebar `/admin` linki 404'e yönlendiriyor + role-gating yok | `Frontend2/components/sidebar.tsx:409-415` | 5.1 |
| 4 | High | Sidebar "Profilim" butonu dead/no-op | `Frontend2/components/sidebar.tsx:256-262` | 5.2 |
| 5 | High | Security: 2FA kartı yok | `Frontend2/app/(shell)/settings/page.tsx:430-477` | 1.13 |
| 6 | High | Security: Active Sessions kartı yok | `Frontend2/app/(shell)/settings/page.tsx:430-477` | 1.14 |
| 7 | High | Profile: Görünen ad alanı yok | `Frontend2/app/(shell)/settings/page.tsx:269-281` | 1.3 |
| 8 | High | Profile: Telefon alanı yok | `Frontend2/app/(shell)/settings/page.tsx:269-281` | 1.4 |
| 9 | High | Appearance: Marka Rengi 2-kol layout + WCAG preview yok | `Frontend2/app/(shell)/settings/page.tsx:613-687` | 1.9 |
| 10 | High | Appearance: "Yeni tema olarak kaydet" butonu yok | `Frontend2/app/(shell)/settings/page.tsx:678-685` | 1.10 |
| 11 | High | Appearance: "Özel Temalarım" kartı yok | `Frontend2/app/(shell)/settings/page.tsx:687` | 1.11 |
| 12 | High | Notifications kolon başlıkları yer değişmiş (üst yerine alt) | `Frontend2/app/(shell)/settings/page.tsx:749-760` | 2.3 |
| 13 | High | Password change endpoint paylaşımı + current_password validation | `Frontend2/services/auth-service.ts:64-72`, `Frontend2/app/(shell)/settings/page.tsx:405-407` | 5.4 |
| 14 | High | Password change Button disable edilmiyor (canChangePassword dead) | `Frontend2/app/(shell)/settings/page.tsx:425-427, 465-473` | 5.5 |
| 15 | Medium | Profile: Departman alanı yok | `Frontend2/app/(shell)/settings/page.tsx:269-281` | 1.5 |
| 16 | Medium | Profile: Unvan alanı yok | `Frontend2/app/(shell)/settings/page.tsx:269-281` | 1.6 |
| 17 | Medium | Profile avatar: Avatar primitive yerine inline div, size 64 vs 72 | `Frontend2/app/(shell)/settings/page.tsx:230-243` | 1.7 |
| 18 | Medium | Appearance: "Custom active" badge yok | `Frontend2/app/(shell)/settings/page.tsx:604-612` | 1.8 |
| 19 | Medium | Appearance: bağımsız "Layout Tokens" kartı yok | `Frontend2/app/(shell)/settings/page.tsx:559-601` | 1.12 |
| 20 | Medium | Preferences açıklama marginBottom 4 → 20 olmalı | `Frontend2/app/(shell)/settings/page.tsx:334` | 2.2 |
| 21 | Medium | Notifications ilk satır borderTop drift | `Frontend2/app/(shell)/settings/page.tsx:768` | 2.4 |
| 22 | Medium | Backend updateProfile DTO eksik (telefon/departman/unvan) | `Frontend2/services/auth-service.ts:64-72` | 5.3 |
| 23 | Medium | Visual-only toggle'lar (hafta/kısayol/palet) "kırık" hissettiriyor | `Frontend2/app/(shell)/settings/page.tsx:372-388` | 5.6 |
| 24 | Medium/Low | Bilinmeyen extra: "Görünüm Modu" kartı | `Frontend2/app/(shell)/settings/page.tsx:559-601` | 3.1 |
| 25 | Low | Sol nav buton padding 8→6 drift | `Frontend2/app/(shell)/settings/page.tsx:824` | 2.1 |
| 26 | Low | Preset Card mode ikonu (Sun/Moon) yok | `Frontend2/app/(shell)/settings/page.tsx:548-552` | 2.5 |
| 27 | Low | LabeledField height 34→32 drift | `Frontend2/app/(shell)/settings/page.tsx:104` | 2.6 |
| 28 | Low | Appearance preset radius 10 → var(--radius-lg) drift | `Frontend2/app/(shell)/settings/page.tsx:528, 665` | 2.7 |
| 29 | Low | applyMode() onChange'de manuel çağrı (dead) | `Frontend2/app/(shell)/settings/page.tsx:566-571` | 3.2 |

## 7. KAPSAM NOTLARI
- **Okunan dosyalar:**
  - Prototip: `New_Frontend/src/pages/settings.jsx`, `New_Frontend/src/pages/admin.jsx`, `New_Frontend/src/pages/user-profile.jsx`, `New_Frontend/src/tweaks.jsx`, `New_Frontend/src/primitives.jsx`, `New_Frontend/src/icons.jsx`
  - Implementasyon: `Frontend2/app/(shell)/settings/page.tsx`, `Frontend2/app/(shell)/layout.tsx`, `Frontend2/components/app-shell.tsx`, `Frontend2/components/sidebar.tsx`, `Frontend2/components/primitives/{toggle,segmented-control,index}.tsx`, `Frontend2/context/{app-context,auth-context}.tsx`, `Frontend2/services/auth-service.ts`, `Frontend2/lib/{theme,i18n}.ts`, `Frontend2/components/toast/index.tsx`
  - Glob taramaları ile teyit: admin/profile route ve component yok; `customPresets` setter yok; sidebar `/admin` linki var ama route yok.
- **Atlanan/eksik kalan:**
  - Backend tarafında `/auth/me` endpoint'inin gerçek davranışını okumadım (sadece TS DTO'larına baktım); password endpoint ayrımı / MFA endpoint olup olmadığı backend tarafında ayrıca doğrulanmalı.
  - `UserAvatar` backend kontratı (`uploadAvatar`) testleri okumadım — UI tetikleme ve toast davranışı doğru.
  - Tweaks panelinin Frontend2'de olup olmadığını sadece glob ile teyit ettim (yok). Eğer Tweaks panelinin Frontend2'de olması intended değilse settings sayfasının "Görünüm Modu" + diğer kontrolleri Tweaks'i çoğunlukla kapsadığı söylenebilir; ama bu prototip-1:1 ilkesine aykırı çünkü tweaks ayrı bir floating panel.
- **Belirsizlikler:**
  - "Görünüm Modu / Dark mode" kartı (3.1) intentional bir extra mı yoksa drift mi? Belge yok.
  - Backend'in MFA/Sessions endpoint'leri var mı? Yoksa 2FA + Sessions kartlarının visual-only eklenip eklenmeyeceği kararı.
  - `customPresets` setter olmaması context'te bilinçli mi (R/O kullanım için) yoksa unutuldu mu? Mevcut `[customPresets] = useState(...)` yazımı setter'ı export etmiyor; "Yeni tema olarak kaydet" özelliğini bağlamak için context refactor gerekecek.
