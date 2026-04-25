# Authentication (Login + Register + Forgot Password) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-auth
**Prototip kaynak:**
- New_Frontend/src/pages/misc.jsx (AuthPage — lines 1-114; LogoMark — lines 116-120)
- New_Frontend/src/app.jsx (auth routing — lines 146-157)
- New_Frontend/src/primitives.jsx (Button — lines 73-118)
- New_Frontend/src/icons.jsx (Sparkle — line 65)
**Implementasyon kaynak:**
- Frontend2/app/(auth)/login/page.tsx
- Frontend2/app/(auth)/forgot-password/page.tsx
- Frontend2/app/(auth)/session-expired/page.tsx
- Frontend2/app/(auth)/layout.tsx
- Frontend2/components/logo-mark.tsx
- Frontend2/components/primitives/button.tsx
- Frontend2/components/primitives/input.tsx
- Frontend2/context/auth-context.tsx
- Frontend2/services/auth-service.ts
- Frontend2/middleware.ts
- Frontend2/lib/constants.ts
**Bilinen intentional extras:** D-11 kararı altında; "Kayıt ol" linki, Google OAuth butonu ve "veya e-posta ile" ayraç **kasıtlı olarak kaldırılmıştır** (closed-system politikası). Bu maddeler Bölüm 4'te listelenmiş, "EKSİK" olarak işaretlenmemiştir. Ayrıca register ekranının tamamı kasıtlı olarak yoktur (D-11).

## TL;DR Özet
- Eksik elementler: 7
- Layout/şekil farkı: 11
- Bilinmeyen extras: 4
- Bilinen extras (D-11): 4
- Hatalı kod: 6
- **EN KRİTİK 3 MADDE:**
  1. **Sağ panel marka içeriği komple yeniden yazılmış** — Prototipteki başlık ("Waterfall'dan Scrum'a — tek platform, sizin kurallarınız."), 4 istatistik kart değeri (120+ Aktif proje, 99.9% Çalışma süresi, 4.8/5 Kullanıcı puanı, 24/7 Destek), badge metni ("Özelleştirilebilir iş akışları" + `<Icons.Sparkle/>` SVG ikonu) ve paragraf ("Özel yaşam döngüsü kuralları, rol tabanlı yetkiler ve gerçek zamanlı işbirliği") tamamen farklı metinlere ve değerlere değiştirilmiş; ikon emoji "✦" ile yer değiştirmiş. Bu D-11 kapsamında değil.
  2. **i18n / TR-EN dil desteği yok** — Prototipte tüm metinler `T(tr,en)` ile dil-duyarlı. Implementasyondaki üç sayfa (login/forgot/session-expired) hard-coded Türkçe; `useApp().language` kullanılmıyor. `app/layout.tsx:87` `<html lang="tr">` sabit. Kullanıcı dil değiştirse bile auth ekranları TR kalır.
  3. **Display tipografisi off-spec ve prototipte farklı** — Login `Tekrar hoş geldiniz` başlığı 28→**20**px (login/page.tsx:75-79), sağ panel headline 36→**24**px (login/page.tsx:294-307), paragraf 14.5→**14**px (login/page.tsx:310-322), StatCard değer 22→**20**px (login/page.tsx:348-357). Forgot-password sayfası ise `28px` başlığı korumuş (forgot/page.tsx:60-64) — iki sayfa arasında **iç tutarsızlık**.

## 1. EKSİK ELEMENTLER

### 1.1 i18n / TR-EN dil duyarlılığı
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:5-6` (`const lang = useApp().language; const T = (tr, en) => lang === "tr" ? tr : en;`) ve tüm metinler `T(...)` ile sarılmış (satır 14, 19-26, 34, 38, 45-48, 54, 57, 62-77, 87-103).
- **Olması gereken implementasyon yeri:** `Frontend2/app/(auth)/login/page.tsx`, `Frontend2/app/(auth)/forgot-password/page.tsx`, `Frontend2/app/(auth)/session-expired/page.tsx`.
- **Görsel/davranış:** `useApp().language` ile EN/TR değişkenliği. Prototipte örn. login → "Welcome back" (en) veya "Tekrar hoş geldiniz" (tr).
- **Prototip kod alıntısı:**
  ```jsx
  const lang = useApp().language;
  const T = (tr, en) => lang === "tr" ? tr : en;
  // ...
  {mode === "login" && T("Tekrar hoş geldiniz", "Welcome back")}
  ```
- **Öncelik:** High
- **Düzeltme önerisi:** `useApp()` hook'u import edip `lang === "tr" ? "Tekrar hoş geldiniz" : "Welcome back"` veya `lib/i18n.ts` `t()` fonksiyonu ile tüm hard-code metinleri sarın. `forgot-password`, `session-expired` ve `login` üçü için.

### 1.2 Sağ panel başlığı (headline)
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:89-91`
  ```jsx
  <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -1, marginTop: 20, lineHeight: 1.15, maxWidth: 480 }}>
    {T("Waterfall'dan Scrum'a — tek platform, sizin kurallarınız.", "Waterfall to Scrum — one platform, your rules.")}
  </div>
  ```
