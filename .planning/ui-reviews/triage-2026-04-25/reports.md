# Reports (Raporlar) — Prototip vs Implementasyon Triajı

**Tarih:** 2026-04-25
**Atanan ajan:** ui-triage-reports
**Prototip kaynak:**
- `c:/Users/yusti/Desktop/bitirme projesi/SPMS/New_Frontend/src/pages/misc.jsx` (ReportsPage, satır 356-534)

**Implementasyon kaynak:**
- `c:/Users/yusti/Desktop/bitirme projesi/SPMS/Frontend2/app/(shell)/reports/page.tsx` (12 satır, stub)

**Bilinen intentional extras:** Yok
**Önemli not:** Prototipte ReportsPage ZENGİN bir uygulamadır (KPI x4 + Burndown + Team Load + CFD + Lead/Cycle + Iteration Comparison + Phase Reports). Implementasyon ise sadece "Phase 13'te yapılacak" stub'u. Bu nedenle bulguların tamamı "EKSİK ELEMENTLER" kategorisinde toplanmıştır.

## TL;DR Özet
- **Prototip Reports stub mu?** Hayır — TAMAMEN BİTMİŞ. Stub olan IMPLEMENTASYON.
- Eksik elementler: 11
- Layout/şekil farkı: 0 (henüz uygulanmadığı için karşılaştırılacak şey yok)
- Bilinmeyen extras: 1 (placeholder copy "Phase 13'te yapılacak" — i18n'siz hardcoded EN)
- Bilinen extras: 0
- Hatalı kod: 3
- **EN KRİTİK 3 MADDE:**
  1. Tüm sayfa stub — header, KPI cards, Burndown, Team Load, CFD, Lead/Cycle, Iteration Comparison ve Phase Reports tamamen eksik (Bölüm 1.1-1.11).
  2. i18n yok — `<h1>Reports</h1>` ve `Reports page will be implemented in Phase 13.` hardcoded İngilizce; prototip her satırı `T(tr, en)` ile çevirir (Bölüm 5.1).
  3. Yanlış başlık tipografisi — 16px / 600 yerine prototipte 22px / 600 / `letterSpacing: -0.4` (Bölüm 5.2). Production'a giden TODO ekranı kullanıcıya gösteriliyor (Bölüm 3.1).

## 1. EKSİK ELEMENTLER

### 1.1 Sayfa başlığı (title + subtitle + sağ aksiyonlar)
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:362-371`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/reports/page.tsx`
- **Görsel/davranış:** Solda 22px / 600 weight başlık `Raporlar` + 13px muted alt yazı `Performans ve verimlilik metrikleri`; sağda iki adet `size="sm" variant="secondary"` Button — biri `Calendar` ikonlu `Q2 2026`, diğeri `Download` ikonlu `PDF`. Flex `justifyContent: space-between`, `alignItems: flex-end`.
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>{T("Raporlar", "Reports")}</div>
      <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>{T("Performans ve verimlilik metrikleri", "Performance & velocity metrics")}</div>
    </div>
    <div style={{ display: "flex", gap: 6 }}>
      <Button size="sm" variant="secondary" icon={<Icons.Calendar size={13}/>}>Q2 2026</Button>
      <Button size="sm" variant="secondary" icon={<Icons.Download size={13}/>}>PDF</Button>
    </div>
  </div>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Mevcut `<h1 style={{ fontSize: 16 ... }}>Reports</h1>` (satır 4) yanlış: prototip 22px ve `letterSpacing: -0.4`. Subtitle ekle, sağ tarafta DateRange (Q2 2026 placeholder) ve PDF export Button'ları ekle.

### 1.2 Stat Cards (KPI grid)
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:373-379`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/reports/page.tsx` (StatCard zaten `Frontend2/components/dashboard/stat-card.tsx` içinde mevcut)
- **Görsel/davranış:** 4 sütunlu grid (`repeat(4, 1fr)`, gap 12). Sırasıyla: `Sprint Velocity` (48, +6 pts, success, Chart icon), `Cycle Time` (3.2d, -0.4d, success, Clock), `Completed` (124, +18%, primary, Check), `Blockers` (3, -2, warning, Alert).
- **Prototip kod alıntısı:**
  ```jsx
  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
    <StatCard label={T("Sprint Velocity","Sprint velocity")} value="48" delta="+6 pts" tone="success" icon={<Icons.Chart/>}/>
    <StatCard label={T("Döngü Süresi","Cycle time")} value="3.2d" delta="-0.4d" tone="success" icon={<Icons.Clock/>}/>
    <StatCard label={T("Tamamlanan","Completed")} value="124" delta="+18%" tone="primary" icon={<Icons.Check/>}/>
    <StatCard label={T("Engeller","Blockers")} value="3" delta="-2" tone="warning" icon={<Icons.Alert/>}/>
  </div>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `Frontend2/components/dashboard/stat-card.tsx` API'sinin `tone="success|warning|primary"` desteklediğini doğrula; yoksa ekle.

### 1.3 Burndown grafiği
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:382-396`
- **Olması gereken implementasyon yeri:** `Frontend2/components/reports/burndown-chart.tsx` (oluşturulmalı)
- **Görsel/davranış:** Card içinde `Burndown — Sprint 23` başlığı (13px / 600). 400x180 viewBox'lı SVG; 4 yatay grid line, ideal kesik çizgili dasharray (`var(--fg-subtle)`), gerçek path `var(--primary)` 2.5 stroke + 8 noktalı dot. X ekseni etiketleri D1, D3 ... D15 mono font.
- **Prototip kod alıntısı:**
  ```jsx
  <Card padding={16}>
    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Burndown — Sprint 23</div>
    <svg viewBox="0 0 400 180" style={{ width: "100%" }}>
      {/* grid + dashed ideal + actual path + dots + labels */}
    </svg>
  </Card>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** Sol kolon (1.5fr) Burndown, sağ kolon (1fr) Team Load grid yerleşimi (`gridTemplateColumns: "1.5fr 1fr"`).

### 1.4 Team Load listesi
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:397-410`
- **Olması gereken implementasyon yeri:** `Frontend2/components/reports/team-load.tsx` (oluşturulmalı)
- **Görsel/davranış:** Card içinde `Takım Yükü` başlığı; `SPMSData.USERS.slice(0, 6)` her satır: Avatar (22px), kullanıcının ilk adı, ProgressBar (140px width, 6px height) — 85+ critical, 65+ review, diğerleri progress, sağda mono `%` yüzdesi (34px width sağa hizalı).
- **Öncelik:** High

### 1.5 Cumulative Flow Diagram (CFD) + range segmented control
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:413-447`
- **Olması gereken implementasyon yeri:** `Frontend2/components/reports/cfd-chart.tsx` (oluşturulmalı)
- **Görsel/davranış:** Card; başlık satırı `Cumulative Flow Diagram` + sağda `SegmentedControl size="xs"` (7d / 30d / 90d, default `30`). Altında 400x160 viewBox stacked area chart 4 katmanlı (done/review/progress/todo), `color-mix(in oklch, ... 40%, transparent)`. Altında 4 swatch legend + sağda mono `Avg WIP: 6.2` ve `Avg Completion: 3.8/d`.
- **Prototip kod alıntısı:**
  ```jsx
  <SegmentedControl value={cfdRange} onChange={setCfdRange} size="xs" options={[
    { id: "7", label: T("7 gün","7d") },
    { id: "30", label: T("30 gün","30d") },
    { id: "90", label: T("90 gün","90d") },
  ]}/>
  ```
- **Öncelik:** Critical
- **Düzeltme önerisi:** `Frontend2/components/primitives/segmented-control.tsx` mevcut, `size="xs"` desteklemiyorsa ekle.

### 1.6 Lead Time histogramı
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:451-463`
- **Olması gereken implementasyon yeri:** `Frontend2/components/reports/lead-cycle-histogram.tsx` (oluşturulmalı, parametrik)
- **Görsel/davranış:** Card; `Lead Time` 13px başlık; altında 24px / 600 / `tabular-nums` `4.2 days` değer. 5 bucket bar chart (300x100 viewBox), `color-mix(in oklch, var(--primary) 70%, transparent)`. Altında mono `P50: 3.2d · P85: 7.1d · P95: 12d`.
- **Öncelik:** High

### 1.7 Cycle Time histogramı
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:464-476`
- **Olması gereken implementasyon yeri:** Aynı bileşen (props ile parametrik)
- **Görsel/davranış:** Lead Time ile aynı yapı, başlık `Cycle Time`, değer `2.8 days`, bar rengi `var(--status-progress)`, percentile satırı `P50: 2.1d · P85: 4.8d · P95: 8.3d`. Lead+Cycle, `gridTemplateColumns: "1fr 1fr"` 2 sütunlu grid içinde yan yana.
- **Öncelik:** High

### 1.8 Iteration Comparison bar chart
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:479-509`
- **Olması gereken implementasyon yeri:** `Frontend2/components/reports/iteration-comparison.tsx` (oluşturulmalı)
- **Görsel/davranış:** Card; başlık `İterasyon Karşılaştırma`. 400x140 viewBox grouped bar chart — 4 sprint x 3 bar (planned 22w, done 22w, carried 22w). Sprintler `S20-S23` mono etiket. Altında 3 swatch legend (Planned/Completed/Carried).
- **Öncelik:** High

### 1.9 Phase Reports tablosu
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:511-531`
- **Olması gereken implementasyon yeri:** `Frontend2/components/reports/phase-reports-table.tsx` (oluşturulmalı)
- **Görsel/davranış:** Card; başlık satırı: `Doc` ikon + `Faz Raporları` başlık + sağda `Tümünü gör` ghost button. Altında 5 sütunlu grid (1fr 120px 80px 80px 80px) — phase name + project name (muted), `closedAt` mono, total tasks mono, ProgressBar (60px width), `%successRate` mono sağa hizalı. Veri: `SPMSData.PHASE_HISTORY`.
- **Önemli ipucu:** Frontend2'de `Frontend2/hooks/use-phase-reports.ts` ve `Frontend2/services/phase-report-service.ts` zaten mevcut. Burada bağla.
- **Öncelik:** Critical

### 1.10 Sayfa container layout (vertical stack)
- **Prototipte:** `New_Frontend/src/pages/misc.jsx:361` — `flex column gap 20`
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/reports/page.tsx`
- **Görsel/davranış:** Tüm sayfa `display: flex; flex-direction: column; gap: 20px` ile dikey stack. Mevcut implementasyonda sadece `<div>` (gap yok).
- **Öncelik:** Medium

### 1.11 Loading skeleton + empty state
- **Prototipte:** Yok (mock data ile çalışıyor) — fakat Frontend2 production'a giderken gerekli.
- **Olması gereken implementasyon yeri:** `Frontend2/app/(shell)/reports/loading.tsx` ve her grafik card'ı için inline skeleton.
- **Öncelik:** Low (prototip 1:1 değil)

## 2. LAYOUT/ŞEKİL/YERLEŞİM FARKLARI

Bulunmadı. (Implementasyonda render edilen yapı yok — yalnızca tek bir başlık + paragraf. Karşılaştırılacak yerleşim oluşmamış. Tüm farklar Bölüm 1'de "EKSİK" olarak listelendi.)

## 3. BİLİNMEYEN EXTRAS

### 3.1 "Phase 13'te yapılacak" placeholder copy
- **Dosya:** `Frontend2/app/(shell)/reports/page.tsx:7-9`
- **İçerik:** `Reports page will be implemented in Phase 13.` — prototipte ASLA YOK. Production'da kullanıcıya gösterilen TODO mesajı.
- **Öncelik:** High (UX kirliliği)
- **Düzeltme önerisi:** Phase 13 implementasyonu yapılana kadar bile en azından i18n'lı bir "Yakında / Coming soon" kullan; ideali tamamen kaldırıp prototipi uygulamak.

## 4. BİLİNEN EXTRAS (UYARI)

Yok.

## 5. HATALI / SORUNLU KOD

### 5.1 Hardcoded İngilizce metin (i18n eksikliği)
- **Dosya:** `Frontend2/app/(shell)/reports/page.tsx:5,8`
- **Sorun türü:** Style drift / i18n bug
- **Açıklama:** `<h1>Reports</h1>` ve paragraf İngilizce sabit. Prototipte tüm Reports sayfasındaki her string `T(tr, en)` üzerinden geçiyor (`misc.jsx:357-358`). Frontend2'de `Frontend2/lib/i18n.ts` mevcut.
- **Öneri:** i18n hook'u ile çevrilebilir hale getir; "Raporlar" / "Reports" dual string ekle.
- **Öncelik:** High

### 5.2 Yanlış başlık tipografisi
- **Dosya:** `Frontend2/app/(shell)/reports/page.tsx:4`
- **Sorun türü:** Style drift (token + size)
- **Açıklama:** `fontSize: 16, fontWeight: 600` — prototipte sayfa başlığı 22px / 600 / `letterSpacing: -0.4`. 16px aslında Card başlık boyutu, page title değil.
- **Öneri:** Prototipteki 22 / 600 / -0.4 letterSpacing değerlerini uygula veya merkezi `<PageHeader>` primitive (varsa) kullan.
- **Öncelik:** High

### 5.3 Yetersiz semantic markup / a11y
- **Dosya:** `Frontend2/app/(shell)/reports/page.tsx:1-12`
- **Sorun türü:** A11y / Style drift
- **Açıklama:** `<h1>` doğru ama altındaki `<p>` "Reports page will be implemented in Phase 13." üretimde kullanıcıya gösterilen anlamlı bir bilgi değil. Sayfa içinde `<main>`, `<section>`, `aria-labelledby` gibi semantik yapı yok. Stub olduğu için region role yok.
- **Öneri:** Prototipi uygula veya en azından `aria-busy="true"` ile loading state göster.
- **Öncelik:** Medium

## 6. ÖNCELİKLENDİRİLMİŞ DÜZELTME LİSTESİ

| # | Öncelik | Madde | Dosya | Bölüm |
|---|---------|-------|-------|-------|
| 1 | Critical | Sayfa başlığı + sağ aksiyonlar (Q2 2026, PDF) | Frontend2/app/(shell)/reports/page.tsx | 1.1 |
| 2 | Critical | KPI Stat Cards (Velocity / Cycle / Completed / Blockers) | Frontend2/app/(shell)/reports/page.tsx (StatCard mevcut) | 1.2 |
| 3 | Critical | Burndown Chart (Sprint 23) | Frontend2/components/reports/burndown-chart.tsx (yeni) | 1.3 |
| 4 | Critical | CFD + SegmentedControl (7/30/90) + Avg WIP/Completion | Frontend2/components/reports/cfd-chart.tsx (yeni) | 1.5 |
| 5 | Critical | Phase Reports tablosu (use-phase-reports'u bağla) | Frontend2/components/reports/phase-reports-table.tsx (yeni) | 1.9 |
| 6 | High | Hardcoded EN string'leri i18n'e çevir | Frontend2/app/(shell)/reports/page.tsx | 5.1, 3.1 |
| 7 | High | Başlık tipografisini 22px/600/-0.4 yap | Frontend2/app/(shell)/reports/page.tsx | 5.2 |
| 8 | High | Team Load listesi (Avatar + ProgressBar) | Frontend2/components/reports/team-load.tsx (yeni) | 1.4 |
| 9 | High | Lead/Cycle histogram (parametrik tek bileşen) | Frontend2/components/reports/lead-cycle-histogram.tsx (yeni) | 1.6, 1.7 |
| 10 | High | Iteration Comparison grouped bar chart | Frontend2/components/reports/iteration-comparison.tsx (yeni) | 1.8 |
| 11 | High | Placeholder "Phase 13" copy'yi kaldır | Frontend2/app/(shell)/reports/page.tsx | 3.1 |
| 12 | Medium | Sayfa container flex column gap 20 | Frontend2/app/(shell)/reports/page.tsx | 1.10 |
| 13 | Medium | Semantic main/section + a11y region | Frontend2/app/(shell)/reports/page.tsx | 5.3 |
| 14 | Low | Loading skeleton ve empty/error state | Frontend2/app/(shell)/reports/loading.tsx (yeni) | 1.11 |

## 7. KAPSAM NOTLARI
- **Okunan dosyalar:**
  - `c:/Users/yusti/Desktop/bitirme projesi/SPMS/New_Frontend/src/pages/misc.jsx` (ReportsPage 356-534 ve sibling'ler)
  - `c:/Users/yusti/Desktop/bitirme projesi/SPMS/Frontend2/app/(shell)/reports/page.tsx` (tamamı, 12 satır)
  - Grep ile Frontend2 genelinde `reports`, `PHASE_HISTORY|StatCard|SegmentedControl` referansları bulundu — `Frontend2/components/dashboard/stat-card.tsx`, `Frontend2/components/primitives/segmented-control.tsx`, `Frontend2/hooks/use-phase-reports.ts`, `Frontend2/services/phase-report-service.ts` zaten mevcut (Reports sayfasını inşa edecek altyapı hazır, fakat sayfa onları tüketmiyor).
- **Atlanan/eksik kalan:**
  - `Frontend2/components/dashboard/stat-card.tsx` API'si bu rapor için açılmadı — `tone` enum desteğini doğrulamak gerek.
  - `Frontend2/components/primitives/segmented-control.tsx` `size="xs"` varyantını doğrulamak gerek.
  - `services/reporting-service.ts` veya benzeri gerçek metrik servisi yok; mock data ile başlanabilir.
- **Belirsizlikler:**
  - Burndown/CFD/Lead/Cycle metrikleri için backend endpoint contract'ı tanımsız (rapor kapsamı dışı).
  - "Q2 2026" date range Button prototipte statik label; gerçek date range picker mı dropdown mı tanımsız.
  - PDF export'un nasıl çalışacağı (server-side render vs jspdf) tanımsız.