- **Olması gereken implementasyon yeri:** `Frontend2/app/(auth)/login/page.tsx:294-307`, `Frontend2/app/(auth)/forgot-password/page.tsx:235-248`.
- **Görsel/davranış:** Prototip "Waterfall'dan Scrum'a..." metnini gösteriyor; implementasyon "Projelerinizi tek yerden yönetin" yazıyor — komple farklı bir copy.
- **Öncelik:** Critical
- **Düzeltme önerisi:** Headline'ı prototipe geri getir. (Font-size de bkz. 2.2.)

### 1.3 Sağ panel paragrafı
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:92-94`
  ```jsx
  <div style={{ fontSize: 14.5, color: "var(--fg-muted)", marginTop: 16, lineHeight: 1.6, maxWidth: 440 }}>
    {T("Özel yaşam döngüsü kuralları, rol tabanlı yetkiler ve gerçek zamanlı işbirliği.", "Custom lifecycle rules, role-based access, real-time collaboration.")}
  </div>
  ```
- **Olması gereken implementasyon yeri:** `Frontend2/app/(auth)/login/page.tsx:310-322`, `Frontend2/app/(auth)/forgot-password/page.tsx:251-263`.
- **Görsel/davranış:** Prototip "Özel yaşam döngüsü kuralları..." gösteriyor; implementasyon "Scrum, Kanban ve Waterfall metodolojilerini destekleyen SPMS ile ekibinizin verimliliğini artırın..." adlı uzun bir kopya kullanıyor — farklı içerik.
- **Öncelik:** Critical
- **Düzeltme önerisi:** Paragrafı prototipe geri getir. Font-size ve max-width değerlerini de prototip değerine al. (Bkz. 2.3.)

### 1.4 Sağ panel 2×2 istatistik kart değerleri
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:97-109`
  ```jsx
  {[
    { k: "120+", v: T("Aktif proje", "Active projects") },
    { k: "99.9%", v: T("Çalışma süresi", "Uptime") },
    { k: "4.8/5", v: T("Kullanıcı puanı", "User rating") },
    { k: "24/7", v: T("Destek", "Support") },
  ].map(s => (
    <div key={s.k} style={{ padding: 14, background: "var(--surface)", borderRadius: 10, boxShadow: "inset 0 0 0 1px var(--border)" }}>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>{s.k}</div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{s.v}</div>
    </div>
  ))}
  ```
- **Olması gereken implementasyon yeri:** `Frontend2/app/(auth)/login/page.tsx:333-369`, `Frontend2/app/(auth)/forgot-password/page.tsx:274-310`.
- **Görsel/davranış:** Prototip iş/ürün metrikleri gösteriyor (120+ aktif proje, 99.9% uptime vb.). Implementasyon ise dev-meta gösteriyor: "4 Metodoloji desteği", "16+ UI bileşeni", "%100 Prototipe sadık", "v2.0 Mevcut sürüm" — pazarlama sayfası amacına aykırı.
- **Öncelik:** Critical
- **Düzeltme önerisi:** Tüm 4 değer + label'ı prototipe geri getir; padding 14, borderRadius 10, value fontSize 22 (UI-sweep yorumlarındaki "20" ile değil).

### 1.5 Sağ panel badge metni "Özelleştirilebilir iş akışları" + `<Icons.Sparkle/>`
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:86-88`
  ```jsx
  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "var(--surface)", boxShadow: "inset 0 0 0 1px var(--border)", fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: "var(--primary)", textTransform: "uppercase" }}>
    <Icons.Sparkle size={11}/> v2.4 — {T("Özelleştirilebilir iş akışları", "Customizable workflows")}
  </div>
  ```
- **Olması gereken implementasyon yeri:** `Frontend2/app/(auth)/login/page.tsx:272-290`, `Frontend2/app/(auth)/forgot-password/page.tsx:214-232`.
- **Görsel/davranış:** Prototip "✦ v2.4 — Özelleştirilebilir iş akışları" / "Customizable workflows", `Icons.Sparkle` SVG ikonu, `letterSpacing 0.3`, `textTransform: uppercase`, `background: var(--surface)`. Implementasyon "✦ v2.4 — Yeni Özellikler" yazıyor; uppercase yok (CSS yok); SVG ikon yerine emoji "✦" karakteri var; background `color-mix(in oklch, var(--primary) 12%, var(--surface))` (prototipte var(--surface) düz); `letterSpacing 0.5` (prototipte 0.3); `marginBottom 24` (prototipte yok).
- **Öncelik:** High
- **Düzeltme önerisi:** İkon olarak SVG `Sparkle` (`Frontend2/components/icons` içinde varsa) kullan; metni "Özelleştirilebilir iş akışları" yap; `textTransform: uppercase`, `letterSpacing: 0.3`, `background: var(--surface)` ekle.

### 1.6 Sağ panel mizanpajı (`justifyContent: "space-between"`)
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:84` — `padding: "80px 60px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between"`.
- **Olması gereken implementasyon yeri:** `Frontend2/app/(auth)/login/page.tsx:249-260`.
- **Görsel/davranış:** Prototipte üst (badge + headline + paragraph) ve alt (stat grid) panele yapışıyor; aralarında boşluk doluyor. Implementasyon `justifyContent: "center"` (login/page.tsx:255) → tüm içerik dikeyde ortalanıyor; üst-alt yapışma olmuyor.
- **Öncelik:** High
- **Düzeltme önerisi:** `justifyContent: "space-between"` yap; üst grup (badge + headline + paragraph) bir `<div>` içinde, stat grid ayrı `<div>` olsun.

### 1.7 Görsel radial gradient — `--status-progress` ikinci radial gradient
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:83`
  ```jsx
  background: "radial-gradient(800px 500px at 70% 30%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 60%), radial-gradient(500px 300px at 20% 80%, color-mix(in oklch, var(--status-progress) 10%, transparent), transparent 60%)"
  ```
- **Olması gereken implementasyon yeri:** `Frontend2/app/(auth)/login/page.tsx:262-270`, `Frontend2/app/(auth)/forgot-password/page.tsx:204-212`.
- **Görsel/davranış:** Prototipte iki radial gradient katmanı var (sol-altta progress-renkli ikincisi). Implementasyonda yalnızca tek gradient (`ellipse at 70% 30%, primary 12%`) — ikinci `--status-progress` katmanı silinmiş; %14 yerine %12 kullanılmış; `800px 500px` ölçü yerine `ellipse` keyword'ü.
- **Öncelik:** Medium
- **Düzeltme önerisi:** Prototipteki çift radial gradient stringini birebir kullan.

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

### 2.1 Display başlık font-size (login)
- **Prototip:** `New_Frontend/src/pages/misc.jsx:18` — `fontSize: 28, fontWeight: 600, letterSpacing: -0.8`.
- **Implementasyon:** `Frontend2/app/(auth)/login/page.tsx:75-79` — `fontSize: 20`. Yorum: "UI-sweep: snapped from 28 -> 20 (Display top of UI-SPEC 4-bucket)".
- **Fark:** 8 px küçülmüş. Forgot ile tutarsız (orada 28 korunmuş — bkz. 2.5).
- **Öncelik:** High

### 2.2 Sağ panel headline font-size
- **Prototip:** `New_Frontend/src/pages/misc.jsx:89` — `fontSize: 36, fontWeight: 600, letterSpacing: -1, lineHeight: 1.15, marginTop: 20, maxWidth: 480`.
- **Implementasyon:** `Frontend2/app/(auth)/login/page.tsx:294-307` — `fontSize: 24, fontWeight: 700, letterSpacing: -1, lineHeight: 1.15, marginBottom: 16`. `maxWidth` yok.
- **Fark:** 36→24 (12px daha küçük), 600→700 (daha kalın), `marginTop: 20` yerine `marginBottom: 16`. `maxWidth: 480` kayıp → headline taşabilir.
- **Öncelik:** Critical

### 2.3 Sağ panel paragraf font-size
- **Prototip:** `New_Frontend/src/pages/misc.jsx:92` — `fontSize: 14.5, marginTop: 16, lineHeight: 1.6, maxWidth: 440`.
- **Implementasyon:** `Frontend2/app/(auth)/login/page.tsx:310-322` — `fontSize: 14, lineHeight: 1.7, marginBottom: 40, maxWidth: 380`.
- **Fark:** 14.5→14 (0.5px), `lineHeight: 1.6→1.7`, `maxWidth: 440→380` (daha dar), spacing `marginTop` → `marginBottom`.
- **Öncelik:** Medium

### 2.4 Sağ panel padding
- **Prototip:** `New_Frontend/src/pages/misc.jsx:84` — `padding: "80px 60px"`. Aynı.
- **Implementasyon:** `Frontend2/app/(auth)/login/page.tsx:253` — `padding: "80px 60px"` ✓ aynı.
- **Fark:** Padding aynı. Buradaki sorun `flex` davranışı — prototipte container `position: relative` + iç div'lerin `position: absolute, inset: 0` ve `position: relative` ayrımı net (içerik fixed positioning ile baskılanıyor). Implementasyonda padding doğrudan dış container'a uygulanmış (radial gradient overlay zaten absolute olduğundan sorun yok ama iç içerik yapısı 1.6'daki space-between yokluğundan dolayı yanlış hizalanır).
- **Öncelik:** Low (zaten 1.6 + 2.2 birlikte çözer)

### 2.5 Forgot-password headline font-size
- **Prototip:** `New_Frontend/src/pages/misc.jsx:18` — `fontSize: 28` (login dahil aynı).
- **Implementasyon:** `Frontend2/app/(auth)/forgot-password/page.tsx:60-64` — `fontSize: 28` ✓ doğru.
- **Fark:** Forgot doğru ama login (2.1) yanlış. **İç tutarsızlık** — iki kardeş ekran arasında font-size farklı.
- **Öncelik:** High (UX tutarsızlık)

### 2.6 StatCard değer font-size
- **Prototip:** `New_Frontend/src/pages/misc.jsx:105` — `fontSize: 22, fontWeight: 600, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums"`.
- **Implementasyon:** `Frontend2/app/(auth)/login/page.tsx:348-357` — `fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums"`. `letterSpacing` yok.
- **Fark:** 22→20, 600→700 (daha kalın), `letterSpacing: -0.5` kayıp.
- **Öncelik:** High

### 2.7 StatCard padding ve borderRadius
- **Prototip:** `New_Frontend/src/pages/misc.jsx:104` — `padding: 14, borderRadius: 10, boxShadow: "inset 0 0 0 1px var(--border)", background: "var(--surface)"`.
- **Implementasyon:** `Frontend2/app/(auth)/login/page.tsx:341-346` — `padding: "16px 20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "color-mix(in oklch, var(--surface) 60%, var(--bg))"`.
- **Fark:** padding `14`→`16px 20px` (yatay daha geniş), borderRadius literal `10`→token `var(--radius-lg)`, border `inset boxShadow`→gerçek `border` (CSS box-model farklı, içerik 1px kayar), background `var(--surface)` düz→ `color-mix` ile karışım.
- **Öncelik:** High

### 2.8 Form üst alanı `marginBottom`
- **Prototip:** `New_Frontend/src/pages/misc.jsx:23` — `marginBottom: 28` (subtitle altında).
- **Implementasyon:** `Frontend2/app/(auth)/login/page.tsx:88` — `marginBottom: 24` (login).
- **Fark:** 4px farklı; form spacing daralmış.
- **Öncelik:** Low

### 2.9 Login submit butonu — `Hesabınız yok mu?` -> `Yönetici onayı ile hesap açılır.` 
- **Prototip:** `New_Frontend/src/pages/misc.jsx:67-71` — Login için "Hesabınız yok mu? Kayıt olun" link'i.
- **Implementasyon:** `Frontend2/app/(auth)/login/page.tsx:209-218` — "Yönetici onayı ile hesap açılır." statik metin.
- **Fark:** D-11 kararı gereği — bu **bilinmesi gereken intentional değişiklik** (closed system). Bölüm 4'te tekrar listelenmiştir; layout farkı olarak değil "kasıtlı" notu ile.
- **Öncelik:** N/A (intentional)

### 2.10 Footer metinleri
- **Prototip:** `New_Frontend/src/pages/misc.jsx:74-78` — `fontSize: 11, color: "var(--fg-subtle)", display: "flex", gap: 16` ve `<a>{T("Gizlilik", "Privacy")}</a>` (cursor:pointer rehberinde href yok).
- **Implementasyon:** `Frontend2/app/(auth)/login/page.tsx:222-245` — Aynı font/spacing ✓ ama `href="#"` (anchor with hash) ve `textDecoration: "none"`.
- **Fark:** `href="#"` kullanımı sayfa scroll'unu en üste atar (hash boş + JS yok) → kullanıcıya tıklayınca tepki yok ama URL'e `#` ekler. Prototipte `<a>` href'siz cursor pointer için var.
- **Öncelik:** Medium (bkz. 5.5 a11y/UX bug)

### 2.11 Forgot-password "Girişe dön" link rengi
- **Prototip:** `New_Frontend/src/pages/misc.jsx:70` — Forgot için `color: "var(--primary)", fontWeight: 600`.
- **Implementasyon (form):** `Frontend2/app/(auth)/forgot-password/page.tsx:113-122` — `color: "var(--fg-muted)"` (yetersiz vurgu).
- **Implementasyon (success):** `Frontend2/app/(auth)/forgot-password/page.tsx:148-158` — `color: "var(--primary)", fontWeight: 600` ✓ doğru.
- **Fark:** Form ekranındaki "← Girişe dön" link'i `fg-muted` ile (prototipteki `primary` 600 yerine). Bu CTA'nın belirginliğini düşürüyor; success ekranı doğru.
- **Öncelik:** Medium

## 3. BİLİNMEYEN EXTRAS

### 3.1 `Yönetici onayı ile hesap açılır.` metnindeki `marginTop: 16` Card-stil container yok
- **Dosya:** `Frontend2/app/(auth)/login/page.tsx:209-218`
- **Açıklama:** Bu D-11 kapsamında onaylanmış; ama prototipte mevcut olmadığı için "extra" olarak listelendi. Yorum (`{/* D-11 */}`) ile dokümante.
- **Öncelik:** N/A (intentional, dokümante)

### 3.2 Inline error banner (login)
- **Dosya:** `Frontend2/app/(auth)/login/page.tsx:181-195`
- **Açıklama:** `priority-critical` renkli error mesajı (`color-mix` background + border). Prototipte hiç bir error UI yok — sadece happy-path. Ancak bu eklenmesi gerekli bir UX iyileştirmesi (T-10-03-02 doc'unda generic error mesajı zorunlu).
- **Öncelik:** Low (prototipe ekleme önerilir, eksik değil)

### 3.3 Loading state ("Giriş yapılıyor...")
- **Dosya:** `Frontend2/app/(auth)/login/page.tsx:205`, `Frontend2/app/(auth)/forgot-password/page.tsx:109`
- **Açıklama:** `isLoading` ile buton metni "Giriş yap" → "Giriş yapılıyor..." değişiyor. Prototipte yok ama UX iyileştirmesi.
- **Öncelik:** Low (prototipe ekleme önerilir)

### 3.4 Session-expired sayfası komple
- **Dosya:** `Frontend2/app/(auth)/session-expired/page.tsx:1-49`
- **Açıklama:** Prototipte `auth-session-expired` rotası yok. Sayfa Phase 10'da eklenmiş (D-03 kararı gereği — 401 interceptor target). Marketing panel'i yok; ortada minimal LogoMark + başlık + buton. Bu bilinçli bir extra sayfa.
- **Öncelik:** N/A (intentional, dokümante)

### 3.5 Forgot success state — büyük değişim
- **Dosya:** `Frontend2/app/(auth)/forgot-password/page.tsx:125-159`
- **Açıklama:** Prototipte "Bağlantı gönderildi" başarı state'i yok; tek modlu form. Implementasyon `submitted` state'i ile başlık ("Bağlantı gönderildi") + email görüntüsü + "← Girişe dön" link'i ekliyor. Bilinmeyen extra; ancak UX iyileştirmesi.
- **Öncelik:** Low (prototipe ekleme önerilir)

## 4. BİLİNEN EXTRAS (UYARI)

D-11 (closed-system) kararı gereğince aşağıdaki prototip elementleri **kasıtlı olarak yoktur veya değiştirilmiştir** — bunlar EKSİK olarak işlenmemiştir:

1. **Register modu/sayfası tamamen yok.** Prototipte AuthPage `mode="register"` ile rendered (misc.jsx:20, 25, 30-49, 63, 69). Implementasyonda hiçbir `app/(auth)/register/page.tsx` yok. Ayrıca `auth-context.tsx` `register` fonksiyonu da yok; `auth-service.ts` register endpoint'i yok. Sebep: D-11 — kullanıcılar yalnızca admin tarafından oluşturulur. Kaynak: `.planning/phases/10-shell-pages-project-features/10-03-PLAN.md:115`.

2. **Google OAuth butonu kaldırılmış.** Prototipte misc.jsx:31-35 `Google ile devam et` butonu (Google logo SVG dahil). Implementasyonda yok. Sebep: D-11. Kaynak: `10-03-PLAN.md:116, 244`.

3. **"veya e-posta ile" ayraç (divider) kaldırılmış.** Prototipte misc.jsx:36-40. Implementasyonda yok. Sebep: D-11.

4. **"Hesabınız yok mu? Kayıt olun" linki yerine "Yönetici onayı ile hesap açılır." statik metin.** Prototipte misc.jsx:67-68 (login modu). Implementasyonda `Frontend2/app/(auth)/login/page.tsx:209-218`. Sebep: D-11. Kaynak: `10-03-PLAN.md:241`.

**UYARI:** Yukarıdaki 4 madde dışındaki prototip elementlerinin (örn. sağ panel marka içeriği, font-size'lar, badge metni vb.) D-11 kapsamında olduğuna dair herhangi bir doküman bulunmamıştır. Onlar Bölüm 1-2'de eksik/farklılık olarak listelenmiştir.

## 5. HATALI / SORUNLU KOD

### 5.1 SSR/hydration mismatch riski — `<html lang="tr">` sabit, AppContext dilden bağımsız
- **Dosya:** `Frontend2/app/layout.tsx:87`
- **Sorun türü:** Bug / a11y / i18n
- **Açıklama:** `<html lang="tr">` her zaman TR. Kullanıcı `useApp().setLanguage("en")` çağırdığında dahi DOM `lang` attribute güncellenmiyor → screen-reader yanlış dile geçer; `:lang(en)` selector'leri patlamaz. Auth ekranları için ekstra önemli, çünkü auth ekranlarında dil değiştirici de yok.
- **Öneri:** `app-context` içinde `document.documentElement.lang = language` effect'i, veya client-side root'ta `<html lang={language}>` kullan.
- **Öncelik:** Medium

### 5.2 Forgot-password — auth sahte (`setTimeout 600ms`)
- **Dosya:** `Frontend2/app/(auth)/forgot-password/page.tsx:13-21`
- **Sorun türü:** Bug / Dead code
- **Açıklama:** `await new Promise((resolve) => setTimeout(resolve, 600))` — backend endpoint çağırmıyor. Yorum doğru: "authService.requestPasswordReset not yet implemented". Kullanıcı her e-postaya başarı mesajı görür ama hiçbir e-posta gönderilmez. **Production'da kritik UX/güvenlik sorunu.**
- **Öneri:** `authService.requestPasswordReset(email)` portu açıp `Backend/.../auth.py` içinde `POST /auth/password-reset` endpoint'i ekle. Geçici çözüm: error mesajı verip "feature not yet available" göster.
- **Öncelik:** High

### 5.3 `LogoMark` size hesabı — fontSize tam sayı dışı oklch warning
- **Dosya:** `Frontend2/components/logo-mark.tsx:17` (`fontSize: size * 0.55`)
- **Sorun türü:** Style drift (kozmetik)
- **Açıklama:** size=22 → fontSize=12.1 (px). Prototip aynı formülü kullanıyor (misc.jsx:117 `fontSize: size * 0.55`) ama bu `letterSpacing: -0.5` da eşlik ediyor. Implementasyonda `letterSpacing` kayıp → "P" harfinin görsel sıkılığı farklı.
- **Öneri:** `letterSpacing: -0.5` ekle.
- **Öncelik:** Low

### 5.4 `Input` primitive — autoComplete/name kullanılmıyor
- **Dosya:** `Frontend2/app/(auth)/login/page.tsx:107-114`, `132-137`; `forgot-password/page.tsx:92-99`
- **Sorun türü:** A11y / UX (password manager)
- **Açıklama:** `Input` primitive `autoComplete` ve `name` prop'larını destekliyor (input.tsx:27) ama login email/password input'larına aktarılmamış. Tarayıcının password manager'ları "username" ve "current-password" semantiklerini bulamaz; auto-fill çalışmaz.
- **Öneri:** Email için `autoComplete="email" name="email"`, password için `autoComplete="current-password" name="password"` (forgot için `autoComplete="email" name="email"`).
- **Öncelik:** Medium

### 5.5 Footer link `href="#"` — JS onClick yok, scrolla atar
- **Dosya:** `Frontend2/app/(auth)/login/page.tsx:233-244`, `forgot-password/page.tsx:175-186`
- **Sorun türü:** Bug / A11y
- **Açıklama:** `<a href="#">Gizlilik</a>` ve `<a href="#">Şartlar</a>` — boş hash → URL'e `#` eklenir, sayfa "scroll-to-top" yapar; tıklandığında hiçbir gerçek sayfa açılmaz. Klavye/ekran okuyucu kullanıcıları "boş link" hisseder. Prototipte `<a>` href yok (cursor pointer için). 
- **Öneri:** Eğer henüz sayfa yoksa `<span>` kullan veya `aria-disabled="true"` + uygun `tabIndex={-1}`. Yapılacaksa `/legal/privacy` ve `/legal/terms` route'larını ekle.
- **Öncelik:** Medium

### 5.6 `aria-label` ve form label-input ilişkisi eksik
- **Dosya:** `Frontend2/app/(auth)/login/page.tsx:96-114, 119-137`; `forgot-password/page.tsx:81-99`
- **Sorun türü:** A11y
- **Açıklama:** `<label>...</label>` ve `<Input>` ayrı render ediliyor ama `htmlFor`/`id` bağı yok. `<label>E-posta</label><Input ... />` → tarayıcılar implicit ilişki kuramayacak (label `<input>` çocuğunu sarmıyor). Screen-reader "edit, blank" der; "Email, edit blank" demez.
- **Öneri:** `<label htmlFor="email">` + `<Input id="email" name="email" />`. `Input` primitive zaten `id` prop'unu destekliyor.
- **Öncelik:** Medium

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| # | Öncelik | Madde | Dosya | Bölüm |
|---|---------|-------|-------|-------|
| 1 | Critical | Sağ panel headline metni "Projelerinizi tek yerden yönetin" → "Waterfall'dan Scrum'a — tek platform, sizin kurallarınız." | login/page.tsx:294-307, forgot/page.tsx:235-248 | 1.2 |
| 2 | Critical | Sağ panel paragraf metni — prototipe geri al | login/page.tsx:310-322, forgot/page.tsx:251-263 | 1.3 |
| 3 | Critical | StatCard değerleri (4 Metodoloji vs.) → prototipte (120+, 99.9%, 4.8/5, 24/7) | login/page.tsx:333-369, forgot/page.tsx:274-310 | 1.4 |
| 4 | Critical | Headline font-size 24→36 ve fontWeight 700→600 | login/page.tsx:294-307, forgot/page.tsx:235-248 | 2.2 |
| 5 | High | Display başlık 20→28 (login: "Tekrar hoş geldiniz") | login/page.tsx:75-79 | 2.1 |
| 6 | High | i18n / TR-EN dil desteği — `useApp().language` ile sar | tüm 3 auth sayfası | 1.1 |
| 7 | High | Sağ panel `justifyContent: "center"` → `"space-between"` (üst-alt grup ayrımı) | login/page.tsx:255 | 1.6 |
| 8 | High | Badge metni "Yeni Özellikler" → "Özelleştirilebilir iş akışları"; SVG `Sparkle` ikonu, uppercase, letterSpacing 0.3, background var(--surface) | login/page.tsx:272-290, forgot/page.tsx:214-232 | 1.5 |
| 9 | High | StatCard değer font-size 20→22, fontWeight 700→600, letterSpacing -0.5 ekle | login/page.tsx:348-357 | 2.6 |
| 10 | High | StatCard padding 16px 20px → 14, borderRadius `--radius-lg` → 10, border CSS → inset boxShadow | login/page.tsx:341-346 | 2.7 |
| 11 | High | Login ile Forgot başlık font-size **iç tutarsızlık** giderme | login/page.tsx:75-79 vs forgot/page.tsx:60-64 | 2.5 |
| 12 | High | Forgot-password — gerçek backend endpoint çağrısı; setTimeout sahte değil | forgot-password/page.tsx:13-21 | 5.2 |
| 13 | Medium | İkinci radial gradient `--status-progress` katmanını geri ekle, `800px 500px at 70% 30%` ölçü ve %14 oran | login/page.tsx:262-270, forgot/page.tsx:204-212 | 1.7 |
| 14 | Medium | Footer href="#" → JS-safe link / span / `aria-disabled`. | login/page.tsx:233-244, forgot/page.tsx:175-186 | 5.5 |
| 15 | Medium | Forgot form ekranındaki "← Girişe dön" rengi `fg-muted` → `primary` 600 | forgot-password/page.tsx:113-122 | 2.11 |
| 16 | Medium | Sağ panel paragraf 14→14.5, lineHeight 1.7→1.6, maxWidth 380→440 | login/page.tsx:310-322, forgot/page.tsx:251-263 | 2.3 |
| 17 | Medium | `<html lang>` dinamikleştir | app/layout.tsx:87 | 5.1 |
| 18 | Medium | Input `autoComplete` + `name` ekle (email/current-password) | login/page.tsx, forgot/page.tsx | 5.4 |
| 19 | Medium | `<label htmlFor>` + `<Input id name>` ile form a11y bağı | login/page.tsx:96-137, forgot/page.tsx:81-99 | 5.6 |
| 20 | Low | `marginBottom` 24→28 (subtitle altı) | login/page.tsx:88 | 2.8 |
| 21 | Low | LogoMark `letterSpacing: -0.5` ekle | components/logo-mark.tsx:17 | 5.3 |
| 22 | Low | Inline error banner (zaten var) — prototipe ekleme önerisi | login/page.tsx:181-195 | 3.2 |
| 23 | Low | Loading state metinleri (zaten var) — prototipe ekleme önerisi | login/page.tsx:205, forgot/page.tsx:109 | 3.3 |
| 24 | Low | Forgot success state (zaten var) — prototipe ekleme önerisi | forgot/page.tsx:125-159 | 3.5 |

## 7. KAPSAM NOTLARI

- **Okunan dosyalar:**
  - `New_Frontend/src/pages/misc.jsx` (tam, 537 satır)
  - `New_Frontend/src/app.jsx` (tam, 523 satır — özellikle 134-176 auth routing bloğu)
  - `New_Frontend/src/primitives.jsx` (Button bloğu — lines 73-118)
  - `New_Frontend/src/i18n.jsx` (auth-related kontrol — auth özelinde key yok)
  - `New_Frontend/src/theme.jsx` (token kontrol)
  - `New_Frontend/src/icons.jsx` (Sparkle icon — line 65)
  - `Frontend2/app/(auth)/login/page.tsx` (tam, 374 satır)
  - `Frontend2/app/(auth)/forgot-password/page.tsx` (tam, 315 satır)
  - `Frontend2/app/(auth)/session-expired/page.tsx` (tam, 49 satır)
  - `Frontend2/app/(auth)/layout.tsx` (tam, 7 satır)
  - `Frontend2/app/layout.tsx` (tam, 99 satır — `<html lang>` kontrol)
  - `Frontend2/components/logo-mark.tsx` (tam, 28 satır)
  - `Frontend2/components/primitives/button.tsx` (tam, 129 satır)
  - `Frontend2/components/primitives/input.tsx` (tam, 103 satır)
  - `Frontend2/components/primitives/index.ts` (tam, 56 satır)
  - `Frontend2/context/auth-context.tsx` (tam, 80 satır)
  - `Frontend2/context/app-context.tsx` (tam, 232 satır — language state)
  - `Frontend2/services/auth-service.ts` (tam, 82 satır — register fonksiyonu yok)
  - `Frontend2/middleware.ts` (tam, 24 satır)
  - `Frontend2/lib/constants.ts` (tam, 3 satır)
  - `Frontend2/lib/i18n.ts` (tam, 117 satır — auth özelinde key yok)
  - `.planning/phases/10-shell-pages-project-features/10-03-PLAN.md` (D-11 + UI-SPEC referans bölümleri)
  - `.planning/phases/10-shell-pages-project-features/10-03-SUMMARY.md` (D-11 doğrulaması)
  - `.planning/UI-REVIEW.md` (UI-sweep / 4-bucket bağlamı için)

- **Atlanan/eksik kalan:**
  - `New_Frontend/src/primitives.jsx` tam okunmadı (sadece Button bölümü); LabeledField (settings.jsx içinde tanımlı) auth'da kullanılmıyor — implementation `<label>+<Input>` ile yapılıyor, eşdeğer.
  - Frontend2'de `register` rotası dosyası dahi yok; arandı ve yok onaylandı (intentional D-11).

- **Belirsizlikler:**
  - "UI-sweep" yorumlarındaki (login/page.tsx:74-79, 292-293) 4-bucket UI-SPEC kuralı ayrı bir doküman (`12-UI-SPEC.md`) tarafından yönetiliyor. Bu kural prototipi geçersiz kılıyorsa **prototip ground truth değildir** — bu durumda Critical maddeler 1, 2, 3, 4 yeniden değerlendirilmelidir. **Kullanıcı talimatına göre prototip tek doğru kaynak**, dolayısıyla raporda prototip değerlerine geri dönüş önerildi.
  - Phase 10 takip dokümanı (10-03-SUMMARY) "forgot-password backend not yet implemented" itirafı yapıyor — düzeltme önceliklendirildi (5.2).
  - `register` rotası eklenecek mi (gelecekteki D-XX kararı)? Şu anlık yok kabul edilmiştir; ekleneceği zaman bu rapor Bölüm 4'ün 1. maddesi geçersizleşir.
